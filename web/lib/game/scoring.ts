import { isUpperSlot } from "@/lib/game/slots";
import type { BattleState, DiceArray } from "@/types/game";

export type LocalScoreResult = {
  slotScore: number;
  bonusDamage: number;
  totalDamage: number;
  nextUpperSubtotal: number;
  nextUpperBonusClaimed: boolean;
};

export function computeLocalScore(
  slotId: number,
  _dice: DiceArray,
  state: BattleState,
): LocalScoreResult {
  const slotScore = 0;
  const nextUpperSubtotal = isUpperSlot(slotId)
    ? state.upperSubtotalLocal + slotScore
    : state.upperSubtotalLocal;

  const bonusDamage =
    isUpperSlot(slotId) &&
    !state.upperBonusClaimedLocal &&
    nextUpperSubtotal >= 63
      ? 35
      : 0;

  return {
    slotScore,
    bonusDamage,
    totalDamage: slotScore + bonusDamage,
    nextUpperSubtotal,
    nextUpperBonusClaimed: state.upperBonusClaimedLocal || bonusDamage > 0,
  };
}
