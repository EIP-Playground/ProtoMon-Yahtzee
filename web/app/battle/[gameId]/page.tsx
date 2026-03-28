import { notFound } from "next/navigation";

import { BattleClient } from "@/components/battle/BattleClient";
import { readGameSessionOnChain } from "@/lib/chain/gameContract";
import { bitmapToSlots, createEmptySlotResults } from "@/lib/game/slots";
import { getBackendGameSession } from "@/lib/server/gameSession";
import { toDiceArray } from "@/lib/server/validation";

type BattlePageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function BattlePage({ params }: BattlePageProps) {
  const { gameId } = await params;
  const session = await getBackendGameSession(gameId);

  if (!session) {
    notFound();
  }

  const onChainState = await readGameSessionOnChain(session.gameId).catch(() => null);

  return (
    <BattleClient
      gameId={gameId}
      initialStateSeed={{
        smartAccount: session.player,
        rewardRecipient: session.rewardRecipient,
        bossHpLocal: onChainState?.bossHp ?? 150,
        bossHpChain: onChainState?.bossHp ?? 150,
        turn: session.turn,
        confirmedTurn: onChainState?.turn ?? session.turn,
        rollCount: session.rollCount,
        dice: toDiceArray(session.currentDice),
        carryoverDice: null,
        usedSlots: onChainState ? bitmapToSlots(onChainState.usedSlotsBitmap) : undefined,
        confirmedUsedSlots: onChainState ? bitmapToSlots(onChainState.usedSlotsBitmap) : undefined,
        slotResults: createEmptySlotResults(),
        upperSubtotalLocal: onChainState?.upperSubtotal ?? 0,
        confirmedUpperSubtotalLocal: onChainState?.upperSubtotal ?? 0,
        upperBonusClaimedLocal: onChainState?.upperBonusClaimed ?? false,
        confirmedUpperBonusClaimedLocal: onChainState?.upperBonusClaimed ?? false,
        confirmedFinished: onChainState?.finished ?? false,
        finished: onChainState?.finished ?? false,
        confirmedWon: onChainState?.won ?? false,
        won: onChainState?.won ?? false,
        rollbackRequired: false,
        pendingTxHash: session.pendingChainTxHash ?? undefined,
      }}
    />
  );
}
