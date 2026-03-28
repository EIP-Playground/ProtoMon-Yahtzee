import type { Locale } from "@/lib/i18n/messages";
import type { DiceValue } from "@/types/game";

type LocalizedLabel = Record<Locale, string>;

export type ActiveCompanionConfig = {
  trainerName: LocalizedLabel;
  companionName: LocalizedLabel;
  companionHp: {
    current: number;
    max: number;
  };
  trainerImageSrc: string;
  companionImageSrc: string;
  stageBackgroundSrc: string;
  elementOrder: readonly DiceValue[];
  destinyLines: readonly {
    diceValue: DiceValue;
    value: number;
  }[];
};

export type PassiveItemConfig = {
  id: string;
  name: LocalizedLabel;
  description: LocalizedLabel;
  iconSrc: string;
};

export type SkillMeta = {
  slotId: number;
  iconSrc: string;
};

export type ElementVisual = {
  diceValue: DiceValue;
  slotId: number;
  iconSrc: string;
  diceFaceSrc: string;
  color: string;
  glow: string;
  maxScore: number;
};

export type BattleBossDisplayConfig = {
  bossIdLabel: string;
  name: LocalizedLabel;
};

export type BattleScenePlacement = {
  left: number;
  top: number;
  width: number;
  height?: number;
};

export const ACTIVE_COMPANION_CONFIG: ActiveCompanionConfig = {
  trainerName: {
    "zh-CN": "熊猫训练家",
    en: "Panda Trainer",
  },
  companionName: {
    "zh-CN": "Ignis Fox",
    en: "Ignis Fox",
  },
  companionHp: {
    current: 100,
    max: 100,
  },
  trainerImageSrc: "/home/hero-section/hero-panda-trainer.png",
  companionImageSrc: "/home/hero-section/hero-protomon.png",
  stageBackgroundSrc: "/home/home-bg/home-bg-1.webp",
  elementOrder: [6, 5, 4, 3, 2, 1] as const,
  destinyLines: [
    { diceValue: 6, value: 6 },
    { diceValue: 5, value: 5 },
    { diceValue: 4, value: 4 },
    { diceValue: 3, value: 3 },
    { diceValue: 2, value: 2 },
    { diceValue: 1, value: 1 },
  ] as const,
};

export const BATTLE_BOSS_DISPLAY: BattleBossDisplayConfig = {
  bossIdLabel: "BOSS 01",
  name: {
    "zh-CN": "哥布林机巧萨满",
    en: "Goblin Gear Shaman",
  },
};

export const BATTLE_ELEMENT_ASC_ORDER: readonly DiceValue[] = [1, 2, 3, 4, 5, 6] as const;

export const BATTLE_SCENE_LAYOUT = {
  trainer: { left: 3.2, top: 28.8, width: 15.2 },
  companion: { left: 19.6, top: 46.8, width: 12.9 },
  companionName: { left: 17.4, top: 38.6, width: 18.8 },
  companionHp: { left: 18.1, top: 42.6, width: 18.4 },
  boss: { left: 53.4, top: 31.2, width: 19.8 },
  bossName: { left: 49.4, top: 16.8, width: 24.8 },
  bossHp: { left: 50.1, top: 20.9, width: 24.1 },
  bossDamage: { left: 60.4, top: 27.2, width: 8.6 },
  passivePanel: { left: 2.6, top: 69.4, width: 27.4 },
  tray: { left: 37.6, top: 61.8, width: 34.6 },
  rollButton: { left: 44.2, top: 89.2, width: 18.4 },
  rightPanel: { left: 78.3, top: 4.8, width: 24.2, height: 95.2 },
} satisfies Record<string, BattleScenePlacement>;

