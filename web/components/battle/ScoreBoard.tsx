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
  const upperBonusPreviewReady =
    state.dice !== null &&
    SLOT_DEFINITIONS.filter((slot) => slot.group === "upper" && !state.usedSlots[slot.id]).some(
      (slot) => computeLocalScore(slot.id, state.dice!, state).bonusDamage > 0,
    );

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/6 p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Slots</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Score Board</h2>

      <div className="mt-6 space-y-6">
        {(["upper", "lower"] as const).map((group) => (
          <div key={group}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {group === "upper" ? "Upper Section" : "Lower Section"}
              </p>
              {group === "upper" ? (
                <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100">
                  {state.upperBonusClaimedLocal
                    ? "Bonus Triggered"
                    : upperBonusPreviewReady
                      ? "Bonus Ready"
                      : "Bonus Pending"}
                </div>
              ) : null}
            </div>

            {group === "upper" ? (
              <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">Upper Bonus</p>
                    <p className="mt-1 text-sm text-slate-400">
                      上半区累计达到 {UPPER_BONUS_TARGET} 分后，额外获得 {UPPER_BONUS_DAMAGE} dmg。
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {state.upperBonusClaimedLocal ? "已触发" : "未达成"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                  <p className="text-slate-300">
                    当前累计: {state.upperSubtotalLocal} / {UPPER_BONUS_TARGET}
                  </p>
                  <p className="text-amber-100">奖励: +{UPPER_BONUS_DAMAGE} dmg</p>
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
                      <p className="text-sm font-medium text-slate-100">{slot.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {isUsed
                          ? `Committed: ${committed?.score ?? 0} score`
                          : preview
                            ? `Preview: ${preview.slotScore} score`
                            : "Roll first to preview this slot"}
                      </p>
                      {isUsed && committed ? (
                        <p className="mt-1 text-xs text-slate-400">
                          Dice: {committed.dice.join(" / ")}
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
                        {isUsed ? "Used" : canCast ? "CAST" : "Open"}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {isUsed
                          ? `${committed?.damage ?? 0} dmg`
                          : preview
                            ? `${preview.totalDamage} dmg`
                            : "--"}
                      </p>
                      {isUsed && committed?.bonusDamage ? (
                        <p className="mt-1 text-xs text-amber-200">
                          +{committed.bonusDamage} upper bonus
                        </p>
                      ) : null}
                      {!isUsed && preview && preview.bonusDamage > 0 ? (
                        <p className="mt-1 text-xs text-amber-200">+35 upper bonus</p>
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
