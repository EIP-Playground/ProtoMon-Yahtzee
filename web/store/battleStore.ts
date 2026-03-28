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
  PendingCastState,
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
    bossHpLocal?: number;
    bossHpChain?: number;
    turn?: number;
    confirmedTurn?: number;
    rollCount?: number;
    dice?: DiceArray | null;
    carryoverDice?: DiceArray | null;
    locked?: LockedDice;
    selectedSlotId?: number | null;
    usedSlots?: Record<number, boolean>;
    confirmedUsedSlots?: Record<number, boolean>;
    slotResults?: BattleState["slotResults"];
    upperSubtotalLocal?: number;
    confirmedUpperSubtotalLocal?: number;
    upperBonusClaimedLocal?: boolean;
    confirmedUpperBonusClaimedLocal?: boolean;
    syncStatus?: BattleState["syncStatus"];
    finished?: boolean;
    confirmedFinished?: boolean;
    won?: boolean;
    confirmedWon?: boolean;
    rollbackRequired?: boolean;
    pendingTxHash?: BattleState["pendingTxHash"];
    pendingCast?: PendingCastState | null;
  },
): BattleState {
  return {
    gameId,
    smartAccount: options?.smartAccount ?? ZERO_ADDRESS,
    rewardRecipient: options?.rewardRecipient ?? ZERO_ADDRESS,
    bossHpLocal: options?.bossHpLocal ?? BOSS_1.targetHp,
    bossHpChain: options?.bossHpChain ?? options?.bossHpLocal ?? BOSS_1.targetHp,
    turn: options?.turn ?? 1,
    confirmedTurn: options?.confirmedTurn ?? options?.turn ?? 1,
    rollCount: options?.rollCount ?? 0,
    dice: options?.dice ?? null,
    carryoverDice: options?.carryoverDice ?? null,
    locked: options?.locked ?? EMPTY_LOCKED_DICE,
    selectedSlotId: options?.selectedSlotId ?? null,
    usedSlots: options?.usedSlots ?? createEmptyUsedSlots(),
    confirmedUsedSlots: options?.confirmedUsedSlots ?? options?.usedSlots ?? createEmptyUsedSlots(),
    slotResults: options?.slotResults ?? createEmptySlotResults(),
    upperSubtotalLocal: options?.upperSubtotalLocal ?? 0,
    confirmedUpperSubtotalLocal:
      options?.confirmedUpperSubtotalLocal ?? options?.upperSubtotalLocal ?? 0,
    upperBonusClaimedLocal: options?.upperBonusClaimedLocal ?? false,
    confirmedUpperBonusClaimedLocal:
      options?.confirmedUpperBonusClaimedLocal ?? options?.upperBonusClaimedLocal ?? false,
    syncStatus: options?.syncStatus ?? "CONFIRMED",
    finished: options?.finished ?? false,
    confirmedFinished: options?.confirmedFinished ?? options?.finished ?? false,
    won: options?.won ?? false,
    confirmedWon: options?.confirmedWon ?? options?.won ?? false,
    rollbackRequired: options?.rollbackRequired ?? false,
    diceActionState: "idle",
    castActionState: "idle",
    pendingTxHash: options?.pendingTxHash,
    pendingCast: options?.pendingCast ?? null,
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
    carryoverDice: null,
    rollCount: input.rollCount,
    turn: input.turn,
    locked: state.rollCount === 0 ? EMPTY_LOCKED_DICE : state.locked,
    syncStatus: state.syncStatus,
    rollbackRequired: false,
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
    carryoverDice: null,
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
    usedSlots,
    slotResults,
    selectedSlotId: null,
    upperSubtotalLocal: score.nextUpperSubtotal,
    upperBonusClaimedLocal: score.nextUpperBonusClaimed,
    finished,
    won: bossHpAfter === 0,
    syncStatus: "LOCAL_APPLIED",
    rollbackRequired: false,
  };

  return nextState;
}

export function advanceOptimisticRound(state: BattleState): BattleState {
  if (state.finished) {
    return {
      ...state,
      dice: null,
      carryoverDice: state.dice,
      locked: EMPTY_LOCKED_DICE,
      selectedSlotId: null,
      rollCount: 0,
    };
  }

  return {
    ...state,
    turn: state.turn + 1,
    dice: null,
    carryoverDice: state.dice,
    locked: EMPTY_LOCKED_DICE,
    selectedSlotId: null,
    rollCount: 0,
  };
}

