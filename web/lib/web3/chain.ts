import { baseSepolia, sepolia } from "wagmi/chains";

export const DEFAULT_CHAIN_ID = sepolia.id;

export type WalletChainResolution = {
  chain: typeof sepolia | typeof baseSepolia;
  rpcUrl: string | undefined;
};

export function resolveWalletChainConfig(env: NodeJS.ProcessEnv): WalletChainResolution {
  const configuredChainId = Number(env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_CHAIN_ID);

  if (configuredChainId === baseSepolia.id) {
    return {
      chain: baseSepolia,
      rpcUrl: env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
    };
  }

  return {
    chain: sepolia,
    rpcUrl: env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
  };
}
