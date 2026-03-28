import { describe, expect, it } from "vitest";

import { createAnimatedDiceFrame, holdMaskToLocked, lockedToHoldMask } from "@/lib/game/dice";
import { computeLocalScore } from "@/lib/game/scoring";
import { createEmptyUsedSlots } from "@/lib/game/slots";
import {
  applyLocalCast,
  applyRollResult,
  createInitialBattleState,
  getBattleStorageKey,
  loadBattleStateSnapshot,
  saveBattleStateSnapshot,
  selectCastSlot,
  toggleLockedDie,
} from "@/store/battleStore";
import type { BattleState, DiceArray } from "@/types/game";

function withDice(
  dice: DiceArray,
  overrides: Partial<BattleState> = {},
): BattleState {
  return {
    ...createInitialBattleState("0xgame"),
    dice,
    rollCount: 1,
    ...overrides,
  };
}

describe("computeLocalScore", () => {
  it("scores upper slots", () => {
    const result = computeLocalScore(0, [1, 1, 3, 4, 6], withDice([1, 1, 3, 4, 6]));

    expect(result).toMatchObject({
      slotScore: 2,
      bonusDamage: 0,
      totalDamage: 2,
      nextUpperSubtotal: 2,
      nextUpperBonusClaimed: false,
    });
  });

  it("scores three and four of a kind", () => {
    expect(
      computeLocalScore(6, [2, 2, 2, 4, 5], withDice([2, 2, 2, 4, 5])).slotScore,
    ).toBe(15);
    expect(
      computeLocalScore(7, [6, 6, 6, 6, 1], withDice([6, 6, 6, 6, 1])).slotScore,
    ).toBe(25);
  });

  it("scores full house and straights", () => {
    expect(
      computeLocalScore(8, [3, 3, 3, 5, 5], withDice([3, 3, 3, 5, 5])).slotScore,
    ).toBe(25);
    expect(
      computeLocalScore(9, [1, 2, 3, 4, 6], withDice([1, 2, 3, 4, 6])).slotScore,
    ).toBe(30);
    expect(
      computeLocalScore(10, [2, 3, 4, 5, 6], withDice([2, 3, 4, 5, 6])).slotScore,
    ).toBe(40);
  });

  it("scores yahtzee and chance", () => {
    expect(
      computeLocalScore(11, [4, 4, 4, 4, 4], withDice([4, 4, 4, 4, 4])).slotScore,
    ).toBe(50);
    expect(
      computeLocalScore(12, [1, 3, 3, 5, 6], withDice([1, 3, 3, 5, 6])).slotScore,
    ).toBe(18);
  });

  it("returns zero for invalid lower patterns", () => {
    expect(
      computeLocalScore(8, [1, 1, 1, 1, 2], withDice([1, 1, 1, 1, 2])).slotScore,
    ).toBe(0);
    expect(
      computeLocalScore(10, [1, 2, 3, 4, 4], withDice([1, 2, 3, 4, 4])).slotScore,
    ).toBe(0);
  });

  it("triggers the upper bonus once", () => {
    const bonusResult = computeLocalScore(
      0,
      [1, 1, 3, 4, 5],
      withDice([1, 1, 3, 4, 5], {
        upperSubtotalLocal: 61,
      }),
    );

    expect(bonusResult).toMatchObject({
      slotScore: 2,
      bonusDamage: 35,
      totalDamage: 37,
      nextUpperSubtotal: 63,
      nextUpperBonusClaimed: true,
    });

    const noSecondBonus = computeLocalScore(
      5,
      [6, 6, 1, 2, 3],
      withDice([6, 6, 1, 2, 3], {
        upperSubtotalLocal: 63,
        upperBonusClaimedLocal: true,
      }),
    );

    expect(noSecondBonus.bonusDamage).toBe(0);
  });
});

