import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  http,
  isAddressEqual,
  parseAbi,
  type Hex,
} from "viem";

import { resolveWalletChainConfig } from "@/lib/web3/chain";
import type {
  DealerProof,
  HexAddress,
  HexString,
  TurnPlayedEvent,
} from "@/types/game";

const protoMonGameAbi = parseAbi([
  "function startGame(bytes32 gameId, address rewardRecipient, uint8 bossId)",
  "function playTurn(bytes32 gameId, uint8 slotId, (bytes32 gameId, address player, address rewardRecipient, uint8 turn, uint8 finalRollCount, uint8[5] dice, uint64 expiry, uint256 chainId, address verifyingContract, bytes backendSig) proof)",
  "function getGame(bytes32 gameId) view returns ((address player, address rewardRecipient, uint8 bossId, uint8 turn, uint16 bossHp, uint16 upperSubtotal, bool upperBonusClaimed, uint16 usedSlotsBitmap, bool finished, bool won))",
  "event GameStarted(bytes32 indexed gameId, address indexed player, address indexed rewardRecipient, uint8 bossId, uint16 bossHp)",
  "event TurnPlayed(bytes32 indexed gameId, address indexed player, address indexed rewardRecipient, uint8 turn, uint8 slotId, uint16 damage, uint16 bossHpAfter, uint16 upperSubtotalAfter, uint16 usedSlotsBitmap, bool won)",
  "event GameWon(bytes32 indexed gameId, address indexed player, address indexed rewardRecipient, uint8 bossId)",
]);

type StartGameInput = {
  gameId: HexString;
  rewardRecipient: HexAddress;
  bossId: number;
};

type GameStartedEvent = {
  eventName: "GameStarted";
  args: {
    gameId: HexString;
    player: HexAddress;
    rewardRecipient: HexAddress;
    bossId: number;
    bossHp: number;
  };
};

type OnChainGameSession = {
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
  turn: number;
  bossHp: number;
  upperSubtotal: number;
  upperBonusClaimed: boolean;
  usedSlotsBitmap: number;
  finished: boolean;
  won: boolean;
};

function getProtoMonGameAddress() {
  const address = process.env.NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS;

  if (!address) {
    throw new Error("NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS is not configured.");
  }

  return getAddress(address) as HexAddress;
}

async function getWagmiContext() {
  const actions = await import("wagmi/actions");
  const config = await import("@/lib/web3/config");

  return {
    ...actions,
    walletConfig: config.walletConfig,
    walletChain: config.walletChain,
  };
}

export async function getConnectedSenderAddress() {
  const { getAccount, walletConfig } = await getWagmiContext();
  const account = getAccount(walletConfig);

  if (!account.address || !account.isConnected) {
    throw new Error("Connect your wallet before starting a battle.");
  }

  return getAddress(account.address) as HexAddress;
}

async function requireWalletClient() {
  const { getWalletClient, walletConfig } = await getWagmiContext();
  const walletClient = await getWalletClient(walletConfig);

  if (!walletClient) {
    throw new Error("Wallet client is not ready. Reconnect the wallet and try again.");
  }

  return walletClient;
}

async function getRequiredPublicClient() {
  const { getPublicClient, walletConfig } = await getWagmiContext();
  const publicClient = getPublicClient(walletConfig);

  if (!publicClient) {
    throw new Error("Public chain client is not ready.");
  }

  return publicClient;
}

function normalizeTurnPlayedArgs(args: {
  gameId: Hex;
  player: HexAddress;
  rewardRecipient: HexAddress;
  turn: bigint | number;
  slotId: bigint | number;
  damage: bigint | number;
  bossHpAfter: bigint | number;
  upperSubtotalAfter: bigint | number;
  usedSlotsBitmap: bigint | number;
  won: boolean;
}): TurnPlayedEvent {
  return {
    eventName: "TurnPlayed",
    args: {
      gameId: args.gameId,
      player: getAddress(args.player) as HexAddress,
      rewardRecipient: getAddress(args.rewardRecipient) as HexAddress,
      turn: Number(args.turn),
      slotId: Number(args.slotId),
      damage: Number(args.damage),
      bossHpAfter: Number(args.bossHpAfter),
      upperSubtotalAfter: Number(args.upperSubtotalAfter),
      usedSlotsBitmap: Number(args.usedSlotsBitmap),
      won: args.won,
    },
  };
}

export function normalizeTurnPlayedEvent(event: TurnPlayedEvent) {
  return event;
}

function toContractDealerProof(proof: DealerProof) {
  return {
    ...proof,
    dice: [...proof.dice] as [number, number, number, number, number],
    expiry: BigInt(proof.expiry),
    chainId: BigInt(proof.chainId),
  };
}

