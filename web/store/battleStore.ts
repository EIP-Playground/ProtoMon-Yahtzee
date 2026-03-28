import { EMPTY_LOCKED_DICE } from "@/lib/game/dice";
import { computeLocalScore } from "@/lib/game/scoring";
import {
  SLOT_DEFINITIONS,
  TOTAL_SLOTS,
  createEmptySlotResults,
  createEmptyUsedSlots,
  getUsedSlotsCount,
} from "@/lib/game/slots";
import { BOSS_1 } from "@/types/game";
import type {
  BattleSlotResult,
  BattleState,
  DiceArray,
  DiceValue,
  HexAddress,
  LockedDice,
} from "@/types/game";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BATTLE_STORAGE_PREFIX = "protomon:battle:";

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type PersistedBattleState = Omit<BattleState, "diceActionState" | "castActionState">;

export function createInitialBattleState(
  gameId: string,
  options?: {
    smartAccount?: HexAddress;
    rewardRecipient?: HexAddress;
  },
): BattleState {
  return {
    gameId,
    smartAccount: options?.smartAccount ?? ZERO_ADDRESS,
    rewardRecipient: options?.rewardRecipient ?? ZERO_ADDRESS,
    bossHpLocal: BOSS_1.targetHp,
    bossHpChain: BOSS_1.targetHp,
    turn: 1,
    rollCount: 0,
    dice: null,
    locked: EMPTY_LOCKED_DICE,
    selectedSlotId: null,
    usedSlots: createEmptyUsedSlots(),
    slotResults: createEmptySlotResults(),
    upperSubtotalLocal: 0,
    upperBonusClaimedLocal: false,
    syncStatus: "LOCAL_APPLIED",
    finished: false,
    won: false,
    diceActionState: "idle",
    castActionState: "idle",
  };
}

export function applyRollResult(
  state: BattleState,
  input: {
    dice: DiceArray;
    rollCount: number;
    turn: number;
  },
): BattleState {
  return {
    ...state,
    dice: input.dice,
    rollCount: input.rollCount,
    turn: input.turn,
    locked: state.rollCount === 0 ? EMPTY_LOCKED_DICE : state.locked,
    syncStatus: "LOCAL_APPLIED",
  };
}

export function toggleLockedDie(state: BattleState, dieIndex: number): BattleState {
  if (!state.dice || state.rollCount === 0 || state.finished || dieIndex < 0 || dieIndex > 4) {
    return state;
  }

  const locked = [...state.locked] as LockedDice;
  locked[dieIndex] = !locked[dieIndex];

  return {
    ...state,
    locked,
  };
}

export function selectCastSlot(state: BattleState, slotId: number): BattleState {
  if (state.usedSlots[slotId] || state.finished || state.castActionState === "waiting") {
    return state;
  }

  return {
    ...state,
    selectedSlotId: slotId,
  };
}

export function resetRoundLocal(state: BattleState): BattleState {
  const baseState = {
    ...state,
    dice: null,
    locked: EMPTY_LOCKED_DICE,
    selectedSlotId: null,
    rollCount: 0,
    syncStatus: "LOCAL_APPLIED" as const,
  };

  if (state.finished) {
    return baseState;
  }

  return {
    ...baseState,
    turn: state.turn + 1,
  };
}

export function applyLocalCast(state: BattleState, slotId: number): BattleState {
  if (!state.dice || state.usedSlots[slotId] || state.finished) {
    return state;
  }

  const score = computeLocalScore(slotId, state.dice, state);
  const bossHpAfter = Math.max(0, state.bossHpLocal - score.totalDamage);
  const usedSlots = {
    ...state.usedSlots,
    [slotId]: true,
  };
  const slotResults = {
    ...state.slotResults,
    [slotId]: {
      score: score.slotScore,
      damage: score.totalDamage,
      bonusDamage: score.bonusDamage,
      dice: [...state.dice] as DiceArray,
    },
  };
  const finished = bossHpAfter === 0 || getUsedSlotsCount(usedSlots) >= TOTAL_SLOTS;
  const nextState: BattleState = {
    ...state,
    bossHpLocal: bossHpAfter,
    bossHpChain: bossHpAfter,
    usedSlots,
    slotResults,
    upperSubtotalLocal: score.nextUpperSubtotal,
    upperBonusClaimedLocal: score.nextUpperBonusClaimed,
    finished,
    won: bossHpAfter === 0,
    syncStatus: "LOCAL_APPLIED",
  };

  return resetRoundLocal(nextState);
}

export function getBattleStorageKey(gameId: string) {
  return `${BATTLE_STORAGE_PREFIX}${gameId}`;
}

function isDiceValue(value: unknown): value is DiceValue {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 6;
}

