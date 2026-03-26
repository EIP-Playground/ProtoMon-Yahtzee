"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { BattleState } from "@/types/game";

type BossPanelProps = {
  state: BattleState;
};

export function BossPanel({ state }: BossPanelProps) {
  const { messages } = useLocale();
  const hpPercent = Math.max(0, Math.min(100, (state.bossHpLocal / 150) * 100));
  const usedSlots = Object.values(state.usedSlots).filter(Boolean).length;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">
        {messages.battle.boss.eyebrow}
      </p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{messages.battle.boss.name}</h2>
          <p className="mt-2 text-sm text-slate-400">{messages.battle.boss.description}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {messages.battle.boss.turn}
          </p>
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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {messages.battle.boss.localHp}
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.bossHpLocal}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {messages.battle.boss.chainHp}
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{state.bossHpChain}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {messages.battle.boss.slotsUsed}
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{usedSlots} / 13</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-300">
        {state.finished
          ? state.won
            ? messages.battle.boss.defeated
            : messages.battle.boss.exhausted
          : messages.battle.boss.instructions}
      </div>
    </section>
  );
}
