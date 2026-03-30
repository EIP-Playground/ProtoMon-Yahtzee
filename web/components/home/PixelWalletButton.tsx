"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import posthog from "posthog-js";
import { useEffect, useRef, type ReactNode } from "react";
import { LuGlobe, LuWallet } from "react-icons/lu";
import { useAccount } from "wagmi";

import { useLocale } from "@/components/providers/LocaleProvider";

function WalletPanelButton({
  children,
  onClick,
  warning = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  warning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "pixel-button inline-flex min-h-[2.35rem] items-center gap-1.5 px-2.5 py-1 text-left text-[0.56rem] uppercase md:min-h-[2.45rem] md:px-3 md:text-[0.61rem]",
        warning ? "pixel-button-warning" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function WalletSquareButton({
  label,
  onClick,
  warning = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  warning?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "pixel-button inline-flex h-[2.6rem] w-[2.6rem] items-center justify-center p-0 text-[#fff6c8] md:hidden",
        warning ? "pixel-button-warning" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function PixelWalletButton() {
  const { messages } = useLocale();
  const { address, isConnected } = useAccount();
  const trackedWalletAddressRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      trackedWalletAddressRef.current = null;
      return;
    }

    if (trackedWalletAddressRef.current === address) {
      return;
    }

    posthog.capture("wallet_connect", {
      wallet_address: address,
    });
    trackedWalletAddressRef.current = address;
  }, [address, isConnected]);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        authenticationStatus,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return (
            <>
              <div className="pixel-panel hidden min-h-[2.7rem] items-center px-3.5 py-1.5 text-[0.62rem] uppercase text-[#17375c] md:inline-flex md:min-h-[2.9rem] md:px-4 md:text-[0.68rem]">
                <span className="mr-1.5 inline-flex text-[#17375c]">
                  <LuWallet className="h-[0.95rem] w-[0.95rem]" aria-hidden="true" />
                </span>
                <p className="pixel-font whitespace-nowrap">{messages.home.walletPreparing}</p>
              </div>
              <WalletSquareButton label={messages.home.walletPreparing}>
                <LuWallet className="h-[1rem] w-[1rem]" aria-hidden="true" />
              </WalletSquareButton>
            </>
          );
        }

        if (!connected) {
          return (
            <>
              <div className="hidden md:block">
                <WalletPanelButton onClick={openConnectModal}>
                  <span className="inline-flex text-[#fff6c8]">
                    <LuWallet className="h-[0.88rem] w-[0.88rem]" aria-hidden="true" />
                  </span>
                  <span className="pixel-font whitespace-nowrap text-[0.54rem] tracking-[0.04em] text-[#fff6c8] md:text-[0.58rem]">
                    {messages.home.walletConnect}
                  </span>
                </WalletPanelButton>
              </div>
              <WalletSquareButton label={messages.home.walletConnect} onClick={openConnectModal}>
                <LuWallet className="h-[1rem] w-[1rem]" aria-hidden="true" />
              </WalletSquareButton>
            </>
          );
        }

        if (chain.unsupported) {
          return (
            <>
              <div className="hidden md:block">
                <WalletPanelButton onClick={openChainModal} warning>
                  <span className="inline-flex text-[#fff6c8]">
                    <LuGlobe className="h-[0.95rem] w-[0.95rem]" aria-hidden="true" />
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="pixel-font text-slate-100/80">{messages.home.walletChainLabel}</span>
                    <span className="pixel-font whitespace-nowrap text-[#fff6c8]">
                      {messages.home.walletWrongNetwork}
                    </span>
                  </div>
                </WalletPanelButton>
              </div>
              <WalletSquareButton
                label={messages.home.walletWrongNetwork}
                onClick={openChainModal}
                warning
              >
                <LuGlobe className="h-[1rem] w-[1rem]" aria-hidden="true" />
              </WalletSquareButton>
            </>
          );
        }

        return (
          <>
            <div className="hidden flex-wrap justify-end gap-2 md:flex">
              <WalletPanelButton onClick={openChainModal}>
                <span className="inline-flex text-[#fff6c8]">
                  <LuGlobe className="h-[0.95rem] w-[0.95rem]" aria-hidden="true" />
                </span>
                <div className="flex flex-col text-left leading-[1.2]">
                  <span className="pixel-font text-[0.49rem] text-slate-100/75">
                    {messages.home.walletChainLabel}
                  </span>
                  <span className="pixel-font whitespace-nowrap text-[0.6rem] text-[#fff6c8]">{chain.name}</span>
                </div>
              </WalletPanelButton>
              <WalletPanelButton onClick={openAccountModal}>
                <span className="inline-flex text-[#fff6c8]">
                  <LuWallet className="h-[0.95rem] w-[0.95rem]" aria-hidden="true" />
                </span>
                <div className="flex flex-col text-left leading-[1.2]">
                  <span className="pixel-font text-[0.49rem] text-slate-100/75">
                    {messages.home.walletAccountLabel}
                  </span>
                  <span className="pixel-font whitespace-nowrap text-[0.6rem] text-[#fff6c8]">
                    {account.displayName}
                    {account.displayBalance ? ` · ${account.displayBalance}` : ""}
                  </span>
                </div>
              </WalletPanelButton>
            </div>
            <WalletSquareButton label={messages.home.walletLabel} onClick={openAccountModal}>
              <LuWallet className="h-[1rem] w-[1rem]" aria-hidden="true" />
            </WalletSquareButton>
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}
