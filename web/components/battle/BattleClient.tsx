"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { advanceRound, rerollDice, rollDice } from "@/lib/api/backend";
import { ProtoMonPanel } from "@/components/battle/ProtoMonPanel";
import { BossPanel } from "@/components/battle/BossPanel";
import { DiceBoard } from "@/components/battle/DiceBoard";
import { ScoreBoard } from "@/components/battle/ScoreBoard";
import { SessionGate } from "@/components/battle/SessionGate";
import { SyncStatusPanel } from "@/components/battle/SyncStatus";
import { lockedToHoldMask } from "@/lib/game/dice";
import { DEMO_PLAYER, DEMO_REWARD_RECIPIENT } from "@/lib/game/demo";
import { computeLocalScore } from "@/lib/game/scoring";
import {
  applyLocalCast,
  applyRollResult,
  createInitialBattleState,
  loadBattleStateSnapshot,
  saveBattleStateSnapshot,
  toggleLockedDie,
} from "@/store/battleStore";

type BattleClientProps = {
  gameId: string;
};

const ROLL_VISUAL_MIN_MS = 700;

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function BattleClient({ gameId }: BattleClientProps) {
  const [state, setState] = useState(() =>
    createInitialBattleState(gameId, {
      smartAccount: DEMO_PLAYER,
      rewardRecipient: DEMO_REWARD_RECIPIENT,
    }),
  );
  const [statusMessage, setStatusMessage] = useState(
    "First roll uses backend authority. CAST stays local-only in this phase.",
  );
  const [lastDiceRttMs, setLastDiceRttMs] = useState<number | null>(null);
  const [isSnapshotReady, setIsSnapshotReady] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const restoredState = loadBattleStateSnapshot(gameId);

    if (restoredState) {
      setState(restoredState);
      setStatusMessage("Recovered the local battle snapshot from this tab.");
    }

    setIsSnapshotReady(true);
  }, [gameId]);

  useEffect(() => {
    if (!isSnapshotReady) {
      return;
    }

    saveBattleStateSnapshot(state);
  }, [isSnapshotReady, state]);

  const redisKey = useMemo(() => `game:${state.gameId}`, [state.gameId]);
  const hasUnlockedDice = state.locked.some((value) => !value);
  const canDiceAction =
    !state.finished &&
    state.diceActionState === "idle" &&
    state.castActionState === "idle" &&
    (state.rollCount === 0 || (state.rollCount < 3 && hasUnlockedDice));
  const diceButtonLabel = state.castActionState === "waiting" ? "正在施法" : "ROLL";

  async function runDiceAction(action: () => Promise<Awaited<ReturnType<typeof rollDice>>>) {
    setState((currentState) => ({
      ...currentState,
      diceActionState: "waiting",
    }));
    setStatusMessage("Requesting authoritative dice from the cloud dealer...");

    const requestStartedAt = performance.now();

    try {
      const result = await action();
      const rtt = Math.round(performance.now() - requestStartedAt);
      setLastDiceRttMs(rtt);

      if (rtt < ROLL_VISUAL_MIN_MS) {
        await sleep(ROLL_VISUAL_MIN_MS - rtt);
      }

      startTransition(() => {
        setState((currentState) => ({
          ...applyRollResult(currentState, result),
          diceActionState: "idle",
          syncStatus: "LOCAL_APPLIED",
        }));
        setStatusMessage(
          result.rollCount === 1
            ? "Authoritative dice received. Lock what you want to keep, then press ROLL again."
            : "Reroll synced from backend. Locked dice stayed highlighted for the next decision.",
        );
      });
    } catch (error) {
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
        setStatusMessage(error instanceof Error ? error.message : "Dice request failed.");
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
          gameId: state.gameId,
          player: state.smartAccount,
        }),
      );
      return;
    }

    if (state.rollCount < 3) {
      void runDiceAction(() =>
        rerollDice({
          gameId: state.gameId,
          player: state.smartAccount,
          holdMask: lockedToHoldMask(state.locked),
        }),
      );
    }
  }

  function handleToggleLock(dieIndex: number) {
    if (state.diceActionState === "waiting" || state.castActionState === "waiting") {
      return;
    }

    startTransition(() => {
      setState((currentState) => toggleLockedDie(currentState, dieIndex));
    });
  }

  function handleCast(slotId: number) {
    if (
      !state.dice ||
      state.usedSlots[slotId] ||
      state.finished ||
      state.castActionState === "waiting"
    ) {
      return;
    }

    const score = computeLocalScore(slotId, state.dice, state);
    const nextState = applyLocalCast(state, slotId);
    const nextStatusMessage = nextState.finished
      ? nextState.won
        ? `Final CAST dealt ${score.totalDamage} damage and defeated the boss.`
        : `Final CAST dealt ${score.totalDamage} damage, but the boss survived all 13 slots.`
      : score.bonusDamage > 0
        ? `CAST dealt ${score.totalDamage} damage, including the +35 upper bonus.`
        : `CAST dealt ${score.totalDamage} damage.`;

    startTransition(() => {
      setState({
        ...nextState,
        castActionState: nextState.finished ? "idle" : "waiting",
      });
      setStatusMessage(nextStatusMessage);
    });

    if (!nextState.finished) {
      void (async () => {
        try {
          await advanceRound({
            gameId: state.gameId,
            player: state.smartAccount,
            nextTurn: nextState.turn,
          });

          startTransition(() => {
            setState((currentState) => ({
              ...currentState,
              castActionState: "idle",
              syncStatus: "LOCAL_APPLIED",
            }));
            setStatusMessage(`${nextStatusMessage} Spell sync complete. Next round is ready.`);
          });
        } catch (error) {
          startTransition(() => {
            setState((currentState) => ({
              ...currentState,
              castActionState: "idle",
              syncStatus: "RETRYABLE_FAIL",
            }));
            setStatusMessage(
              error instanceof Error
                ? `Local CAST applied, but backend round advance failed: ${error.message}`
                : "Local CAST applied, but backend round advance failed.",
            );
          });
        }
      })();
    }
  }

  if (!isSnapshotReady) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-slate-950/50 p-8 text-sm text-slate-300">
          Restoring local battle snapshot...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-slate-950/50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">
                Classic Battle Board
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                ProtoMon Yahtzee Battle
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                左侧先预留 ProtoMon 与未来被动位，中间集中战斗与掷骰流程，右侧固定放积分板。
              </p>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <div className="inline-flex rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                gameId: {gameId}
              </div>
              <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
                Back to Lobby
              </Link>
            </div>
          </div>
        </header>

        <SessionGate gameId={gameId}>
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.45fr_1fr]">
            <div className="flex flex-col gap-6">
              <ProtoMonPanel />
              <SyncStatusPanel
                status={state.syncStatus}
                message={statusMessage}
                pendingTxHash={state.pendingTxHash}
                redisKey={redisKey}
                latestDiceRttMs={lastDiceRttMs}
              />
            </div>

            <div className="flex flex-col gap-6">
              <BossPanel state={state} />
              <DiceBoard
                dice={state.dice}
                locked={state.locked}
                rollCount={state.rollCount}
                actionLabel={diceButtonLabel}
                canDiceAction={canDiceAction}
                isRollingVisual={state.diceActionState === "waiting"}
                isCasting={state.castActionState === "waiting"}
                finished={state.finished}
                onDiceAction={handleDiceAction}
                onToggleLock={handleToggleLock}
              />
            </div>

            <div className="flex flex-col gap-6">
              <ScoreBoard
                state={state}
                isCasting={state.castActionState === "waiting"}
                onCastSlot={handleCast}
              />
            </div>
          </div>
        </SessionGate>
      </div>
    </main>
  );
}
