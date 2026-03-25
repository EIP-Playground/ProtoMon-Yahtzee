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
