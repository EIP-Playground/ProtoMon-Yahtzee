"use client";

import type { ReactNode } from "react";

import { HomeArt, HomeStage } from "@/components/home/HomeStage";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  ALCHEMY_ART,
  CROSS_CHAIN_ART,
  HERO_ART,
  HOME_STAGES,
  MEET_CARD_ART,
} from "@/lib/home/layout";

type HomeLandingProps = {
  errorMessage: string | null;
  isBusy: boolean;
  onStartBattle: () => void;
  heroTopControls?: ReactNode;
};

export function HomeLanding({
  errorMessage,
  isBusy,
  onStartBattle,
  heroTopControls,
}: HomeLandingProps) {
  const { messages } = useLocale();

  return (
    <div className="home-shell relative overflow-x-hidden bg-[#070d16] pb-[1.8vw]">
      <HomeStage stage={HOME_STAGES.hero} priority>
        {heroTopControls ? (
          <div className="absolute inset-x-[2.6%] top-[1.6%] z-[40]">
            {heroTopControls}
          </div>
        ) : null}

        <div className="absolute left-[50%] top-[7.2%] z-10 w-[80%] -translate-x-1/2 text-center">
          <p className="pixel-font text-[clamp(0.62rem,1.18vw,0.92rem)] tracking-[0.18em] text-[#fef3b2] drop-shadow-[0_0.2rem_0_rgba(10,19,35,0.68)]">
            {messages.home.eyebrow}
          </p>
          <h1 className="pixel-font mt-[1.6%] text-[clamp(2rem,5.2vw,4.2rem)] leading-[1.04] text-[#ffcc57] [text-shadow:0_0.22rem_0_#0b1322,0_0.4rem_0_rgba(10,19,35,0.85)]">
            {messages.home.title}
          </h1>
          <p className="pixel-font mx-auto mt-[2.4%] max-w-[78%] text-[clamp(0.78rem,1.5vw,1.2rem)] leading-[1.62] text-slate-100/95">
            {messages.home.description}
          </p>
        </div>

        {HERO_ART.map((art) => (
          <HomeArt key={art.src} art={art} />
        ))}

        <div className="absolute left-1/2 top-[80.8%] z-20 w-[clamp(12.8rem,25vw,18.2rem)] -translate-x-1/2 text-center">
          <button
            type="button"
            onClick={onStartBattle}
            disabled={isBusy}
            aria-label={isBusy ? messages.home.startButtonBusy : messages.home.startButtonIdle}
            className="pixel-cta-button w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="pixel-font block text-[clamp(0.96rem,1.65vw,1.3rem)] text-[#fff6c8]">
              {isBusy ? messages.home.startButtonBusy : messages.home.startButtonIdle}
            </span>
            <span className="pixel-font mt-[2.2%] block text-[clamp(0.68rem,1vw,0.9rem)] text-[#dceeff]">
              {messages.home.startButtonCaption}
            </span>
          </button>
          {errorMessage ? (
            <p className="pixel-font mt-[4.8%] text-[clamp(0.72rem,1.1vw,0.96rem)] leading-[1.6] text-[#ffd1d1]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </HomeStage>

      <HomeStage stage={HOME_STAGES.meet}>
        <div className="absolute left-1/2 top-[7.6%] z-10 w-[82%] -translate-x-1/2 text-center">
          <h2 className="pixel-font text-[clamp(1.04rem,2.35vw,1.92rem)] text-[#eef8ff] [text-shadow:0_0.18rem_0_rgba(8,17,31,0.88)]">
            {messages.home.meetTitle}
          </h2>
        </div>
        {MEET_CARD_ART.map((art, index) => (
          <div key={art.src}>
            <HomeArt art={art} />
            <div
              className="absolute z-20 text-center"
              style={{
                left: `${art.left + 0.7}%`,
                top: "78.1%",
                width: `${art.width - 2.8}%`,
              }}
            >
            </div>
          </div>
        ))}
      </HomeStage>

      <HomeStage stage={HOME_STAGES.alchemy}>
        <div className="absolute left-1/2 top-[7.4%] z-10 w-[84%] -translate-x-1/2 text-center">
          <h2 className="pixel-font text-[clamp(1.04rem,2.35vw,1.92rem)] text-[#eef8ff] [text-shadow:0_0.18rem_0_rgba(8,17,31,0.88)]">
            {messages.home.alchemyTitle}
          </h2>
        </div>
        {ALCHEMY_ART.map((art) => (
          <HomeArt key={art.src} art={art} />
        ))}
        {/* <div className="absolute left-[12.1%] top-[80.4%] z-10 w-[30%] text-center">
          <p className="pixel-tag text-[clamp(0.34rem,0.68vw,0.5rem)]">{messages.home.alchemyWorkbench}</p>
        </div>
        <div className="absolute left-[58.5%] top-[80.3%] z-10 w-[27%] text-center">
          <p className="pixel-tag text-[clamp(0.34rem,0.68vw,0.5rem)]">{messages.home.alchemyCastPanel}</p>
        </div> */}
      </HomeStage>

      <HomeStage stage={HOME_STAGES.crossChain}>
        <div className="absolute left-1/2 top-[7.4%] z-10 w-[86%] -translate-x-1/2 text-center">
          <h2 className="pixel-font text-[clamp(1.02rem,2.18vw,1.78rem)] text-[#eef8ff] [text-shadow:0_0.18rem_0_rgba(8,17,31,0.88)]">
            {messages.home.crossChainTitle}
          </h2>
        </div>
        {CROSS_CHAIN_ART.map((art) => (
          <HomeArt key={art.src} art={art} />
        ))}
        <div className="absolute left-[39.8%] top-[75.9%] z-10 w-[15.8%] text-center">
          <p className="pixel-tag text-[clamp(0.58rem,0.9vw,0.78rem)]">{messages.home.reactiveNodeLabel}</p>
        </div>
        <div className="absolute left-[70.2%] top-[75.1%] z-10 w-[12.8%] text-center">
          <p className="pixel-tag text-[clamp(0.58rem,0.9vw,0.78rem)]">{messages.home.mainnetRewardLabel}</p>
        </div>
        <div className="absolute left-[32.6%] top-[84.1%] z-10 w-[35%] text-center">
          <p className="pixel-font text-[clamp(0.66rem,1vw,0.9rem)] text-sky-100/96">
            {messages.home.crossChainCaption}
          </p>
        </div>
      </HomeStage>

      <HomeStage stage={HOME_STAGES.footer} className="-mt-[0.2%]">
        <div className="absolute inset-x-[5%] top-[42.5%] z-10 flex items-center justify-between gap-[3%]">
          <div className="flex flex-wrap gap-[1.2%]">
            {messages.home.footerLeftLinks.map((label) => (
              <span key={label} className="pixel-footer-chip">
                {label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-[1.2%]">
            {messages.home.footerRightLinks.map((label) => (
              <span key={label} className="pixel-footer-chip">
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute left-1/2 top-[60.2%] z-10 w-[72%] -translate-x-1/2 text-center">
          <p className="pixel-font text-[clamp(0.62rem,0.98vw,0.88rem)] text-slate-100/95">
            {messages.home.footerTagline}
          </p>
          <p className="pixel-font mt-[1.1%] text-[clamp(0.52rem,0.82vw,0.74rem)] text-slate-300/86">
            {messages.home.footerCopyright}
          </p>
        </div>
      </HomeStage>
    </div>
  );
}
