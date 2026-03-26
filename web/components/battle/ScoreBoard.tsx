"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import {
  UPPER_BONUS_DAMAGE,
  UPPER_BONUS_TARGET,
  computeLocalScore,
} from "@/lib/game/scoring";
import { SLOT_DEFINITIONS } from "@/lib/game/slots";
import type { BattleState } from "@/types/game";

type ScoreBoardProps = {
  state: BattleState;
  isCasting: boolean;
  onCastSlot: (slotId: number) => void;
};

export function ScoreBoard({ state, isCasting, onCastSlot }: ScoreBoardProps) {
  const { messages } = useLocale();
  const upperBonusPreviewReady =
    state.dice !== null &&
    SLOT_DEFINITIONS.filter((slot) => slot.group === "upper" && !state.usedSlots[slot.id]).some(
      (slot) => computeLocalScore(slot.id, state.dice!, state).bonusDamage > 0,
    );

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
        {messages.battle.score.eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{messages.battle.score.title}</h2>

      <div className="mt-6 space-y-6">
        {(["upper", "lower"] as const).map((group) => (
          <div key={group}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {group === "upper"
                  ? messages.battle.score.upperSection
                  : messages.battle.score.lowerSection}
              </p>
              {group === "upper" ? (
                <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100">
                  {state.upperBonusClaimedLocal
                    ? messages.battle.score.bonusTriggered
                    : upperBonusPreviewReady
                      ? messages.battle.score.bonusReady
                      : messages.battle.score.bonusPending}
                </div>
              ) : null}
            </div>

            {group === "upper" ? (
              <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {messages.battle.score.upperBonusTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {messages.battle.score.upperBonusDescription(
                        UPPER_BONUS_TARGET,
                        UPPER_BONUS_DAMAGE,
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {messages.battle.score.status}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {state.upperBonusClaimedLocal
                        ? messages.battle.score.achieved
                        : messages.battle.score.notAchieved}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                  <p className="text-slate-300">
                    {messages.battle.score.currentSubtotal(
                      state.upperSubtotalLocal,
                      UPPER_BONUS_TARGET,
                    )}
                  </p>
                  <p className="text-amber-100">
                    {messages.battle.score.reward(UPPER_BONUS_DAMAGE)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              {SLOT_DEFINITIONS.filter((slot) => slot.group === group).map((slot) => {
                const isUsed = state.usedSlots[slot.id];
                const committed = state.slotResults[slot.id];
                const preview =
                  !isUsed && state.dice ? computeLocalScore(slot.id, state.dice, state) : null;
                const canCast = !!state.dice && !isUsed && !state.finished && !isCasting;

                return (
                  <button
                    type="button"
                    key={slot.key}
                    onClick={() => onCastSlot(slot.id)}
                    disabled={!canCast}
                    className={
                      isUsed
                        ? "flex items-center justify-between rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-left"
                        : "flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-left transition hover:border-cyan-200/40 disabled:cursor-not-allowed disabled:hover:border-white/10"
                    }
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {messages.battle.score.slotTitles[slot.key]}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {isUsed
                          ? messages.battle.score.committed(committed?.score ?? 0)
                          : preview
                            ? messages.battle.score.preview(preview.slotScore)
                            : messages.battle.score.rollFirst}
                      </p>
                      {isUsed && committed ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {messages.battle.score.diceRecord(committed.dice)}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          isUsed
                            ? "text-xs uppercase tracking-[0.18em] text-amber-200"
                            : "text-xs uppercase tracking-[0.18em] text-cyan-100"
                        }
                      >
                        {isUsed
                          ? messages.battle.score.used
                          : canCast
                            ? messages.battle.score.cast
                            : messages.battle.score.open}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {isUsed
                          ? messages.battle.score.damage(committed?.damage ?? 0)
                          : preview
                            ? messages.battle.score.damage(preview.totalDamage)
                            : "--"}
                      </p>
                      {isUsed && committed?.bonusDamage ? (
                        <p className="mt-1 text-xs text-amber-200">
                          {messages.battle.score.upperBonusTag(committed.bonusDamage)}
                        </p>
                      ) : null}
                      {!isUsed && preview && preview.bonusDamage > 0 ? (
                        <p className="mt-1 text-xs text-amber-200">
                          {messages.battle.score.upperBonusTag(preview.bonusDamage)}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
