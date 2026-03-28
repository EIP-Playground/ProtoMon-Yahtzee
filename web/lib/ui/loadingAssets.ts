const LOADING_ASSET_SOURCES = [
  "/protomon-loading/loading-bg.webp",
  "/protomon-loading/loading-bar-container.png",
  "/protomon-loading/loading-clean-fill.png",
  "/protomon-loading/icon-gold.png",
  "/protomon-loading/icon-wood.png",
  "/protomon-loading/icon-water.png",
  "/protomon-loading/icon-fire.png",
  "/protomon-loading/icon-earth.png",
  "/protomon-loading/icon-wind.png",
  "/dice/dice-fire.png",
  "/dice/dice-water.png",
  "/dice/dice-wood.png",
  "/dice/dice-wind.png",
  "/dice/dice-earth.png",
  "/dice/dice-gold.png",
] as const;

let loadingAssetsPromise: Promise<void> | null = null;

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

export function preloadLoadingAssets() {
  if (typeof window === "undefined" || isJsdomRuntime()) {
    return Promise.resolve();
  }

  if (!loadingAssetsPromise) {
    loadingAssetsPromise = Promise.all(LOADING_ASSET_SOURCES.map((src) => preloadImage(src))).then(
      () => undefined,
    );
  }

  return loadingAssetsPromise;
}
