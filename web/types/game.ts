export type HexString = `0x${string}`;

export type HexAddress = HexString;

export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export type DiceArray = [DiceValue, DiceValue, DiceValue, DiceValue, DiceValue];

export type StoredDiceValue = 0 | DiceValue;

export type StoredDiceArray = [
  StoredDiceValue,
  StoredDiceValue,
  StoredDiceValue,
  StoredDiceValue,
  StoredDiceValue,
];

export type LockedDice = [boolean, boolean, boolean, boolean, boolean];

export type BattleActionState = "idle" | "waiting";

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
  name: "Goblin Gear Shaman",
  targetHp: 150,
};

export type BattleSlotResult = {
  score: number;
  damage: number;
  bonusDamage: number;
  dice: DiceArray;
};

export type BattleSlotResults = Record<number, BattleSlotResult | null>;

export type DealerProof = {
  gameId: HexString;
  player: HexAddress;
  rewardRecipient: HexAddress;
  turn: number;
  finalRollCount: number;
  dice: DiceArray;
  expiry: number;
  chainId: number;
  verifyingContract: HexAddress;
  backendSig: HexString;
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
  selectedSlotId: number | null;
  usedSlots: Record<number, boolean>;
  slotResults: BattleSlotResults;
  upperSubtotalLocal: number;
  upperBonusClaimedLocal: boolean;
  syncStatus: SyncStatus;
  finished: boolean;
  won: boolean;
  diceActionState: BattleActionState;
  castActionState: BattleActionState;
  pendingTxHash?: HexString;
};

export type CreateGameSessionInput = {
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
};

export type CreateGameSessionResult = {
  gameId: HexString;
  player: HexAddress;
  rewardRecipient: HexAddress;
  bossId: number;
  bossHp: number;
  turn: number;
  rollCount: number;
};

export type RollDiceInput = {
  gameId: HexString;
  player: HexAddress;
};

export type RollDiceResult = {
  gameId: HexString;
  turn: number;
  rollCount: number;
  dice: DiceArray;
};

export type RerollDiceInput = {
  gameId: HexString;
  player: HexAddress;
  holdMask: number;
};

export type RerollDiceResult = {
  gameId: HexString;
  turn: number;
  rollCount: number;
  dice: DiceArray;
};

export type FinalizeRoundInput = {
  gameId: HexString;
  player: HexAddress;
  rewardRecipient: HexAddress;
};

export type AdvanceRoundInput = {
  gameId: HexString;
  player: HexAddress;
  nextTurn: number;
};

export type AdvanceRoundResult = {
  gameId: HexString;
  turn: number;
  rollCount: number;
};

export type TurnPlayedEvent = {
  eventName: "TurnPlayed";
  args: {
    gameId: HexString;
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
