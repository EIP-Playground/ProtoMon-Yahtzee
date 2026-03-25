import { EMPTY_LOCKED_DICE } from "@/lib/game/dice";
import { BOSS_1 } from "@/types/game";
import type { BattleState } from "@/types/game";

export function createInitialBattleState(gameId: string): BattleState {
  return {
    gameId,
    smartAccount: "0x0000000000000000000000000000000000000000",
    rewardRecipient: "0x0000000000000000000000000000000000000000",
    bossHpLocal: BOSS_1.targetHp,
    bossHpChain: BOSS_1.targetHp,
    turn: 1,
    rollCount: 0,
    dice: null,
    locked: EMPTY_LOCKED_DICE,
    usedSlots: {},
    upperSubtotalLocal: 0,
    upperBonusClaimedLocal: false,
    syncStatus: "LOCAL_APPLIED",
  };
}
