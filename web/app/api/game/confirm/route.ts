import { getBackendGameSession, saveBackendGameSession } from "@/lib/server/gameSession";
import {
  ApiRouteError,
  handleRouteError,
  readJsonObject,
  requireAddressField,
  requireGameIdField,
  requireIntegerField,
  requireTxHashField,
} from "@/lib/server/http";
import type { ConfirmRoundResult } from "@/types/game";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const gameId = requireGameIdField(body, "gameId");
    const player = requireAddressField(body, "player");
    const pendingTxHash = requireTxHashField(body, "pendingTxHash");
    const confirmedTurn = requireIntegerField(body, "confirmedTurn");
    const session = await getBackendGameSession(gameId);

    if (!session) {
      throw new ApiRouteError(404, "GAME_NOT_FOUND", "Game session was not found.");
    }

    if (session.player !== player) {
      throw new ApiRouteError(409, "PLAYER_MISMATCH", "Player does not match the game session.");
    }

    if (session.pendingChainTxHash !== pendingTxHash) {
      throw new ApiRouteError(
        409,
        "PENDING_TX_MISMATCH",
        "pendingTxHash does not match the session pending transaction.",
      );
    }

    const updatedSession = {
      ...session,
      turn: confirmedTurn,
      pendingChainTxHash: null,
      pendingTurn: null,
    };

    await saveBackendGameSession(updatedSession);

    const response: ConfirmRoundResult = {
      gameId: updatedSession.gameId,
      turn: updatedSession.turn,
    };

    return Response.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
