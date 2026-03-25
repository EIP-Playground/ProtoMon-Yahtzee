import { isUpperSlot } from "@/lib/game/slots";
import type { BattleState, DiceArray } from "@/types/game";

export const UPPER_BONUS_TARGET = 63;
export const UPPER_BONUS_DAMAGE = 35;

export type LocalScoreResult = {
  slotScore: number;
  bonusDamage: number;
  totalDamage: number;
  nextUpperSubtotal: number;
  nextUpperBonusClaimed: boolean;
};

function sumDice(dice: DiceArray) {
  return dice.reduce((total, value) => total + value, 0);
}

function countFaces(dice: DiceArray) {
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const value of dice) {
    counts[value] += 1;
  }

  return counts;
}

function hasSequence(values: number[], target: number[]) {
  return target.every((value) => values.includes(value));
}

function isSmallStraight(dice: DiceArray) {
  const values = [...new Set(dice)].sort((left, right) => left - right);

  return (
    hasSequence(values, [1, 2, 3, 4]) ||
    hasSequence(values, [2, 3, 4, 5]) ||
    hasSequence(values, [3, 4, 5, 6])
  );
}

function isLargeStraight(dice: DiceArray) {
  const values = [...new Set(dice)].sort((left, right) => left - right);

  return (
    values.length === 5 &&
    (hasSequence(values, [1, 2, 3, 4, 5]) || hasSequence(values, [2, 3, 4, 5, 6]))
  );
}

export function getSlotScore(slotId: number, dice: DiceArray) {
  if (slotId >= 0 && slotId <= 5) {
    const faceValue = slotId + 1;
    return dice.filter((value) => value === faceValue).reduce((total, value) => total + value, 0);
  }

  const counts = countFaces(dice);
  const maxCount = Math.max(...counts);
  const total = sumDice(dice);

  switch (slotId) {
    case 6:
      return maxCount >= 3 ? total : 0;
    case 7:
      return maxCount >= 4 ? total : 0;
    case 8:
      return counts.includes(3) && counts.includes(2) ? 25 : 0;
    case 9:
      return isSmallStraight(dice) ? 30 : 0;
    case 10:
      return isLargeStraight(dice) ? 40 : 0;
    case 11:
      return maxCount === 5 ? 50 : 0;
    case 12:
      return total;
    default:
      return 0;
  }
}

export function computeLocalScore(
  slotId: number,
  dice: DiceArray,
  state: BattleState,
): LocalScoreResult {
  const slotScore = getSlotScore(slotId, dice);
  const nextUpperSubtotal = isUpperSlot(slotId)
    ? state.upperSubtotalLocal + slotScore
    : state.upperSubtotalLocal;

  const bonusDamage =
    isUpperSlot(slotId) &&
    !state.upperBonusClaimedLocal &&
    nextUpperSubtotal >= UPPER_BONUS_TARGET
      ? UPPER_BONUS_DAMAGE
      : 0;

  return {
    slotScore,
    bonusDamage,
    totalDamage: slotScore + bonusDamage,
    nextUpperSubtotal,
    nextUpperBonusClaimed: state.upperBonusClaimedLocal || bonusDamage > 0,
  };
}
