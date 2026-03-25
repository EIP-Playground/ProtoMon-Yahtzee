import { buildDealerProof } from "@/lib/server/dealerSigner";
import { getBackendGameSession, saveBackendGameSession } from "@/lib/server/gameSession";
import { toDiceArray } from "@/lib/server/validation";
import {
  ApiRouteError,
  handleRouteError,
  readJsonObject,
  requireAddressField,
  requireGameIdField,
} from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const gameId = requireGameIdField(body, "gameId");
    const player = requireAddressField(body, "player");
    const rewardRecipient = requireAddressField(body, "rewardRecipient");
    const session = await getBackendGameSession(gameId);

    if (!session) {
      throw new ApiRouteError(404, "GAME_NOT_FOUND", "Game session was not found.");
    }

    if (session.player !== player) {
      throw new ApiRouteError(409, "PLAYER_MISMATCH", "Player does not match the game session.");
    }

    if (session.rewardRecipient !== rewardRecipient) {
      throw new ApiRouteError(
        409,
        "REWARD_RECIPIENT_MISMATCH",
        "rewardRecipient does not match the game session.",
      );
    }

    if (session.finalized) {
      throw new ApiRouteError(409, "ROUND_FINALIZED", "The current round has already been finalized.");
    }

    if (session.rollCount < 1) {
      throw new ApiRouteError(409, "ROLL_NOT_STARTED", "The current round has not started yet.");
    }

    const dice = toDiceArray(session.currentDice);

    if (!dice) {
      throw new ApiRouteError(500, "INVALID_SESSION_DICE", "Stored dice are invalid for finalize.");
    }

    const proof = await buildDealerProof({
      gameId: session.gameId,
      player: session.player,
      rewardRecipient: session.rewardRecipient,
      turn: session.turn,
      finalRollCount: session.rollCount,
      dice,
    });

    await saveBackendGameSession({
      ...session,
      finalized: true,
    });

    return Response.json(proof);
  } catch (error) {
    return handleRouteError(error);
  }
}
