import type { DiceArray, DiceValue } from "@/types/game";

function randomDiceValue(): DiceValue {
  return (Math.floor(Math.random() * 6) + 1) as DiceValue;
}

export function generateDice(): DiceArray {
  return [
    randomDiceValue(),
    randomDiceValue(),
    randomDiceValue(),
    randomDiceValue(),
    randomDiceValue(),
  ];
}

export function rerollWithMask(currentDice: DiceArray, holdMask: number): DiceArray {
  return currentDice.map((value, index) => {
    return ((holdMask >> index) & 1) === 1 ? value : randomDiceValue();
  }) as DiceArray;
}
