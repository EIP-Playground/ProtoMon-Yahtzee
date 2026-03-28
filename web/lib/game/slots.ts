export const SLOT_LABELS = [
  "Upper1",
  "Upper2",
  "Upper3",
  "Upper4",
  "Upper5",
  "Upper6",
  "ThreeKind",
  "FourKind",
  "FullHouse",
  "SmallStraight",
  "LargeStraight",
  "Yahtzee",
  "Chance",
] as const;

export type SlotLabel = (typeof SLOT_LABELS)[number];

export const SLOT_DEFINITIONS = [
  { id: 0, key: "Upper1", title: "Water / Ones", group: "upper" },
  { id: 1, key: "Upper2", title: "Metal / Twos", group: "upper" },
  { id: 2, key: "Upper3", title: "Earth / Threes", group: "upper" },
  { id: 3, key: "Upper4", title: "Air / Fours", group: "upper" },
  { id: 4, key: "Upper5", title: "Wood / Fives", group: "upper" },
  { id: 5, key: "Upper6", title: "Fire / Sixes", group: "upper" },
  { id: 6, key: "ThreeKind", title: "Triple Strike", group: "lower" },
  { id: 7, key: "FourKind", title: "Quad Breaker", group: "lower" },
  { id: 8, key: "FullHouse", title: "Full House", group: "lower" },
  { id: 9, key: "SmallStraight", title: "Small Straight", group: "lower" },
  { id: 10, key: "LargeStraight", title: "Large Straight", group: "lower" },
  { id: 11, key: "Yahtzee", title: "Yahtzee", group: "lower" },
  { id: 12, key: "Chance", title: "Chance", group: "lower" },
] as const;

export const TOTAL_SLOTS = SLOT_DEFINITIONS.length;

export function isUpperSlot(slotId: number) {
  return slotId >= 0 && slotId <= 5;
}

export function bitmapToSlots(usedSlotsBitmap: number) {
  return SLOT_LABELS.reduce<Record<number, boolean>>((accumulator, _label, index) => {
    accumulator[index] = ((usedSlotsBitmap >> index) & 1) === 1;
    return accumulator;
  }, {});
}

export function slotsToBitmap(usedSlots: Record<number, boolean>) {
  return Object.entries(usedSlots).reduce((bitmap, [slotId, used]) => {
    if (!used) {
      return bitmap;
    }

    return bitmap | (1 << Number(slotId));
  }, 0);
}

export function createEmptyUsedSlots() {
  return SLOT_DEFINITIONS.reduce<Record<number, boolean>>((accumulator, slot) => {
    accumulator[slot.id] = false;
    return accumulator;
  }, {});
}

export function createEmptySlotResults() {
  return SLOT_DEFINITIONS.reduce<Record<number, null>>((accumulator, slot) => {
    accumulator[slot.id] = null;
    return accumulator;
  }, {});
}

export function getUsedSlotsCount(usedSlots: Record<number, boolean>) {
  return Object.values(usedSlots).filter(Boolean).length;
}
