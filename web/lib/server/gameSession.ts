import type { DiceArray, HexAddress } from "@/types/game";

export type BackendGameSession = {
  gameId: string;
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
  turn: number;
  rollCount: number;
  currentDice: DiceArray | null;
  finalized: boolean;
  createdAt: number;
  expiresAt: number;
};

export function createBackendGameSession(input: {
  gameId: string;
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
  now?: number;
}) {
  const now = input.now ?? Date.now();

  return {
    gameId: input.gameId,
    player: input.player,
    rewardRecipient: input.rewardRecipient,
    bossId: input.bossId,
    turn: 1,
    rollCount: 0,
    currentDice: null,
    finalized: false,
    createdAt: now,
    expiresAt: now + 2 * 60 * 60 * 1000,
  } satisfies BackendGameSession;
}
