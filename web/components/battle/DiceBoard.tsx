"use client";

import { useEffect, useMemo, useState } from "react";
import { LuLock } from "react-icons/lu";

import { useLocale } from "@/components/providers/LocaleProvider";
import { BATTLE_ELEMENT_VISUALS } from "@/lib/battle/config";
import { createAnimatedDiceFrame } from "@/lib/game/dice";
import type { DiceArray, LockedDice } from "@/types/game";

const DIE_POSITIONS = [
  { left: "28%", top: "35%" },
  { left: "50%", top: "31%" },
  { left: "72%", top: "35%" },
  { left: "39%", top: "64%" },
  { left: "61%", top: "64%" },
] as const;

function getDiceFaceSrc(value: number) {
  if (value >= 1 && value <= 6) {
    return BATTLE_ELEMENT_VISUALS[value as 1 | 2 | 3 | 4 | 5 | 6].diceFaceSrc;
  }

  return "/dice/dice-six-sides.png";
}

function createPreviewDiceFaces(): DiceArray {
  const pool = [1, 2, 3, 4, 5, 6];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = pool[index];

    pool[index] = pool[swapIndex];
    pool[swapIndex] = current;
  }

  return [
    pool[0] as DiceArray[number],
    pool[1] as DiceArray[number],
    pool[2] as DiceArray[number],
    pool[3] as DiceArray[number],
    pool[4] as DiceArray[number],
  ];
}

type DiceBoardProps = {
  dice: DiceArray | null;
  carryoverDice: DiceArray | null;
  locked: LockedDice;
  rollCount: number;
  canDiceAction: boolean;
  isRollingVisual: boolean;
  isSubmittingCast: boolean;
  isChainPending: boolean;
  finished: boolean;
  onDiceAction: () => void;
  onToggleLock: (index: number) => void;
};

export function DiceBoard({
  dice,
  carryoverDice,
  locked,
  rollCount,
  canDiceAction,
  isRollingVisual,
  isSubmittingCast,
  isChainPending,
  finished,
  onDiceAction,
  onToggleLock,
}: DiceBoardProps) {
  const { locale, messages } = useLocale();
  const [animatedValues, setAnimatedValues] = useState<DiceArray>(() =>
    createAnimatedDiceFrame(dice, locked),
  );
  const [previewValues] = useState<DiceArray>(() => createPreviewDiceFaces());

  useEffect(() => {
    if (!isRollingVisual) {
      return;
    }

    // Seed the first animation frame immediately so locked dice never flash
    // to a random face before the interval starts ticking.
    setAnimatedValues(createAnimatedDiceFrame(dice, locked));

    const intervalId = window.setInterval(() => {
      setAnimatedValues(createAnimatedDiceFrame(dice, locked));
    }, 90);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dice, isRollingVisual, locked]);

  const displayDice = dice ?? carryoverDice;
  const statusCopy = useMemo(() => {
    if (finished) {
      return messages.battle.dice.battleFinished;
    }

    if (isSubmittingCast) {
      return messages.battle.dice.syncingCast;
    }

    if (isChainPending) {
      return messages.battle.dice.pendingChain;
    }

    if (isRollingVisual) {
      return messages.battle.dice.rolling;
    }

    if (!dice) {
      return messages.battle.dice.clickToStart;
    }

    if (rollCount < 3) {
      return messages.battle.dice.lockThenRoll;
    }

    return messages.battle.dice.noRerolls;
  }, [dice, finished, isChainPending, isRollingVisual, isSubmittingCast, messages.battle.dice, rollCount]);
  const remainingRolls = Math.max(0, 3 - rollCount);
  const rollLabel = `${messages.battle.dice.rollButton}(${remainingRolls}/3)`;

  return (
    <section className="relative">
      <div className="relative mx-auto aspect-[983/557] w-full">
        <img
          src="/battle/dice-plate.png"
          alt="Wooden dice tray"
          className="absolute inset-0 h-full w-full object-contain"
        />

        {DIE_POSITIONS.map((position, index) => {
          const value =
            isRollingVisual && dice && locked[index]
              ? dice[index]
              : isRollingVisual
                ? animatedValues[index]
                : (displayDice ?? previewValues)[index];
          const isKnown = value >= 1 && value <= 6;
          const faceSrc = getDiceFaceSrc(value);
          const disabled = !dice || isSubmittingCast || finished || isRollingVisual;

          return (
            <button
              type="button"
              key={`${index}-${value}-${locked[index] ? "locked" : "open"}`}
              aria-label={`${messages.battle.dice.die(index)} ${
                locked[index] ? messages.battle.dice.locked : messages.battle.dice.unlocked
              }`}
              onClick={() => onToggleLock(index)}
              disabled={disabled}
              className="absolute h-[31%] w-[22%] -translate-x-1/2 -translate-y-1/2 bg-transparent transition hover:-translate-y-[53%] disabled:cursor-not-allowed"
              style={{ left: position.left, top: position.top }}
            >
              <div className="relative flex h-full items-center justify-center">
                <img
                  src={faceSrc}
                  alt={isKnown ? messages.battle.elementLabels[value as 1 | 2 | 3 | 4 | 5 | 6] : messages.battle.dice.unknownFace}
                  className="h-[88%] w-auto object-contain drop-shadow-[0_10px_16px_rgba(15,23,42,0.22)]"
                />
                {locked[index] ? (
                  <span className="absolute right-[6px] top-[6px] inline-flex h-[18px] w-[18px] items-center justify-center bg-amber-300/90 text-[#3d2307] shadow-[0_4px_10px_rgba(15,23,42,0.18)]">
                    <LuLock className="h-[10px] w-[10px]" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-[12px] flex flex-col items-center justify-center gap-2.5">
        {!finished ? (
          <p className="pixel-font animate-pulse text-center text-[0.6rem] tracking-wider text-amber-200/90">
            {locale === "zh-CN" ? "✦ 点击骰子可以锁定或解锁想要的元素 ✦" : "✦ Click dice to lock or unlock elements ✦"}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onDiceAction}
          disabled={!canDiceAction || finished || isRollingVisual || isSubmittingCast}
          title={statusCopy}
          aria-label={rollLabel}
          className={[
            "pixel-cta-button inline-flex min-h-[54px] min-w-[208px] items-center justify-center gap-3 px-5 py-3 text-[0.88rem] uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-55",
            canDiceAction && !finished && !isRollingVisual && !isSubmittingCast && !isChainPending ? "battle-roll-breathing" : ""
          ].join(" ")}
        >
          {rollLabel}
        </button>
      </div>
    </section>
  );
}
