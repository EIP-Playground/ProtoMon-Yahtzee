import { createGameSession } from "@/lib/api/backend";
import type { CreateGameSessionResult, HexAddress } from "@/types/game";

export async function createBattleSession(input: {
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
}): Promise<CreateGameSessionResult> {
  return createGameSession(input);
}
