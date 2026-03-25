import type { DiceArray, DiceValue, LockedDice } from "@/types/game";

export const EMPTY_LOCKED_DICE: LockedDice = [false, false, false, false, false];

export const DICE_ELEMENT_MAP: Record<
  DiceValue,
  {
    emoji: string;
    label: string;
  }
> = {
  1: { emoji: "💧", label: "Water" },
  2: { emoji: "⚙️", label: "Metal" },
  3: { emoji: "🪨", label: "Earth" },
  4: { emoji: "💨", label: "Air" },
  5: { emoji: "🌿", label: "Wood" },
  6: { emoji: "🔥", label: "Fire" },
};

export function lockedToHoldMask(locked: LockedDice) {
  return locked.reduce((mask, value, index) => {
    return value ? mask | (1 << index) : mask;
  }, 0);
}

export function holdMaskToLocked(holdMask: number): LockedDice {
  return [0, 1, 2, 3, 4].map((index) => ((holdMask >> index) & 1) === 1) as LockedDice;
}

export function getDiceElement(value: DiceValue) {
  return DICE_ELEMENT_MAP[value];
}

export function createAnimatedDiceFrame(
  dice: DiceArray | null,
  locked: LockedDice,
  randomSource: () => number = Math.random,
): DiceArray {
  return [0, 1, 2, 3, 4].map((index) => {
    if (dice && locked[index]) {
      return dice[index];
    }

    return (Math.floor(randomSource() * 6) + 1) as DiceValue;
  }) as DiceArray;
}
