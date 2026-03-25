import { SLOT_LABELS } from "@/lib/game/slots";

type ScoreBoardProps = {
  usedSlots: Record<number, boolean>;
};

export function ScoreBoard({ usedSlots }: ScoreBoardProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Slots</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Score Board</h2>

      <div className="mt-6 grid gap-3">
        {SLOT_LABELS.map((label, index) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3"
          >
            <span className="text-sm text-slate-200">{label}</span>
            <span
              className={
                usedSlots[index]
                  ? "text-xs uppercase tracking-[0.18em] text-amber-200"
                  : "text-xs uppercase tracking-[0.18em] text-slate-500"
              }
            >
              {usedSlots[index] ? "Used" : "Open"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
