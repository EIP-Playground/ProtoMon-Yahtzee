import type { BattleState } from "@/types/game";

type BossPanelProps = {
  state: BattleState;
};

export function BossPanel({ state }: BossPanelProps) {
  const hpPercent = Math.max(0, Math.min(100, (state.bossHpLocal / 150) * 100));
  const usedSlots = Object.values(state.usedSlots).filter(Boolean).length;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">Boss</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Goblin Hacker</h2>
          <p className="mt-2 text-sm text-slate-400">
            经典快艇骰子战斗包装。击倒 150 HP 的哥布林黑客。
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Turn</p>
          <p className="text-3xl font-semibold text-cyan-200">
            {state.finished ? "-" : state.turn}
          </p>
        </div>
      </div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-950/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-cyan-300 to-cyan-200 transition-all"
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Local HP</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.bossHpLocal}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chain HP</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.bossHpChain}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Slots Used</p>
          <p className="mt-2 text-3xl font-semibold text-white">{usedSlots} / 13</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
        {state.finished
          ? state.won
            ? "Boss defeated. The classic ProtoMon run is complete."
            : "All 13 slots are consumed. This run ends in defeat."
          : "Roll, lock, reroll, then click a slot to cast local damage."}
      </div>
    </section>
  );
}
