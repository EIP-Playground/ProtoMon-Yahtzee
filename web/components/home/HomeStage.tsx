"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import type { HomeArtConfig, HomeStageConfig } from "@/lib/home/layout";

type HomeStageProps = {
  stage: HomeStageConfig;
  children?: ReactNode;
  className?: string;
  priority?: boolean;
};

export function HomeStage({ stage, children, className, priority = false }: HomeStageProps) {
  const overflowClass = stage.overflow === "visible" ? "overflow-visible" : "overflow-hidden";
  const backgroundClass = stage.backgroundObjectClassName ?? "object-fill";

  return (
    <section
      id={stage.id}
      className={["relative w-full", overflowClass, className ?? ""].join(" ")}
      style={{ aspectRatio: `${stage.aspectWidth} / ${stage.aspectHeight}` }}
    >
      <Image
        src={stage.backgroundSrc}
        alt={stage.backgroundAlt}
        fill
        priority={priority}
        sizes="100vw"
        className={backgroundClass}
        style={{ imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0">{children}</div>
    </section>
  );
}

type HomeArtProps = {
  art: HomeArtConfig;
};

export function HomeArt({ art }: HomeArtProps) {
  const style: CSSProperties & {
    "--art-width": string;
    "--art-mobile-width": string;
    "--art-left": string;
    "--art-mobile-left": string;
    "--art-top": string;
    "--art-mobile-top": string;
  } = {
    "--art-width": `${art.width}%`,
    "--art-mobile-width": `${art.mobileWidth ?? art.width}%`,
    "--art-left": `${art.left}%`,
    "--art-mobile-left": `${art.mobileLeft ?? art.left}%`,
    "--art-top": `${art.top}%`,
    "--art-mobile-top": `${art.mobileTop ?? art.top}%`,
    zIndex: art.zIndex ?? 1,
    opacity: art.opacity ?? 1,
    maxWidth: art.maxWidthVw ? `${art.maxWidthVw}vw` : undefined,
    transform: art.rotate ? `rotate(${art.rotate}deg)` : undefined,
    animationDelay: art.animationDelayMs ? `${art.animationDelayMs}ms` : undefined,
  };

  return (
    <div
      className={[
        "absolute left-[var(--art-mobile-left)] top-[var(--art-mobile-top)] w-[var(--art-mobile-width)] md:left-[var(--art-left)] md:top-[var(--art-top)] md:w-[var(--art-width)]",
        art.className ?? "",
      ].join(" ")}
      style={style}
    >
      {art.href ? (
        <a href={art.href} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
          <Image
            src={art.src}
            alt={art.alt}
            width={1200}
            height={1200}
            sizes={`${art.width}vw`}
            className="h-auto w-full"
            style={{ imageRendering: "pixelated" }}
          />
        </a>
      ) : (
        <Image
          src={art.src}
          alt={art.alt}
          width={1200}
          height={1200}
          sizes={`${art.width}vw`}
          className="h-auto w-full"
          style={{ imageRendering: "pixelated" }}
        />
      )}
    </div>
  );
}
