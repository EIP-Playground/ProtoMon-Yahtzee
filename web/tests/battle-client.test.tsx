// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rollDiceMock = vi.fn();
const rerollDiceMock = vi.fn();
const finalizeRoundMock = vi.fn();
const advanceRoundMock = vi.fn();
const confirmRoundMock = vi.fn();
const rollbackRoundMock = vi.fn();
const sendCastTurnUserOpMock = vi.fn();
const waitForTurnPlayedMock = vi.fn();
const createBattleSessionMock = vi.fn();
const startGameOnChainMock = vi.fn();
const waitForGameStartedMock = vi.fn();
const getConnectedSenderAddressMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: unknown;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/api/backend", () => ({
  rollDice: (...args: unknown[]) => rollDiceMock(...args),
  rerollDice: (...args: unknown[]) => rerollDiceMock(...args),
  finalizeRound: (...args: unknown[]) => finalizeRoundMock(...args),
  advanceRound: (...args: unknown[]) => advanceRoundMock(...args),
  confirmRound: (...args: unknown[]) => confirmRoundMock(...args),
  rollbackRound: (...args: unknown[]) => rollbackRoundMock(...args),
}));

vi.mock("@/lib/chain/gameContract", () => ({
  getConnectedSenderAddress: (...args: unknown[]) => getConnectedSenderAddressMock(...args),
  startGameOnChain: (...args: unknown[]) => startGameOnChainMock(...args),
  waitForGameStarted: (...args: unknown[]) => waitForGameStartedMock(...args),
  sendCastTurnUserOp: (...args: unknown[]) => sendCastTurnUserOpMock(...args),
  waitForTurnPlayed: (...args: unknown[]) => waitForTurnPlayedMock(...args),
}));

vi.mock("@/lib/game/session", () => ({
  createBattleSession: (...args: unknown[]) => createBattleSessionMock(...args),
}));

vi.mock("@/components/battle/BattleHudControls", () => ({
  BattleHudControls: () => <div data-testid="wallet-hud">wallet-controls</div>,
}));

import { BattleClient } from "@/components/battle/BattleClient";
import { createInitialBattleState, saveBattleStateSnapshot } from "@/store/battleStore";
import type { BattleState, DiceArray } from "@/types/game";

const INITIAL_SEED = {
  smartAccount: "0x1111111111111111111111111111111111111111",
  rewardRecipient: "0x2222222222222222222222222222222222222222",
} as const;

function createHydratedState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    ...createInitialBattleState("0xtestgame", INITIAL_SEED),
    ...overrides,
  };
}

function storeSnapshot(state: BattleState) {
  saveBattleStateSnapshot(state, window.sessionStorage);
}

