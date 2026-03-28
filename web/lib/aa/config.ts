import { entryPoint07Address } from "viem/account-abstraction";

/**
 * AA feature gate. When false, the app uses standard EOA wallet signing.
 * When true, the app creates ephemeral Safe Smart Accounts via Pimlico.
 */
export function isAAEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AA_ENABLED === "true";
}

/**
 * Pimlico bundler / paymaster URL for the current chain.
 * Both services share the same v2 RPC endpoint.
 */
export function getPimlicoRpcUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_AA_BUNDLER_URL ??
    process.env.AA_BUNDLER_URL;

  if (explicit) {
    return explicit;
  }

  const apiKey =
    process.env.NEXT_PUBLIC_AA_PIMLICO_API_KEY ??
    process.env.AA_PIMLICO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AA is enabled but no Pimlico API key is configured. " +
      "Set NEXT_PUBLIC_AA_PIMLICO_API_KEY or AA_PIMLICO_API_KEY in .env.local.",
    );
  }

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111";

  return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${apiKey}`;
}

/** ERC-4337 v0.7 EntryPoint — recommended by Pimlico. */
export const ENTRYPOINT_ADDRESS = entryPoint07Address;

export const ENTRYPOINT_VERSION = "0.7" as const;

export const SAFE_VERSION = "1.4.1" as const;
