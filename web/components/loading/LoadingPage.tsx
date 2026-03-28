"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { LoadingBar } from "@/components/loading/LoadingBar";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  getPendingRevealProgress,
  LOADING_BAR_WIDTH,
  LOADING_REVEAL_CAP,
} from "@/lib/ui/loading";
import { preloadLoadingAssets } from "@/lib/ui/loadingAssets";

const PARTICLE_COLORS = ["#FFD700", "#4ADE80", "#38BDF8", "#F97316", "#A16207", "#93C5FD"];
const STATIC_DICE_FACES = [
  "/dice/dice-fire.png",
  "/dice/dice-water.png",
  "/dice/dice-wood.png",
  "/dice/dice-wind.png",
  "/dice/dice-earth.png",
  "/dice/dice-gold.png",
] as const;

type FloatingParticle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  driftDuration: number;
  twinkleDuration: number;
  color: string;
  rotation: number;
};

type LoadingPageProps = {
  mode?: "timed" | "pending";
  duration?: number;
  ready?: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  loadingLabel?: string;
  completeLabel?: string;
  messages?: readonly string[];
};

function createParticles(): FloatingParticle[] {
  return Array.from({ length: 24 }, (_, index) => ({
    id: index,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 2,
    delay: Math.random() * 3,
    driftDuration: Math.random() * 3 + 3.5,
    twinkleDuration: Math.random() * 1.4 + 1.2,
    color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
    rotation: Math.random() * 90,
  }));
}

function pickStaticDiceFace() {
  return STATIC_DICE_FACES[Math.floor(Math.random() * STATIC_DICE_FACES.length)];
}

