// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const createBattleSessionMock = vi.fn();
const getConnectedSenderAddressMock = vi.fn();
const startGameOnChainMock = vi.fn();
const waitForGameStartedMock = vi.fn();
const preloadBattleAssetsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/game/session", () => ({
  createBattleSession: (...args: unknown[]) => createBattleSessionMock(...args),
}));

vi.mock("@/lib/chain/gameContract", () => ({
  getConnectedSenderAddress: (...args: unknown[]) => getConnectedSenderAddressMock(...args),
  startGameOnChain: (...args: unknown[]) => startGameOnChainMock(...args),
  waitForGameStarted: (...args: unknown[]) => waitForGameStartedMock(...args),
}));

vi.mock("@/lib/ui/battleAssets", () => ({
  preloadBattleAssets: (...args: unknown[]) => preloadBattleAssetsMock(...args),
}));

vi.mock("@/components/loading/LoadingPage", () => ({
  LoadingPage: ({
    mode,
    ready,
    duration,
    loadingLabel,
    onComplete,
  }: {
    mode: string;
    ready?: boolean;
    duration?: number;
    loadingLabel?: string;
    onComplete?: () => void;
  }) => (
    <div data-testid={`loading-${mode}`}>
      <div>{loadingLabel}</div>
      <div data-testid="loading-ready">{String(Boolean(ready))}</div>
      <div data-testid="loading-duration">{String(duration ?? "")}</div>
      <button type="button" onClick={() => onComplete?.()}>
        complete-loading
      </button>
    </div>
  ),
}));

vi.mock("@/components/home/HomeWalletHud", () => ({
  HomeWalletHud: () => <div data-testid="home-controls">home-controls</div>,
}));

import Home from "@/app/page";
import { LOADING_MIN_CREATE_DURATION_MS } from "@/lib/ui/loading";

describe("Home loading flows", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    pushMock.mockReset();
    createBattleSessionMock.mockReset();
    getConnectedSenderAddressMock.mockReset();
    startGameOnChainMock.mockReset();
    waitForGameStartedMock.mockReset();
    preloadBattleAssetsMock.mockReset();
    getConnectedSenderAddressMock.mockResolvedValue("0x1111111111111111111111111111111111111111");
    preloadBattleAssetsMock.mockResolvedValue(undefined);
    waitForGameStartedMock.mockResolvedValue(undefined);
  });

  it("shows the shared loading component on first entry", async () => {
    render(<Home />);

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("loading-timed")).toBeInTheDocument();
    expect(screen.getByText("启动中…")).toBeInTheDocument();
  });

  it("does not replay entry loading again in the same tab", async () => {
    window.sessionStorage.setItem("protomon:entry-loading:seen", "1");

    render(<Home />);

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.queryByTestId("loading-timed")).not.toBeInTheDocument();
    expect(screen.getByText("ProtoMon")).toBeInTheDocument();
    expect(screen.getByText("ELEMENTAL ALCHEMY")).toBeInTheDocument();
  });

  it("keeps create-game loading on screen for at least 2600ms and finishes before navigation", async () => {
    window.sessionStorage.setItem("protomon:entry-loading:seen", "1");
    createBattleSessionMock.mockResolvedValue({
      gameId: "0xtestgame",
      rewardRecipient: "0x1111111111111111111111111111111111111111",
      bossId: 1,
    });
    startGameOnChainMock.mockResolvedValue({
      txHash: `0x${"1".repeat(64)}`,
    });

    render(<Home />);

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    fireEvent.click(screen.getByRole("button", { name: "立即开战" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("loading-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("home-controls")).not.toBeInTheDocument();
    expect(screen.getByTestId("loading-duration")).toHaveTextContent(
      String(LOADING_MIN_CREATE_DURATION_MS),
    );
    expect(screen.getByTestId("loading-ready")).toHaveTextContent("false");

    await act(async () => {
      vi.advanceTimersByTime(LOADING_MIN_CREATE_DURATION_MS - 1);
      await Promise.resolve();
    });

    expect(screen.getByTestId("loading-ready")).toHaveTextContent("false");

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(screen.getByTestId("loading-ready")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "complete-loading" }));

    expect(pushMock).toHaveBeenCalledWith("/battle/0xtestgame");
  });

  it("does not show create loading before startGame returns a tx hash", async () => {
    window.sessionStorage.setItem("protomon:entry-loading:seen", "1");
    createBattleSessionMock.mockResolvedValue({
      gameId: "0xtestgame",
      rewardRecipient: "0x1111111111111111111111111111111111111111",
      bossId: 1,
    });
    startGameOnChainMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(() => resolve({ txHash: `0x${"2".repeat(64)}` }), 10);
        }),
    );

    render(<Home />);

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    fireEvent.click(screen.getByRole("button", { name: "立即开战" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByTestId("loading-pending")).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(10);
      await Promise.resolve();
    });

    expect(screen.getByTestId("loading-pending")).toBeInTheDocument();
  });
});
