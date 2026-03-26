import { afterEach, describe, expect, it, vi } from "vitest";

describe("web3 config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to Ethereum Sepolia and reads the new RPC env first", async () => {
    const { resolveWalletChainConfig } = await import("@/lib/web3/chain");

    const result = resolveWalletChainConfig({
      NEXT_PUBLIC_CHAIN_ID: "11155111",
      NEXT_PUBLIC_SEPOLIA_RPC_URL: "https://sepolia.example",
    });

    expect(result.chain.id).toBe(11155111);
    expect(result.rpcUrl).toBe("https://sepolia.example");
  });

  it("falls back to legacy Base Sepolia RPC env when the new env is missing", async () => {
    const { resolveWalletChainConfig } = await import("@/lib/web3/chain");

    const result = resolveWalletChainConfig({
      NEXT_PUBLIC_CHAIN_ID: "11155111",
      NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: "https://legacy-base-sepolia.example",
    });

    expect(result.chain.id).toBe(11155111);
    expect(result.rpcUrl).toBe("https://legacy-base-sepolia.example");
  });
});
