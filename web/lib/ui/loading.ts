export const LOADING_REVEAL_CAP = 83;
export const LOADING_REVEAL_MODE = "segment-end";
export const LOADING_ELEMENT_COUNT = 6;
export const LOADING_MIN_CREATE_DURATION_MS = 2600;
export const LOADING_BAR_WIDTH = 320;

function roundRevealValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function getLoadingRevealThreshold(
  index: number,
  count = LOADING_ELEMENT_COUNT,
  revealCap = LOADING_REVEAL_CAP,
) {
  return roundRevealValue(((index + 1) * revealCap) / count);
}

export function getLoadingRevealPosition(
  index: number,
  count = LOADING_ELEMENT_COUNT,
  revealCap = LOADING_REVEAL_CAP,
) {
  return getLoadingRevealThreshold(index, count, revealCap) / 100;
}

export function getPendingRevealProgress(
  elapsedMs: number,
  durationMs: number,
  revealCap = LOADING_REVEAL_CAP,
) {
  if (durationMs <= 0) {
    return revealCap;
  }

  const progressRatio = Math.min(Math.max(elapsedMs, 0) / durationMs, 1);
  return Math.round(revealCap * progressRatio);
}