function isDiceArray(value: unknown): value is DiceArray {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    value.every((item) => isDiceValue(item))
  );
}

function isLockedDice(value: unknown): value is LockedDice {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    value.every((item) => typeof item === "boolean")
  );
}

function isBattleSlotResult(value: unknown): value is BattleSlotResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.score === "number" &&
    typeof candidate.damage === "number" &&
    typeof candidate.bonusDamage === "number" &&
    isDiceArray(candidate.dice)
  );
}

function isBooleanSlotMap(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return SLOT_DEFINITIONS.every((slot) => typeof candidate[String(slot.id)] === "boolean");
}

function isSlotResultMap(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return SLOT_DEFINITIONS.every((slot) => {
    const entry = candidate[String(slot.id)];
    return entry === null || isBattleSlotResult(entry);
  });
}

function toPersistedBattleState(state: BattleState): PersistedBattleState {
  const { diceActionState, castActionState, ...snapshot } = state;
  void diceActionState;
  void castActionState;
  return snapshot;
}

function parsePersistedBattleState(value: unknown): PersistedBattleState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.gameId !== "string" ||
    typeof candidate.smartAccount !== "string" ||
    typeof candidate.rewardRecipient !== "string" ||
    typeof candidate.bossHpLocal !== "number" ||
    typeof candidate.bossHpChain !== "number" ||
    typeof candidate.turn !== "number" ||
    typeof candidate.rollCount !== "number" ||
    !isBooleanSlotMap(candidate.usedSlots) ||
    !isSlotResultMap(candidate.slotResults) ||
    typeof candidate.upperSubtotalLocal !== "number" ||
    typeof candidate.upperBonusClaimedLocal !== "boolean" ||
    typeof candidate.syncStatus !== "string" ||
    typeof candidate.finished !== "boolean" ||
    typeof candidate.won !== "boolean" ||
    !isLockedDice(candidate.locked)
  ) {
    return null;
  }

  if (
    candidate.selectedSlotId !== undefined &&
    candidate.selectedSlotId !== null &&
    (typeof candidate.selectedSlotId !== "number" ||
      !Number.isInteger(candidate.selectedSlotId) ||
      candidate.selectedSlotId < 0 ||
      candidate.selectedSlotId >= TOTAL_SLOTS)
  ) {
    return null;
  }

  if (candidate.dice !== null && !isDiceArray(candidate.dice)) {
    return null;
  }

  if (
    candidate.pendingTxHash !== undefined &&
    typeof candidate.pendingTxHash !== "string"
  ) {
    return null;
  }

  return {
    gameId: candidate.gameId,
    smartAccount: candidate.smartAccount as HexAddress,
    rewardRecipient: candidate.rewardRecipient as HexAddress,
    bossHpLocal: candidate.bossHpLocal,
    bossHpChain: candidate.bossHpChain,
    turn: candidate.turn,
    rollCount: candidate.rollCount,
    dice: candidate.dice as DiceArray | null,
    locked: candidate.locked,
    selectedSlotId:
      candidate.selectedSlotId === undefined || candidate.selectedSlotId === null
        ? null
        : Number(candidate.selectedSlotId),
    usedSlots: candidate.usedSlots as Record<number, boolean>,
    slotResults: candidate.slotResults as BattleState["slotResults"],
    upperSubtotalLocal: candidate.upperSubtotalLocal,
    upperBonusClaimedLocal: candidate.upperBonusClaimedLocal,
    syncStatus: candidate.syncStatus as BattleState["syncStatus"],
    finished: candidate.finished,
    won: candidate.won,
    pendingTxHash: candidate.pendingTxHash as BattleState["pendingTxHash"],
  };
}

export function restorePersistedBattleState(snapshot: PersistedBattleState): BattleState {
  return {
    ...snapshot,
    diceActionState: "idle",
    castActionState: "idle",
  };
}

export function loadBattleStateSnapshot(
  gameId: string,
  storage?: StorageLike | null,
): BattleState | null {
  const safeStorage = storage ?? (typeof window === "undefined" ? null : window.sessionStorage);

  if (!safeStorage) {
    return null;
  }

  try {
    const raw = safeStorage.getItem(getBattleStorageKey(gameId));

    if (!raw) {
      return null;
    }

    const parsed = parsePersistedBattleState(JSON.parse(raw));
    return parsed ? restorePersistedBattleState(parsed) : null;
  } catch {
    return null;
  }
}

export function saveBattleStateSnapshot(
  state: BattleState,
  storage?: StorageLike | null,
) {
  const safeStorage = storage ?? (typeof window === "undefined" ? null : window.sessionStorage);

  if (!safeStorage) {
    return;
  }

  safeStorage.setItem(
    getBattleStorageKey(state.gameId),
    JSON.stringify(toPersistedBattleState(state)),
  );
}
