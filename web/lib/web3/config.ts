import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { resolveWalletChainConfig } from "@/lib/web3/chain";

export const DEFAULT_WALLETCONNECT_PROJECT_ID = "3c8abab3d6209b3a73ae523efba1524a";

const { chain, rpcUrl } = resolveWalletChainConfig(process.env);

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? DEFAULT_WALLETCONNECT_PROJECT_ID;

export const walletConfig = getDefaultConfig({
  appName: "ProtoMon",
  projectId: walletConnectProjectId,
  chains: [chain],
  ssr: true,
  transports: {
    [chain.id]: http(rpcUrl),
  },
});

export const walletChain = chain;
export const walletRpcUrl = rpcUrl;
