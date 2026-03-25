import { generateDice } from "@/lib/server/rng";
import { getBackendGameSession, saveBackendGameSession } from "@/lib/server/gameSession";
import {
  ApiRouteError,
  handleRouteError,
  readJsonObject,
  requireAddressField,
  requireGameIdField,
} from "@/lib/server/http";
import type { RollDiceResult } from "@/types/game";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const gameId = requireGameIdField(body, "gameId");
    const player = requireAddressField(body, "player");
    const session = await getBackendGameSession(gameId);

    if (!session) {
      throw new ApiRouteError(404, "GAME_NOT_FOUND", "Game session was not found.");
    }

    if (session.player !== player) {
      throw new ApiRouteError(409, "PLAYER_MISMATCH", "Player does not match the game session.");
    }

    if (session.finalized) {
      throw new ApiRouteError(409, "ROUND_FINALIZED", "The current round has already been finalized.");
    }

    if (session.rollCount !== 0) {
      throw new ApiRouteError(409, "ROLL_ALREADY_STARTED", "The current round has already been rolled.");
    }

    const dice = generateDice();
    const updatedSession = {
      ...session,
      currentDice: dice,
      rollCount: 1,
    };

    await saveBackendGameSession(updatedSession);

    const response: RollDiceResult = {
      gameId: updatedSession.gameId,
      turn: updatedSession.turn,
      rollCount: updatedSession.rollCount,
      dice,
    };

    return Response.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