describe("battleStore helpers", () => {
  it("applies the first backend roll and keeps later ROLL actions available", () => {
    const initialState = createInitialBattleState("0xgame");

    const nextState = applyRollResult(initialState, {
      dice: [2, 2, 3, 4, 5],
      rollCount: 1,
      turn: 1,
    });

    expect(nextState.dice).toEqual([2, 2, 3, 4, 5]);
    expect(nextState.locked).toEqual([false, false, false, false, false]);
    expect(nextState.rollCount).toBe(1);
  });

  it("keeps locked dice highlighted across rerolls", () => {
    const initialState = withDice([1, 1, 1, 1, 1], {
      locked: [true, true, false, false, false],
      rollCount: 2,
    });

    const nextState = applyRollResult(initialState, {
      dice: [2, 2, 3, 4, 5],
      rollCount: 2,
      turn: 1,
    });

    expect(nextState.dice).toEqual([2, 2, 3, 4, 5]);
    expect(nextState.locked).toEqual([true, true, false, false, false]);
    expect(nextState.rollCount).toBe(2);
  });

  it("toggles dice locks only during an active round", () => {
    const activeState = withDice([1, 2, 3, 4, 5]);
    expect(toggleLockedDie(activeState, 2).locked).toEqual([false, false, true, false, false]);
    expect(toggleLockedDie(createInitialBattleState("0xgame"), 2).locked).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("tracks the currently selected cast slot", () => {
    const state = withDice([1, 2, 3, 4, 5]);
    const usedSlots = createEmptyUsedSlots();
    usedSlots[9] = true;

    expect(selectCastSlot(state, 9).selectedSlotId).toBe(9);
    expect(
      selectCastSlot(
        withDice([1, 2, 3, 4, 5], {
          usedSlots,
        }),
        9,
      ).selectedSlotId,
    ).toBeNull();
  });

  it("applies local cast and keeps chain-confirmed state untouched until receipt", () => {
    const nextState = applyLocalCast(withDice([2, 2, 2, 4, 5], { selectedSlotId: 6 }), 6);

    expect(nextState.bossHpLocal).toBe(150 - 15);
    expect(nextState.bossHpChain).toBe(150);
    expect(nextState.usedSlots[6]).toBe(true);
    expect(nextState.slotResults[6]).toMatchObject({
      score: 15,
      damage: 15,
      bonusDamage: 0,
      dice: [2, 2, 2, 4, 5],
    });
    expect(nextState.selectedSlotId).toBeNull();
    expect(nextState.dice).toEqual([2, 2, 2, 4, 5]);
    expect(nextState.rollCount).toBe(1);
    expect(nextState.turn).toBe(1);
    expect(nextState.finished).toBe(false);
    expect(nextState.won).toBe(false);
  });

  it("finishes the run on boss kill", () => {
    const state = withDice([4, 4, 4, 4, 4], {
      bossHpLocal: 50,
      bossHpChain: 50,
    });

    const nextState = applyLocalCast(state, 11);

    expect(nextState.bossHpLocal).toBe(0);
    expect(nextState.finished).toBe(true);
    expect(nextState.won).toBe(true);
    expect(nextState.turn).toBe(1);
  });

  it("finishes the run as a loss on the thirteenth slot", () => {
    const usedSlots = createEmptyUsedSlots();
    for (let slotId = 0; slotId < 12; slotId += 1) {
      usedSlots[slotId] = true;
    }

    const state = withDice([1, 2, 3, 4, 5], {
      turn: 13,
      bossHpLocal: 100,
      bossHpChain: 100,
      usedSlots,
    });

    const nextState = applyLocalCast(state, 12);

    expect(nextState.finished).toBe(true);
    expect(nextState.won).toBe(false);
    expect(nextState.turn).toBe(13);
    expect(nextState.usedSlots[12]).toBe(true);
  });
});

describe("dice lock mask helpers", () => {
  it("converts locked dice to holdMask and back", () => {
    const locked = [true, false, true, true, false] as const;
    const mask = lockedToHoldMask([...locked]);

    expect(mask).toBe(13);
    expect(holdMaskToLocked(mask)).toEqual([true, false, true, true, false]);
  });

  it("keeps locked dice fixed in animated reroll frames", () => {
    const frame = createAnimatedDiceFrame(
      [6, 2, 5, 4, 3],
      [true, false, true, false, true],
      () => 0,
    );

    expect(frame).toEqual([6, 1, 5, 1, 3]);
  });
});

describe("battle snapshot persistence", () => {
  it("serializes and restores battle state snapshots through storage", () => {
    const state = withDice([6, 6, 1, 2, 3], {
      locked: [true, false, false, false, true],
      selectedSlotId: 9,
      upperSubtotalLocal: 63,
      upperBonusClaimedLocal: true,
    });

    const castState = applyLocalCast(state, 5);
    const storage = new Map<string, string>();
    const fakeStorage = {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
    };

    saveBattleStateSnapshot(castState, fakeStorage);
    const restoredState = loadBattleStateSnapshot("0xgame", fakeStorage);

    expect(storage.has(getBattleStorageKey("0xgame"))).toBe(true);
    expect(restoredState).toMatchObject({
      gameId: "0xgame",
      bossHpLocal: castState.bossHpLocal,
      usedSlots: castState.usedSlots,
      slotResults: castState.slotResults,
      upperSubtotalLocal: castState.upperSubtotalLocal,
      upperBonusClaimedLocal: true,
      selectedSlotId: null,
      diceActionState: "idle",
      castActionState: "idle",
    });
  });
});
