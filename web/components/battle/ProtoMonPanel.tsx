"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { DICE_ELEMENT_MAP } from "@/lib/game/dice";

const destinyProfile = [
  { value: 4, diceValue: 1 },
  { value: 3, diceValue: 2 },
  { value: 5, diceValue: 3 },
  { value: 2, diceValue: 4 },
  { value: 6, diceValue: 5 },
  { value: 4, diceValue: 6 },
] as const;

export function ProtoMonPanel() {
  const { messages } = useLocale();

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
        {messages.battle.protomon.eyebrow}
      </p>
      <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border border-cyan-200/20 bg-gradient-to-br from-cyan-300/20 via-slate-900 to-emerald-300/10 text-4xl">
            🧬
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{messages.battle.protomon.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{messages.battle.protomon.description}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>{messages.battle.protomon.destiny}</span>
            <span>{messages.battle.protomon.preset}</span>
          </div>

          {destinyProfile.map(({ value, diceValue }) => {
            const element = DICE_ELEMENT_MAP[diceValue];

            return (
              <div
                key={diceValue}
                className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-100">
                    <span className="text-lg">{element.emoji}</span>
                    <span>{messages.battle.elementLabels[diceValue]}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{value} / 6</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300"
                    style={{ width: `${(value / 6) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-dashed border-white/12 bg-slate-950/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {messages.battle.protomon.passiveSlot}
        </p>
        <p className="mt-2 text-sm text-slate-300">{messages.battle.protomon.passiveDescription}</p>
      </div>
    </section>
  );
}
