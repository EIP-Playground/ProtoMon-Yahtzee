import { createPublicClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { entryPoint07Address } from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";

import { getPimlicoRpcUrl, SAFE_VERSION } from "@/lib/aa/config";
import { resolveWalletChainConfig } from "@/lib/web3/chain";
import type { HexAddress } from "@/types/game";

const EPHEMERAL_KEY_STORAGE_PREFIX = "protomon:ephemeral-key:";

/**
 * Generate or restore an ephemeral private key for a game session.
 * The key is stored in sessionStorage so it survives page refreshes
 * within the same browser tab.
 */
export function getOrCreateEphemeralKey(gameId?: string): `0x${string}` {
  const storageKey = gameId
    ? `${EPHEMERAL_KEY_STORAGE_PREFIX}${gameId}`
    : `${EPHEMERAL_KEY_STORAGE_PREFIX}current`;

  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(storageKey);

    if (stored && stored.startsWith("0x") && stored.length === 66) {
      return stored as `0x${string}`;
    }
  }

  const privateKey = generatePrivateKey();

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKey, privateKey);
  }

  return privateKey;
}

/**
 * Persist the current ephemeral key under a specific gameId so it can be
 * restored when navigating to the battle page.
 */
export function bindEphemeralKeyToGame(gameId: string, privateKey: `0x${string}`): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(`${EPHEMERAL_KEY_STORAGE_PREFIX}${gameId}`, privateKey);
  }
}

/**
 * Create a Safe Smart Account using an ephemeral signer.
 * Returns the Safe account instance and the ephemeral signer's account.
 */
export async function createSafeSmartAccount(ephemeralPrivateKey: `0x${string}`) {
  const ephemeralSigner = privateKeyToAccount(ephemeralPrivateKey);
  const { chain, rpcUrl } = resolveWalletChainConfig(process.env);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const safeAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [ephemeralSigner],
    version: SAFE_VERSION,
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    saltNonce: BigInt(0),
  });

  return {
    safeAccount,
    safeAddress: safeAccount.address as HexAddress,
    ephemeralSigner,
  };
}

/**
 * Create a gasless smart account client with Pimlico bundler + paymaster.
 * This client can send transactions without requiring ETH in the Safe.
 */
export async function createGaslessSmartAccountClient(
  safeAccount: Awaited<ReturnType<typeof createSafeSmartAccount>>["safeAccount"],
) {
  const { chain } = resolveWalletChainConfig(process.env);
  const pimlicoUrl = getPimlicoRpcUrl();

  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });

  const smartAccountClient = createSmartAccountClient({
    account: safeAccount,
    chain,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        const gasPrice = await pimlicoClient.getUserOperationGasPrice();

        return gasPrice.fast;
      },
    },
  });

  return smartAccountClient;
}

/** Convenience: create Safe + client in one call. */
export async function setupGaslessAccount(ephemeralPrivateKey: `0x${string}`) {
  const { safeAccount, safeAddress, ephemeralSigner } =
    await createSafeSmartAccount(ephemeralPrivateKey);
  const smartAccountClient = await createGaslessSmartAccountClient(safeAccount);

  return {
    safeAccount,
    safeAddress,
    ephemeralSigner,
    smartAccountClient,
  };
}

export async function waitForAAUserOpTxHash(userOpHash: `0x${string}`) {
  const pimlicoUrl = getPimlicoRpcUrl();

  const bundlerClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return receipt.receipt.transactionHash as `0x${string}`;
}
