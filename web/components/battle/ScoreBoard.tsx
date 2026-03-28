"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuLoaderCircle } from "react-icons/lu";

import { useLocale } from "@/components/providers/LocaleProvider";
import {
  ACTIVE_COMPANION_CONFIG,
  BATTLE_ELEMENT_ASC_ORDER,
  BATTLE_ELEMENT_VISUALS,
  BATTLE_SCORE_TOOLTIP_META,
  BATTLE_SKILL_META,
} from "@/lib/battle/config";
import {
  UPPER_BONUS_DAMAGE,
  UPPER_BONUS_TARGET,
  computeLocalScore,
} from "@/lib/game/scoring";
import { SLOT_DEFINITIONS } from "@/lib/game/slots";
import type { BattleScoreTooltipCopy } from "@/lib/i18n/messages";
import type { BattleState } from "@/types/game";

type ScoreBoardProps = {
  state: BattleState;
  castingSlotId: number | null;
  castFx: {
    key: number;
    slotId: number;
    damage: number;
    kind: "element" | "skill";
  } | null;
  isCasting: boolean;
  onCastSlot: (slotId: number) => void;
};

const HOLD_DURATION_MS = 1000;
const HOLD_PROGRESS_TICK_MS = 16;
const HOLD_REVERT_MS = 280;

type HoldPhase = "holding" | "reverting" | "casting";

type HoldState = {
  slotId: number;
  progress: number;
  phase: HoldPhase;
};

type RowTooltipState = {
  key: string;
  title: string;
  content: BattleScoreTooltipCopy;
  meta: (typeof BATTLE_SCORE_TOOLTIP_META)[keyof typeof BATTLE_SCORE_TOOLTIP_META];
  anchorLeft: number;
  anchorTop: number;
  placement: "above" | "below";
};

function spellLabel(raw: string, locale: "zh-CN" | "en") {
  return locale === "zh-CN" ? `【${raw}】` : `[${raw}]`;
}

function tooltipFixedDamageLabel(locale: "zh-CN" | "en", fixedDamage: number) {
  return locale === "zh-CN" ? `固定 ${fixedDamage}` : `Fixed ${fixedDamage}`;
}

