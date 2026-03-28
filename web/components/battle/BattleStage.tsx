"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import {
  ACTIVE_COMPANION_CONFIG,
  BATTLE_BOSS_DISPLAY,
  BATTLE_ELEMENT_VISUALS,
  BATTLE_SCENE_LAYOUT,
} from "@/lib/battle/config";
import type { BattleState } from "@/types/game";

type BattleCastFx = {
  key: number;
  slotId: number;
  damage: number;
  kind: "element" | "skill";
} | null;

function BattleHpBar({
  current,
  max,
  tone,
}: {
  current: number;
  max: number;
  tone: "player" | "boss";
}) {
  const ratio = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className="battle-hp-shell">
      <div
        className={tone === "boss" ? "battle-hp-fill-boss" : "battle-hp-fill-player"}
        style={{ width: `${ratio}%` }}
      />
      <span className="battle-hp-value pixel-font">
        {current}/{max}
      </span>
    </div>
  );
}

function BattleName({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <p className={["battle-name-text pixel-font truncate text-center", className].join(" ")}>{label}</p>
  );
}

export function BattleStage({
  state,
  castFx,
}: {
  state: BattleState;
  castFx: BattleCastFx;
}) {
  const { locale, messages } = useLocale();
  const trainerName = ACTIVE_COMPANION_CONFIG.trainerName[locale];
  const companionName = ACTIVE_COMPANION_CONFIG.companionName[locale];
  const bossName = BATTLE_BOSS_DISPLAY.name[locale];
  const companionHp = ACTIVE_COMPANION_CONFIG.companionHp;

  return (
    <div className="absolute inset-0">
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${BATTLE_SCENE_LAYOUT.trainer.left}%`,
          top: `${BATTLE_SCENE_LAYOUT.trainer.top}%`,
          width: `${BATTLE_SCENE_LAYOUT.trainer.width}%`,
        }}
      >
        <img
          src={ACTIVE_COMPANION_CONFIG.trainerImageSrc}
          alt={trainerName}
          className="h-auto w-full -scale-x-100 object-contain drop-shadow-[0_18px_18px_rgba(15,23,42,0.3)]"
        />
      </div>

      <div
        className="absolute pointer-events-none"
        style={{
          left: `${BATTLE_SCENE_LAYOUT.companionName.left}%`,
          top: `${BATTLE_SCENE_LAYOUT.companionName.top}%`,
          width: `${BATTLE_SCENE_LAYOUT.companionName.width}%`,
        }}
      >
        <BattleName label={companionName} />
      </div>

      <div
        className="group absolute pointer-events-auto"
        style={{
          left: `${BATTLE_SCENE_LAYOUT.companion.left}%`,
          top: `${BATTLE_SCENE_LAYOUT.companion.top}%`,
          width: `${BATTLE_SCENE_LAYOUT.companion.width}%`,
        }}
      >
        <img
          src={ACTIVE_COMPANION_CONFIG.companionImageSrc}
          alt={companionName}
          className="h-auto w-full object-contain drop-shadow-[0_16px_16px_rgba(15,23,42,0.34)]"
        />

        <div className="pixel-rounded-md pointer-events-none absolute left-[68%] top-[-24%] z-20 min-w-[170px] border-[3px] border-[#1d2430] bg-[rgba(13,19,31,0.94)] px-3 py-2 opacity-0 shadow-[0_12px_24px_rgba(8,13,22,0.34)] transition duration-150 group-hover:opacity-100">
          <p className="battle-destiny-title pixel-font mb-2 text-[10px] uppercase tracking-[0.12em] text-[#fff2c3]">
            {locale === "zh-CN" ? "六行天命值" : "Destiny Lines"}
          </p>
          <div className="space-y-1.5">
            {ACTIVE_COMPANION_CONFIG.destinyLines.map((line) => {
              const visual = BATTLE_ELEMENT_VISUALS[line.diceValue];
              return (
                <div key={`${line.diceValue}-${line.value}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={visual.iconSrc}
                      alt={messages.battle.elementLabels[line.diceValue]}
                      className="h-[14px] w-[14px] object-contain"
                    />
                    <span className="battle-destiny-label pixel-font text-[9px] uppercase tracking-[0.08em] text-white/88">
                      {messages.battle.elementLabels[line.diceValue]}
                    </span>
                  </div>
                  <span className="battle-destiny-value pixel-font text-[9px] uppercase tracking-[0.08em] text-[#fff2c3]">
                    {line.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="absolute pointer-events-none"
        style={{
          left: `${BATTLE_SCENE_LAYOUT.companionHp.left}%`,
          top: `${BATTLE_SCENE_LAYOUT.companionHp.top}%`,
          width: `${BATTLE_SCENE_LAYOUT.companionHp.width}%`,
        }}
      >
        <BattleHpBar current={companionHp.current} max={companionHp.max} tone="player" />
      </div>

      <div
        className="absolute pointer-events-none"
        style={{
          left: `${BATTLE_SCENE_LAYOUT.bossName.left}%`,
          top: `${BATTLE_SCENE_LAYOUT.bossName.top}%`,
          width: `${BATTLE_SCENE_LAYOUT.bossName.width}%`,
        }}
      >
        <BattleName label={bossName} />
      </div>

      <div
        className="absolute pointer-events-none"
        style={{
          left: `${BATTLE_SCENE_LAYOUT.boss.left}%`,
          top: `${BATTLE_SCENE_LAYOUT.boss.top}%`,
          width: `${BATTLE_SCENE_LAYOUT.boss.width}%`,
        }}
      >
        <img
          src="/enemy/boss-goblin-gear-shaman.png"
          alt={bossName}
          className="h-auto w-full object-contain drop-shadow-[0_22px_20px_rgba(15,23,42,0.4)]"
        />
      </div>

      <div
        className="absolute pointer-events-none"
        style={{
          left: `${BATTLE_SCENE_LAYOUT.bossHp.left}%`,
          top: `${BATTLE_SCENE_LAYOUT.bossHp.top}%`,
          width: `${BATTLE_SCENE_LAYOUT.bossHp.width}%`,
        }}
      >
        <BattleHpBar current={state.bossHpLocal} max={150} tone="boss" />
      </div>

      {castFx ? (
        <div
          key={castFx.key}
          className="pointer-events-none absolute"
          style={{
            left: `${BATTLE_SCENE_LAYOUT.bossDamage.left}%`,
            top: `${BATTLE_SCENE_LAYOUT.bossDamage.top}%`,
            width: `${BATTLE_SCENE_LAYOUT.bossDamage.width}%`,
          }}
        >
          <p className="battle-damage-pop pixel-font text-center text-[28px] uppercase text-[#ff6155]">
            -{castFx.damage}
          </p>
        </div>
      ) : null}
    </div>
  );
}
