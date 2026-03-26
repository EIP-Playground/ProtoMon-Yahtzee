"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { DealerStatus } from "@/lib/home/layout";

const STATUS_CLASS: Record<DealerStatus, string> = {
  idle: "bg-slate-400 shadow-[0_0_0.5rem_rgba(148,163,184,0.45)]",
  waiting: "bg-amber-300 shadow-[0_0_0.75rem_rgba(252,211,77,0.7)] animate-pixel-blink",
  online: "bg-emerald-400 shadow-[0_0_0.75rem_rgba(74,222,128,0.75)] animate-pixel-blink",
  error: "bg-rose-400 shadow-[0_0_0.75rem_rgba(251,113,133,0.75)] animate-pixel-blink",
};

type DealerStatusPillProps = {
  status: DealerStatus;
};

export function DealerStatusPill({ status }: DealerStatusPillProps) {
  const { messages } = useLocale();

  return (
    <div className="pixel-panel flex items-center gap-2 px-2 py-1.5 text-[#fef3b2] sm:px-2.5 sm:py-1.5">
      <span className={["block h-2.5 w-2.5 shrink-0", STATUS_CLASS[status]].join(" ")} />
      <p className="pixel-font whitespace-nowrap text-[0.58rem] tracking-[0.1em] text-[#fef3b2] sm:text-[0.66rem]">
        {messages.home.dealerLabel}: {messages.home.dealerStates[status]}
      </p>
    </div>
  );
}
