"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { LoadingBar } from "@/components/loading/LoadingBar";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  getPendingRevealProgress,
  LOADING_BAR_WIDTH,
  LOADING_REVEAL_CAP,
} from "@/lib/ui/loading";

const PARTICLE_COLORS = ["#FFD700", "#4ADE80", "#38BDF8", "#F97316", "#A16207", "#93C5FD"];

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
  const progressRef = useRef(0);
  const completeTimeoutRef = useRef<number | null>(null);
  const particles = useMemo(() => createParticles(), []);
  const resolvedTitle = title ?? messages.loading.defaultTitle;
  const resolvedSubtitle = subtitle ?? messages.loading.defaultSubtitle;
  const resolvedLoadingLabel = loadingLabel ?? messages.loading.defaultLoadingLabel;
  const resolvedCompleteLabel = completeLabel ?? messages.loading.defaultCompleteLabel;
  const messageList = customMessages ?? messages.loading.defaultMessages;

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (messageList.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setFadeMessage(false);
      window.setTimeout(() => {
        setMessageIndex((index) => (index + 1) % messageList.length);
        setFadeMessage(true);
      }, 300);
    }, Math.max(700, Math.round(duration / messageList.length)));

    return () => window.clearInterval(interval);
  }, [duration, messageList]);

  useEffect(() => {
    if (mode !== "timed") {
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
  }, [duration, mode, onComplete]);

  useEffect(() => {
    if (mode !== "pending" || ready) {
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
  }, [duration, mode, ready]);

  useEffect(() => {
    if (mode !== "pending" || !ready) {
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
  }, [mode, onComplete, ready]);

  return (
    <div
      className="loading-shell fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0a0e1a 0%, #0d1b2a 50%, #060d18 100%)",
      }}
    >
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher compact variant="pixel" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
              style={{
                transform: `rotate(${particle.rotation}deg)`,
              }}
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

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6 px-6">
        <div className="mb-2 text-center">
          <h1
            className="mb-1 text-2xl font-bold tracking-widest uppercase sm:text-3xl"
            style={{
              fontFamily: "var(--font-heading), var(--font-pixel-ui), monospace",
              color: "#FFD700",
              textShadow: "0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,165,0,0.3)",
              lineHeight: 1.4,
            }}
          >
            {resolvedTitle}
          </h1>
          <p
            className="text-xs tracking-widest"
            style={{
              fontFamily: "var(--font-pixel-ui), monospace",
              color: "#00E5FF",
              textShadow: "0 0 10px rgba(0,229,255,0.5)",
            }}
          >
            {resolvedSubtitle}
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <LoadingBar progress={progress} width={LOADING_BAR_WIDTH} />

          <div className="flex w-full items-center justify-between px-1">
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-pixel-ui), monospace",
                color: "#00E5FF",
                textShadow: "0 0 8px rgba(0,229,255,0.6)",
              }}
            >
              {progress}%
            </span>
            <span
              className="text-xs"
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
            className="text-center text-xs transition-opacity duration-300"
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
          className="mt-4 text-xs opacity-40"
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
