export type HexAddress = `0x${string}`;

export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export type DiceArray = [DiceValue, DiceValue, DiceValue, DiceValue, DiceValue];

export type LockedDice = [boolean, boolean, boolean, boolean, boolean];

export type SyncStatus =
  | "LOCAL_APPLIED"
  | "PENDING_CHAIN"
  | "CONFIRMED"
  | "RETRYABLE_FAIL"
  | "ROLLBACK";

export type BossConfig = {
  bossId: number;
  name: string;
  targetHp: number;
};

export const BOSS_1: BossConfig = {
  bossId: 1,
  name: "Goblin Hacker",
  targetHp: 150,
};

export type DealerProof = {
  gameId: string;
  player: HexAddress;
  rewardRecipient: HexAddress;
  turn: number;
  finalRollCount: number;
  dice: DiceArray;
  expiry: number;
  chainId: number;
  verifyingContract: HexAddress;
  backendSig: HexAddress;
};

export type BattleState = {
  gameId: string;
  smartAccount: HexAddress;
  rewardRecipient: HexAddress;
  bossHpLocal: number;
  bossHpChain: number;
  turn: number;
  rollCount: number;
  dice: DiceArray | null;
  locked: LockedDice;
  usedSlots: Record<number, boolean>;
  upperSubtotalLocal: number;
  upperBonusClaimedLocal: boolean;
  syncStatus: SyncStatus;
  pendingTxHash?: HexAddress;
};

export type CreateGameSessionInput = {
  smartAccount: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
};

export type CreateGameSessionResult = {
  gameId: string;
  bossId: number;
  bossHp: number;
  turn: number;
};

export type RollDiceInput = {
  gameId: string;
  player: HexAddress;
};

export type RollDiceResult = {
  gameId: string;
  turn: number;
  rollCount: number;
  dice: DiceArray;
};

export type RerollDiceInput = {
  gameId: string;
  player: HexAddress;
  holdMask: number;
};

export type RerollDiceResult = {
  gameId: string;
  turn: number;
  rollCount: number;
  dice: DiceArray;
};

export type FinalizeRoundInput = {
  gameId: string;
  player: HexAddress;
  rewardRecipient: HexAddress;
};

export type TurnPlayedEvent = {
  eventName: "TurnPlayed";
  args: {
    gameId: string;
    player: HexAddress;
    rewardRecipient: HexAddress;
    turn: number;
    slotId: number;
    damage: number;
    bossHpAfter: number;
    upperSubtotalAfter: number;
    usedSlotsBitmap: number;
    won: boolean;
  };
};
