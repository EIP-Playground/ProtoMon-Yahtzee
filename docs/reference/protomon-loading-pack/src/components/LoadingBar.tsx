/**
 * LoadingBar Component — ProtoMon: Elemental Alchemy
 * Design: 浮空岛全景长卷 · Pixel Art Loading Bar
 *
 * 行为：
 *   - 6个图标均匀分布在进度条内部，对应进度位置（0%/17%/33%/50%/67%/83%）
 *   - 进度条填充到图标位置时，图标从进度条内部弹出（scale 0→1）
 *   - 图标始终在进度条内部，不在上方单独显示
 *   - 进度条从左到右彩虹填充，图标叠加在填充条上方
 *
 * Container PNG: 1486×222px
 * Inner fill region: x=16~1479, y=0~202
 */

import { useEffect, useRef, useState } from "react";

const CDN = {
  container:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/loading-bar-container_88258ccf.png",
  cleanFill:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/loading-clean-fill_2e1c37a6.png",
};

const ELEMENTS = [
  {
    key: "gold",
    label: "金",
    color: "#FFD700",
    /** 进度到达此值时，图标弹出 */
    threshold: 0,
    /** 图标在进度条内部的 x 位置（0~1 比例） */
    position: 1 / 12,
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/icon-gold_09674285.png",
  },
  {
    key: "wood",
    label: "木",
    color: "#4ADE80",
    threshold: 17,
    position: 3 / 12,
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/icon-wood_840228cc.png",
  },
  {
    key: "water",
    label: "水",
    color: "#38BDF8",
    threshold: 33,
    position: 5 / 12,
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/icon-water_abff7ce4.png",
  },
  {
    key: "fire",
    label: "火",
    color: "#F97316",
    threshold: 50,
    position: 7 / 12,
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/icon-fire_3135121f.png",
  },
  {
    key: "earth",
    label: "土",
    color: "#A16207",
    threshold: 67,
    position: 9 / 12,
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/icon-earth_7e537bb0.png",
  },
  {
    key: "wind",
    label: "风",
    color: "#93C5FD",
    threshold: 83,
    position: 11 / 12,
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663465952904/Lzh6fFzoZLQWMXibFQX3Kr/icon-wind_17bad2b4.png",
  },
];

interface LoadingBarProps {
  /** 0–100 */
  progress: number;
  /** Total pixel width of the bar, default 480 */
  width?: number;
}

export default function LoadingBar({ progress, width = 480 }: LoadingBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  // Container aspect ratio: 1486 / 222 ≈ 6.693
  const barHeight = Math.round(width / 6.693);

  // Inner fill region (measured from PNG):
  const padLeft = Math.round(width * 0.011);
  const padRight = Math.round(width * 0.005);
  const padTop = Math.round(barHeight * 0.10);
  const padBottom = Math.round(barHeight * 0.12);
  const innerW = width - padLeft - padRight;
  const innerH = barHeight - padTop - padBottom;

  // Icon size inside the bar
  const iconSize = Math.round(innerH * 0.88);

  // Track which icons have been revealed (popped in)
  const [revealedSet, setRevealedSet] = useState<Set<string>>(new Set());
  const prevProgress = useRef(0);

  useEffect(() => {
    const newlyRevealed = ELEMENTS.filter(
      (el) => clamped >= el.threshold && !revealedSet.has(el.key)
    );
    if (newlyRevealed.length > 0) {
      setRevealedSet((prev) => {
        const next = new Set(prev);
        newlyRevealed.forEach((el) => next.add(el.key));
        return next;
      });
    }
    prevProgress.current = clamped;
  }, [clamped, revealedSet]);

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      {/* ── Progress bar with icons inside ── */}
      <div
        style={{
          width,
          height: barHeight,
          position: "relative",
          flexShrink: 0,
        }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Loading ${clamped}%`}
      >
        {/* Layer 1 (bottom): Container frame */}
        <img
          src={CDN.container}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
            display: "block",
          }}
        />

        {/* Layer 2: Rainbow fill (clips left→right) */}
        <div
          style={{
            position: "absolute",
            left: padLeft,
            top: padTop,
            width: innerW,
            height: innerH,
            overflow: "hidden",
            borderRadius: Math.round(innerH * 0.4),
          }}
        >
          {/* Animated reveal */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${clamped}%`,
              overflow: "hidden",
              transition: "width 500ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <img
              src={CDN.cleanFill}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: innerW,
                height: innerH,
                maxWidth: "none",
                objectFit: "fill",
                imageRendering: "pixelated",
                display: "block",
              }}
            />
          </div>

          {/* Shimmer sweep */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.2s infinite linear",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Layer 3: Icons INSIDE the bar — each at its own x position, pops in when progress reaches threshold */}
        <div
          style={{
            position: "absolute",
            left: padLeft,
            top: padTop,
            width: innerW,
            height: innerH,
            pointerEvents: "none",
          }}
        >
          {ELEMENTS.map((el) => {
            const revealed = revealedSet.has(el.key);
            // x center of this icon within innerW
            const xCenter = Math.round(el.position * innerW);
            const xLeft = xCenter - Math.round(iconSize / 2);
            const yTop = Math.round((innerH - iconSize) / 2);

            return (
              <div
                key={el.key}
                style={{
                  position: "absolute",
                  left: xLeft,
                  top: yTop,
                  width: iconSize,
                  height: iconSize,
                  // Pop-in animation when revealed
                  transition:
                    "transform 400ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease",
                  transform: revealed ? "scale(1)" : "scale(0)",
                  opacity: revealed ? 1 : 0,
                  filter: `drop-shadow(0 0 5px ${el.color}) drop-shadow(0 0 10px ${el.color}88)`,
                }}
              >
                <img
                  src={el.url}
                  alt={el.label}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    imageRendering: "pixelated",
                    display: "block",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
