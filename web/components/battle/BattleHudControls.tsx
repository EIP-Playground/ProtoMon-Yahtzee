"use client";

import { PixelWalletButton } from "@/components/home/PixelWalletButton";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function BattleHudControls() {
  return (
    <Web3Provider>
      <div className="relative z-[80] flex shrink-0 items-center gap-2 overflow-visible">
        <PixelWalletButton />
        <LanguageSwitcher compact variant="pixel" />
      </div>
    </Web3Provider>
  );
}
