"use client";

import { useEffect, useRef } from "react";

import { PixelWalletButton } from "@/components/home/PixelWalletButton";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function HomeFloatingControls() {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!navRef.current) {
      return undefined;
    }

    const updateHeight = () => {
      const height = navRef.current?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty("--home-top-nav-height", `${Math.ceil(height)}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(navRef.current);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label="home top controls"
      className="pixel-frost-nav pointer-events-auto fixed inset-x-0 top-0 z-[60] flex w-full items-center gap-2 px-3 py-3 md:gap-3 md:px-5 md:py-3.5"
    >
      <div className="flex w-full items-center justify-between gap-3 md:mx-auto md:max-w-[1600px]">
        <div className="pointer-events-none flex min-w-0 items-center">
          <img
            src="/protomon-logo.png"
            alt="ProtoMon"
            className="h-9 w-auto object-contain md:h-10"
            draggable="false"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className="shrink-0">
            <PixelWalletButton />
          </div>
          <LanguageSwitcher compact variant="pixel" />
        </div>
      </div>
    </nav>
  );
}
