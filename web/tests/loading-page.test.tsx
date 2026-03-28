// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt} {...props} />
  ),
}));

vi.mock("@/components/providers/LocaleProvider", () => ({
  useLocale: () => ({
    messages: {
      loading: {
        defaultTitle: "PROTOMON",
        defaultSubtitle: "元素共鸣同步中",
        defaultLoadingLabel: "加载中…",
        defaultCompleteLabel: "完成！",
        defaultMessages: ["正在同步元素共鸣…"],
        tagline: "FULLY ON-CHAIN. FULLY FUN.",
      },
    },
  }),
}));

vi.mock("@/components/loading/LoadingBar", () => ({
  LoadingBar: () => <div data-testid="loading-bar" />,
}));

import { LoadingPage } from "@/components/loading/LoadingPage";

describe("LoadingPage background transition", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 0));
    vi.stubGlobal("cancelAnimationFrame", vi.fn(() => undefined));
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the fallback network first, then fades in the final background after the image loads", () => {
    render(<LoadingPage mode="pending" duration={2600} ready={false} />);

    const networkLayer = screen.getByTestId("loading-network-layer");
    const particlesLayer = screen.getByTestId("loading-particles-layer");
    const backgroundLayer = screen.getByTestId("loading-background-layer");
    const backgroundImage = screen.getByTestId("loading-background-image");
    const subtitle = screen.getByTestId("loading-subtitle");
    const diceImage = screen.getByTestId("loading-dice-image");

    expect(networkLayer).toHaveStyle({ opacity: "0.12" });
    expect(particlesLayer).toHaveStyle({ opacity: "0.9" });
    expect(backgroundLayer).toHaveStyle({ opacity: "0" });
    expect(screen.queryByTestId("language-switcher")).not.toBeInTheDocument();
    expect(diceImage).toHaveAttribute("src", "/dice/dice-fire.png");
    expect(subtitle).toHaveStyle({ color: "rgb(0, 229, 255)" });

    fireEvent.load(backgroundImage);

    expect(networkLayer).toHaveStyle({ opacity: "0" });
    expect(particlesLayer).toHaveStyle({ opacity: "0.42" });
    expect(backgroundLayer).toHaveStyle({ opacity: "1" });
    expect(subtitle).toHaveStyle({ color: "rgb(180, 108, 255)" });
  });
});
