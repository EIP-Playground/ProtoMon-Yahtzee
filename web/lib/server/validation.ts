import type { DiceArray, HexAddress, HexString, StoredDiceArray } from "@/types/game";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export function isHexAddress(value: unknown): value is HexAddress {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isBytes32Hex(value: unknown): value is HexString {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function toDiceArray(dice: StoredDiceArray): DiceArray | null {
  if (dice.every((value) => value >= 1 && value <= 6)) {
    return dice as DiceArray;
  }

  return null;
}