export function ScoreBoard({
  state,
  castingSlotId,
  castFx,
  isCasting,
  onCastSlot,
}: ScoreBoardProps) {
  const { locale, messages } = useLocale();
  const [holdState, setHoldState] = useState<HoldState | null>(null);
  const [rowTooltip, setRowTooltip] = useState<RowTooltipState | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const revertIntervalRef = useRef<number | null>(null);
  const holdStateRef = useRef<HoldState | null>(null);
  const stateRef = useRef(state);
  const isCastingRef = useRef(isCasting);
  const onCastSlotRef = useRef(onCastSlot);

  const setSyncedHoldState = (nextState: HoldState | null) => {
    holdStateRef.current = nextState;
    setHoldState(nextState);
  };

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    isCastingRef.current = isCasting;
  }, [isCasting]);

  useEffect(() => {
    onCastSlotRef.current = onCastSlot;
  }, [onCastSlot]);

  function clearTimers() {
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (revertIntervalRef.current !== null) {
      window.clearInterval(revertIntervalRef.current);
      revertIntervalRef.current = null;
    }
  }

  function startRevert(slotId: number, startProgress: number) {
    clearTimers();
    setSyncedHoldState({
      slotId,
      progress: startProgress,
      phase: "reverting",
    });

    let elapsedMs = 0;

    revertIntervalRef.current = window.setInterval(() => {
      const current = holdStateRef.current;

      if (!current || current.slotId !== slotId || current.phase !== "reverting") {
        return;
      }

      elapsedMs += HOLD_PROGRESS_TICK_MS;
      const nextProgress = Math.max(0, startProgress * (1 - elapsedMs / HOLD_REVERT_MS));

      if (nextProgress <= 0) {
        clearTimers();
        setSyncedHoldState(null);
        return;
      }

      setSyncedHoldState({
        slotId,
        progress: nextProgress,
        phase: "reverting",
      });
    }, HOLD_PROGRESS_TICK_MS);
  }

  function beginHold(slotId: number) {
    if (!state.dice || state.usedSlots[slotId] || state.finished || isCasting) {
      return;
    }

    clearTimers();
    let elapsedMs = 0;
    setSyncedHoldState({
      slotId,
      progress: 0,
      phase: "holding",
    });

    holdIntervalRef.current = window.setInterval(() => {
      const current = holdStateRef.current;

      if (!current || current.slotId !== slotId || current.phase !== "holding") {
        return;
      }

      elapsedMs += HOLD_PROGRESS_TICK_MS;
      const progress = Math.min(1, elapsedMs / HOLD_DURATION_MS);

      setSyncedHoldState({
        slotId,
        progress,
        phase: "holding",
      });
    }, HOLD_PROGRESS_TICK_MS);

    holdTimeoutRef.current = window.setTimeout(() => {
      clearTimers();

      const currentState = stateRef.current;

      if (
        !currentState.dice ||
        currentState.usedSlots[slotId] ||
        currentState.finished ||
        isCastingRef.current
      ) {
        setSyncedHoldState(null);
        return;
      }

      setSyncedHoldState({
        slotId,
        progress: 1,
        phase: "casting",
      });
      onCastSlotRef.current(slotId);
    }, HOLD_DURATION_MS);
  }

  function cancelHold(slotId: number) {
    const current = holdStateRef.current;

    if (!current || current.slotId !== slotId || current.phase !== "holding") {
      return;
    }

    startRevert(slotId, current.progress);
  }

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!holdState || holdState.phase !== "casting") {
      return;
    }

    const rowCasting = isCasting && castingSlotId === holdState.slotId;

    if (rowCasting) {
      return;
    }

    if (!state.usedSlots[holdState.slotId]) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (
        holdStateRef.current?.slotId === holdState.slotId &&
        holdStateRef.current.phase === "casting"
      ) {
        setSyncedHoldState(null);
      }
    }, 240);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [castingSlotId, holdState, isCasting, state.usedSlots]);

  const upperRows = useMemo(
    () =>
      BATTLE_ELEMENT_ASC_ORDER.map((diceValue) => {
        const visual = BATTLE_ELEMENT_VISUALS[diceValue];
        const slot = SLOT_DEFINITIONS[visual.slotId];
        const committed = state.slotResults[slot.id];
        const preview =
          !state.usedSlots[slot.id] && state.dice
            ? computeLocalScore(slot.id, state.dice, state)
            : null;
        const damageValue = committed
          ? committed.damage - committed.bonusDamage
          : preview
            ? preview.totalDamage - preview.bonusDamage
            : 0;
        const percent = Math.max(0, Math.min(100, (damageValue / visual.maxScore) * 100));

        return {
          slot,
          visual,
          damageValue,
          percent,
          committed,
          preview,
          used: state.usedSlots[slot.id],
          selected: state.selectedSlotId === slot.id || castingSlotId === slot.id,
          impacted: castFx?.slotId === slot.id && castFx.kind === "element",
        };
      }),
    [castFx, castingSlotId, state],
  );

  const rewardProgress = Math.max(
    0,
    Math.min(100, (state.upperSubtotalLocal / UPPER_BONUS_TARGET) * 100),
  );
  const destinyValueByDiceValue = useMemo(
    () =>
      new Map(
        ACTIVE_COMPANION_CONFIG.destinyLines.map((line) => [line.diceValue, line.value] as const),
      ),
    [],
  );

  const skillRows = useMemo(
    () =>
      BATTLE_SKILL_META.map((meta) => {
        const slot = SLOT_DEFINITIONS[meta.slotId];
        const committed = state.slotResults[slot.id];
        const preview =
          !state.usedSlots[slot.id] && state.dice
            ? computeLocalScore(slot.id, state.dice, state)
            : null;
        const damageValue = committed?.damage ?? preview?.totalDamage ?? 0;

        return {
          meta,
          slot,
          damageValue,
          used: state.usedSlots[slot.id],
          selected: state.selectedSlotId === slot.id || castingSlotId === slot.id,
          impacted: castFx?.slotId === slot.id && castFx.kind === "skill",
        };
      }),
    [castFx, castingSlotId, state],
  );

  function openRowTooltip(
    key: string,
    title: string,
    content: BattleScoreTooltipCopy,
    meta: (typeof BATTLE_SCORE_TOOLTIP_META)[keyof typeof BATTLE_SCORE_TOOLTIP_META],
    target: HTMLElement,
  ) {
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 272;
    const edgePadding = 16;
    const gap = 10;
    const left = Math.max(
      edgePadding,
      Math.min(rect.right - tooltipWidth, window.innerWidth - tooltipWidth - edgePadding),
    );
    const prefersBelow = rect.top < 164;

    setRowTooltip({
      key,
      title,
      content,
      meta,
      anchorLeft: left,
      anchorTop: prefersBelow ? rect.bottom + gap : rect.top - gap,
      placement: prefersBelow ? "below" : "above",
    });
  }

  function closeRowTooltip(key: string) {
    setRowTooltip((current) => (current?.key === key ? null : current));
  }

  const tooltipGroups =
    rowTooltip?.meta.exampleGroups ??
    (rowTooltip?.meta.iconDiceValues ? [rowTooltip.meta.iconDiceValues] : []);

  return (
    <aside className="battle-command-panel pixel-rounded-lg flex h-full flex-col overflow-hidden border-[4px] border-[#545250] bg-[rgba(135,132,129,0.88)] p-[9px] shadow-[0_14px_24px_rgba(10,15,22,0.18)]">
      <section className="battle-command-block">
        <p className="battle-command-title">ELEMENTS</p>

        <div className="mt-[2px] space-y-1">
          {upperRows.map((row) => {
            const canSelect = !row.used && !state.finished && !isCasting && !!state.dice;
            const rowHoldState = holdState?.slotId === row.slot.id ? holdState : null;
            const rowCasting =
              rowHoldState?.phase === "casting" || (isCasting && castingSlotId === row.slot.id);
            const showUsed = row.used && !rowCasting;
            const tooltipKey = `slot-${row.slot.id}`;

            return (
              <div
                key={row.slot.id}
                className={[
                  "battle-row-shell pixel-rounded-md px-[7px] py-[5px]",
                  rowHoldState ? "battle-row-selected" : "",
                  rowHoldState?.phase === "holding" ? "battle-row-arming" : "",
                  row.used ? "battle-row-used" : "",
                  row.impacted ? "battle-row-hit" : "",
                ].join(" ")}
                onMouseEnter={(event) =>
                  openRowTooltip(
                    tooltipKey,
                    messages.battle.score.slotTitles[row.slot.key],
                    messages.battle.score.slotHints[row.slot.key],
                    BATTLE_SCORE_TOOLTIP_META[row.slot.key],
                    event.currentTarget,
                  )
                }
                onMouseLeave={() => closeRowTooltip(tooltipKey)}
                onFocusCapture={(event) => {
                  const target = event.currentTarget as HTMLElement;
                  openRowTooltip(
                    tooltipKey,
                    messages.battle.score.slotTitles[row.slot.key],
                    messages.battle.score.slotHints[row.slot.key],
                    BATTLE_SCORE_TOOLTIP_META[row.slot.key],
                    target,
                  );
                }}
                onBlurCapture={() => closeRowTooltip(tooltipKey)}
              >
                {rowHoldState ? (
                  <div
                    className="battle-hold-fill"
                    style={{ width: `${Math.round(rowHoldState.progress * 100)}%` }}
                  />
                ) : null}
                <button
                  type="button"
                  aria-label={messages.battle.score.slotTitles[row.slot.key]}
                  disabled={!canSelect}
                  onPointerDown={() => beginHold(row.slot.id)}
                  onPointerUp={() => cancelHold(row.slot.id)}
                  onPointerLeave={() => cancelHold(row.slot.id)}
                  onPointerCancel={() => cancelHold(row.slot.id)}
                  onKeyDown={(event) => {
                    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                      event.preventDefault();
                      beginHold(row.slot.id);
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      cancelHold(row.slot.id);
                    }
                  }}
                  className="relative z-[1] flex min-h-[1.86rem] w-full items-center text-left disabled:cursor-not-allowed"
                >
                  <div className="flex w-full items-center gap-2">
                    <img
                      src={row.visual.iconSrc}
                      alt={messages.battle.elementLabels[row.visual.diceValue]}
                      className="battle-entry-icon"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="battle-element-bar">
                        <div
                          className={row.impacted ? "battle-element-fill battle-element-fill-hit" : "battle-element-fill"}
                          style={{
                            width: `${row.percent}%`,
                            backgroundColor: row.visual.color,
                          }}
                        />
                        <span className={row.impacted ? "battle-element-value battle-element-value-hit" : "battle-element-value"}>
                          {row.damageValue}
                        </span>
                      </div>
                    </div>
                    {rowCasting ? (
                      <span className="battle-row-loading" aria-label={messages.battle.dice.castingButton}>
                        <LuLoaderCircle className="animate-spin" aria-hidden="true" />
                      </span>
                    ) : null}
                    {showUsed ? <span className="battle-used-badge">Used</span> : null}
                  </div>
                </button>
              </div>
            );
          })}

          <div
            className="battle-reward-row pixel-rounded-md"
            onMouseEnter={(event) =>
              openRowTooltip(
                "reward-row",
                messages.battle.score.upperBonusTitle,
                messages.battle.score.rewardHint,
                BATTLE_SCORE_TOOLTIP_META.reward,
                event.currentTarget,
              )
            }
            onMouseLeave={() => closeRowTooltip("reward-row")}
          >
            <img
              src="/skills/awakening-energy-icon.png"
              alt={locale === "zh-CN" ? "觉醒奖励" : "Awakening Reward"}
              className="battle-entry-icon"
            />
            <div className="min-w-0 flex-1">
              <div className="battle-element-bar">
                <div
                  className="battle-element-fill"
                  style={{
                    width: `${rewardProgress}%`,
                    background: "linear-gradient(90deg,#ffd556_0%,#ff8c39_100%)",
                  }}
                />
                <span className="battle-element-value">
                  {state.upperSubtotalLocal}/{UPPER_BONUS_TARGET}
                </span>
              </div>
            </div>
            <span className="battle-reward-tag">+{UPPER_BONUS_DAMAGE}</span>
          </div>
        </div>
      </section>

      <section className="battle-command-block mt-1 min-h-0 flex-1">
        <p className="battle-command-title">SPELLS</p>

        <div className="mt-[2px] space-y-1">
          {skillRows.map((row) => {
            const canSelect = !row.used && !state.finished && !isCasting && !!state.dice;
            const rowHoldState = holdState?.slotId === row.slot.id ? holdState : null;
            const rowCasting =
              rowHoldState?.phase === "casting" || (isCasting && castingSlotId === row.slot.id);
            const showUsed = row.used && !rowCasting;
            const tooltipKey = `slot-${row.slot.id}`;

            return (
              <div
                key={row.slot.id}
                className={[
                  "battle-row-shell pixel-rounded-md relative px-[7px] py-[5px]",
                  rowHoldState ? "battle-row-selected" : "",
                  rowHoldState?.phase === "holding" ? "battle-row-arming" : "",
                  row.used ? "battle-row-used" : "",
                  row.impacted ? "battle-row-hit" : "",
                ].join(" ")}
                onMouseEnter={(event) =>
                  openRowTooltip(
                    tooltipKey,
                    messages.battle.score.slotTitles[row.slot.key],
                    messages.battle.score.slotHints[row.slot.key],
                    BATTLE_SCORE_TOOLTIP_META[row.slot.key],
                    event.currentTarget,
                  )
                }
                onMouseLeave={() => closeRowTooltip(tooltipKey)}
                onFocusCapture={(event) => {
                  const target = event.currentTarget as HTMLElement;
                  openRowTooltip(
                    tooltipKey,
                    messages.battle.score.slotTitles[row.slot.key],
                    messages.battle.score.slotHints[row.slot.key],
                    BATTLE_SCORE_TOOLTIP_META[row.slot.key],
                    target,
                  );
                }}
                onBlurCapture={() => closeRowTooltip(tooltipKey)}
              >
                {rowHoldState ? (
                  <div
                    className="battle-hold-fill"
                    style={{ width: `${Math.round(rowHoldState.progress * 100)}%` }}
                  />
                ) : null}
                <button
                  type="button"
                  aria-label={messages.battle.score.slotTitles[row.slot.key]}
                  disabled={!canSelect}
                  onPointerDown={() => beginHold(row.slot.id)}
                  onPointerUp={() => cancelHold(row.slot.id)}
                  onPointerLeave={() => cancelHold(row.slot.id)}
                  onPointerCancel={() => cancelHold(row.slot.id)}
                  onKeyDown={(event) => {
                    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                      event.preventDefault();
                      beginHold(row.slot.id);
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      cancelHold(row.slot.id);
                    }
                  }}
                  className="relative z-[1] flex min-h-[1.96rem] w-full items-center text-left disabled:cursor-not-allowed"
                >
                  <div className="flex w-full items-center gap-2">
                    <img
                      src={row.meta.iconSrc}
                      alt={messages.battle.score.slotTitles[row.slot.key]}
                      className="battle-entry-icon"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-h-[1.72rem] items-center justify-between gap-2">
                        <p className="battle-spell-label">
                          {spellLabel(messages.battle.score.slotTitles[row.slot.key], locale)}
                        </p>
                        <span className={row.impacted ? "battle-spell-damage battle-spell-damage-hit" : "battle-spell-damage"}>
                          {row.damageValue}
                        </span>
                      </div>
                    </div>
                    {rowCasting ? (
                      <span className="battle-row-loading" aria-label={messages.battle.dice.castingButton}>
                        <LuLoaderCircle className="animate-spin" aria-hidden="true" />
                      </span>
                    ) : null}
                    {showUsed ? <span className="battle-used-badge">Used</span> : null}
                  </div>
                </button>

                {row.impacted ? (
                  <span key={castFx?.key} className="battle-row-damage-pop pixel-font">
                    -{row.damageValue}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
      {rowTooltip && typeof document !== "undefined"
        ? createPortal(
            <div
              className="battle-row-tooltip pixel-rounded-md pixel-panel pointer-events-none fixed z-[160] max-w-[16rem] px-3 py-2 text-left text-[#fff8d1] shadow-[0_18px_32px_rgba(7,12,20,0.34)]"
              style={{
                top: `${rowTooltip.anchorTop}px`,
                left: `${rowTooltip.anchorLeft}px`,
                transform: rowTooltip.placement === "above" ? "translateY(-100%)" : "none",
              }}
            >
              <p className="battle-row-tooltip-title pixel-font">{rowTooltip.title}</p>
              <p className="battle-row-tooltip-body pixel-font mt-1">{rowTooltip.content.summary}</p>
              {rowTooltip.content.detail ? (
                <p className="battle-row-tooltip-body pixel-font mt-1">{rowTooltip.content.detail}</p>
              ) : null}
              {rowTooltip.meta.fixedDamage ? (
                <div className="mt-2">
                  <span className="battle-tooltip-chip pixel-font">
                    {tooltipFixedDamageLabel(locale, rowTooltip.meta.fixedDamage)} DMG
                  </span>
                </div>
              ) : null}
              {tooltipGroups.length > 0 ? (
                <div className="mt-2.5">
                  {rowTooltip.content.exampleLabel ? (
                    <p className="battle-row-tooltip-caption pixel-font">{rowTooltip.content.exampleLabel}</p>
                  ) : null}
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {tooltipGroups.map((group, groupIndex) => (
                      <div key={`${rowTooltip.key}-group-${groupIndex}`} className="battle-tooltip-icon-row">
                        {group.map((diceValue, iconIndex) => {
                          const visual = BATTLE_ELEMENT_VISUALS[diceValue];
                          const destinyValue = destinyValueByDiceValue.get(diceValue);

                          return (
                            <span
                              key={`${rowTooltip.key}-${groupIndex}-${diceValue}-${iconIndex}`}
                              className="battle-tooltip-icon-chip"
                            >
                              <img
                                src={visual.iconSrc}
                                alt={messages.battle.elementLabels[diceValue]}
                                className="battle-tooltip-element-icon"
                              />
                              {rowTooltip.meta.showDestinyValues && destinyValue !== undefined ? (
                                <span className="battle-tooltip-icon-value pixel-font">{destinyValue}</span>
                              ) : null}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </aside>
  );
}
