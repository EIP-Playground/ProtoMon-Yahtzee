import type { BattleState } from "@/types/game";

type BossPanelProps = {
  state: BattleState;
};

export function BossPanel({ state }: BossPanelProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">Boss</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Goblin Hacker</h2>
          <p className="mt-2 text-sm text-slate-400">MVP 固定 Boss，目标血量 150。</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Turn</p>
          <p className="text-3xl font-semibold text-cyan-200">{state.turn}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Local HP</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.bossHpLocal}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chain HP</p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.bossHpChain}</p>
        </div>
      </div>
    </section>
  );
}
