import type { DiceArray, LockedDice } from "@/types/game";

type DiceBoardProps = {
  dice: DiceArray | null;
  locked: LockedDice;
  rollCount: number;
};

export function DiceBoard({ dice, locked, rollCount }: DiceBoardProps) {
  const values = dice ?? [0, 0, 0, 0, 0];

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Dice</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Roll Board</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 text-sm text-slate-300">
          rollCount: {rollCount}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        {values.map((value, index) => (
          <article
            key={`${index}-${value}`}
            className="rounded-[22px] border border-white/10 bg-slate-950/50 p-5 text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Die {index + 1}
            </p>
            <div className="mt-4 text-4xl font-semibold text-white">
              {value === 0 ? "?" : value}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              {locked[index] ? "Locked" : "Unlocked"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
