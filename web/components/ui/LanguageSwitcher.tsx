"use client";

import { MdTranslate } from "react-icons/md";
import { useEffect, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPixel || !open) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isPixel, open]);

  if (isPixel) {
    return (
      <div ref={rootRef} className={["relative", className ?? ""].join(" ")} aria-label={messages.common.language}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={messages.common.language}
          onClick={() => setOpen((current) => !current)}
          className={[
            "pixel-button inline-flex items-center justify-center p-0 text-[#fff6c8]",
            compact ? "h-[2.9rem] w-[2.9rem]" : "h-[3.2rem] w-[3.2rem]",
          ].join(" ")}
        >
          <MdTranslate className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden="true" />
        </button>

        {open ? (
          <div
            role="menu"
            className="pixel-panel absolute right-0 top-[calc(100%+0.45rem)] flex min-w-[5.2rem] flex-col gap-1 p-1 text-[#fef3b2]"
          >
            {SUPPORTED_LOCALES.map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="menuitemradio"
                aria-checked={locale === candidate}
                onClick={() => {
                  setLocale(candidate as Locale);
                  setOpen(false);
                }}
                className={[
                  "pixel-button pixel-font min-h-[2.2rem] px-3 py-1.5 text-left text-[0.64rem]",
                  locale === candidate
                    ? "bg-[#f1f7ff] text-[#17375c]"
                    : "bg-[#102034] text-slate-100 hover:bg-[#163053] hover:text-white",
                ].join(" ")}
              >
                {messages.common.locales[candidate]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full border border-white/12 bg-slate-950/55 p-1",
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
            "rounded-full",
            compact ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs",
            locale === candidate
              ? "bg-cyan-300 text-slate-950"
              : "text-slate-300 hover:bg-white/8 hover:text-white",
          ].join(" ")}
        >
          {messages.common.locales[candidate]}
        </button>
      ))}
    </div>
  );
}
