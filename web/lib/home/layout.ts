export type DealerStatus = "idle" | "waiting" | "online" | "error";

export type HomeArtConfig = {
  src: string;
  alt: string;
  left: number;
  top: number;
  width: number;
  mobileWidth?: number;
  maxWidthVw?: number;
  zIndex?: number;
  opacity?: number;
  rotate?: number;
};

export type HomeStageConfig = {
  id: string;
  backgroundSrc: string;
  backgroundAlt: string;
  aspectWidth: number;
  aspectHeight: number;
  overflow?: "hidden" | "visible";
  backgroundObjectClassName?: string;
};

export const HOME_STAGES: Record<
  "hero" | "meet" | "alchemy" | "crossChain" | "footer",
  HomeStageConfig
> = {
  hero: {
    id: "hero",
    backgroundSrc: "/home/home-bg/home-bg-1.webp",
    backgroundAlt: "ProtoMon floating island home background",
    aspectWidth: 1600,
    aspectHeight: 896,
    overflow: "hidden",
  },
  meet: {
    id: "meet",
    backgroundSrc: "/home/home-bg/home-bg-2.webp",
    backgroundAlt: "ProtoMon collection showcase background",
    aspectWidth: 1600,
    aspectHeight: 535,
    overflow: "visible",
  },
  alchemy: {
    id: "alchemy",
    backgroundSrc: "/home/home-bg/home-bg-3.webp",
    backgroundAlt: "ProtoMon alchemy systems background",
    aspectWidth: 1600,
    aspectHeight: 535,
    overflow: "visible",
  },
  crossChain: {
    id: "crossChain",
    backgroundSrc: "/home/home-bg/home-bg-4.webp",
    backgroundAlt: "ProtoMon reactive cross-chain background",
    aspectWidth: 1600,
    aspectHeight: 716,
    overflow: "hidden",
  },
  footer: {
    id: "footer",
    backgroundSrc: "/home/home-bg/footer-bg.webp",
    backgroundAlt: "ProtoMon footer background",
    aspectWidth: 3392,
    aspectHeight: 560,
    overflow: "hidden",
    backgroundObjectClassName: "object-cover object-top",
  },
};

export const HERO_ART: readonly HomeArtConfig[] = [
  {
    src: "/home/hero-section/hero-protomon.png",
    alt: "Hero ProtoMon",
    left: 34.2,
    top: 45.1,
    width: 15.6,
    mobileWidth: 21,
    maxWidthVw: 16.2,
    zIndex: 10,
  },
  {
    src: "/home/hero-section/hero-panda-trainer.png",
    alt: "Hero Panda Trainer",
    left: 48.9,
    top: 25.1,
    width: 16.4,
    mobileWidth: 24,
    maxWidthVw: 18,
    zIndex: 11,
  },
];

export const MEET_CARD_ART: readonly HomeArtConfig[] = [
  {
    src: "/home/meet-protomon-section/protomon-001-card-transparent.png",
    alt: "ProtoMon card 1",
    left: 17.5,
    top: 25.1,
    width: 16.4,
    mobileWidth: 25,
    maxWidthVw: 20.5,
    zIndex: 16,
  },
  {
    src: "/home/meet-protomon-section/protomon-002-card-transparent.png",
    alt: "ProtoMon card 2",
    left: 41.5,
    top: 24.8,
    width: 16.4,
    mobileWidth: 25,
    maxWidthVw: 20.5,
    zIndex: 18,
  },
  {
    src: "/home/meet-protomon-section/protomon-003-card-transparent.png",
    alt: "ProtoMon card 3",
    left: 63.4,
    top: 25.1,
    width: 16.4,
    mobileWidth: 25,
    maxWidthVw: 20.5,
    zIndex: 16,
  },
];

export const ALCHEMY_ART: readonly HomeArtConfig[] = [
  {
    src: "/home/master-the-alchemy-section/dice-intro.png",
    alt: "Dice intro board",
    left: 10.1,
    top: 34.9,
    width: 35.2,
    mobileWidth: 41,
    maxWidthVw: 36,
    zIndex: 4,
  },
  {
    src: "/home/master-the-alchemy-section/skill-panel-intro.png",
    alt: "Skill panel intro board",
    left: 56,
    top: 6,
    width: 34.1,
    mobileWidth: 40,
    maxWidthVw: 35.2,
    zIndex: 18,
  },
];

export const CROSS_CHAIN_ART: readonly HomeArtConfig[] = [
  {
    src: "/home/cross-chain-section/network-arrow-400.png",
    alt: "Reactive flywheel arrow network",
    left: 8.6,
    top: 12.4,
    width: 30,
    mobileWidth: 27,
    maxWidthVw: 35,
    zIndex: 2,
  },
  {
    src: "/home/cross-chain-section/portal-inactive.png",
    alt: "Inactive portal",
    left: 41.6,
    top: 24.5,
    width: 17.3,
    mobileWidth: 21,
    maxWidthVw: 18.5,
    opacity: 0.35,
    zIndex: 2,
  },
  {
    src: "/home/cross-chain-section/portal-active.png",
    alt: "Active portal",
    left: 41.6,
    top: 23.8,
    width: 18.4,
    mobileWidth: 22,
    maxWidthVw: 19.5,
    zIndex: 4,
  },
  {
    src: "/home/cross-chain-section/teleport-well.png",
    alt: "Reactive node pedestal",
    left: 69.6,
    top: 53.7,
    width: 20.1,
    mobileWidth: 18,
    maxWidthVw: 20,
    zIndex: 5,
  },
  {
    src: "/home/cross-chain-section/mainnet-chest.png",
    alt: "Mainnet chest reward",
    left: 71.6,
    top: 22.1,
    width: 15.1,
    mobileWidth: 18,
    maxWidthVw: 16,
    zIndex: 7,
  },
];