function renderBattleClient() {
  return render(<BattleClient gameId="0xtestgame" initialStateSeed={INITIAL_SEED} />);
}

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("BattleClient", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    rollDiceMock.mockReset();
    rerollDiceMock.mockReset();
    finalizeRoundMock.mockReset();
    advanceRoundMock.mockReset();
    confirmRoundMock.mockReset();
    rollbackRoundMock.mockReset();
    sendCastTurnUserOpMock.mockReset();
    waitForTurnPlayedMock.mockReset();
    createBattleSessionMock.mockReset();
    startGameOnChainMock.mockReset();
    waitForGameStartedMock.mockReset();
    getConnectedSenderAddressMock.mockReset();
    pushMock.mockReset();
    getConnectedSenderAddressMock.mockResolvedValue(INITIAL_SEED.smartAccount);
    rollbackRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 1,
      rollCount: 0,
      bossHp: 150,
      upperSubtotal: 0,
      upperBonusClaimed: false,
      usedSlotsBitmap: 0,
      finished: false,
      won: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses one ROLL button for first, second, and third dice actions", async () => {
    const user = userEvent.setup();

    rollDiceMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 1,
      rollCount: 1,
      dice: [1, 2, 3, 4, 5] as DiceArray,
    });
    rerollDiceMock
      .mockResolvedValueOnce({
        gameId: "0xtestgame",
        turn: 1,
        rollCount: 2,
        dice: [1, 2, 3, 4, 6] as DiceArray,
      })
      .mockResolvedValueOnce({
        gameId: "0xtestgame",
        turn: 1,
        rollCount: 3,
        dice: [1, 2, 3, 5, 6] as DiceArray,
      });

    const firstRender = renderBattleClient();
    await user.click(await screen.findByRole("button", { name: /^ROLL\(3\/3\)$/ }));
    expect(rollDiceMock).toHaveBeenCalledTimes(1);
    expect(rollDiceMock).toHaveBeenCalledWith({
      gameId: "0xtestgame",
      player: INITIAL_SEED.smartAccount,
    });
    firstRender.unmount();

    window.sessionStorage.clear();
    storeSnapshot(
      createHydratedState({
        dice: [1, 2, 3, 4, 5],
        rollCount: 1,
      }),
    );

    const secondRender = renderBattleClient();
    await user.click(await screen.findByRole("button", { name: /^ROLL\(2\/3\)$/ }));
    expect(rerollDiceMock).toHaveBeenNthCalledWith(1, {
      gameId: "0xtestgame",
      player: INITIAL_SEED.smartAccount,
      holdMask: 0,
    });
    secondRender.unmount();

    window.sessionStorage.clear();
    storeSnapshot(
      createHydratedState({
        dice: [1, 2, 3, 4, 6],
        rollCount: 2,
        locked: [true, false, true, false, false],
      }),
    );

    renderBattleClient();
    await user.click(await screen.findByRole("button", { name: /^ROLL\(1\/3\)$/ }));
    expect(rerollDiceMock).toHaveBeenNthCalledWith(2, {
      gameId: "0xtestgame",
      player: INITIAL_SEED.smartAccount,
      holdMask: 5,
    });
  }, 10000);

  it("removes standalone CAST buttons and never shows Rolling copy in the board UI", async () => {
    storeSnapshot(
      createHydratedState({
        dice: [6, 6, 6, 4, 1],
        rollCount: 1,
      }),
    );

    renderBattleClient();

    await screen.findByRole("button", { name: /Chance|机会/i });
    expect(screen.queryByRole("button", { name: "CAST" })).toBeNull();
    expect(screen.queryByText(/Rolling/i)).not.toBeInTheDocument();
  }, 10000);

  it("disables ROLL when a reroll phase has all five dice locked", async () => {
    storeSnapshot(
      createHydratedState({
        dice: [1, 2, 3, 4, 5],
        rollCount: 2,
        locked: [true, true, true, true, true],
      }),
    );

    renderBattleClient();

    expect(await screen.findByRole("button", { name: /^ROLL\(1\/3\)$/ })).toBeDisabled();
  });

  it("hydrates the battle snapshot from sessionStorage", async () => {
    storeSnapshot(
      createHydratedState({
        bossHpLocal: 88,
        bossHpChain: 88,
        dice: [6, 6, 1, 2, 3],
        rollCount: 2,
        locked: [true, false, false, false, true],
        usedSlots: {
          0: false,
          1: false,
          2: false,
          3: false,
          4: false,
          5: true,
          6: false,
          7: false,
          8: false,
          9: false,
          10: false,
          11: false,
          12: false,
        },
        slotResults: {
          0: null,
          1: null,
          2: null,
          3: null,
          4: null,
          5: {
            score: 12,
            damage: 47,
            bonusDamage: 35,
            dice: [6, 6, 1, 2, 3],
          },
          6: null,
          7: null,
          8: null,
          9: null,
          10: null,
          11: null,
          12: null,
        },
        upperSubtotalLocal: 63,
        upperBonusClaimedLocal: true,
      }),
    );

    renderBattleClient();

    expect(await screen.findByText(/BOSS 01/)).toBeInTheDocument();
    expect(screen.getByText("63/63")).toBeInTheDocument();
    expect(screen.getByText(/\+35/)).toBeInTheDocument();
    expect(screen.getByTestId("wallet-hud")).toBeInTheDocument();
    expect(screen.getByText("哥布林机巧萨满")).toBeInTheDocument();
    expect(screen.getByText("槽位 2/13")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /已锁定/ })).toHaveLength(2);
  });

  it("shows element-face dice before the first authoritative roll", async () => {
    renderBattleClient();

    await screen.findByRole("button", { name: /^ROLL\(3\/3\)$/ });

    expect(document.querySelector('img[src="/dice/dice-six-sides.png"]')).toBeNull();
    expect(document.querySelectorAll('img[src^="/dice/dice-"]')).not.toHaveLength(0);
  });

  it("opens a custom exit modal before returning to the homepage", async () => {
    const user = userEvent.setup();

    renderBattleClient();

    await user.click(await screen.findByRole("button", { name: "退出游戏" }));
    expect(screen.getByText("退出战斗")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确认" }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("casts exactly once after holding a row for 1.5 seconds", async () => {
    finalizeRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      player: INITIAL_SEED.smartAccount,
      rewardRecipient: INITIAL_SEED.rewardRecipient,
      turn: 1,
      finalRollCount: 1,
      dice: [6, 6, 6, 4, 1],
      expiry: Math.floor(Date.now() / 1000) + 600,
      chainId: 11155111,
      verifyingContract: "0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1",
      backendSig: `0x${"1".repeat(130)}`,
    });
    sendCastTurnUserOpMock.mockResolvedValue({
      txHash: `0x${"2".repeat(64)}`,
    });
    waitForTurnPlayedMock.mockResolvedValue({
      event: {
        eventName: "TurnPlayed",
        args: {
          gameId: "0xtestgame",
          player: INITIAL_SEED.smartAccount,
          rewardRecipient: INITIAL_SEED.rewardRecipient,
          turn: 1,
          slotId: 5,
          damage: 18,
          bossHpAfter: 132,
          upperSubtotalAfter: 18,
          usedSlotsBitmap: 32,
          won: false,
        },
      },
    });
    advanceRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 2,
      rollCount: 0,
    });
    confirmRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 2,
    });

    storeSnapshot(
      createHydratedState({
        dice: [6, 6, 6, 4, 1],
        rollCount: 1,
      }),
    );

    renderBattleClient();
    const row = await screen.findByRole("button", { name: /火 \/ 六点/ });

    fireEvent.pointerDown(row);
    await new Promise((resolve) => window.setTimeout(resolve, 1600));

    await waitFor(() => {
      expect(finalizeRoundMock).toHaveBeenCalledTimes(1);
      expect(sendCastTurnUserOpMock).toHaveBeenCalledTimes(1);
      expect(waitForTurnPlayedMock).toHaveBeenCalledTimes(1);
      expect(advanceRoundMock).toHaveBeenCalledTimes(1);
      expect(confirmRoundMock).toHaveBeenCalledTimes(1);
    });
  }, 8000);

  it("shows row hover tooltips for score slots", async () => {
    const user = userEvent.setup();

    storeSnapshot(
      createHydratedState({
        dice: [1, 2, 3, 4, 5],
        rollCount: 1,
      }),
    );

    renderBattleClient();

    const row = await screen.findByRole("button", { name: /水 \/ 一点/ });
    await user.hover(row);

    expect(await screen.findByText("统计所有水元素骰面，累计成当前水系伤害。")).toBeInTheDocument();
  });

  it("shows a custom tooltip for the sync status lamp", async () => {
    const user = userEvent.setup();

    storeSnapshot(
      createHydratedState({
        pendingTxHash: `0x${"3".repeat(64)}`,
        syncStatus: "PENDING_CHAIN",
      }),
    );

    renderBattleClient();

    const syncChip = await screen.findByLabelText("同步状态说明");
    await user.hover(syncChip);

    expect(await screen.findByText("本地或后端已经领先链上，正在等待链上确认。")).toBeInTheDocument();
    expect(screen.getByText("上一回合仍在同步中，需等待确认完成后才能释放下一次技能。")).toBeInTheDocument();
  });

  it("explains blocked casting while the previous turn is still syncing", async () => {
    const user = userEvent.setup();

    storeSnapshot(
      createHydratedState({
        dice: [6, 6, 6, 4, 1],
        rollCount: 1,
        turn: 2,
        confirmedTurn: 1,
        pendingTxHash: `0x${"4".repeat(64)}`,
        syncStatus: "PENDING_CHAIN",
      }),
    );

    renderBattleClient();

    const row = await screen.findByRole("button", { name: /火 \/ 六点/ });
    await user.hover(row.closest(".battle-row-shell") as HTMLElement);

    expect(await screen.findByText("上一回合仍在同步中，需等待确认完成后才能释放下一次技能。")).toBeInTheDocument();
  });

  it("keeps second-round dice visible when the previous turn confirms later", async () => {
    const user = userEvent.setup();
    const turnPlayedDeferred = createDeferredPromise<{
      event: {
        eventName: "TurnPlayed";
        args: {
          gameId: "0xtestgame";
          player: typeof INITIAL_SEED.smartAccount;
          rewardRecipient: typeof INITIAL_SEED.rewardRecipient;
          turn: number;
          slotId: number;
          damage: number;
          bossHpAfter: number;
          upperSubtotalAfter: number;
          usedSlotsBitmap: number;
          won: boolean;
        };
      };
    }>();

    finalizeRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      player: INITIAL_SEED.smartAccount,
      rewardRecipient: INITIAL_SEED.rewardRecipient,
      turn: 1,
      finalRollCount: 1,
      dice: [6, 6, 6, 6, 6],
      expiry: Math.floor(Date.now() / 1000) + 600,
      chainId: 11155111,
      verifyingContract: "0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1",
      backendSig: `0x${"1".repeat(130)}`,
    });
    sendCastTurnUserOpMock.mockResolvedValue({
      txHash: `0x${"2".repeat(64)}`,
    });
    waitForTurnPlayedMock.mockImplementation(() => turnPlayedDeferred.promise);
    advanceRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 2,
      rollCount: 0,
    });
    confirmRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 2,
    });
    rollDiceMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 2,
      rollCount: 1,
      dice: [1, 1, 1, 1, 1] as DiceArray,
    });

    storeSnapshot(
      createHydratedState({
        dice: [6, 6, 6, 6, 6],
        rollCount: 1,
      }),
    );

    renderBattleClient();
    const row = await screen.findByRole("button", { name: /火 \/ 六点/ });

    fireEvent.pointerDown(row);
    await new Promise((resolve) => window.setTimeout(resolve, 1600));

    await waitFor(() => {
      expect(advanceRoundMock).toHaveBeenCalledTimes(1);
    });

    await user.click(await screen.findByRole("button", { name: /^ROLL\(3\/3\)$/ }));
    await waitFor(() => {
      expect(rollDiceMock).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByRole("button", { name: /^ROLL\(2\/3\)$/ }, { timeout: 2000 })).toBeInTheDocument();
    expect(document.querySelectorAll('img[src="/dice/dice-water.png"]')).toHaveLength(5);

    turnPlayedDeferred.resolve({
      event: {
        eventName: "TurnPlayed",
        args: {
          gameId: "0xtestgame",
          player: INITIAL_SEED.smartAccount,
          rewardRecipient: INITIAL_SEED.rewardRecipient,
          turn: 1,
          slotId: 5,
          damage: 30,
          bossHpAfter: 120,
          upperSubtotalAfter: 30,
          usedSlotsBitmap: 32,
          won: false,
        },
      },
    });

    await waitFor(() => {
      expect(confirmRoundMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: /^ROLL\(2\/3\)$/ })).toBeInTheDocument();
    });
    expect(document.querySelectorAll('img[src="/dice/dice-water.png"]')).toHaveLength(5);
    expect(document.querySelectorAll('img[src="/dice/dice-fire.png"]')).toHaveLength(0);
  }, 12000);

  it("shows the rollback modal when confirmed chain state mismatches optimistic local state", async () => {
    finalizeRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      player: INITIAL_SEED.smartAccount,
      rewardRecipient: INITIAL_SEED.rewardRecipient,
      turn: 1,
      finalRollCount: 1,
      dice: [6, 6, 6, 4, 1],
      expiry: Math.floor(Date.now() / 1000) + 600,
      chainId: 11155111,
      verifyingContract: "0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1",
      backendSig: `0x${"1".repeat(130)}`,
    });
    sendCastTurnUserOpMock.mockResolvedValue({
      txHash: `0x${"2".repeat(64)}`,
    });
    waitForTurnPlayedMock.mockResolvedValue({
      event: {
        eventName: "TurnPlayed",
        args: {
          gameId: "0xtestgame",
          player: INITIAL_SEED.smartAccount,
          rewardRecipient: INITIAL_SEED.rewardRecipient,
          turn: 1,
          slotId: 5,
          damage: 18,
          bossHpAfter: 149,
          upperSubtotalAfter: 18,
          usedSlotsBitmap: 32,
          won: false,
        },
      },
    });
    advanceRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 2,
      rollCount: 0,
    });
    confirmRoundMock.mockResolvedValue({
      gameId: "0xtestgame",
      turn: 2,
    });

    storeSnapshot(
      createHydratedState({
        dice: [6, 6, 6, 4, 1],
        rollCount: 1,
      }),
    );

    renderBattleClient();
    const row = await screen.findByRole("button", { name: /火 \/ 六点/ });

    fireEvent.pointerDown(row);
    await new Promise((resolve) => window.setTimeout(resolve, 1600));

    expect(await screen.findByRole("button", { name: "空间扭曲：回滚" })).toBeInTheDocument();
  }, 10000);
});
