"use client";

import { HomeFloatingControls } from "@/components/home/HomeFloatingControls";
import { Web3Provider } from "@/components/providers/Web3Provider";
import type { DealerStatus } from "@/lib/home/layout";

type HomeWalletHudProps = {
  dealerStatus: DealerStatus;
};

export function HomeWalletHud({ dealerStatus }: HomeWalletHudProps) {
  return (
    <Web3Provider>
      <HomeFloatingControls dealerStatus={dealerStatus} />
    </Web3Provider>
  );
}
