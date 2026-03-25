import type { DealerProof, TurnPlayedEvent } from "@/types/game";

export async function sendCastTurnUserOp(input: {
  gameId: string;
  slotId: number;
  proof: DealerProof;
}) {
  throw new Error(
    `Chain integration is not implemented yet for game ${input.gameId} / slot ${input.slotId}.`,
  );
}

export async function waitForTurnPlayed(txHash: `0x${string}`) {
  void txHash;
  throw new Error("Chain event tracking is not implemented yet.");
}

export function normalizeTurnPlayedEvent(event: TurnPlayedEvent) {
  return event;
}
