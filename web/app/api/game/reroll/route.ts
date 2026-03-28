import { rerollWithMask } from "@/lib/server/rng";
import { getBackendGameSession, saveBackendGameSession } from "@/lib/server/gameSession";
import { toDiceArray } from "@/lib/server/validation";
import {
  ApiRouteError,
  handleRouteError,
  readJsonObject,
  requireAddressField,
  requireGameIdField,
  requireIntegerField,
} from "@/lib/server/http";
import type { RerollDiceResult } from "@/types/game";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const gameId = requireGameIdField(body, "gameId");
    const player = requireAddressField(body, "player");
    const holdMask = requireIntegerField(body, "holdMask");
    const session = await getBackendGameSession(gameId);

    if (holdMask < 0 || holdMask > 31) {
      throw new ApiRouteError(400, "INVALID_HOLD_MASK", "holdMask must be an integer between 0 and 31.");
    }

    if (!session) {
      throw new ApiRouteError(404, "GAME_NOT_FOUND", "Game session was not found.");
    }

    if (session.player !== player) {
      throw new ApiRouteError(409, "PLAYER_MISMATCH", "Player does not match the game session.");
    }

    if (session.finalized) {
      throw new ApiRouteError(409, "ROUND_FINALIZED", "The current round has already been finalized.");
    }

    if (session.rollCount === 0) {
      throw new ApiRouteError(409, "ROLL_NOT_STARTED", "The current round has not started yet.");
    }

    if (session.rollCount >= 3) {
      throw new ApiRouteError(409, "REROLL_LIMIT_REACHED", "The current round has no rerolls remaining.");
    }

    const currentDice = toDiceArray(session.currentDice);

    if (!currentDice) {
      throw new ApiRouteError(500, "INVALID_SESSION_DICE", "Stored dice are invalid for reroll.");
    }

    const dice = rerollWithMask(currentDice, holdMask);
    const updatedSession = {
      ...session,
      currentDice: dice,
      rollCount: session.rollCount + 1,
      finalized: false,
      finalizedProof: null,
    };

    await saveBackendGameSession(updatedSession);

    const response: RerollDiceResult = {
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
