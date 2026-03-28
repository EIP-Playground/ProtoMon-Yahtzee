import { baseSepolia, sepolia } from "wagmi/chains";

export const DEFAULT_CHAIN_ID = sepolia.id;

export type WalletChainResolution = {
  chain: typeof sepolia | typeof baseSepolia;
  rpcUrl: string | undefined;
};

export function resolveRpcUrl(env: NodeJS.ProcessEnv, chainId?: number) {
  const resolvedChainId = chainId ?? Number(env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_CHAIN_ID);

  if (resolvedChainId === baseSepolia.id) {
    return env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0];
  }

  return (
    env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
    env.NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL ??
    env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ??
    sepolia.rpcUrls.default.http[0]
  );
}

export function resolveWalletChainConfig(env: NodeJS.ProcessEnv): WalletChainResolution {
  const configuredChainId = Number(env.NEXT_PUBLIC_CHAIN_ID ?? DEFAULT_CHAIN_ID);

  if (configuredChainId === baseSepolia.id) {
    return {
      chain: baseSepolia,
      rpcUrl: resolveRpcUrl(env, configuredChainId),
    };
  }

  return {
    chain: sepolia,
    rpcUrl: resolveRpcUrl(env, configuredChainId),
  };
}
