"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/messages";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  variant?: "default" | "pixel";
};

export function LanguageSwitcher({
  className,
  compact = false,
  variant = "default",
}: LanguageSwitcherProps) {
  const { locale, messages, setLocale } = useLocale();
  const isPixel = variant === "pixel";

  return (
    <div
      className={[
        isPixel
          ? "inline-flex items-center gap-1 p-0 text-[#fef3b2]"
          : "inline-flex items-center gap-1 rounded-full border border-white/12 bg-slate-950/55 p-1",
        className ?? "",
      ].join(" ")}
      aria-label={messages.common.language}
    >
      {SUPPORTED_LOCALES.map((candidate) => (
        <button
          key={candidate}
          type="button"
          onClick={() => setLocale(candidate as Locale)}
          className={[
            "transition",
            isPixel
              ? [
                  "pixel-button pixel-font rounded-none border-[#1d2f48] uppercase shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
                  compact ? "min-h-[2.15rem] px-2.5 py-1.5 text-[0.62rem]" : "min-h-[2.3rem] px-3 py-1.5 text-[0.68rem]",
                ].join(" ")
              : [
                  "rounded-full",
                  compact ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs",
                ].join(" "),
            locale === candidate
              ? isPixel
                ? "bg-[#4f9ff7] text-[#fff6c8]"
                : "bg-cyan-300 text-slate-950"
              : isPixel
                ? "bg-[#183253] text-slate-100 hover:bg-[#21466f] hover:text-white"
                : "text-slate-300 hover:bg-white/8 hover:text-white",
          ].join(" ")}
        >
          {messages.common.locales[candidate]}
        </button>
      ))}
    </div>
  );
}
