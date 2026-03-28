"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { IoPowerSharp } from "react-icons/io5";

import { advanceRound, rerollDice, rollDice } from "@/lib/api/backend";
import { BattleStage } from "@/components/battle/BattleStage";
import { DiceBoard } from "@/components/battle/DiceBoard";
import { PassiveItemsPanel } from "@/components/battle/PassiveItemsPanel";
import { ScoreBoard } from "@/components/battle/ScoreBoard";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  BATTLE_BOSS_DISPLAY,
  BATTLE_SCENE_LAYOUT,
} from "@/lib/battle/config";
import { lockedToHoldMask } from "@/lib/game/dice";
import { DEMO_PLAYER, DEMO_REWARD_RECIPIENT } from "@/lib/game/demo";
import {
  applyLocalCast,
  applyRollResult,
  createInitialBattleState,
  loadBattleStateSnapshot,
  saveBattleStateSnapshot,
  toggleLockedDie,
} from "@/store/battleStore";
import type { SyncStatus } from "@/types/game";

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

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getHudSyncMeta(locale: "zh-CN" | "en", status: SyncStatus) {
  switch (status) {
    case "LOCAL_APPLIED":
      return {
        label: locale === "zh-CN" ? "云端就绪" : "Cloud Ready",
        className:
          "border-emerald-300/25 bg-emerald-400/12 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.16)]",
      };
    case "PENDING_CHAIN":
      return {
        label: locale === "zh-CN" ? "同步中" : "Syncing",
        className:
          "border-amber-300/25 bg-amber-400/12 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.14)]",
      };
    case "CONFIRMED":
      return {
        label: locale === "zh-CN" ? "链上确认" : "Confirmed",
        className:
          "border-sky-300/25 bg-sky-400/12 text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.14)]",
      };
    case "RETRYABLE_FAIL":
      return {
        label: locale === "zh-CN" ? "同步失败" : "Retry",
        className:
          "border-rose-300/25 bg-rose-400/12 text-rose-100 shadow-[0_0_20px_rgba(251,113,133,0.18)]",
      };
    case "ROLLBACK":
      return {
        label: locale === "zh-CN" ? "已回滚" : "Rollback",
        className:
          "border-fuchsia-300/25 bg-fuchsia-400/12 text-fuchsia-100 shadow-[0_0_20px_rgba(217,70,239,0.16)]",
      };
  }
}

type BattleClientProps = {
  gameId: string;
};

export function BattleClient({ gameId }: BattleClientProps) {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const [state, setState] = useState(() =>
    createInitialBattleState(gameId, {
      smartAccount: DEMO_PLAYER,
      rewardRecipient: DEMO_REWARD_RECIPIENT,
    }),
  );
  const [isSnapshotReady, setIsSnapshotReady] = useState(false);
  const [boardScale, setBoardScale] = useState(1);
  const [castingSlotId, setCastingSlotId] = useState<number | null>(null);
  const [castFx, setCastFx] = useState<BattleCastFx | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const castFxTimeoutRef = useRef<number | null>(null);
  const exitButtonRef = useRef<HTMLButtonElement | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const restoredState = loadBattleStateSnapshot(gameId);
    const timeoutId = window.setTimeout(() => {
      if (restoredState) {
        setState(restoredState);
      }

      setIsSnapshotReady(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
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

  const hudSyncMeta = useMemo(() => getHudSyncMeta(locale, state.syncStatus), [locale, state.syncStatus]);
  const hasUnlockedDice = state.locked.some((value) => !value);
  const bossDisplayName = BATTLE_BOSS_DISPLAY.name[locale];
  const canDiceAction =
    !state.finished &&
    state.diceActionState === "idle" &&
    state.castActionState === "idle" &&
    (state.rollCount === 0 || (state.rollCount < 3 && hasUnlockedDice));
  const usedSlotsCount = useMemo(
    () => Object.values(state.usedSlots).filter(Boolean).length,
    [state.usedSlots],
  );
  const slotProgressDisplay = state.finished ? 13 : Math.min(usedSlotsCount + 1, 13);

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
          syncStatus: "LOCAL_APPLIED",
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
        castActionState: nextState.finished ? "idle" : "waiting",
      });
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
            setCastingSlotId(null);
          });
        } catch {
          startTransition(() => {
            setState((currentState) => ({
              ...currentState,
              castActionState: "idle",
              syncStatus: "RETRYABLE_FAIL",
            }));
            setCastingSlotId(null);
          });
        }
      })();
    } else {
      setCastingSlotId(null);
    }
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
    setExitModalOpen(false);
    router.push("/");
  }

  if (!isSnapshotReady) {
    return (
      <main className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#040a14] px-6 py-8">
        <div className="rounded-[22px] border border-white/10 bg-slate-950/70 px-6 py-5 text-sm text-slate-300">
          {messages.battle.restoringSnapshot}
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#040a14] text-white">
      <img
        src="/battle/battle-bg-full.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,12,18,0.08),rgba(7,12,18,0.18))]" />

      <div className="relative z-10 flex h-full flex-col overflow-hidden">
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
                className={[
                  "battle-hud-chip pixel-panel inline-flex min-h-[2.45rem] items-center px-3 py-1.5 text-[0.62rem] uppercase",
                  hudSyncMeta.className,
                ].join(" ")}
                title={messages.battle.sync.statusCopy[state.syncStatus]}
              >
                <span className="pixel-font whitespace-nowrap">{hudSyncMeta.label}</span>
              </div>
            </div>

            <div className="justify-self-end">
              <BattleHudControls />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden px-0 pb-0 pt-0">
          <div ref={viewportRef} className="relative h-full w-full overflow-hidden">
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
                  locked={state.locked}
                  rollCount={state.rollCount}
                  canDiceAction={canDiceAction}
                  isRollingVisual={state.diceActionState === "waiting"}
                  isCasting={state.castActionState === "waiting"}
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
                  isCasting={state.castActionState === "waiting"}
                  castFx={castFx}
                  onCastSlot={handleCast}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {exitModalOpen ? (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-[rgba(3,8,14,0.5)] backdrop-blur-[4px]">
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
    </main>
  );
}
