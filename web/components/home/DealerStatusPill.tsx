"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { DealerStatus } from "@/lib/home/layout";

const STATUS_LABEL_CLASS: Record<DealerStatus, string> = {
  idle: "text-emerald-300/75",
  waiting: "text-emerald-200/85",
  online: "text-emerald-200",
  error: "text-emerald-200/70",
};

type DealerStatusPillProps = {
  status: DealerStatus;
};

export function DealerStatusPill({ status }: DealerStatusPillProps) {
  const { messages } = useLocale();

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <span className="animate-dealer-slow-blink block h-3 w-3 shrink-0 rounded-none bg-emerald-400 shadow-[0_0_0.9rem_rgba(74,222,128,0.9)]" />
      <p
        className={[
          "pixel-font whitespace-nowrap text-[0.66rem] tracking-[0.14em] sm:text-[0.72rem]",
          STATUS_LABEL_CLASS[status],
        ].join(" ")}
      >
        {messages.home.dealerLabel}
      </p>
    </div>
  );
}
