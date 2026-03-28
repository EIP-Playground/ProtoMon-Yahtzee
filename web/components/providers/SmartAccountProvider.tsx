"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { HexAddress } from "@/types/game";

type SmartAccountContextValue = {
  /** The Safe Smart Account address used as msg.sender on chain. */
  safeAddress: HexAddress | null;
  /** The assembled gasless smart account client, if AA is enabled. */
  smartAccountClient: unknown | null;
  /** The ephemeral private key hex used to create the Safe. */
  ephemeralPrivateKey: `0x${string}` | null;
  /** Whether AA is currently enabled in the environment. */
  isAAEnabled: boolean;
  /** Whether a smart account setup is currently in progress. */
  isSettingUp: boolean;
  /** Setup error message, if any. */
  setupError: string | null;
  /** Create and store the gasless smart account. Returns the Safe address. */
  setupSmartAccount: (gameId?: string) => Promise<HexAddress>;
  /** Restore smart account from an existing ephemeral key (e.g. on page reload). */
  restoreSmartAccount: (ephemeralPrivateKey: `0x${string}`) => Promise<HexAddress>;
};

const SmartAccountContext = createContext<SmartAccountContextValue>({
  safeAddress: null,
  smartAccountClient: null,
  ephemeralPrivateKey: null,
  isAAEnabled: false,
  isSettingUp: false,
  setupError: null,
  setupSmartAccount: () => Promise.reject(new Error("SmartAccountProvider not mounted")),
  restoreSmartAccount: () => Promise.reject(new Error("SmartAccountProvider not mounted")),
});

export function useSmartAccount() {
  return useContext(SmartAccountContext);
}

type SmartAccountProviderProps = {
  children: ReactNode;
};

export function SmartAccountProvider({ children }: SmartAccountProviderProps) {
  const aaEnabled =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_AA_ENABLED === "true";

  const [safeAddress, setSafeAddress] = useState<HexAddress | null>(null);
  const [smartAccountClient, setSmartAccountClient] = useState<unknown | null>(null);
  const [ephemeralPrivateKey, setEphemeralPrivateKey] = useState<`0x${string}` | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const setupLockRef = useRef(false);

  const setupSmartAccount = useCallback(
    async (gameId?: string): Promise<HexAddress> => {
      if (!aaEnabled) {
        throw new Error("AA is not enabled.");
      }

      if (setupLockRef.current) {
        throw new Error("Smart account setup already in progress.");
      }

      setupLockRef.current = true;
      setIsSettingUp(true);
      setSetupError(null);

      try {
        const { getOrCreateEphemeralKey, bindEphemeralKeyToGame, setupGaslessAccount } =
          await import("@/lib/aa/smartAccount");

        const privKey = getOrCreateEphemeralKey(gameId);
        const { safeAddress: sa, smartAccountClient: client } =
          await setupGaslessAccount(privKey);

        if (gameId) {
          bindEphemeralKeyToGame(gameId, privKey);
        }

        setSafeAddress(sa);
        setSmartAccountClient(client);
        setEphemeralPrivateKey(privKey);
        setIsSettingUp(false);
        setupLockRef.current = false;

        return sa;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Smart account setup failed";
        setSetupError(message);
        setIsSettingUp(false);
        setupLockRef.current = false;
        throw error;
      }
    },
    [aaEnabled],
  );

  const restoreSmartAccount = useCallback(
    async (privKey: `0x${string}`): Promise<HexAddress> => {
      if (!aaEnabled) {
        throw new Error("AA is not enabled.");
      }

      if (setupLockRef.current) {
        throw new Error("Smart account setup already in progress.");
      }

      setupLockRef.current = true;
      setIsSettingUp(true);
      setSetupError(null);

      try {
        const { setupGaslessAccount } = await import("@/lib/aa/smartAccount");

        const { safeAddress: sa, smartAccountClient: client } =
          await setupGaslessAccount(privKey);

        setSafeAddress(sa);
        setSmartAccountClient(client);
        setEphemeralPrivateKey(privKey);
        setIsSettingUp(false);
        setupLockRef.current = false;

        return sa;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Smart account restore failed";
        setSetupError(message);
        setIsSettingUp(false);
        setupLockRef.current = false;
        throw error;
      }
    },
    [aaEnabled],
  );

  const value = useMemo<SmartAccountContextValue>(
    () => ({
      safeAddress,
      smartAccountClient,
      ephemeralPrivateKey,
      isAAEnabled: aaEnabled,
      isSettingUp,
      setupError,
      setupSmartAccount,
      restoreSmartAccount,
    }),
    [
      safeAddress,
      smartAccountClient,
      ephemeralPrivateKey,
      aaEnabled,
      isSettingUp,
      setupError,
      setupSmartAccount,
      restoreSmartAccount,
    ],
  );

  return (
    <SmartAccountContext.Provider value={value}>
      {children}
    </SmartAccountContext.Provider>
  );
}
