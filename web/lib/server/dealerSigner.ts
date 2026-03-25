import { createHash } from "node:crypto";

import { ZERO_ADDRESS, isHexAddress } from "@/lib/server/validation";
import type { DealerProof, DiceArray } from "@/types/game";

export type BuildDealerProofInput = {
  gameId: string;
  player: `0x${string}`;
  rewardRecipient: `0x${string}`;
  turn: number;
  finalRollCount: number;
  dice: DiceArray;
  expiry?: number;
  chainId?: number;
  verifyingContract?: `0x${string}`;
  now?: number;
};

export async function buildDealerProof(input: BuildDealerProofInput): Promise<DealerProof> {
  const now = input.now ?? Date.now();
  const expiry = input.expiry ?? Math.floor(now / 1000) + 15 * 60;
  const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  const chainId =
    Number.isInteger(envChainId) && envChainId > 0 ? envChainId : (input.chainId ?? 84532);
  const verifyingContract =
    isHexAddress(process.env.NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS)
      ? process.env.NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS
      : (input.verifyingContract ?? ZERO_ADDRESS);

  const proofPayload = {
    gameId: input.gameId,
    player: input.player,
    rewardRecipient: input.rewardRecipient,
    turn: input.turn,
    finalRollCount: input.finalRollCount,
    dice: input.dice,
    expiry,
    chainId,
    verifyingContract,
  };

  const backendSig = `0x${createHash("sha256").update(JSON.stringify(proofPayload)).digest("hex")}` as const;

  return {
    ...proofPayload,
    backendSig,
  };
}
