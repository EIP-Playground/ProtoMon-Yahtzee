import { BOSS_1, type CreateGameSessionResult } from "@/types/game";
import { createBackendGameSession, createGameId, saveBackendGameSession } from "@/lib/server/gameSession";
import {
  ApiRouteError,
  handleRouteError,
  readJsonObject,
  requireAddressField,
  requireIntegerField,
} from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const player = requireAddressField(body, "player");
    const rewardRecipient = requireAddressField(body, "rewardRecipient");
    const bossId = requireIntegerField(body, "bossId");

    if (bossId !== BOSS_1.bossId) {
      throw new ApiRouteError(400, "UNSUPPORTED_BOSS_ID", "Only bossId 1 is supported.");
    }

    const session = createBackendGameSession({
      gameId: createGameId(),
      player,
      rewardRecipient,
      bossId,
    });

    await saveBackendGameSession(session);

    const response: CreateGameSessionResult = {
      gameId: session.gameId,
      player: session.player,
      rewardRecipient: session.rewardRecipient,
      bossId: session.bossId,
      bossHp: BOSS_1.targetHp,
      turn: session.turn,
      rollCount: session.rollCount,
    };

    return Response.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
