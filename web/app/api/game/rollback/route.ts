import { readGameSessionOnChain } from "@/lib/chain/gameContract";
import { getBackendGameSession, saveBackendGameSession } from "@/lib/server/gameSession";
import {
  ApiRouteError,
  handleRouteError,
  readJsonObject,
  requireAddressField,
  requireGameIdField,
} from "@/lib/server/http";
import type { RollbackRoundResult } from "@/types/game";

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

    const chainSession = await readGameSessionOnChain(gameId);

    if (!chainSession) {
      throw new ApiRouteError(404, "CHAIN_GAME_NOT_FOUND", "On-chain game session was not found.");
    }

    const updatedSession = {
      ...session,
      rewardRecipient: chainSession.rewardRecipient,
      bossId: chainSession.bossId,
      turn: chainSession.turn,
      rollCount: 0,
      currentDice: [0, 0, 0, 0, 0] as [0, 0, 0, 0, 0],
      finalized: false,
      finalizedProof: null,
      pendingChainTxHash: null,
      pendingTurn: null,
    };

    await saveBackendGameSession(updatedSession);

    const response: RollbackRoundResult = {
      gameId: updatedSession.gameId,
      turn: updatedSession.turn,
      rollCount: updatedSession.rollCount,
      bossHp: chainSession.bossHp,
      upperSubtotal: chainSession.upperSubtotal,
      upperBonusClaimed: chainSession.upperBonusClaimed,
      usedSlotsBitmap: chainSession.usedSlotsBitmap,
      finished: chainSession.finished,
      won: chainSession.won,
    };

    return Response.json(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
