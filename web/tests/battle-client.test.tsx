// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rollDiceMock = vi.fn();
const rerollDiceMock = vi.fn();
const advanceRoundMock = vi.fn();
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
  advanceRound: (...args: unknown[]) => advanceRoundMock(...args),
}));

vi.mock("@/components/battle/BattleHudControls", () => ({
  BattleHudControls: () => <div data-testid="wallet-hud">wallet-controls</div>,
}));

import { BattleClient } from "@/components/battle/BattleClient";
import { createInitialBattleState, saveBattleStateSnapshot } from "@/store/battleStore";
import type { BattleState, DiceArray } from "@/types/game";

function createHydratedState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    ...createInitialBattleState("0xtestgame", {
      smartAccount: "0x1111111111111111111111111111111111111111",
      rewardRecipient: "0x2222222222222222222222222222222222222222",
    }),
    ...overrides,
  };
}

function storeSnapshot(state: BattleState) {
  saveBattleStateSnapshot(state, window.sessionStorage);
}

describe("BattleClient", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    rollDiceMock.mockReset();
    rerollDiceMock.mockReset();
    advanceRoundMock.mockReset();
    pushMock.mockReset();
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

    const firstRender = render(<BattleClient gameId="0xtestgame" />);
    await user.click(await screen.findByRole("button", { name: /^ROLL\(3\/3\)$/ }));
    expect(rollDiceMock).toHaveBeenCalledTimes(1);
    firstRender.unmount();

    window.sessionStorage.clear();
    storeSnapshot(
      createHydratedState({
        dice: [1, 2, 3, 4, 5],
        rollCount: 1,
      }),
    );

    const secondRender = render(<BattleClient gameId="0xtestgame" />);
    await user.click(await screen.findByRole("button", { name: /^ROLL\(2\/3\)$/ }));
    expect(rerollDiceMock).toHaveBeenNthCalledWith(1, {
      gameId: "0xtestgame",
      player: "0x1111111111111111111111111111111111111111",
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

    render(<BattleClient gameId="0xtestgame" />);
    await user.click(await screen.findByRole("button", { name: /^ROLL\(1\/3\)$/ }));
    expect(rerollDiceMock).toHaveBeenNthCalledWith(2, {
      gameId: "0xtestgame",
      player: "0x1111111111111111111111111111111111111111",
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

    render(<BattleClient gameId="0xtestgame" />);

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

    render(<BattleClient gameId="0xtestgame" />);

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

    render(<BattleClient gameId="0xtestgame" />);

    expect(await screen.findByText(/BOSS 01/)).toBeInTheDocument();
    expect(screen.getByText("63/63")).toBeInTheDocument();
    expect(screen.getByText(/\+35/)).toBeInTheDocument();
    expect(screen.getByTestId("wallet-hud")).toBeInTheDocument();
    expect(screen.getByText("哥布林机巧萨满")).toBeInTheDocument();
    expect(screen.getByText("槽位 2/13")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /已锁定/ })).toHaveLength(2);
  });

  it("shows element-face dice before the first authoritative roll", async () => {
    render(<BattleClient gameId="0xtestgame" />);

    await screen.findByRole("button", { name: /^ROLL\(3\/3\)$/ });

    expect(document.querySelector('img[src="/dice/dice-six-sides.png"]')).toBeNull();
    expect(document.querySelectorAll('img[src^="/dice/dice-"]')).not.toHaveLength(0);
  });

  it("opens a custom exit modal before returning to the homepage", async () => {
    const user = userEvent.setup();

    render(<BattleClient gameId="0xtestgame" />);

    await user.click(await screen.findByRole("button", { name: "退出游戏" }));
    expect(screen.getByText("退出战斗")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "确认" }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("casts exactly once after holding a row for 1.5 seconds", async () => {
    advanceRoundMock.mockResolvedValue({});

    storeSnapshot(
      createHydratedState({
        dice: [6, 6, 6, 4, 1],
        rollCount: 1,
      }),
    );

    render(<BattleClient gameId="0xtestgame" />);
    const row = await screen.findByRole("button", { name: /火 \/ 六点/ });

    fireEvent.pointerDown(row);
    await new Promise((resolve) => window.setTimeout(resolve, 1600));

    await waitFor(() => {
      expect(advanceRoundMock).toHaveBeenCalledTimes(1);
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

    render(<BattleClient gameId="0xtestgame" />);

    const row = await screen.findByRole("button", { name: /水 \/ 一点/ });
    await user.hover(row);

    expect(await screen.findByText("统计所有水元素骰面，累计成当前水系伤害。")).toBeInTheDocument();
  });
});
