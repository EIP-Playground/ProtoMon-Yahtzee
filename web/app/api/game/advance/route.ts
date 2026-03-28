import { saveBackendGameSession, getBackendGameSession } from "@/lib/server/gameSession";
import {
  ApiRouteError,
  handleRouteError,
  readJsonObject,
  requireAddressField,
  requireGameIdField,
  requireIntegerField,
} from "@/lib/server/http";
import type { AdvanceRoundResult } from "@/types/game";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const gameId = requireGameIdField(body, "gameId");
    const player = requireAddressField(body, "player");
    const nextTurn = requireIntegerField(body, "nextTurn");
    const session = await getBackendGameSession(gameId);

    if (!session) {
      throw new ApiRouteError(404, "GAME_NOT_FOUND", "Game session was not found.");
    }

    if (session.player !== player) {
      throw new ApiRouteError(409, "PLAYER_MISMATCH", "Player does not match the game session.");
    }

    if (session.rollCount < 1) {
      throw new ApiRouteError(409, "ROLL_NOT_STARTED", "The current round has not started yet.");
    }

    if (nextTurn !== session.turn + 1) {
      throw new ApiRouteError(
        409,
        "INVALID_NEXT_TURN",
        "nextTurn must advance exactly one round.",
      );
    }

    if (nextTurn < 2 || nextTurn > 13) {
      throw new ApiRouteError(400, "INVALID_NEXT_TURN", "nextTurn must stay within 2..13.");
    }

    const updatedSession = {
      ...session,
      turn: nextTurn,
      rollCount: 0,
      currentDice: [0, 0, 0, 0, 0] as [0, 0, 0, 0, 0],
      finalized: false,
      finalizedProof: null,
    };

    await saveBackendGameSession(updatedSession);

    const response: AdvanceRoundResult = {
      gameId: updatedSession.gameId,
      turn: updatedSession.turn,
      rollCount: updatedSession.rollCount,
    };

    return Response.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
