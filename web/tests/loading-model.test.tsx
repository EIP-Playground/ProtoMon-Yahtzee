// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingBar } from "@/components/loading/LoadingBar";
import {
  getLoadingRevealPosition,
  getLoadingRevealThreshold,
  getPendingRevealProgress,
  LOADING_MIN_CREATE_DURATION_MS,
  LOADING_REVEAL_CAP,
} from "@/lib/ui/loading";

describe("loading model", () => {
  it("uses the confirmed segment-end threshold table and matching positions", () => {
    const thresholds = Array.from({ length: 6 }, (_, index) => getLoadingRevealThreshold(index));
    const positions = Array.from({ length: 6 }, (_, index) =>
      Number((getLoadingRevealPosition(index) * 100).toFixed(1)),
    );

    expect(thresholds).toEqual([13.8, 27.7, 41.5, 55.3, 69.2, 83]);
    expect(positions).toEqual(thresholds);
  });

  it("caps pending progress at 83 until ready", () => {
    expect(getPendingRevealProgress(0, LOADING_MIN_CREATE_DURATION_MS, LOADING_REVEAL_CAP)).toBe(
      0,
    );
    expect(
      getPendingRevealProgress(
        LOADING_MIN_CREATE_DURATION_MS / 2,
        LOADING_MIN_CREATE_DURATION_MS,
        LOADING_REVEAL_CAP,
      ),
    ).toBe(42);
    expect(
      getPendingRevealProgress(
        LOADING_MIN_CREATE_DURATION_MS,
        LOADING_MIN_CREATE_DURATION_MS,
        LOADING_REVEAL_CAP,
      ),
    ).toBe(83);
    expect(
      getPendingRevealProgress(
        LOADING_MIN_CREATE_DURATION_MS * 3,
        LOADING_MIN_CREATE_DURATION_MS,
        LOADING_REVEAL_CAP,
      ),
    ).toBe(83);
  });

  it("reveals icons only after the synced thresholds are reached", () => {
    render(<LoadingBar progress={42} width={280} />);

    const fillMask = screen.getByTestId("loading-fill-mask");

    expect(screen.getByTestId("loading-icon-gold")).toHaveStyle({ opacity: "1" });
    expect(screen.getByTestId("loading-icon-wood")).toHaveStyle({ opacity: "1" });
    expect(screen.getByTestId("loading-icon-water")).toHaveStyle({ opacity: "1" });
    expect(screen.getByTestId("loading-icon-fire")).toHaveStyle({ opacity: "0" });
    expect(screen.getByTestId("loading-icon-earth")).toHaveStyle({ opacity: "0" });
    expect(screen.getByTestId("loading-icon-wind")).toHaveStyle({ opacity: "0" });

    expect(screen.getByTestId("loading-icon-gold")).toHaveAttribute("data-threshold", "13.8");
    expect(screen.getByTestId("loading-icon-wind")).toHaveAttribute("data-threshold", "83");
    expect(fillMask.style.transition).toBe("");
    expect(fillMask.contains(screen.getByTestId("loading-icon-gold"))).toBe(true);
  });

  it("delays the last icon until the fill front can cover the full icon width", () => {
    render(<LoadingBar progress={83} width={320} />);

    expect(screen.getByTestId("loading-icon-wind")).toHaveStyle({ opacity: "0" });
    expect(Number(screen.getByTestId("loading-icon-wind").getAttribute("data-visible-threshold"))).toBeGreaterThan(83);
  });
});
