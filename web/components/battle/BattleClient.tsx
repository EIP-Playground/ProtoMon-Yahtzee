"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { IoPowerSharp } from "react-icons/io5";

import {
  advanceRound,
  confirmRound,
  finalizeRound,
  rerollDice,
  rollbackRound,
  rollDice,
} from "@/lib/api/backend";
import { BattleStage } from "@/components/battle/BattleStage";
import { DiceBoard } from "@/components/battle/DiceBoard";
import { PassiveItemsPanel } from "@/components/battle/PassiveItemsPanel";
import { ScoreBoard } from "@/components/battle/ScoreBoard";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSmartAccount } from "@/components/providers/SmartAccountProvider";
import {
  BATTLE_ELEMENT_ASC_ORDER,
  BATTLE_ELEMENT_VISUALS,
  BATTLE_BOSS_DISPLAY,
  BATTLE_SCENE_LAYOUT,
} from "@/lib/battle/config";
import {
  getConnectedSenderAddress,
  startGameOnChain,
  waitForGameStarted,
  sendCastTurnUserOp,
  waitForTurnPlayed,
} from "@/lib/chain/gameContract";
import { EMPTY_LOCKED_DICE, lockedToHoldMask } from "@/lib/game/dice";
import { createBattleSession } from "@/lib/game/session";
import { bitmapToSlots, getUsedSlotsCount } from "@/lib/game/slots";
import {
  advanceOptimisticRound,
  applyLocalCast,
  applyRollResult,
  createInitialBattleState,
  createPendingCastState,
  loadBattleStateSnapshot,
  saveBattleStateSnapshot,
  toggleLockedDie,
} from "@/store/battleStore";
import type { BattleState, PendingCastState, TurnPlayedEvent } from "@/types/game";

const ROLL_VISUAL_MIN_MS = 700;
const BOARD_BASE_WIDTH = 1300;
const BOARD_BASE_HEIGHT = 860;
const BOARD_SAFE_PADDING = 24;
const BattleHudControls = dynamic(
  () => import("@/components/battle/BattleHudControls").then((mod) => mod.BattleHudControls),
  { ssr: false },
);

type BattleCastFx = {
  key: number;
  slotId: number;
  damage: number;
  kind: "element" | "skill";
};

type HudSyncLampState = "READY" | "SYNCING" | "ERROR" | "ROLLBACK_REQUIRED";

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function deriveHudLampState(state: BattleState): HudSyncLampState {
  if (state.rollbackRequired || state.syncStatus === "ROLLBACK") {
    return "ROLLBACK_REQUIRED";
  }

  if (state.syncStatus === "RETRYABLE_FAIL") {
    return "ERROR";
  }

  if (
    state.pendingTxHash ||
    state.syncStatus === "PENDING_CHAIN" ||
    state.syncStatus === "LOCAL_APPLIED" ||
    state.turn !== state.confirmedTurn
  ) {
    return "SYNCING";
  }

  return "READY";
}

function getHudSyncMeta(locale: "zh-CN" | "en", lampState: HudSyncLampState) {
  switch (lampState) {
    case "READY":
      return {
        label: locale === "zh-CN" ? "同步完成" : "Ready",
        lampClassName: "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.55)] animate-pulse",
        className:
          "border-emerald-300/25 bg-emerald-400/12 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.16)]",
      };
    case "SYNCING":
      return {
        label: locale === "zh-CN" ? "同步中" : "Syncing",
        lampClassName: "bg-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.5)] animate-pulse",
        className:
          "border-amber-300/25 bg-amber-400/12 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.14)]",
      };
    case "ERROR":
      return {
        label: locale === "zh-CN" ? "同步异常" : "Error",
        lampClassName: "bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.45)]",
        className:
          "border-rose-300/25 bg-rose-400/12 text-rose-100 shadow-[0_0_20px_rgba(251,113,133,0.18)]",
      };
    case "ROLLBACK_REQUIRED":
      return {
        label: locale === "zh-CN" ? "空间扭曲" : "Rollback",
        lampClassName: "bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.5)]",
        className:
          "border-red-300/25 bg-red-400/12 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.18)]",
      };
  }
}

type BattleClientProps = {
  gameId: string;
  initialStateSeed?: Parameters<typeof createInitialBattleState>[1];
};