export function createPendingCastState(
  state: BattleState,
  slotId: number,
  txHash: BattleState["pendingTxHash"],
): PendingCastState | null {
  if (!txHash) {
    return null;
  }

  return {
    txHash,
    originTurn: state.turn,
    slotId,
    optimisticSnapshot: {
      bossHpLocal: state.bossHpLocal,
      usedSlots: { ...state.usedSlots },
      upperSubtotalLocal: state.upperSubtotalLocal,
      upperBonusClaimedLocal: state.upperBonusClaimedLocal,
      finished: state.finished,
      won: state.won,
    },
  };
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

function isPendingCastSnapshot(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.bossHpLocal === "number" &&
    isBooleanSlotMap(candidate.usedSlots) &&
    typeof candidate.upperSubtotalLocal === "number" &&
    typeof candidate.upperBonusClaimedLocal === "boolean" &&
    typeof candidate.finished === "boolean" &&
    typeof candidate.won === "boolean"
  );
}

function isPendingCastState(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.txHash === "string" &&
    typeof candidate.originTurn === "number" &&
    typeof candidate.slotId === "number" &&
    isPendingCastSnapshot(candidate.optimisticSnapshot)
  );
}

function toPersistedBattleState(state: BattleState): PersistedBattleState {
  const { diceActionState, castActionState, ...snapshot } = state;
  void diceActionState;
  void castActionState;

  return {
    ...snapshot,
    carryoverDice: null,
  };
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
    typeof candidate.confirmedTurn !== "number" ||
    typeof candidate.rollCount !== "number" ||
    !isBooleanSlotMap(candidate.usedSlots) ||
    !isBooleanSlotMap(candidate.confirmedUsedSlots) ||
    !isSlotResultMap(candidate.slotResults) ||
    typeof candidate.upperSubtotalLocal !== "number" ||
    typeof candidate.confirmedUpperSubtotalLocal !== "number" ||
    typeof candidate.upperBonusClaimedLocal !== "boolean" ||
    typeof candidate.confirmedUpperBonusClaimedLocal !== "boolean" ||
    typeof candidate.syncStatus !== "string" ||
    typeof candidate.finished !== "boolean" ||
    typeof candidate.confirmedFinished !== "boolean" ||
    typeof candidate.won !== "boolean" ||
    typeof candidate.confirmedWon !== "boolean" ||
    typeof candidate.rollbackRequired !== "boolean" ||
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

  if (candidate.carryoverDice !== null && candidate.carryoverDice !== undefined && !isDiceArray(candidate.carryoverDice)) {
    return null;
  }

  if (
    candidate.pendingTxHash !== undefined &&
    typeof candidate.pendingTxHash !== "string"
  ) {
    return null;
  }

  if (
    candidate.pendingCast !== undefined &&
    candidate.pendingCast !== null &&
    !isPendingCastState(candidate.pendingCast)
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
    confirmedTurn: candidate.confirmedTurn,
    rollCount: candidate.rollCount,
    dice: candidate.dice as DiceArray | null,
    carryoverDice: (candidate.carryoverDice as DiceArray | null | undefined) ?? null,
    locked: candidate.locked,
    selectedSlotId:
      candidate.selectedSlotId === undefined || candidate.selectedSlotId === null
        ? null
        : Number(candidate.selectedSlotId),
    usedSlots: candidate.usedSlots as Record<number, boolean>,
    confirmedUsedSlots: candidate.confirmedUsedSlots as Record<number, boolean>,
    slotResults: candidate.slotResults as BattleState["slotResults"],
    upperSubtotalLocal: candidate.upperSubtotalLocal,
    confirmedUpperSubtotalLocal: candidate.confirmedUpperSubtotalLocal,
    upperBonusClaimedLocal: candidate.upperBonusClaimedLocal,
    confirmedUpperBonusClaimedLocal: candidate.confirmedUpperBonusClaimedLocal,
    syncStatus: candidate.syncStatus as BattleState["syncStatus"],
    finished: candidate.finished,
    confirmedFinished: candidate.confirmedFinished,
    won: candidate.won,
    confirmedWon: candidate.confirmedWon,
    rollbackRequired: candidate.rollbackRequired,
    pendingTxHash: candidate.pendingTxHash as BattleState["pendingTxHash"],
    pendingCast: (candidate.pendingCast as PendingCastState | null | undefined) ?? null,
  };
}

export function restorePersistedBattleState(snapshot: PersistedBattleState): BattleState {
  return {
    ...snapshot,
    rollbackRequired: snapshot.rollbackRequired || snapshot.syncStatus === "ROLLBACK",
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