export async function startGameOnChain(input: StartGameInput) {
  const sender = await getConnectedSenderAddress();
  await requireWalletClient();
  const { writeContract, walletConfig, walletChain } = await getWagmiContext();

  const hash = await writeContract(walletConfig, {
    account: sender,
    chainId: walletChain.id,
    address: getProtoMonGameAddress(),
    abi: protoMonGameAbi,
    functionName: "startGame",
    args: [input.gameId, input.rewardRecipient, input.bossId],
  });

  return {
    txHash: hash,
  };
}

export async function waitForGameStarted(txHash: HexString) {
  const publicClient = await getRequiredPublicClient();
  const { waitForTransactionReceipt, walletConfig } = await getWagmiContext();
  const receipt = await waitForTransactionReceipt(walletConfig, {
    hash: txHash,
  });

  if (receipt.status !== "success") {
    throw new Error("startGame transaction failed on chain.");
  }

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: protoMonGameAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "GameStarted") {
        return {
          receipt,
          event: {
            eventName: "GameStarted" as const,
            args: {
              gameId: decoded.args.gameId,
              player: getAddress(decoded.args.player) as HexAddress,
              rewardRecipient: getAddress(decoded.args.rewardRecipient) as HexAddress,
              bossId: Number(decoded.args.bossId),
              bossHp: Number(decoded.args.bossHp),
            },
          } satisfies GameStartedEvent,
        };
      }
    } catch {
      continue;
    }
  }

  const receiptResult = await publicClient.getTransactionReceipt({
    hash: txHash,
  });

  for (const log of receiptResult.logs) {
    try {
      const decoded = decodeEventLog({
        abi: protoMonGameAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "GameStarted") {
        return {
          receipt: receiptResult,
          event: {
            eventName: "GameStarted" as const,
            args: {
              gameId: decoded.args.gameId,
              player: getAddress(decoded.args.player) as HexAddress,
              rewardRecipient: getAddress(decoded.args.rewardRecipient) as HexAddress,
              bossId: Number(decoded.args.bossId),
              bossHp: Number(decoded.args.bossHp),
            },
          } satisfies GameStartedEvent,
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error("GameStarted event was not found in the transaction receipt.");
}

export async function sendCastTurnUserOp(input: {
  gameId: HexString;
  slotId: number;
  proof: DealerProof;
}) {
  const sender = await getConnectedSenderAddress();
  await requireWalletClient();
  const { writeContract, walletConfig, walletChain } = await getWagmiContext();

  if (!isAddressEqual(sender, input.proof.player)) {
    throw new Error("Connected wallet does not match the player bound to this battle.");
  }

  const hash = await writeContract(walletConfig, {
    account: sender,
    chainId: walletChain.id,
    address: getProtoMonGameAddress(),
    abi: protoMonGameAbi,
    functionName: "playTurn",
    args: [input.gameId, input.slotId, toContractDealerProof(input.proof)],
  });

  return {
    txHash: hash,
  };
}

export async function waitForTurnPlayed(txHash: `0x${string}`) {
  const publicClient = await getRequiredPublicClient();
  const { waitForTransactionReceipt, walletConfig } = await getWagmiContext();
  const receipt = await waitForTransactionReceipt(walletConfig, {
    hash: txHash,
  });

  if (receipt.status !== "success") {
    throw new Error("playTurn transaction failed on chain.");
  }

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: protoMonGameAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "TurnPlayed") {
        return {
          receipt,
          event: normalizeTurnPlayedArgs(decoded.args),
        };
      }
    } catch {
      continue;
    }
  }

  const receiptResult = await publicClient.getTransactionReceipt({
    hash: txHash,
  });

  for (const log of receiptResult.logs) {
    try {
      const decoded = decodeEventLog({
        abi: protoMonGameAbi,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "TurnPlayed") {
        return {
          receipt: receiptResult,
          event: normalizeTurnPlayedArgs(decoded.args),
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error("TurnPlayed event was not found in the transaction receipt.");
}

export async function readGameSessionOnChain(gameId: HexString): Promise<OnChainGameSession | null> {
  const { chain, rpcUrl } = resolveWalletChainConfig(process.env);
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
  const session = await publicClient.readContract({
    address: getProtoMonGameAddress(),
    abi: protoMonGameAbi,
    functionName: "getGame",
    args: [gameId],
  });

  if (
    !session.player ||
    isAddressEqual(getAddress(session.player), getAddress("0x0000000000000000000000000000000000000000"))
  ) {
    return null;
  }

  return {
    player: getAddress(session.player) as HexAddress,
    rewardRecipient: getAddress(session.rewardRecipient) as HexAddress,
    bossId: Number(session.bossId),
    turn: Number(session.turn),
    bossHp: Number(session.bossHp),
    upperSubtotal: Number(session.upperSubtotal),
    upperBonusClaimed: session.upperBonusClaimed,
    usedSlotsBitmap: Number(session.usedSlotsBitmap),
    finished: session.finished,
    won: session.won,
  };
}