export function BattleClient({ gameId, initialStateSeed }: BattleClientProps) {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const { isAAEnabled, smartAccountClient, restoreSmartAccount } = useSmartAccount();
  const [state, setState] = useState(() =>
    createInitialBattleState(gameId, initialStateSeed),
  );
  const [isSnapshotReady, setIsSnapshotReady] = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const [castingSlotId, setCastingSlotId] = useState<number | null>(null);
  const [castFx, setCastFx] = useState<BattleCastFx | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [finishModalResult, setFinishModalResult] = useState<"victory" | "defeat" | null>(null);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [isRetryingRoom, setIsRetryingRoom] = useState(false);
  const [finishModalError, setFinishModalError] = useState<string | null>(null);
  const [syncTooltipOpen, setSyncTooltipOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const castFxTimeoutRef = useRef<number | null>(null);
  const exitButtonRef = useRef<HTMLButtonElement | null>(null);
  const gameCompleteTrackedRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const initialState = createInitialBattleState(gameId, initialStateSeed);
    const restoredState = loadBattleStateSnapshot(gameId);
    const hydratedState = restoredState
      ? {
        ...restoredState,
        smartAccount: initialState.smartAccount,
        rewardRecipient: initialState.rewardRecipient,
      }
      : initialState;
    const timeoutId = window.setTimeout(() => {
      setIsSnapshotReady(false);
      setState(hydratedState);
      setIsSnapshotReady(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [gameId, initialStateSeed]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFinishModalResult(null);
      setFinishModalOpen(false);
      setFinishModalError(null);
      setIsRetryingRoom(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [gameId]);

  useEffect(() => {
    gameCompleteTrackedRef.current = false;
  }, [gameId]);

  useEffect(() => {
    if (!isSnapshotReady) {
      return;
    }

    saveBattleStateSnapshot(state);
  }, [isSnapshotReady, state]);

  useEffect(() => {
    const node = viewportRef.current;

    if (!node) {
      return;
    }

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();

      if (!width || !height) {
        return;
      }

      const availableWidth = Math.max(width - BOARD_SAFE_PADDING, 0);
      const availableHeight = Math.max(height - BOARD_SAFE_PADDING, 0);
      setBoardScale(
        Math.min(
          1,
          availableWidth / BOARD_BASE_WIDTH,
          availableHeight / BOARD_BASE_HEIGHT,
        ),
      );
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        measure();
      });

      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (castFxTimeoutRef.current !== null) {
        window.clearTimeout(castFxTimeoutRef.current);
      }
    };
  }, []);

  function captureGameComplete(success: boolean) {
    if (gameCompleteTrackedRef.current) {
      return;
    }

    gameCompleteTrackedRef.current = true;
    posthog.capture("game_complete", {
      game_id: "yahtzee",
      mode: "standard",
      success,
    });
  }

  useEffect(() => {
    if (!state.finished || finishModalResult || state.rollbackRequired || state.syncStatus === "ROLLBACK") {
      return;
    }

    captureGameComplete(state.won);

    const timeoutId = window.setTimeout(() => {
      setFinishModalResult(state.won ? "victory" : "defeat");
      setFinishModalOpen(true);
      setFinishModalError(null);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [finishModalResult, state.finished, state.rollbackRequired, state.syncStatus, state.won]);

  const hudLampState = useMemo(() => deriveHudLampState(state), [state]);
  const hudSyncMeta = useMemo(() => getHudSyncMeta(locale, hudLampState), [hudLampState, locale]);
  const hasUnlockedDice = state.locked.some((value) => !value);
  const rollbackBlocked = state.rollbackRequired || state.syncStatus === "ROLLBACK";
  const bossDisplayName = BATTLE_BOSS_DISPLAY.name[locale];
  const finishBurstVisuals = useMemo(
    () => BATTLE_ELEMENT_ASC_ORDER.map((diceValue) => BATTLE_ELEMENT_VISUALS[diceValue]),
    [],
  );
  const canDiceAction =
    !state.finished &&
    !rollbackBlocked &&
    state.diceActionState === "idle" &&
    state.castActionState === "idle" &&
    (state.rollCount === 0 || (state.rollCount < 3 && hasUnlockedDice));
  const usedSlotsCount = useMemo(
    () => Object.values(state.usedSlots).filter(Boolean).length,
    [state.usedSlots],
  );
  const slotProgressDisplay = state.finished ? 13 : Math.min(usedSlotsCount + 1, 13);

  function matchesOptimisticTurn(
    optimisticSnapshot: PendingCastState["optimisticSnapshot"],
    event: TurnPlayedEvent,
  ) {
    const eventUsedSlots = bitmapToSlots(event.args.usedSlotsBitmap);

    return (
      optimisticSnapshot.bossHpLocal === event.args.bossHpAfter &&
      optimisticSnapshot.upperSubtotalLocal === event.args.upperSubtotalAfter &&
      optimisticSnapshot.won === event.args.won &&
      getUsedSlotsCount(optimisticSnapshot.usedSlots) === getUsedSlotsCount(eventUsedSlots) &&
      Object.entries(eventUsedSlots).every(
        ([slotId, used]) => optimisticSnapshot.usedSlots[Number(slotId)] === used,
      )
    );
  }

  function hasActiveRoundProgress(currentState: BattleState, confirmedTurn: number) {
    return (
      currentState.turn > confirmedTurn ||
      currentState.rollCount > 0 ||
      currentState.dice !== null ||
      currentState.selectedSlotId !== null ||
      currentState.locked.some(Boolean)
    );
  }

  function reconcileConfirmedTurn(
    currentState: BattleState,
    pendingCast: PendingCastState,
    confirmedTurn: number,
    event: TurnPlayedEvent,
  ) {
    const usedSlots = bitmapToSlots(event.args.usedSlotsBitmap);
    const finished = event.args.won || getUsedSlotsCount(usedSlots) >= 13;
    const preserveActiveRound = hasActiveRoundProgress(currentState, confirmedTurn);
    const confirmedUpperBonusClaimed =
      pendingCast.optimisticSnapshot.upperBonusClaimedLocal || event.args.upperSubtotalAfter >= 63;
    const nextState = {
      ...currentState,
      bossHpChain: event.args.bossHpAfter,
      confirmedTurn,
      confirmedUsedSlots: usedSlots,
      confirmedUpperSubtotalLocal: event.args.upperSubtotalAfter,
      confirmedUpperBonusClaimedLocal: confirmedUpperBonusClaimed,
      confirmedFinished: finished,
      confirmedWon: event.args.won,
      castActionState: "idle" as const,
    };

    if (preserveActiveRound) {
      return nextState;
    }

    return {
      ...nextState,
      bossHpLocal: event.args.bossHpAfter,
      usedSlots,
      upperSubtotalLocal: event.args.upperSubtotalAfter,
      upperBonusClaimedLocal: confirmedUpperBonusClaimed,
      finished,
      won: event.args.won,
      turn: confirmedTurn,
      carryoverDice: currentState.carryoverDice,
    };
  }

  async function runDiceAction(action: () => Promise<Awaited<ReturnType<typeof rollDice>>>) {
    setState((currentState) => ({
      ...currentState,
      diceActionState: "waiting",
    }));

    const requestStartedAt = performance.now();

    try {
      const result = await action();
      const rtt = Math.round(performance.now() - requestStartedAt);

      if (rtt < ROLL_VISUAL_MIN_MS) {
        await sleep(ROLL_VISUAL_MIN_MS - rtt);
      }

      startTransition(() => {
        setState((currentState) => ({
          ...applyRollResult(currentState, result),
          diceActionState: "idle",
        }));
      });
    } catch {
      const rtt = Math.round(performance.now() - requestStartedAt);

      if (rtt < ROLL_VISUAL_MIN_MS) {
        await sleep(ROLL_VISUAL_MIN_MS - rtt);
      }

      startTransition(() => {
        setState((currentState) => ({
          ...currentState,
          diceActionState: "idle",
          syncStatus: "RETRYABLE_FAIL",
        }));
      });
    }
  }

  function handleDiceAction() {
    if (!canDiceAction) {
      return;
    }

    if (state.rollCount === 0) {
      void runDiceAction(() =>
        rollDice({
          gameId: state.gameId as `0x${string}`,
          player: state.smartAccount,
        }),
      );
      return;
    }

    if (state.rollCount < 3) {
      void runDiceAction(() =>
        rerollDice({
          gameId: state.gameId as `0x${string}`,
          player: state.smartAccount,
          holdMask: lockedToHoldMask(state.locked),
        }),
      );
    }
  }

  function handleToggleLock(dieIndex: number) {
    if (
      state.diceActionState === "waiting" ||
      state.castActionState === "waiting" ||
      rollbackBlocked
    ) {
      return;
    }

    startTransition(() => {
      setState((currentState) => toggleLockedDie(currentState, dieIndex));
    });
  }

  async function tryAutoRecoverPendingChain(
    previousState: BattleState,
  ): Promise<boolean> {
    const oldTxHash = previousState.pendingTxHash;
    if (!oldTxHash) return false;

    try {
      const { event } = await waitForTurnPlayed(oldTxHash, isAAEnabled);
      const chainUsedSlots = bitmapToSlots(event.args.usedSlotsBitmap);
      const confirmedTurn =
        event.args.won || getUsedSlotsCount(chainUsedSlots) >= 13
          ? event.args.turn
          : event.args.turn + 1;

      await confirmRound({
        gameId: previousState.gameId as `0x${string}`,
        player: previousState.smartAccount,
        pendingTxHash: oldTxHash,
        confirmedTurn,
      });

      const clientUsedSlots = previousState.usedSlots;
      const slotsConsistent = Object.entries(chainUsedSlots).every(
        ([id, used]) => !used || clientUsedSlots[Number(id)] === true,
      );
      const hpConsistent = event.args.bossHpAfter <= previousState.bossHpLocal;

      if (slotsConsistent && hpConsistent) {
        startTransition(() => {
          setState((currentState) => ({
            ...currentState,
            // DO NOT copy previousState blindly, otherwise it stomps active turn state.
            bossHpChain: event.args.bossHpAfter,
            confirmedTurn,
            confirmedUsedSlots: chainUsedSlots,
            confirmedUpperSubtotalLocal: event.args.upperSubtotalAfter,
            confirmedUpperBonusClaimedLocal: event.args.upperSubtotalAfter >= 63,
            confirmedFinished: event.args.won || getUsedSlotsCount(chainUsedSlots) >= 13,
            confirmedWon: event.args.won,
            castActionState: "idle",
            pendingTxHash: undefined,
            pendingCast: null,
            syncStatus: "CONFIRMED",
            rollbackRequired: false,
          }));
          setCastingSlotId(null);
        });
        return true;
      }
    } catch {
      // Recovery failed
    }

    return false;
  }

  function handleCast(slotId: number) {
    if (
      castingSlotId !== null ||
      !state.dice ||
      state.usedSlots[slotId] ||
      state.finished ||
      state.castActionState === "waiting" ||
      !!state.pendingTxHash ||
      rollbackBlocked
    ) {
      return;
    }

    const previousState = state;
    const nextState = applyLocalCast(state, slotId);
    setCastingSlotId(slotId);
    const castResult = nextState.slotResults[slotId];

    if (castResult) {
      if (castFxTimeoutRef.current !== null) {
        window.clearTimeout(castFxTimeoutRef.current);
      }

      setCastFx({
        key: Date.now(),
        slotId,
        damage: castResult.damage,
        kind: slotId <= 5 ? "element" : "skill",
      });

      castFxTimeoutRef.current = window.setTimeout(() => {
        setCastFx(null);
      }, 1200);
    }

    startTransition(() => {
      setState({
        ...nextState,
        castActionState: "waiting",
        syncStatus: "PENDING_CHAIN",
        pendingTxHash: undefined,
        pendingCast: null,
        rollbackRequired: false,
      });
    });

    void (async () => {
      let txHash: `0x${string}` | undefined;
      let pendingCast: PendingCastState | null = null;
      let activeState: BattleState = {
        ...nextState,
        pendingTxHash: undefined,
        pendingCast: null,
        syncStatus: "PENDING_CHAIN" as const,
        rollbackRequired: false,
      };

      try {
        let finalClient = smartAccountClient;
        if (isAAEnabled) {
          try {
            const { getOrCreateEphemeralKey, setupGaslessAccount } = await import("@/lib/aa/smartAccount");
            const privKey = getOrCreateEphemeralKey();
            const { smartAccountClient: freshClient } = await setupGaslessAccount(privKey);
            finalClient = freshClient;
          } catch (e) {
            console.warn("Failed to recreate fresh AA client", e);
          }
        }

        const proof = await finalizeRound({
          gameId: state.gameId as `0x${string}`,
          player: state.smartAccount,
          rewardRecipient: state.rewardRecipient,
        });
        let isAA = false;
        ({ txHash, isAA } = await sendCastTurnUserOp({
          gameId: state.gameId as `0x${string}`,
          slotId,
          proof,
        }, finalClient ?? undefined));
        const shouldAdvanceOptimistically = !nextState.finished;
        let advancedOptimistically = false;
        pendingCast = createPendingCastState(nextState, slotId, txHash);
        activeState = {
          ...nextState,
          pendingTxHash: txHash,
          pendingCast,
          syncStatus: "PENDING_CHAIN" as const,
          rollbackRequired: false,
        };

        if (shouldAdvanceOptimistically) {
          try {
            const advanced = await advanceRound({
              gameId: state.gameId as `0x${string}`,
              player: state.smartAccount,
              nextTurn: state.turn + 1,
              pendingTxHash: txHash,
            });
            activeState = {
              ...advanceOptimisticRound(nextState),
              turn: advanced.turn,
              pendingTxHash: txHash,
              pendingCast,
              syncStatus: "PENDING_CHAIN",
              castActionState: "idle",
              rollbackRequired: false,
            };
            advancedOptimistically = true;
          } catch {
            activeState = {
              ...nextState,
              pendingTxHash: txHash,
              pendingCast,
              syncStatus: "PENDING_CHAIN",
              castActionState: "waiting",
              rollbackRequired: false,
            };
          }
        } else {
          activeState = {
            ...nextState,
            pendingTxHash: txHash,
            pendingCast,
            syncStatus: "PENDING_CHAIN",
            castActionState: "idle",
            rollbackRequired: false,
          };
        }

        startTransition(() => {
          setState(activeState);
        });

        const { event } = await waitForTurnPlayed(txHash, isAA);
        const expectedConfirmedTurn = event.args.won || getUsedSlotsCount(bitmapToSlots(event.args.usedSlotsBitmap)) >= 13
          ? event.args.turn
          : event.args.turn + 1;
        const optimisticMismatch = !pendingCast
          || !matchesOptimisticTurn(pendingCast.optimisticSnapshot, event);

        try {
          if (advancedOptimistically) {
            await confirmRound({
              gameId: state.gameId as `0x${string}`,
              player: state.smartAccount,
              pendingTxHash: txHash,
              confirmedTurn: expectedConfirmedTurn,
            });
          } else if (!event.args.won && getUsedSlotsCount(bitmapToSlots(event.args.usedSlotsBitmap)) < 13) {
            await advanceRound({
              gameId: state.gameId as `0x${string}`,
              player: state.smartAccount,
              nextTurn: event.args.turn + 1,
              pendingTxHash: txHash,
            });
            await confirmRound({
              gameId: state.gameId as `0x${string}`,
              player: state.smartAccount,
              pendingTxHash: txHash,
              confirmedTurn: event.args.turn + 1,
            });
          }

          startTransition(() => {
            setState((currentState) => {
              const mergedState = pendingCast
                ? reconcileConfirmedTurn(
                  currentState,
                  pendingCast,
                  expectedConfirmedTurn,
                  event,
                )
                : currentState;

              return {
                ...mergedState,
                pendingTxHash: optimisticMismatch ? currentState.pendingTxHash ?? txHash : undefined,
                pendingCast: optimisticMismatch ? currentState.pendingCast ?? pendingCast : null,
                syncStatus: optimisticMismatch ? "ROLLBACK" : "CONFIRMED",
                rollbackRequired: optimisticMismatch,
              };
            });
            setCastingSlotId(null);
          });
        } catch {
          startTransition(() => {
            setState((currentState) => {
              const mergedState = pendingCast
                ? reconcileConfirmedTurn(
                  currentState,
                  pendingCast,
                  expectedConfirmedTurn,
                  event,
                )
                : currentState;

              return {
                ...mergedState,
                pendingTxHash: currentState.pendingTxHash ?? txHash,
                pendingCast: currentState.pendingCast ?? pendingCast,
                syncStatus: "ROLLBACK",
                rollbackRequired: true,
              };
            });
            setCastingSlotId(null);
          });
        }
      } catch (error) {
        console.error("Cast Error during AA playTurn:", error);
        
        const isPendingChainErr =
          error instanceof Error &&
          error.message.includes("waiting for on-chain confirmation");

        if (isPendingChainErr) {
          const recovered = await tryAutoRecoverPendingChain(previousState);
          if (recovered) return;
        }

        startTransition(() => {
          setState((currentState) =>
            txHash || isPendingChainErr
              ? {
                ...currentState,
                castActionState: "idle",
                pendingTxHash: currentState.pendingTxHash ?? txHash,
                pendingCast: currentState.pendingCast ?? pendingCast,
                syncStatus: "ROLLBACK",
                rollbackRequired: true,
              }
              : {
                ...previousState,
                castActionState: "idle",
                pendingTxHash: undefined,
                pendingCast: null,
                syncStatus: "RETRYABLE_FAIL",
                rollbackRequired: false,
              },
          );
          setCastingSlotId(null);
        });
      }
    })();
  }

  function handleExitBattle() {
    setExitModalOpen(true);
  }

  function handleCancelExit() {
    setExitModalOpen(false);
    window.requestAnimationFrame(() => {
      exitButtonRef.current?.focus();
    });
  }

  function handleConfirmExit() {
    captureGameComplete(false);
    setExitModalOpen(false);
    router.push("/");
  }

  function handleCloseFinishModal() {
    setFinishModalOpen(false);
    setFinishModalError(null);
  }

  async function handleRetryBattle() {
    setFinishModalError(null);
    setIsRetryingRoom(true);

    try {
      const sender = await getConnectedSenderAddress();
      posthog.capture("game_start", {
        game_id: "yahtzee",
        mode: "standard",
      });

      let player = sender;
      let aaClient: unknown = undefined;

      if (isAAEnabled) {
        try {
          const { getOrCreateEphemeralKey, setupGaslessAccount, bindEphemeralKeyToGame } =
            await import("@/lib/aa/smartAccount");
          const privKey = getOrCreateEphemeralKey();
          const result = await setupGaslessAccount(privKey);
          player = result.safeAddress;
          aaClient = result.smartAccountClient;
          // Will bind after we have the gameId
          void bindEphemeralKeyToGame;
        } catch {
          // Fall back to EOA if AA setup fails during retry
        }
      }

      const session = await createBattleSession({
        player,
        rewardRecipient: sender,
        bossId: 1,
      });
      const { txHash } = await startGameOnChain(
        {
          gameId: session.gameId,
          rewardRecipient: session.rewardRecipient,
          bossId: session.bossId,
        },
        aaClient,
      );

      if (isAAEnabled) {
        try {
          const { getOrCreateEphemeralKey, bindEphemeralKeyToGame } =
            await import("@/lib/aa/smartAccount");
          bindEphemeralKeyToGame(session.gameId, getOrCreateEphemeralKey());
        } catch {
          // Non-critical
        }
      }

      await waitForGameStarted(txHash);

      router.push(`/battle/${session.gameId}`);
    } catch (error) {
      setFinishModalError(error instanceof Error ? error.message : messages.home.errorCreateGame);
      setIsRetryingRoom(false);
    }
  }

  async function handleRollbackBattle() {
    try {
      const rolledBack = await rollbackRound({
        gameId: state.gameId as `0x${string}`,
        player: state.smartAccount,
      });
      const rolledBackSlots = bitmapToSlots(rolledBack.usedSlotsBitmap);

      startTransition(() => {
        setState((currentState) => ({
          ...currentState,
          bossHpLocal: rolledBack.bossHp,
          bossHpChain: rolledBack.bossHp,
          turn: rolledBack.turn,
          confirmedTurn: rolledBack.turn,
          rollCount: rolledBack.rollCount,
          dice: null,
          carryoverDice: null,
          locked: EMPTY_LOCKED_DICE,
          selectedSlotId: null,
          usedSlots: rolledBackSlots,
          confirmedUsedSlots: rolledBackSlots,
          slotResults: Object.fromEntries(
            Object.entries(currentState.slotResults).map(([id, result]) => [
              id,
              rolledBackSlots[Number(id)] ? result : null,
            ])
          ) as BattleState["slotResults"],
          upperSubtotalLocal: rolledBack.upperSubtotal,
          confirmedUpperSubtotalLocal: rolledBack.upperSubtotal,
          upperBonusClaimedLocal: rolledBack.upperBonusClaimed,
          confirmedUpperBonusClaimedLocal: rolledBack.upperBonusClaimed,
          finished: rolledBack.finished,
          confirmedFinished: rolledBack.finished,
          won: rolledBack.won,
          confirmedWon: rolledBack.won,
          castActionState: "idle",
          pendingTxHash: undefined,
          pendingCast: null,
          syncStatus: "CONFIRMED",
          rollbackRequired: false,
        }));
        setCastingSlotId(null);
      });
    } catch {
      startTransition(() => {
        setState((currentState) => ({
          ...currentState,
          syncStatus: "ROLLBACK",
          rollbackRequired: true,
        }));
      });
    }
  }

  if (!isSnapshotReady) {
    return (
      <main className="battle-shell flex min-h-[100dvh] items-center justify-center overflow-auto bg-[#040a14] px-6 py-8">
        <div className="rounded-[22px] border border-white/10 bg-slate-950/70 px-6 py-5 text-sm text-slate-300">
          {messages.battle.restoringSnapshot}
        </div>
      </main>
    );
  }

  return (
    <main className="battle-shell relative min-h-[100dvh] overflow-auto bg-[#040a14] text-white">
      <img
        src="/battle/battle-bg-full.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(7,12,18,0.08),rgba(7,12,18,0.18))]" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <header className="pixel-frost-nav relative z-[50] shrink-0 overflow-visible px-3 py-2 sm:px-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 justify-self-start">
              <button
                ref={exitButtonRef}
                type="button"
                onClick={handleExitBattle}
                aria-label={locale === "zh-CN" ? "退出游戏" : "Exit battle"}
                title={locale === "zh-CN" ? "退出游戏" : "Exit battle"}
                className="pixel-button pixel-button-warning inline-flex h-[2.45rem] w-[2.45rem] items-center justify-center p-0 text-[#fff6c8]"
              >
                <IoPowerSharp className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
              </button>
              <div className="battle-hud-chip pixel-panel inline-flex min-h-[2.45rem] items-center px-3 py-1.5 text-[0.62rem] uppercase text-[#fff6c8]">
                <span className="pixel-font whitespace-nowrap">
                  {BATTLE_BOSS_DISPLAY.bossIdLabel} · {bossDisplayName}
                </span>
              </div>
              <div className="battle-hud-chip pixel-panel inline-flex min-h-[2.45rem] items-center px-3 py-1.5 text-[0.62rem] uppercase text-[#fff6c8]">
                <span className="pixel-font whitespace-nowrap">
                  {locale === "zh-CN" ? `槽位 ${slotProgressDisplay}/13` : `Slot ${slotProgressDisplay}/13`}
                </span>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2 justify-self-center">
              <div className="battle-hud-chip pixel-panel inline-flex min-h-[2.45rem] items-center px-3 py-1.5 text-[0.62rem] uppercase text-[#fff6c8]">
                <span className="pixel-font whitespace-nowrap">TURN {state.turn}</span>
              </div>
              <div
                className="relative"
                onMouseEnter={() => setSyncTooltipOpen(true)}
                onMouseLeave={() => setSyncTooltipOpen(false)}
                onFocusCapture={() => setSyncTooltipOpen(true)}
                onBlurCapture={() => setSyncTooltipOpen(false)}
              >
                <div
                  tabIndex={0}
                  aria-label={messages.battle.sync.lampTooltipLabel}
                  className={[
                    "battle-hud-chip pixel-panel inline-flex min-h-[2.45rem] items-center px-3 py-1.5 text-[0.62rem] uppercase outline-none",
                    hudSyncMeta.className,
                  ].join(" ")}
                >
                  <span className={["mr-2 inline-flex h-2.5 w-2.5 rounded-full", hudSyncMeta.lampClassName].join(" ")} />
                  <span className="pixel-font whitespace-nowrap">{hudSyncMeta.label}</span>
                </div>
                {syncTooltipOpen ? (
                  <div className="battle-sync-tooltip pixel-rounded-md pixel-panel absolute left-1/2 top-[calc(100%+10px)] z-[155] w-[min(20rem,42vw)] -translate-x-1/2 px-3 py-2 text-left text-[#fff8d1] shadow-[0_18px_32px_rgba(7,12,20,0.34)]">
                    <p className="battle-row-tooltip-title pixel-font">{messages.battle.sync.lampTooltipLabel}</p>
                    <p className="battle-row-tooltip-body pixel-font mt-1">{messages.battle.sync.lampCopy[hudLampState]}</p>
                    {hudLampState === "SYNCING" && state.pendingTxHash ? (
                      <p className="battle-row-tooltip-notice pixel-font mt-2">
                        {messages.battle.sync.castPendingHint}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="justify-self-end">
              <BattleHudControls />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 px-0 pb-0 pt-20">
          <div ref={viewportRef} className="relative h-full w-full" style={{ minHeight: `${BOARD_BASE_HEIGHT * 0.85}px` }}>
            <div
              data-testid="battle-board"
              className="absolute left-1/2 top-1/2 origin-center"
              style={{
                width: `${BOARD_BASE_WIDTH}px`,
                height: `${BOARD_BASE_HEIGHT}px`,
                transform: `translate(-50%, -50%) scale(${boardScale})`,
              }}
            >
              <div className="absolute inset-0 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(7,12,20,0.02))]" />

              <BattleStage state={state} castFx={castFx} />

              <div
                className="absolute"
                style={{
                  left: `${BATTLE_SCENE_LAYOUT.passivePanel.left}%`,
                  top: `${BATTLE_SCENE_LAYOUT.passivePanel.top}%`,
                  width: `${BATTLE_SCENE_LAYOUT.passivePanel.width}%`,
                }}
              >
                <PassiveItemsPanel />
              </div>

              <div
                className="absolute"
                style={{
                  left: `${BATTLE_SCENE_LAYOUT.tray.left}%`,
                  top: `${BATTLE_SCENE_LAYOUT.tray.top}%`,
                  width: `${BATTLE_SCENE_LAYOUT.tray.width}%`,
                }}
              >
                <DiceBoard
                  dice={state.dice}
                  carryoverDice={state.carryoverDice}
                  locked={state.locked}
                  rollCount={state.rollCount}
                  canDiceAction={canDiceAction}
                  isRollingVisual={state.diceActionState === "waiting"}
                  isSubmittingCast={state.castActionState === "waiting"}
                  isChainPending={!!state.pendingTxHash}
                  finished={state.finished}
                  onDiceAction={handleDiceAction}
                  onToggleLock={handleToggleLock}
                />
              </div>

              <div
                className="absolute"
                style={{
                  left: `${BATTLE_SCENE_LAYOUT.rightPanel.left}%`,
                  top: `${BATTLE_SCENE_LAYOUT.rightPanel.top}%`,
                  width: `${BATTLE_SCENE_LAYOUT.rightPanel.width}%`,
                  height: `${BATTLE_SCENE_LAYOUT.rightPanel.height}%`,
                }}
              >
                <ScoreBoard
                  state={state}
                  castingSlotId={castingSlotId}
                  isCasting={state.castActionState === "waiting" || !!state.pendingTxHash}
                  castFx={castFx}
                  onCastSlot={handleCast}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {exitModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(3,8,14,0.5)] backdrop-blur-[4px]">
          <div className="pixel-rounded-lg pixel-panel w-[min(24rem,calc(100vw-2rem))] px-5 py-4 text-center text-[#fff6c8] shadow-[0_20px_38px_rgba(3,8,18,0.34)]">
            <p className="battle-modal-title pixel-font text-[0.84rem] uppercase tracking-[0.12em] text-[#fff8d1]">
              {locale === "zh-CN" ? "退出战斗" : "Leave Battle"}
            </p>
            <p className="battle-modal-copy pixel-font mt-3 text-[0.6rem] leading-[1.8] text-slate-100">
              {locale === "zh-CN"
                ? "确认退出当前战斗并返回首页？"
                : "Leave this battle and return to the homepage?"}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCancelExit}
                className="battle-modal-action pixel-button inline-flex min-h-[2.4rem] min-w-[6.2rem] items-center justify-center px-4 py-2 text-[0.62rem] uppercase text-[#fff6c8]"
              >
                {locale === "zh-CN" ? "取消" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="battle-modal-action pixel-button pixel-button-warning inline-flex min-h-[2.4rem] min-w-[6.2rem] items-center justify-center px-4 py-2 text-[0.62rem] uppercase text-[#fff6c8]"
              >
                {locale === "zh-CN" ? "确认" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rollbackBlocked ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(26,6,6,0.58)] backdrop-blur-[5px]">
          <div className="pixel-rounded-lg pixel-panel w-[min(24rem,calc(100vw-2rem))] px-5 py-4 text-center text-[#fff6c8] shadow-[0_20px_38px_rgba(30,6,6,0.4)]">
            <p className="battle-modal-title pixel-font text-[0.84rem] uppercase tracking-[0.12em] text-[#fff8d1]">
              {messages.battle.sync.rollbackTitle}
            </p>
            <p className="battle-modal-copy pixel-font mt-3 text-[0.6rem] leading-[1.8] text-slate-100">
              {messages.battle.sync.rollbackBody}
            </p>
            <div className="mt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={handleRollbackBattle}
                className="battle-modal-action pixel-button pixel-button-warning inline-flex min-h-[2.4rem] min-w-[10rem] items-center justify-center px-4 py-2 text-[0.62rem] uppercase text-[#fff6c8]"
              >
                {messages.battle.sync.rollbackAction}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {finishModalOpen && finishModalResult ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(3,8,14,0.56)] backdrop-blur-[5px]">
          <div className="relative w-[min(28rem,calc(100vw-2rem))]">
            {finishModalResult === "victory" ? (
              <div className="pointer-events-none absolute inset-0 -z-[1]">
                {finishBurstVisuals.map((visual, index) => (
                  <img
                    key={visual.diceValue}
                    src={visual.iconSrc}
                    alt=""
                    aria-hidden="true"
                    className="battle-victory-burst"
                    style={
                      {
                        "--burst-x": `${[-122, -72, -36, 36, 82, 128][index]}px`,
                        "--burst-y": `${[-112, -146, -120, -132, -148, -114][index]}px`,
                        "--burst-delay": `${index * 95}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            ) : null}
            <div className="pixel-rounded-lg pixel-panel px-5 py-4 text-center text-[#fff6c8] shadow-[0_20px_38px_rgba(3,8,18,0.34)]">
              <p className="battle-modal-title pixel-font text-[0.84rem] uppercase tracking-[0.12em] text-[#fff8d1]">
                {finishModalResult === "victory"
                  ? messages.battle.finish.victoryTitle
                  : messages.battle.finish.defeatTitle}
              </p>
              <p className="battle-modal-copy pixel-font mt-3 text-[0.6rem] leading-[1.8] text-slate-100">
                {finishModalResult === "victory"
                  ? messages.battle.finish.victoryBody
                  : messages.battle.finish.defeatBody}
              </p>
              {finishModalError ? (
                <p className="battle-modal-copy pixel-font mt-3 text-[0.56rem] leading-[1.7] text-[#ffd0d0]">
                  {finishModalError}
                </p>
              ) : null}
              <div className="mt-5 flex items-center justify-center gap-3">
                {finishModalResult === "victory" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="battle-modal-action pixel-button inline-flex min-h-[2.4rem] min-w-[6.8rem] items-center justify-center px-4 py-2 text-[0.62rem] uppercase text-[#fff6c8]"
                    >
                      {messages.battle.finish.victoryReturn}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseFinishModal}
                      className="battle-modal-action pixel-button inline-flex min-h-[2.4rem] min-w-[6.8rem] items-center justify-center px-4 py-2 text-[0.62rem] uppercase text-[#fff6c8]"
                    >
                      {messages.battle.finish.victoryStay}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      disabled={isRetryingRoom}
                      className="battle-modal-action pixel-button inline-flex min-h-[2.4rem] min-w-[6.8rem] items-center justify-center px-4 py-2 text-[0.62rem] uppercase text-[#fff6c8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {messages.battle.finish.defeatReturn}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleRetryBattle();
                      }}
                      disabled={isRetryingRoom}
                      className="battle-modal-action pixel-button pixel-button-warning inline-flex min-h-[2.4rem] min-w-[8.8rem] items-center justify-center px-4 py-2 text-[0.62rem] uppercase text-[#fff6c8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isRetryingRoom
                        ? messages.battle.finish.retrying
                        : messages.battle.finish.defeatRetry}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
