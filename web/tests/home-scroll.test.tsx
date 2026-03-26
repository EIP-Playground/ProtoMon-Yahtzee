// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/components/loading/LoadingPage", () => ({
  LoadingPage: () => <div data-testid="loading" />,
}));

vi.mock("@/components/home/HomeWalletHud", () => ({
  HomeWalletHud: () => <div data-testid="wallet-hud">wallet-hud</div>,
}));

import Home from "@/app/page";

describe("Home scroll affordances", () => {
  beforeEach(() => {
    window.sessionStorage.setItem("protomon:entry-loading:seen", "1");
    window.localStorage.setItem("protomon:locale", "zh-CN");
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      writable: true,
      configurable: true,
    });
  });

  it("reveals the back-to-top button after scrolling past the threshold", async () => {
    render(<Home />);

    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
    });

    const button = await screen.findByRole("button", { name: "返回顶部" });
    expect(button.className).toContain("opacity-0");

    await act(async () => {
      window.scrollY = 700;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(button.className).toContain("opacity-100");
  });
});
