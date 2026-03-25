import { useEffect, useState } from "react";

import { createAnimatedDiceFrame, DICE_ELEMENT_MAP } from "@/lib/game/dice";
import type { DiceArray, LockedDice } from "@/types/game";

type DiceBoardProps = {
  dice: DiceArray | null;
  locked: LockedDice;
  rollCount: number;
  actionLabel: string;
  canDiceAction: boolean;
  isRollingVisual: boolean;
  isCasting: boolean;
  finished: boolean;
  onDiceAction: () => void;
  onToggleLock: (index: number) => void;
};

export function DiceBoard({
  dice,
  locked,
  rollCount,
  actionLabel,
  canDiceAction,
  isRollingVisual,
  isCasting,
  finished,
  onDiceAction,
  onToggleLock,
}: DiceBoardProps) {
  const [animatedValues, setAnimatedValues] = useState<DiceArray>(() =>
    createAnimatedDiceFrame(dice, locked),
  );

  useEffect(() => {
    if (!isRollingVisual) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAnimatedValues(createAnimatedDiceFrame(dice, locked));
    }, 90);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dice, isRollingVisual, locked]);

  const values = isRollingVisual ? animatedValues : dice ?? [0, 0, 0, 0, 0];
  const controlsDisabled = finished || isRollingVisual || isCasting;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Dice</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Roll Board</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 text-sm text-slate-300">
          rollCount: {rollCount} / 3
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onDiceAction}
          disabled={!canDiceAction || controlsDisabled}
          className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
        <div className="rounded-full border border-white/10 bg-slate-950/45 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-400">
          {finished
            ? "Battle finished"
            : isCasting
              ? "正在同步本地施法结果"
              : isRollingVisual
                ? "云端骰面生成中..."
                : !dice
                  ? "点击 ROLL 开始当前回合"
                  : rollCount < 3
                    ? "锁定想保留的骰子，再按 ROLL"
                    : "本回合次数已满，去积分板施法"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        {values.map((value, index) => {
          const isUnknown = value === 0;
          const element = isUnknown ? null : DICE_ELEMENT_MAP[value];

          return (
            <button
              type="button"
              key={`${index}-${value}-${locked[index] ? "locked" : "open"}`}
              onClick={() => onToggleLock(index)}
              disabled={!dice || controlsDisabled}
              className={
                locked[index]
                  ? "rounded-[22px] border border-amber-300/70 bg-amber-300/12 p-5 text-center shadow-[0_0_0_1px_rgba(253,224,71,0.16)] transition hover:border-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                  : isRollingVisual
                    ? "rounded-[22px] border border-cyan-200/40 bg-cyan-300/10 p-5 text-center transition disabled:cursor-not-allowed disabled:opacity-70"
                    : "rounded-[22px] border border-white/10 bg-slate-950/50 p-5 text-center transition hover:border-cyan-200/40 disabled:cursor-not-allowed disabled:opacity-70"
              }
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Die {index + 1}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-4xl font-semibold text-white">
                {isUnknown ? (
                  "?"
                ) : (
                  <>
                    <span>{value}</span>
                    <span>{element?.emoji}</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {isUnknown ? "Unknown face" : element?.label}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                {locked[index] ? "Locked" : "Unlocked"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
