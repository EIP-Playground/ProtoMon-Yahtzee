"use client";

import { HomeFloatingControls } from "@/components/home/HomeFloatingControls";
import { Web3Provider } from "@/components/providers/Web3Provider";

export function HomeWalletHud() {
  return (
    <Web3Provider>
      <HomeFloatingControls />
    </Web3Provider>
  );
}
