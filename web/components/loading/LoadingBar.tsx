"use client";
/* eslint-disable @next/next/no-img-element */

import {
  getLoadingRevealPosition,
  getLoadingRevealThreshold,
} from "@/lib/ui/loading";

const ELEMENTS = [
  {
    key: "gold",
    label: "金",
    color: "#FFD700",
    src: "/protomon-loading/icon-gold.png",
  },
  {
    key: "wood",
    label: "木",
    color: "#4ADE80",
    src: "/protomon-loading/icon-wood.png",
  },
  {
    key: "water",
    label: "水",
    color: "#38BDF8",
    src: "/protomon-loading/icon-water.png",
  },
  {
    key: "fire",
    label: "火",
    color: "#F97316",
    src: "/protomon-loading/icon-fire.png",
  },
  {
    key: "earth",
    label: "土",
    color: "#A16207",
    src: "/protomon-loading/icon-earth.png",
  },
  {
    key: "wind",
    label: "风",
    color: "#93C5FD",
    src: "/protomon-loading/icon-wind.png",
  },
] as const;

type LoadingBarProps = {
  progress: number;
  width?: number;
};

export function LoadingBar({ progress, width = 320 }: LoadingBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const barHeight = Math.round(width / 6.693);

  const padLeft = Math.round(width * 0.056);
  const padRight = Math.round(width * 0.056);
  const padTop = Math.round(barHeight * 0.17);
  const padBottom = Math.round(barHeight * 0.19);

  const innerWidth = width - padLeft - padRight;
  const innerHeight = barHeight - padTop - padBottom;
  const iconSize = Math.round(innerHeight * 0.88);
  const fillWidth = Math.round((innerWidth * clamped) / 100);
  const lastIconRevealPadding = (iconSize / 2 / innerWidth) * 100;

  return (
    <div
      style={{
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Loading ${clamped}%`}
        style={{
          width,
          height: barHeight,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <img
          src="/protomon-loading/loading-bar-container.png"
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

        <div
          data-testid="loading-fill-mask"
          style={{
            position: "absolute",
            left: padLeft,
            top: padTop,
            width: fillWidth,
            height: innerHeight,
            overflow: "hidden",
            borderRadius: Math.round(innerHeight * 0.4),
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: innerWidth,
            }}
          >
            <img
              src="/protomon-loading/loading-clean-fill.png"
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: innerWidth,
                height: innerHeight,
                maxWidth: "none",
                objectFit: "fill",
                imageRendering: "pixelated",
                display: "block",
              }}
            />
          </div>

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
          <div
            data-testid="loading-icon-scene"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: innerWidth,
              height: innerHeight,
              pointerEvents: "none",
            }}
          >
            {ELEMENTS.map((element, index) => {
              const threshold = getLoadingRevealThreshold(index);
              const visibleThreshold =
                index === ELEMENTS.length - 1
                  ? Math.min(100, threshold + lastIconRevealPadding)
                  : threshold;
              const position = getLoadingRevealPosition(index);
              const xCenter = Math.round(position * innerWidth);
              const xLeft = xCenter - Math.round(iconSize / 2);
              const yTop = Math.round((innerHeight - iconSize) / 2);

              return (
                <div
                  key={element.key}
                  data-testid={`loading-icon-${element.key}`}
                  data-threshold={threshold}
                  data-visible-threshold={visibleThreshold.toFixed(1)}
                  style={{
                    position: "absolute",
                    left: xLeft,
                    top: yTop,
                    width: iconSize,
                    height: iconSize,
                    transition:
                      "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease",
                    transform:
                      clamped >= visibleThreshold ? "scale(1)" : "scale(0)",
                    opacity: clamped >= visibleThreshold ? 1 : 0,
                    filter: `drop-shadow(0 0 5px ${element.color}) drop-shadow(0 0 10px ${element.color}88)`,
                  }}
                >
                  <img
                    src={element.src}
                    alt={element.label}
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
    </div>
  );
}
