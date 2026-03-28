"use client";

import { FaGithub, FaPlay, FaUsers, FaXTwitter } from "react-icons/fa6";
import type { ReactNode } from "react";

import { HomeArt, HomeStage } from "@/components/home/HomeStage";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ALCHEMY_ART, CROSS_CHAIN_ART, HERO_ART, HOME_STAGES, MEET_CARD_ART } from "@/lib/home/layout";

const FOOTER_LEFT_TYPES = ["github", "x"] as const;
const FOOTER_RIGHT_TYPES = ["team"] as const;

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
  const footerRightType = FOOTER_RIGHT_TYPES[0] as FooterIconType;
  const footerRightLabel = messages.home.footerRightLinks[0] ?? footerRightType;

  return (
    <div className="home-shell relative overflow-x-hidden bg-[#070d16]">
      {heroTopControls}

      <HomeStage stage={HOME_STAGES.hero} priority>
        <div
          className="absolute left-1/2 z-10 w-[72%] -translate-x-1/2 text-center"
          style={{
            top: "calc(var(--home-top-nav-height, 0px) + clamp(1rem, 2vw, 1.7rem))",
          }}
        >
          <h1 className="hero-title-primary pixel-font mt-[1.4%] text-[clamp(2.25rem,5.9vw,4.9rem)] leading-[1.02] text-[#ffcc57]">
            {messages.home.title}
          </h1>
          <p className="hero-title-secondary pixel-font mx-auto mt-[1.2%] text-[clamp(1.05rem,2.36vw,2rem)] leading-[1.1] text-white">
            {messages.home.subtitle}
          </p>
          <p className="hero-reactive-line pixel-font mx-auto mt-[1.6%] max-w-[92%] text-[clamp(0.72rem,1.3vw,1.02rem)] leading-[1.38] text-white/96">
            <span>{messages.home.reactiveHeadlinePrefix}</span>
            <span className="reactive-network-glow">{messages.home.reactiveHeadlineHighlight}</span>
            <span>{messages.home.reactiveHeadlineSuffix}</span>
          </p>
        </div>

        {HERO_ART.map((art) => (
          <HomeArt key={art.src} art={art} />
        ))}

        <div className="absolute left-1/2 top-[80.5%] z-20 w-[clamp(12.2rem,23vw,17rem)] -translate-x-1/2 text-center">
          <button
            type="button"
            onClick={onStartBattle}
            disabled={isBusy}
            aria-label={isBusy ? messages.home.startButtonBusy : messages.home.startButtonIdle}
            className="pixel-cta-button w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="flex items-center justify-center gap-3">
              <FaPlay className="cta-play-icon" aria-hidden="true" />
              <span className="pixel-font block text-[clamp(0.92rem,1.74vw,1.34rem)] text-[#fff6c8]">
                {isBusy ? messages.home.startButtonBusy : messages.home.startButtonIdle}
              </span>
            </span>
          </button>
          {errorMessage ? (
            <p className="pixel-font mt-[4.8%] text-[clamp(0.56rem,1.02vw,0.82rem)] leading-[1.65] text-[#ffd1d1]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </HomeStage>

      <HomeStage stage={HOME_STAGES.meet}>
        <div className="absolute left-1/2 top-[7.6%] z-10 w-[82%] -translate-x-1/2 text-center">
          <h2 className="section-title-glow pixel-font text-[clamp(1rem,2.1vw,1.62rem)] text-[#eef8ff]">
            {messages.home.meetTitle}
          </h2>
        </div>
        {MEET_CARD_ART.map((art) => (
          <HomeArt key={art.src} art={art} />
        ))}
      </HomeStage>

      <HomeStage stage={HOME_STAGES.alchemy}>
        <div className="absolute left-1/2 top-[7.4%] z-10 w-[84%] -translate-x-1/2 text-center">
          <h2 className="section-title-glow pixel-font text-[clamp(1rem,2.1vw,1.62rem)] text-[#eef8ff]">
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
          <h2 className="section-title-glow pixel-font text-[clamp(1.14rem,2.3vw,1.8rem)] text-[#eef8ff]">
            {messages.home.crossChainTitle}
          </h2>
        </div>
        {CROSS_CHAIN_ART.map((art) => (
          <HomeArt key={art.src} art={art} />
        ))}
        <div className="absolute left-[41.4%] top-[68.6%] z-10 w-[17.2%] text-center">
          <p className="pixel-tag text-[clamp(0.82rem,1.34vw,1.12rem)]">{messages.home.reactiveNodeLabel}</p>
        </div>
        <div className="absolute left-[71.8%] top-[83.4%] z-10 w-[15.8%] text-center">
          <p className="pixel-tag text-[clamp(0.82rem,1.34vw,1.12rem)]">{messages.home.mainnetRewardLabel}</p>
        </div>
        <div className="absolute left-[31.8%] top-[82.4%] z-10 w-[37%] text-center">
          <p className="pixel-font text-[clamp(0.84rem,1.26vw,1.02rem)] text-sky-100/96 [text-shadow:0_0_0.14rem_rgba(12,22,35,0.9),0_0_0.8rem_rgba(88,211,255,0.34)]">
            {messages.home.crossChainCaption}
          </p>
        </div>
      </HomeStage>

      <HomeStage stage={HOME_STAGES.footer} className="-mt-[0.2%]">
        <div className="absolute inset-x-[4.2%] top-[17%] z-10 flex items-start justify-between gap-[2%] md:top-[19%]">
          <div className="flex min-w-0 flex-1 items-start gap-[3%]">
            {FOOTER_LEFT_TYPES.map((type, index) => {
              const label = messages.home.footerLeftLinks[index] ?? type;

              return (
                <a
                  key={label}
                  href={getFooterLink(type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="pixel-stone-button footer-stone-button inline-flex shrink-0 items-center justify-center text-[#fff6c8]"
                >
                  <FooterIcon type={type as FooterIconType} />
                </a>
              );
            })}
          </div>
          <div className="min-w-0 flex-[1.2] pt-[0.18rem] text-center">
            <p className="pixel-font text-[clamp(0.48rem,0.86vw,0.7rem)] text-slate-100/94 [text-shadow:0_0_0.1rem_rgba(8,17,31,0.9),0_0_0.55rem_rgba(170,220,255,0.18)]">
              {messages.home.footerTagline}
            </p>
            <p className="pixel-font mt-1 text-[clamp(0.42rem,0.74vw,0.58rem)] text-slate-200/82 [text-shadow:0_0_0.08rem_rgba(8,17,31,0.88)]">
              {messages.home.footerCopyright}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-end">
            <a
              href={getFooterLink(footerRightType)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={footerRightLabel}
              className="pixel-stone-button footer-stone-button inline-flex shrink-0 items-center justify-center text-[#fff6c8]"
            >
              <FooterIcon type={footerRightType} />
            </a>
          </div>
        </div>
      </HomeStage>
    </div>
  );
}

function FooterIcon({
  type,
}: {
  type: FooterIconType;
}) {
  switch (type) {
    case "github":
      return <FaGithub className="footer-lucide-icon" aria-hidden="true" />;
    case "x":
      return <FaXTwitter className="footer-lucide-icon" aria-hidden="true" />;
    case "team":
      return <FaUsers className="footer-lucide-icon" aria-hidden="true" />;
  }
}

type FooterIconType = "github" | "x" | "team";
function getFooterLink(type: FooterIconType) {
  switch (type) {
    case "github":
      return "https://github.com/EIP-Playground/ProtoMon-Yahtzee";
    case "x":
      return "https://x.com/EIP_Playground";
    case "team":
      return "https://www.eip-playground.com/team";
  }
}
