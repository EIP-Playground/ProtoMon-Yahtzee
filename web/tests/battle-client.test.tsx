// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rollDiceMock = vi.fn();
const rerollDiceMock = vi.fn();
const advanceRoundMock = vi.fn();

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

vi.mock("@/lib/api/backend", () => ({
  rollDice: (...args: unknown[]) => rollDiceMock(...args),
  rerollDice: (...args: unknown[]) => rerollDiceMock(...args),
  advanceRound: (...args: unknown[]) => advanceRoundMock(...args),
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
    await user.click(await screen.findByRole("button", { name: "ROLL" }));
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
    await user.click(await screen.findByRole("button", { name: "ROLL" }));
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
    await user.click(await screen.findByRole("button", { name: "ROLL" }));
    expect(rerollDiceMock).toHaveBeenNthCalledWith(2, {
      gameId: "0xtestgame",
      player: "0x1111111111111111111111111111111111111111",
      holdMask: 5,
    });
  });

  it("shows 正在施法 during cast sync and never shows Rolling text", async () => {
    const user = userEvent.setup();
    let resolveAdvance: (() => void) | null = null;

    advanceRoundMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAdvance = () => resolve({ gameId: "0xtestgame", turn: 2, rollCount: 0 });
        }),
    );

    storeSnapshot(
      createHydratedState({
        dice: [6, 6, 6, 4, 1],
        rollCount: 1,
      }),
    );

    render(<BattleClient gameId="0xtestgame" />);

    const castButton = await screen.findByRole("button", { name: /Chance|机会/i });
    await user.click(castButton);

    expect(screen.getByRole("button", { name: "正在施法" })).toBeDisabled();
    expect(screen.queryByText(/Rolling/i)).not.toBeInTheDocument();

    resolveAdvance?.();

    await waitFor(() => expect(screen.getByRole("button", { name: "ROLL" })).toBeEnabled());
  });

  it("disables ROLL when a reroll phase has all five dice locked", async () => {
    storeSnapshot(
      createHydratedState({
        dice: [1, 2, 3, 4, 5],
        rollCount: 2,
        locked: [true, true, true, true, true],
      }),
    );

    render(<BattleClient gameId="0xtestgame" />);

    expect(await screen.findByRole("button", { name: "ROLL" })).toBeDisabled();
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

    expect(await screen.findByText("当前累计: 63 / 63")).toBeInTheDocument();
    expect(screen.getByText("已触发")).toBeInTheDocument();
    expect(screen.getByText("47 dmg")).toBeInTheDocument();
    expect(screen.getByText("骰面: 6 / 6 / 1 / 2 / 3")).toBeInTheDocument();
    expect(screen.getAllByText("本地 HP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("88").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已锁定")).toHaveLength(2);
  });
});