export function LoadingPage({
  mode = "timed",
  duration = 3200,
  ready = false,
  onComplete,
  title,
  subtitle,
  loadingLabel,
  completeLabel,
  messages: customMessages,
}: LoadingPageProps) {
  const { messages } = useLocale();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeMessage, setFadeMessage] = useState(true);
  const [done, setDone] = useState(false);
  const [assetsReady, setAssetsReady] = useState(
    () => typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent),
  );
  const [backgroundReady, setBackgroundReady] = useState(false);
  const progressRef = useRef(0);
  const completeTimeoutRef = useRef<number | null>(null);
  const particles = useMemo(() => createParticles(), []);
  const diceFace = useMemo(() => pickStaticDiceFace(), []);
  const resolvedTitle = title ?? messages.loading.defaultTitle;
  const resolvedSubtitle = subtitle ?? messages.loading.defaultSubtitle;
  const resolvedLoadingLabel = loadingLabel ?? messages.loading.defaultLoadingLabel;
  const resolvedCompleteLabel = completeLabel ?? messages.loading.defaultCompleteLabel;
  const messageList = customMessages ?? messages.loading.defaultMessages;

  useEffect(() => {
    if (assetsReady) {
      return undefined;
    }

    let active = true;

    void preloadLoadingAssets().then(() => {
      if (!active) {
        return;
      }

      setAssetsReady(true);
      setBackgroundReady(true);
    });

    return () => {
      active = false;
    };
  }, [assetsReady]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!assetsReady || messageList.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setFadeMessage(false);
      window.setTimeout(() => {
        setMessageIndex((index) => (index + 1) % messageList.length);
        setFadeMessage(true);
      }, 450);
    }, Math.max(1600, Math.round((duration * 1.45) / messageList.length)));

    return () => window.clearInterval(interval);
  }, [assetsReady, duration, messageList]);

  useEffect(() => {
    if (!assetsReady || mode !== "timed") {
      return undefined;
    }

    let animationFrame = 0;
    let startedAt: number | null = null;

    const animate = (timestamp: number) => {
      if (startedAt === null) {
        startedAt = timestamp;
      }

      const elapsed = timestamp - startedAt;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2.5);
      const nextProgress = Math.round(eased * 100);
      setProgress(nextProgress);

      if (t < 1) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      setProgress(100);
      setDone(true);
      completeTimeoutRef.current = window.setTimeout(() => {
        onComplete?.();
      }, 900);
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (completeTimeoutRef.current !== null) {
        window.clearTimeout(completeTimeoutRef.current);
      }
    };
  }, [assetsReady, duration, mode, onComplete]);

  useEffect(() => {
    if (!assetsReady || mode !== "pending" || ready) {
      return undefined;
    }

    let animationFrame = 0;
    let startedAt: number | null = null;

    const animate = (timestamp: number) => {
      if (startedAt === null) {
        startedAt = timestamp;
      }

      const elapsed = timestamp - startedAt;
      const t = Math.min(elapsed / duration, 1);
      const nextProgress = getPendingRevealProgress(elapsed, duration, LOADING_REVEAL_CAP);

      setProgress((current) => (nextProgress > current ? nextProgress : current));

      if (t < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [assetsReady, duration, mode, ready]);

  useEffect(() => {
    if (!assetsReady || mode !== "pending" || !ready) {
      return undefined;
    }

    let animationFrame = 0;
    let startedAt: number | null = null;
    const initialProgress = progressRef.current;

    const animate = (timestamp: number) => {
      if (startedAt === null) {
        startedAt = timestamp;
      }

      const elapsed = timestamp - startedAt;
      const t = Math.min(elapsed / 450, 1);
      const nextProgress = Math.round(initialProgress + (100 - initialProgress) * t);
      setProgress(nextProgress);

      if (t < 1) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      setProgress(100);
      setDone(true);
      if (onComplete) {
        completeTimeoutRef.current = window.setTimeout(onComplete, 500);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (completeTimeoutRef.current !== null) {
        window.clearTimeout(completeTimeoutRef.current);
      }
    };
  }, [assetsReady, mode, onComplete, ready]);

  if (!assetsReady) {
    return (
      <div className="loading-shell fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #09101b 0%, #0b1524 54%, #050c16 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,200,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.22) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
          <p className="title-pixel text-[clamp(1.4rem,3vw,2.2rem)] uppercase text-[#ffd556] [text-shadow:0_0_16px_rgba(255,213,86,0.32)]">
            {resolvedTitle}
          </p>
          <p className="pixel-font animate-pixel-blink text-[clamp(0.66rem,1.2vw,0.9rem)] uppercase tracking-[0.12em] text-[#d7ecff]">
            {resolvedLoadingLabel}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-shell fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #0a0e1a 0%, #0d1b2a 50%, #060d18 100%)",
        }}
      />

      <div
        data-testid="loading-background-layer"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ opacity: backgroundReady ? 1 : 0 }}
      >
        <Image
          src="/protomon-loading/loading-bg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          data-testid="loading-background-image"
          className="object-cover object-center"
          style={{ imageRendering: "pixelated" }}
          onLoad={() => setBackgroundReady(true)}
        />
      </div>

      <div
        data-testid="loading-network-layer"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: backgroundReady ? 0 : 0.12,
          backgroundImage:
            "linear-gradient(rgba(0,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        data-testid="loading-particles-layer"
        className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700"
        style={{ opacity: backgroundReady ? 0.42 : 0.9 }}
      >
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              animation: `float-particle ${particle.driftDuration}s ${particle.delay}s ease-in-out infinite`,
            }}
          >
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ transform: `rotate(${particle.rotation}deg)` }}
            >
              <div
                className="h-full w-full"
                style={{
                  background: particle.color,
                  boxShadow: `0 0 ${particle.size * 6}px ${particle.color}, 0 0 ${particle.size * 10}px ${particle.color}66`,
                  clipPath:
                    "polygon(50% 0%, 68% 32%, 100% 50%, 68% 68%, 50% 100%, 32% 68%, 0% 50%, 32% 32%)",
                  animation: `twinkle-particle ${particle.twinkleDuration}s ${particle.delay}s ease-in-out infinite`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(6,18,34,0.08) 28%, rgba(7,14,26,0.2) 58%, rgba(7,12,22,0.52) 100%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,13,24,0) 0%, rgba(6,13,24,0.22) 18%, rgba(6,13,24,0.7) 100%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-[44rem] flex-col items-center gap-5 px-5 pb-[6vh] pt-[10vh] sm:gap-6 sm:px-6 sm:pb-[7vh]">
        <div className="mb-1 text-center">
          <h1
            className="mb-2 text-3xl tracking-[0.08em] uppercase sm:text-4xl"
            style={{
              fontFamily: "var(--font-heading), var(--font-pixel-ui), monospace",
              color: "#FFD700",
              textShadow: "0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,165,0,0.3)",
              lineHeight: 1.28,
            }}
          >
            {resolvedTitle}
          </h1>
          <p
            data-testid="loading-subtitle"
            className="text-sm tracking-[0.08em] sm:text-base"
            style={{
              fontFamily: "var(--font-pixel-ui), monospace",
              color: backgroundReady ? "#B46CFF" : "#00E5FF",
              textShadow: backgroundReady
                ? "0 0 10px rgba(180,108,255,0.6), 0 0 18px rgba(105,42,255,0.36)"
                : "0 0 10px rgba(0,229,255,0.5)",
              transition: "color 0.4s ease, text-shadow 0.4s ease",
            }}
          >
            {resolvedSubtitle}
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
          <div
            className="pointer-events-none flex items-center justify-center"
            aria-hidden="true"
          >
            <img
              data-testid="loading-dice-image"
              src={diceFace}
              alt=""
              draggable={false}
              className="h-auto w-[clamp(9.5rem,28vw,15.5rem)]"
              style={{
                imageRendering: "pixelated",
                animation: "card-float 3.8s ease-in-out infinite",
                filter:
                  "drop-shadow(0 0 1.2rem rgba(255,219,111,0.34)) drop-shadow(0 0 2rem rgba(95,223,255,0.24))",
              }}
            />
          </div>

          <LoadingBar progress={progress} width={LOADING_BAR_WIDTH} />

          <div className="flex w-full items-center justify-between px-1">
            <span
              className="text-sm sm:text-base"
              style={{
                fontFamily: "var(--font-pixel-ui), monospace",
                color: "#00E5FF",
                textShadow: "0 0 8px rgba(0,229,255,0.6)",
              }}
            >
              {progress}%
            </span>
            <span
              className="text-sm sm:text-base"
              style={{
                fontFamily: "var(--font-pixel-ui), monospace",
                color: done ? "#FFD700" : "#4a6fa5",
                textShadow: done ? "0 0 10px rgba(255,215,0,0.6)" : "none",
                transition: "color 0.3s, text-shadow 0.3s",
              }}
            >
              {done ? resolvedCompleteLabel : resolvedLoadingLabel}
            </span>
          </div>
        </div>

        <div className="flex h-8 items-center justify-center" style={{ minHeight: 32 }}>
          <p
            className="text-center text-sm transition-opacity duration-300 sm:text-base"
            style={{
              fontFamily: "var(--font-pixel-ui), var(--font-orbitron), monospace",
              color: "#7ecfff",
              opacity: fadeMessage ? 1 : 0,
              textShadow: "0 0 8px rgba(126,207,255,0.4)",
              letterSpacing: "0.05em",
            }}
          >
            {messageList[messageIndex]}
          </p>
        </div>

        <p
          className="mt-2 text-sm opacity-40 sm:text-base"
          style={{
            fontFamily: "var(--font-pixel-ui), monospace",
            color: "#ffffff",
            letterSpacing: "0.1em",
          }}
        >
          {messages.loading.tagline}
        </p>
      </div>

      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: "#000",
          opacity: done ? 1 : 0,
        }}
      />
    </div>
  );
}
