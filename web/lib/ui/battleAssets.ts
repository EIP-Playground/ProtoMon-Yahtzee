import {
  ACTIVE_COMPANION_CONFIG,
  BATTLE_ELEMENT_VISUALS,
  BATTLE_PASSIVE_ITEMS,
  BATTLE_SKILL_META,
} from "@/lib/battle/config";

const BATTLE_ASSET_SOURCES = Array.from(
  new Set([
    "/battle/battle-bg-full.webp",
    "/battle/dice-plate.png",
    "/enemy/boss-goblin-gear-shaman.png",
    "/skills/awakening-energy-icon.png",
    ACTIVE_COMPANION_CONFIG.trainerImageSrc,
    ACTIVE_COMPANION_CONFIG.companionImageSrc,
    ...BATTLE_PASSIVE_ITEMS.map((item) => item.iconSrc),
    ...BATTLE_SKILL_META.map((item) => item.iconSrc),
    ...Object.values(BATTLE_ELEMENT_VISUALS).flatMap((visual) => [visual.iconSrc, visual.diceFaceSrc]),
  ]),
);

let battleAssetsPromise: Promise<void> | null = null;

function isJsdomRuntime() {
  return typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new window.Image();

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
    };

    image.onload = () => {
      cleanup();
      resolve();
    };

    image.onerror = () => {
      cleanup();
      resolve();
    };

    image.decoding = "async";
    image.src = src;

    if (image.complete) {
      cleanup();
      resolve();
    }
  });
}

export function preloadBattleAssets() {
  if (typeof window === "undefined" || isJsdomRuntime()) {
    return Promise.resolve();
  }

  if (!battleAssetsPromise) {
    battleAssetsPromise = Promise.all(BATTLE_ASSET_SOURCES.map((src) => preloadImage(src))).then(
      () => undefined,
    );
  }

  return battleAssetsPromise;
}
