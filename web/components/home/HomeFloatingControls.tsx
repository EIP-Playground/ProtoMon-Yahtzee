"use client";

import { DealerStatusPill } from "@/components/home/DealerStatusPill";
import { PixelWalletButton } from "@/components/home/PixelWalletButton";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import type { DealerStatus } from "@/lib/home/layout";

type HomeFloatingControlsProps = {
  dealerStatus: DealerStatus;
};

export function HomeFloatingControls({ dealerStatus }: HomeFloatingControlsProps) {
  return (
    <nav
      aria-label="home top controls"
      className="pointer-events-auto flex w-full items-start justify-between gap-3 sm:items-center"
    >
      <div className="min-w-0">
        <DealerStatusPill status={dealerStatus} />
      </div>
      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
        <LanguageSwitcher compact variant="pixel" />
        <PixelWalletButton />
      </div>
    </nav>
  );
}
