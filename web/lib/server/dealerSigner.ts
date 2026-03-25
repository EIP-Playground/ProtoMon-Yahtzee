import type { DealerProof, DiceArray } from "@/types/game";

type BuildDealerProofInput = {
  gameId: string;
  player: `0x${string}`;
  rewardRecipient: `0x${string}`;
  turn: number;
  finalRollCount: number;
  dice: DiceArray;
  expiry: number;
  chainId: number;
  verifyingContract: `0x${string}`;
};

export async function buildDealerProof(input: BuildDealerProofInput): Promise<DealerProof> {
  void input;
  throw new Error("Dealer proof signing is not implemented yet.");
}
