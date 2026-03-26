"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";

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
        "pixel-button inline-flex min-h-[2.15rem] items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[0.62rem] uppercase sm:min-h-[2.3rem] sm:px-3 sm:py-1.5 sm:text-[0.7rem]",
        warning ? "pixel-button-warning" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function PixelWalletButton() {
  const { messages } = useLocale();

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
            <div className="inline-flex min-h-[2.15rem] items-center px-2.5 py-1.5 text-[0.62rem] uppercase text-[#fef3b2] sm:min-h-[2.3rem] sm:px-3 sm:py-1.5 sm:text-[0.7rem]">
              <p className="pixel-font whitespace-nowrap">{messages.home.walletPreparing}</p>
            </div>
          );
        }

        if (!connected) {
          return (
            <WalletPanelButton onClick={openConnectModal}>
              <div className="flex items-center gap-1.5">
                <span className="pixel-font text-sky-100/80">{messages.home.walletLabel}</span>
                <span className="pixel-font whitespace-nowrap text-[#fef3b2]">
                  {messages.home.walletConnect}
                </span>
              </div>
            </WalletPanelButton>
          );
        }

        if (chain.unsupported) {
          return (
            <WalletPanelButton onClick={openChainModal} warning>
              <div className="flex items-center gap-1.5">
                <span className="pixel-font text-sky-100/80">{messages.home.walletLabel}</span>
                <span className="pixel-font whitespace-nowrap text-[#fef3b2]">
                  {messages.home.walletWrongNetwork}
                </span>
              </div>
              <span className="pixel-font text-[0.58rem] text-sky-100/80 sm:text-[0.64rem]">
                {messages.home.walletSwitchNetwork}
              </span>
            </WalletPanelButton>
          );
        }

        return (
          <div className="flex flex-wrap justify-end gap-2">
            <WalletPanelButton onClick={openChainModal}>
              <span className="pixel-font text-sky-100/80">{messages.home.walletChainLabel}</span>
              <span className="pixel-font whitespace-nowrap text-[#fef3b2]">{chain.name}</span>
            </WalletPanelButton>
            <WalletPanelButton onClick={openAccountModal}>
              <span className="pixel-font text-sky-100/80">{messages.home.walletAccountLabel}</span>
              <span className="pixel-font whitespace-nowrap text-[#fef3b2] sm:hidden">
                {account.displayName}
              </span>
              <span className="pixel-font hidden whitespace-nowrap text-[#fef3b2] sm:inline">
                {account.displayName}
                {account.displayBalance ? ` · ${account.displayBalance}` : ""}
              </span>
            </WalletPanelButton>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