export const BATTLE_PASSIVE_ITEMS: readonly PassiveItemConfig[] = [
  {
    id: "zhu-rong-fire-orb",
    name: {
      "zh-CN": "祝融火玉",
      en: "Zhurong Fire Orb",
    },
    description: {
      "zh-CN": "未来接入：火系伤害强化。",
      en: "Future hook: boosts fire-aligned damage.",
    },
    iconSrc: "/skills/passive-zhurong-fire-orb.png",
  },
  {
    id: "thunder-feather",
    name: {
      "zh-CN": "雷震子残羽",
      en: "Thunder Feather",
    },
    description: {
      "zh-CN": "未来接入：提高重掷节奏与连携。",
      en: "Future hook: improves reroll tempo and chaining.",
    },
    iconSrc: "/skills/passive-thunder-feather.png",
  },
  {
    id: "fortune-cat-claw",
    name: {
      "zh-CN": "招财灵猫爪",
      en: "Fortune Cat Claw",
    },
    description: {
      "zh-CN": "未来接入：金币收益与奖励修正。",
      en: "Future hook: adjusts coin income and reward gain.",
    },
    iconSrc: "/skills/passive-fortune-cat-claw.png",
  },
  {
    id: "invincible-star",
    name: {
      "zh-CN": "无敌星",
      en: "Invincible Star",
    },
    description: {
      "zh-CN": "未来接入：关键回合保护效果。",
      en: "Future hook: grants a protection burst on key turns.",
    },
    iconSrc: "/skills/passive-invincible-star.png",
  },
  {
    id: "greed-pouch",
    name: {
      "zh-CN": "贪婪之袋",
      en: "Greed Pouch",
    },
    description: {
      "zh-CN": "未来接入：最终金币结算加成。",
      en: "Future hook: adds a bonus to final coin settlement.",
    },
    iconSrc: "/skills/passive-greed-pouch.png",
  },
] as const;

export const BATTLE_SKILL_META: readonly SkillMeta[] = [
  { slotId: 6, iconSrc: "/skills/skill-three-kind.png" },
  { slotId: 7, iconSrc: "/skills/skill-four-kind.png" },
  { slotId: 8, iconSrc: "/skills/skill-full-house.png" },
  { slotId: 9, iconSrc: "/skills/skill-small-straight.png" },
  { slotId: 10, iconSrc: "/skills/skill-large-straight.png" },
  { slotId: 11, iconSrc: "/skills/skill-yahtzee.png" },
  { slotId: 12, iconSrc: "/skills/skill-chance.png" },
] as const;

export const BATTLE_ELEMENT_VISUALS: Record<DiceValue, ElementVisual> = {
  1: {
    diceValue: 1,
    slotId: 0,
    iconSrc: "/elements/icon-water.png",
    diceFaceSrc: "/dice/dice-water.png",
    color: "#4fb6ff",
    glow: "rgba(79,182,255,0.28)",
    maxScore: 5,
  },
  2: {
    diceValue: 2,
    slotId: 1,
    iconSrc: "/elements/icon-gold.png",
    diceFaceSrc: "/dice/dice-gold.png",
    color: "#f8d34f",
    glow: "rgba(248,211,79,0.28)",
    maxScore: 10,
  },
  3: {
    diceValue: 3,
    slotId: 2,
    iconSrc: "/elements/icon-earth.png",
    diceFaceSrc: "/dice/dice-earth.png",
    color: "#b97d4c",
    glow: "rgba(185,125,76,0.26)",
    maxScore: 15,
  },
  4: {
    diceValue: 4,
    slotId: 3,
    iconSrc: "/elements/icon-wind.png",
    diceFaceSrc: "/dice/dice-wind.png",
    color: "#c3f2ff",
    glow: "rgba(195,242,255,0.24)",
    maxScore: 20,
  },
  5: {
    diceValue: 5,
    slotId: 4,
    iconSrc: "/elements/icon-wood.png",
    diceFaceSrc: "/dice/dice-wood.png",
    color: "#59ce6e",
    glow: "rgba(89,206,110,0.26)",
    maxScore: 25,
  },
  6: {
    diceValue: 6,
    slotId: 5,
    iconSrc: "/elements/icon-fire.png",
    diceFaceSrc: "/dice/dice-fire.png",
    color: "#ff704f",
    glow: "rgba(255,112,79,0.28)",
    maxScore: 30,
  },
};
