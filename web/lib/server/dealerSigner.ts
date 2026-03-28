import { createPublicClient, encodeAbiParameters, getAddress, http, isAddressEqual, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { resolveWalletChainConfig } from "@/lib/web3/chain";
import { ZERO_ADDRESS, isHexAddress } from "@/lib/server/validation";
import type { DealerProof, DiceArray, HexAddress, HexString } from "@/types/game";

const DEALER_SIGNER_ABI = [
  {
    inputs: [],
    name: "dealerSigner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type BuildDealerProofInput = {
  gameId: HexString;
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

let dealerSignerCheckPromise: Promise<void> | null = null;

function getDealerPrivateKey() {
  const privateKey = process.env.BACKEND_DEALER_PRIVATE_KEY?.trim();

  if (!privateKey) {
    throw new Error("BACKEND_DEALER_PRIVATE_KEY is not configured.");
  }

  return (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as HexString;
}

function getDealerAccount() {
  return privateKeyToAccount(getDealerPrivateKey());
}

function resolveVerifyingContract(input?: HexAddress) {
  if (input && isHexAddress(input)) {
    return input;
  }

  if (isHexAddress(process.env.NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS)) {
    return process.env.NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS;
  }

  return ZERO_ADDRESS;
}

function getProofHash(input: {
  gameId: HexString;
  player: HexAddress;
  rewardRecipient: HexAddress;
  turn: number;
  finalRollCount: number;
  dice: DiceArray;
  expiry: number;
  chainId: number;
  verifyingContract: HexAddress;
}) {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "address" },
        { type: "address" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint8[5]" },
        { type: "uint64" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        input.gameId,
        input.player,
        input.rewardRecipient,
        input.turn,
        input.finalRollCount,
        input.dice,
        BigInt(input.expiry),
        BigInt(input.chainId),
        input.verifyingContract,
      ],
    ),
  );
}

async function assertDealerSignerMatchesContract(
  verifyingContract: HexAddress,
  chainId: number,
) {
  if (verifyingContract === ZERO_ADDRESS) {
    return;
  }

  if (dealerSignerCheckPromise) {
    return dealerSignerCheckPromise;
  }

  dealerSignerCheckPromise = (async () => {
    const { chain, rpcUrl } = resolveWalletChainConfig(process.env);

    if (!rpcUrl) {
      return;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
    const onChainDealerSigner = await publicClient.readContract({
      address: verifyingContract,
      abi: DEALER_SIGNER_ABI,
      functionName: "dealerSigner",
    });
    const dealerAccount = getDealerAccount();

    if (!isAddressEqual(getAddress(onChainDealerSigner), getAddress(dealerAccount.address))) {
      throw new Error(
        `BACKEND_DEALER_PRIVATE_KEY does not match ProtoMonGame.dealerSigner() on chain ${chainId}.`,
      );
    }
  })().catch((error) => {
    dealerSignerCheckPromise = null;
    throw error;
  });

  return dealerSignerCheckPromise;
}

export async function buildDealerProof(input: BuildDealerProofInput): Promise<DealerProof> {
  const now = input.now ?? Date.now();
  const expiry = input.expiry ?? Math.floor(now / 1000) + 15 * 60;
  const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  const chainId =
    Number.isInteger(envChainId) && envChainId > 0 ? envChainId : (input.chainId ?? 11155111);
  const verifyingContract = resolveVerifyingContract(input.verifyingContract);

  await assertDealerSignerMatchesContract(verifyingContract, chainId);

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
  } satisfies Omit<DealerProof, "backendSig">;

  const proofHash = getProofHash(proofPayload);
  const backendSig = await getDealerAccount().signMessage({
    message: {
      raw: proofHash,
    },
  });

  return {
    ...proofPayload,
    backendSig,
  };
}
