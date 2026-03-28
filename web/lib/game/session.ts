import { createGameSession } from "@/lib/api/backend";
import { startGameOnChain } from "@/lib/chain/gameContract";
import type { CreateGameSessionResult, HexAddress } from "@/types/game";

export async function createAndStartBattleSession(input: {
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
}): Promise<CreateGameSessionResult> {
  const session = await createGameSession(input);

  await startGameOnChain({
    gameId: session.gameId,
    rewardRecipient: session.rewardRecipient,
    bossId: session.bossId,
  });

  return session;
}
