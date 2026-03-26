"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

type BackToTopButtonProps = {
  visible: boolean;
};

export function BackToTopButton({ visible }: BackToTopButtonProps) {
  const { messages } = useLocale();

  return (
    <button
      type="button"
      aria-label={messages.home.backToTop}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={[
        "pixel-button fixed bottom-5 right-5 z-30 inline-flex h-10 w-10 items-center justify-center p-0 text-[#fff6c8] transition duration-200 sm:bottom-6 sm:right-6",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      ].join(" ")}
    >
      <span className="pixel-font text-[0.78rem] leading-none">↑</span>
    </button>
  );
}
