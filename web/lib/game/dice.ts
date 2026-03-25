import type { LockedDice } from "@/types/game";

export const EMPTY_LOCKED_DICE: LockedDice = [false, false, false, false, false];

export function lockedToHoldMask(locked: LockedDice) {
  return locked.reduce((mask, value, index) => {
    return value ? mask | (1 << index) : mask;
  }, 0);
}

export function holdMaskToLocked(holdMask: number): LockedDice {
  return [0, 1, 2, 3, 4].map((index) => ((holdMask >> index) & 1) === 1) as LockedDice;
}
