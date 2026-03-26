/**
 * LoadingPage — ProtoMon: Elemental Alchemy
 * Design: 浮空岛全景长卷 · 像素风 · 暗夜地下链区
 *
 * Layout:
 *   - Full-screen dark background with pixel grid
 *   - Centered logo + title
 *   - LoadingBar (icons above bar, icons appear one by one as progress advances)
 *   - Scrolling loading messages
 *   - Auto-calls onComplete when progress reaches 100
 */

import { useEffect, useRef, useState } from "react";
import LoadingBar from "@/components/LoadingBar";

// ── Loading flavor messages ──────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "正在同步元素共鸣… Syncing Elemental Resonance…",
  "加载跨链数据… Preparing Cross-Chain Data…",
  "召唤 Ignis Fox 中… Summoning Ignis Fox…",
  "Aqua Tortoise 正在冷却… Cooling Down…",
  "Volt Kitten 连接 MEV 节点… Connecting MEV Node…",
  "炼金术工作台初始化… Alchemy Workbench Init…",
  "加载 EIP Dex 数据库… Loading EIP Dex…",
  "验证链上资产… Verifying On-Chain Assets…",
  "同步 L2 状态… Syncing L2 State…",
  "元素骰子校准中… Calibrating Elemental Dice…",
  "FULLY ON-CHAIN. FULLY FUN.",
];

// ── Floating particle component ──────────────────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 3,
    color: ["#FFD700", "#4ADE80", "#38BDF8", "#F97316", "#A16207", "#93C5FD"][i % 6],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `float-particle ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  onComplete?: () => void;
  duration?: number;
}

export default function LoadingPage({
  onComplete,
  duration = 4000,
}: LoadingPageProps) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeMsg, setFadeMsg] = useState(true);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  // ── Animate progress 0 → 100 ────────────────────────────────────────────
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out: fast start, slow finish
      const eased = 1 - Math.pow(1 - t, 2.5);
      const newProgress = Math.round(eased * 100);
      setProgress(newProgress);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setProgress(100);
        setDone(true);
        setTimeout(() => onComplete?.(), 900);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, onComplete]);

  // ── Cycle loading messages ───────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeMsg(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setFadeMsg(true);
      }, 300);
    }, Math.round(duration / LOADING_MESSAGES.length));

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0a0e1a 0%, #0d1b2a 50%, #060d18 100%)",
      }}
    >
      {/* ── Pixel grid background ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Floating particles ── */}
      <FloatingParticles />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-lg">

        {/* Logo / Title */}
        <div className="text-center mb-2">
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-widest uppercase mb-1"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              color: "#FFD700",
              textShadow: "0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,165,0,0.3)",
              lineHeight: 1.4,
            }}
          >
            PROTOMON
          </h1>
          <p
            className="text-xs tracking-widest"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              color: "#00E5FF",
              textShadow: "0 0 10px rgba(0,229,255,0.5)",
            }}
          >
            ELEMENTAL ALCHEMY
          </p>
        </div>

        {/* ── LoadingBar (icons + bar integrated) ── */}
        <div className="w-full flex flex-col items-center gap-3">
          <LoadingBar progress={progress} width={420} />

          {/* Progress percentage + status */}
          <div className="flex items-center justify-between w-full px-1">
            <span
              className="text-xs"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                color: "#00E5FF",
                textShadow: "0 0 8px rgba(0,229,255,0.6)",
              }}
            >
              {progress}%
            </span>
            <span
              className="text-xs"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                color: done ? "#FFD700" : "#4a6fa5",
                textShadow: done ? "0 0 10px rgba(255,215,0,0.6)" : "none",
                transition: "color 0.3s, text-shadow 0.3s",
              }}
            >
              {done ? "READY!" : "LOADING…"}
            </span>
          </div>
        </div>

        {/* Scrolling message */}
        <div className="h-8 flex items-center justify-center" style={{ minHeight: 32 }}>
          <p
            className="text-center text-xs transition-opacity duration-300"
            style={{
              fontFamily: "'Orbitron', 'Press Start 2P', monospace",
              color: "#7ecfff",
              opacity: fadeMsg ? 1 : 0,
              textShadow: "0 0 8px rgba(126,207,255,0.4)",
              letterSpacing: "0.05em",
            }}
          >
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Bottom tagline */}
        <p
          className="text-xs opacity-40 mt-4"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            color: "#ffffff",
            letterSpacing: "0.1em",
          }}
        >
          FULLY ON-CHAIN. FULLY FUN.
        </p>
      </div>

      {/* ── Fade-out overlay when done ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: "#000",
          opacity: done ? 1 : 0,
        }}
      />
    </div>
  );
}
