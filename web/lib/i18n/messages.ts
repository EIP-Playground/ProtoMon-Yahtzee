import type { SlotLabel } from "@/lib/game/slots";
import type { DiceArray, DiceValue, SyncStatus } from "@/types/game";

export const SUPPORTED_LOCALES = ["zh-CN", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_STORAGE_KEY = "protomon:locale";

export type BattleScoreTooltipCopy = {
  summary: string;
  detail?: string;
  exampleLabel?: string;
};

type BattleSyncLampState = "READY" | "SYNCING" | "ERROR" | "ROLLBACK_REQUIRED";

type BattleFinishMessages = {
  victoryTitle: string;
  victoryBody: string;
  victoryReturn: string;
  victoryStay: string;
  defeatTitle: string;
  defeatBody: string;
  defeatRetry: string;
  defeatReturn: string;
  retrying: string;
};

type LocaleMessages = {
  common: {
    language: string;
    locales: Record<Locale, string>;
  };
  loading: {
    defaultTitle: string;
    defaultSubtitle: string;
    defaultLoadingLabel: string;
    defaultCompleteLabel: string;
    defaultMessages: readonly string[];
    tagline: string;
  };
  home: {
    sections: readonly string[];
    sectionBody: string;
    entrySubtitle: string;
    entryLoadingLabel: string;
    entryCompleteLabel: string;
    createSubtitle: string;
    createLoadingLabel: string;
    createCompleteLabel: string;
    createMessages: readonly string[];
    eyebrow: string;
    title: string;
    subtitle: string;
    reactiveHeadlinePrefix: string;
    reactiveHeadlineHighlight: string;
    reactiveHeadlineSuffix: string;
    slogan: string;
    description: string;
    demoPlayerLabel: string;
    startButtonIdle: string;
    startButtonBusy: string;
    startButtonCaption: string;
    dealerOnline: string;
    dealerLabel: string;
    dealerStates: Record<"idle" | "waiting" | "online" | "error", string>;
    walletLabel: string;
    walletPreparing: string;
    walletConnect: string;
    walletDesktopHint: string;
    walletWrongNetwork: string;
    walletSwitchNetwork: string;
    walletConnected: string;
    walletChainLabel: string;
    walletAccountLabel: string;
    backToTop: string;
    meetTitle: string;
    meetCards: readonly string[];
    alchemyTitle: string;
    alchemyWorkbench: string;
    alchemyCastPanel: string;
    crossChainTitle: string;
    reactiveNodeLabel: string;
    mainnetRewardLabel: string;
    crossChainCaption: string;
    footerTagline: string;
    footerCopyright: string;
    footerLeftLinks: readonly string[];
    footerRightLinks: readonly string[];
    errorCreateGame: string;
  };
  battle: {
    boardEyebrow: string;
    boardTitle: string;
    boardDescription: string;
    backToLobby: string;
    gameIdLabel: string;
    restoringSnapshot: string;
    restoredSnapshot: string;
    initialStatus: string;
    requestingDice: string;
    diceReceivedFirst: string;
    diceReceivedReroll: string;
    diceRequestFailed: string;
    finalCastWin: (damage: number) => string;
    finalCastLose: (damage: number) => string;
    castWithBonus: (damage: number, bonusDamage: number) => string;
    castNormal: (damage: number) => string;
    spellSyncComplete: (baseMessage: string) => string;
    localCastAdvanceFailed: (reason?: string) => string;
    boss: {
      eyebrow: string;
      name: string;
      description: string;
      turn: string;
      localHp: string;
      chainHp: string;
      slotsUsed: string;
      defeated: string;
      exhausted: string;
      instructions: string;
    };
    dice: {
      eyebrow: string;
      title: string;
      rollCountLabel: string;
      rollButton: string;
      castingButton: string;
      battleFinished: string;
      syncingCast: string;
      pendingChain: string;
      rolling: string;
      clickToStart: string;
      lockThenRoll: string;
      noRerolls: string;
      die: (index: number) => string;
      unknownFace: string;
      locked: string;
      unlocked: string;
    };
    score: {
      eyebrow: string;
      title: string;
      upperSection: string;
      lowerSection: string;
      bonusTriggered: string;
      bonusReady: string;
      bonusPending: string;
      upperBonusTitle: string;
      upperBonusDescription: (target: number, damage: number) => string;
      status: string;
      achieved: string;
      notAchieved: string;
      currentSubtotal: (subtotal: number, target: number) => string;
      reward: (damage: number) => string;
      committed: (score: number) => string;
      preview: (score: number) => string;
      rollFirst: string;
      diceRecord: (dice: DiceArray) => string;
      used: string;
      open: string;
      cast: string;
      damage: (amount: number) => string;
      upperBonusTag: (bonusDamage: number) => string;
      rewardHint: BattleScoreTooltipCopy;
      slotHints: Record<SlotLabel, BattleScoreTooltipCopy>;
      slotTitles: Record<SlotLabel, string>;
    };
    protomon: {
      eyebrow: string;
      title: string;
      description: string;
      destiny: string;
      preset: string;
      passiveSlot: string;
      passiveDescription: string;
    };
    session: {
      eyebrow: string;
      description: string;
    };
    finish: BattleFinishMessages;
      sync: {
        eyebrow: string;
        title: string;
        statusCopy: Record<SyncStatus, string>;
        lampCopy: Record<BattleSyncLampState, string>;
        lampTooltipLabel: string;
        castPendingHint: string;
        castSubmittingHint: string;
        rollbackTitle: string;
        rollbackBody: string;
        rollbackAction: string;
        pendingTxAssigned: (hash: string) => string;
      pendingTxMissing: string;
      debug: string;
      redisKey: (key: string) => string;
      latestDiceRtt: (rttMs: number | null) => string;
      storedFields: string;
    };
    elementLabels: Record<DiceValue, string>;
  };
};

export const MESSAGES: Record<Locale, LocaleMessages> = {
  "zh-CN": {
    common: {
      language: "语言",
      locales: {
        "zh-CN": "中文",
        en: "EN",
      },
    },
    loading: {
      defaultTitle: "PROTOMON",
      defaultSubtitle: "元素共鸣同步中",
      defaultLoadingLabel: "加载中…",
      defaultCompleteLabel: "完成！",
      defaultMessages: [
        "正在同步元素共鸣…",
        "校准炼金仪式回路…",
        "读取原型战斗数据…",
        "唤醒骰面核心…",
        "战场即将展开…",
      ],
      tagline: "FULLY ON-CHAIN. FULLY FUN.",
    },
    home: {
      sections: [
        "经典 13 槽快艇骰子",
        "后端权威 roll / reroll",
        "本地乐观 CAST 伤害",
        "轻 ProtoMon 战斗包装",
      ],
      sectionBody: "本轮聚焦经典快艇骰子体验，链上裁决和 session key 在后续阶段接入。",
      entrySubtitle: "站点连接建立中",
      entryLoadingLabel: "启动中…",
      entryCompleteLabel: "进入！",
      createSubtitle: "战斗房间锻造中",
      createLoadingLabel: "创建中…",
      createCompleteLabel: "房间就绪！",
      createMessages: [
        "正在锻造挑战房间…",
        "向 Upstash 发出开局请求…",
        "绑定链上战斗会话…",
        "注入 Boss 初始状态…",
        "为你展开第一场试炼…",
      ],
      eyebrow: "PROTO MON / ELEMENTAL ALCHEMY",
      title: "ProtoMon",
      subtitle: "ELEMENTAL ALCHEMY",
      reactiveHeadlinePrefix: "首款基于 ",
      reactiveHeadlineHighlight: "Reactive Network",
      reactiveHeadlineSuffix: " 驱动的无信任跨链肉鸽游戏",
      slogan: "体验在云，资产在链，快乐无限~",
      description:
        "经典快艇骰子主循环先跑起来，再轻度包上 ProtoMon 世界观。后端负责权威骰面，首页先做像素风入口与钱包接入。",
      demoPlayerLabel: "Demo player",
      startButtonIdle: "立即开战",
      startButtonBusy: "锻造对战中…",
      startButtonCaption: "ERC-4337 无感施法",
      dealerOnline: "Upstash 发牌器在线",
      dealerLabel: "Dealer Online",
      dealerStates: {
        idle: "待命中",
        waiting: "同步中",
        online: "在线",
        error: "异常",
      },
      walletLabel: "钱包",
      walletPreparing: "连接器启动中",
      walletConnect: "连接钱包",
      walletDesktopHint: "桌面端全模式",
      walletWrongNetwork: "网络不正确",
      walletSwitchNetwork: "切换网络",
      walletConnected: "已连接",
      walletChainLabel: "网络",
      walletAccountLabel: "账户",
      backToTop: "返回顶部",
      meetTitle: "认识 ProtoMons",
      meetCards: ["炎狐", "水甲龟", "幽电猫"],
      alchemyTitle: "掌握炼金术",
      alchemyWorkbench: "炼金工作台",
      alchemyCastPanel: "施法面板",
      crossChainTitle: "响应式跨链飞轮",
      reactiveNodeLabel: "响应节点",
      mainnetRewardLabel: "主网宝箱",
      crossChainCaption: "L2 数据桥就位，主网奖励跃迁待发。",
      footerTagline: "FULLY ON-CHAIN. FULLY FUN.",
      footerCopyright: "© 2026 EIP-Playground ProtoMon",
      footerLeftLinks: ["GitHub", "X"],
      footerRightLinks: ["Team"],
      errorCreateGame: "创建战斗房间失败。",
    },
    battle: {
      boardEyebrow: "经典战斗面板",
      boardTitle: "ProtoMon 快艇骰子战斗",
      boardDescription: "左侧预留 ProtoMon 与未来被动位，中间是战斗与掷骰流程，右侧固定放积分板。",
      backToLobby: "返回大厅",
      gameIdLabel: "gameId",
      restoringSnapshot: "正在恢复本地战斗快照…",
      restoredSnapshot: "已从当前标签页恢复本地战斗快照。",
      initialStatus: "第一次掷骰由后端权威生成；每次释放都会在链上完成结算。",
      requestingDice: "正在向云端发牌器请求权威骰面…",
      diceReceivedFirst: "已收到权威骰面。锁定想保留的骰子，然后再次按 ROLL。",
      diceReceivedReroll: "后端重掷已同步。已锁定的骰子会继续高亮，方便下一次决策。",
      diceRequestFailed: "骰面请求失败。",
      finalCastWin: (damage) => `最终 CAST 造成 ${damage} 点伤害，并击败了 Boss。`,
      finalCastLose: (damage) => `最终 CAST 造成 ${damage} 点伤害，但 Boss 仍撑过了全部 13 个槽位。`,
      castWithBonus: (damage, bonusDamage) =>
        `CAST 造成 ${damage} 点伤害，其中包含 +${bonusDamage} 的上半区奖励。`,
      castNormal: (damage) => `CAST 造成 ${damage} 点伤害。`,
      spellSyncComplete: (baseMessage) => `${baseMessage} 回合同步完成，下一轮已就绪。`,
      localCastAdvanceFailed: (reason) =>
        reason
          ? `本地 CAST 已应用，但后端推进下一轮失败：${reason}`
          : "本地 CAST 已应用，但后端推进下一轮失败。",
      boss: {
        eyebrow: "Boss",
        name: "哥布林机巧萨满",
        description: "经典快艇骰子战斗包装。击倒 150 HP 的哥布林机巧萨满。",
        turn: "回合",
        localHp: "本地 HP",
        chainHp: "链上 HP",
        slotsUsed: "已用槽位",
        defeated: "Boss 已被击败。本次经典 ProtoMon 试炼完成。",
        exhausted: "13 个槽位已经全部耗尽。这次试炼以失败结束。",
        instructions: "先掷骰、再锁骰、再重掷，然后点击积分槽位施放本地伤害。",
      },
      dice: {
        eyebrow: "骰面",
        title: "掷骰面板",
        rollCountLabel: "rollCount",
        rollButton: "ROLL",
        castingButton: "正在施法",
        battleFinished: "战斗结束",
        syncingCast: "正在同步本地施法结果",
        pendingChain: "上一回合链上确认中，可继续掷骰",
        rolling: "云端骰面生成中…",
        clickToStart: "点击 ROLL 开始当前回合",
        lockThenRoll: "锁定想保留的骰子，再按 ROLL",
        noRerolls: "本回合次数已满，去积分板施法",
        die: (index) => `骰子 ${index + 1}`,
        unknownFace: "未知点数",
        locked: "已锁定",
        unlocked: "未锁定",
      },
      score: {
        eyebrow: "槽位",
        title: "积分板",
        upperSection: "上半区",
        lowerSection: "下半区",
        bonusTriggered: "奖励已触发",
        bonusReady: "奖励就绪",
        bonusPending: "奖励进行中",
        upperBonusTitle: "上半区奖励",
        upperBonusDescription: (target, damage) =>
          `上半区累计达到 ${target} 分后，额外获得 ${damage} dmg。`,
        status: "状态",
        achieved: "已触发",
        notAchieved: "未达成",
        currentSubtotal: (subtotal, target) => `当前累计: ${subtotal} / ${target}`,
        reward: (damage) => `奖励: +${damage} dmg`,
        committed: (score) => `已记录: ${score} 分`,
        preview: (score) => `预览: ${score} 分`,
        rollFirst: "先掷骰才能预览该槽位",
        diceRecord: (dice) => `骰面: ${dice.join(" / ")}`,
        used: "已使用",
        open: "空位",
        cast: "CAST",
        damage: (amount) => `${amount} dmg`,
        upperBonusTag: (bonusDamage) => `+${bonusDamage} 上半区奖励`,
        rewardHint: {
          summary: "上半区累计达到 63 分时，额外获得 35 点奖励伤害。",
          detail: "当前累计一旦开始增长，这里就会显示奖励进度。",
          exampleLabel: "上半区元素",
        },
        slotHints: {
          Upper1: {
            summary: "统计所有水元素骰面，累计成当前水系伤害。",
            detail: "该行只吃水元素，出现几枚就结算几枚。",
            exampleLabel: "计入元素",
          },
          Upper2: {
            summary: "统计所有金元素骰面，累计成当前金系伤害。",
            detail: "该行只吃金元素，出现几枚就结算几枚。",
            exampleLabel: "计入元素",
          },
          Upper3: {
            summary: "统计所有土元素骰面，累计成当前土系伤害。",
            detail: "该行只吃土元素，出现几枚就结算几枚。",
            exampleLabel: "计入元素",
          },
          Upper4: {
            summary: "统计所有风元素骰面，累计成当前风系伤害。",
            detail: "该行只吃风元素，出现几枚就结算几枚。",
            exampleLabel: "计入元素",
          },
          Upper5: {
            summary: "统计所有木元素骰面，累计成当前木系伤害。",
            detail: "该行只吃木元素，出现几枚就结算几枚。",
            exampleLabel: "计入元素",
          },
          Upper6: {
            summary: "统计所有火元素骰面，累计成当前火系伤害。",
            detail: "该行只吃火元素，出现几枚就结算几枚。",
            exampleLabel: "计入元素",
          },
          ThreeKind: {
            summary: "至少三枚相同元素即可触发三条。",
            detail: "伤害会结算 5 枚骰面的总和，不只计算那三枚相同元素。",
            exampleLabel: "触发示例",
          },
          FourKind: {
            summary: "至少四枚相同元素即可触发四条。",
            detail: "伤害会结算 5 枚骰面的总和，剩余那一枚也会一起算进去。",
            exampleLabel: "触发示例",
          },
          FullHouse: {
            summary: "三同元素 + 两同元素时触发葫芦。",
            detail: "固定伤害 25，不再按骰面总和追加。",
            exampleLabel: "触发示例",
          },
          SmallStraight: {
            summary: "任意四连元素序列都会触发小顺。",
            detail: "固定伤害 30。下面用当前六行天命值举例展示可用连序。",
            exampleLabel: "可用连序",
          },
          LargeStraight: {
            summary: "完整五连元素序列会触发大顺。",
            detail: "固定伤害 40。下面用当前六行天命值举例展示可用连序。",
            exampleLabel: "可用连序",
          },
          Yahtzee: {
            summary: "五枚相同元素时触发快艇终结。",
            detail: "固定伤害 50，是当前最强的单次牌型伤害。",
            exampleLabel: "触发示例",
          },
          Chance: {
            summary: "机会会结算全部 5 枚骰面的总和。",
            detail: "没有牌型门槛，只要你想把当前总和直接打出去，就可以用它。",
            exampleLabel: "示例骰面",
          },
        },
        slotTitles: {
          Upper1: "水 / 一点",
          Upper2: "金 / 两点",
          Upper3: "土 / 三点",
          Upper4: "风 / 四点",
          Upper5: "木 / 五点",
          Upper6: "火 / 六点",
          ThreeKind: "三条",
          FourKind: "四条",
          FullHouse: "葫芦",
          SmallStraight: "小顺",
          LargeStraight: "大顺",
          Yahtzee: "快艇",
          Chance: "机会",
        },
      },
      protomon: {
        eyebrow: "ProtoMon",
        title: "ProtoMon // 初始体",
        description: "未来会在这里接入被动道具、遗物和更完整的角色成长。",
        destiny: "六行天命值",
        preset: "预设",
        passiveSlot: "被动槽位",
        passiveDescription: "未来的遗物 / 被动道具区域。当前版本只保留占位。",
      },
      session: {
        eyebrow: "会话网关",
        description: "当前版本已接入钱包与链上结算；session key / 4337 会在下一阶段替换普通 sender。",
      },
      finish: {
        victoryTitle: "胜利",
        victoryBody: "哥布林机巧萨满已被击倒。本场 ProtoMon 试炼完成。",
        victoryReturn: "返回大厅",
        victoryStay: "继续查看",
        defeatTitle: "失败",
        defeatBody: "13 个槽位已经全部耗尽。要立即锻造新的战斗房间吗？",
        defeatRetry: "重新开战",
        defeatReturn: "返回大厅",
        retrying: "房间锻造中…",
      },
      sync: {
        eyebrow: "同步",
        title: "结算状态",
        statusCopy: {
          LOCAL_APPLIED: "本地乐观结算已应用。",
          PENDING_CHAIN: "等待链上回执确认。",
          CONFIRMED: "链上与本地状态一致。",
          RETRYABLE_FAIL: "提交失败，可重试。",
          ROLLBACK: "链上结果与本地不一致，已回滚。",
        },
        lampCopy: {
          READY: "链上状态已确认，本地没有领先回合。",
          SYNCING: "本地或后端已经领先链上，正在等待链上确认。",
          ERROR: "本次同步出现异常，当前回合需要人工处理。",
          ROLLBACK_REQUIRED: "链上结果与本地乐观状态不一致，需要回滚到最新链上确认态。",
        },
        lampTooltipLabel: "同步状态说明",
        castPendingHint: "上一回合仍在同步中，需等待确认完成后才能释放下一次技能。",
        castSubmittingHint: "当前施法正在提交中，等待本次交易发出后才能继续操作。",
        rollbackTitle: "空间扭曲",
        rollbackBody: "检测到链上结果与本地乐观状态不一致。请回滚到最新链上确认态后继续。",
        rollbackAction: "空间扭曲：回滚",
        pendingTxAssigned: (hash) => `pendingTxHash: ${hash}`,
        pendingTxMissing: "pendingTxHash: 尚未分配",
        debug: "调试",
        redisKey: (key) => `Redis key: ${key}`,
        latestDiceRtt: (rttMs) =>
          `最近一次骰面 RTT: ${rttMs === null ? "尚未采样" : `${rttMs} ms`}`,
        storedFields:
          "存储字段: player, rewardRecipient, bossId, turn, rollCount, currentDice, finalized, createdAt, expiresAt",
      },
      elementLabels: {
        1: "水",
        2: "金",
        3: "土",
        4: "风",
        5: "木",
        6: "火",
      },
    },
  },
  en: {
    common: {
      language: "Language",
      locales: {
        "zh-CN": "中文",
        en: "EN",
      },
    },
    loading: {
      defaultTitle: "PROTOMON",
      defaultSubtitle: "ELEMENTAL RESONANCE SYNC",
      defaultLoadingLabel: "LOADING…",
      defaultCompleteLabel: "READY!",
      defaultMessages: [
        "Syncing elemental resonance…",
        "Calibrating alchemy circuits…",
        "Reading prototype battle data…",
        "Waking the dice core…",
        "Opening the battle scene…",
      ],
      tagline: "FULLY ON-CHAIN. FULLY FUN.",
    },
    home: {
      sections: [
        "Classic 13-slot Yahtzee flow",
        "Backend-authoritative roll / reroll",
        "Local optimistic CAST damage",
        "Light ProtoMon battle wrapper",
      ],
      sectionBody:
        "This phase focuses on the classic Yahtzee loop first. On-chain settlement and session-key flow come later.",
      entrySubtitle: "SITE LINK ESTABLISHING",
      entryLoadingLabel: "BOOTING…",
      entryCompleteLabel: "ENTER!",
      createSubtitle: "BATTLE ROOM FORGING",
      createLoadingLabel: "CREATING…",
      createCompleteLabel: "ROOM READY!",
      createMessages: [
        "Forging the battle room…",
        "Sending the start request to Upstash…",
        "Binding the on-chain battle session…",
        "Seeding the boss state…",
        "Opening the first trial…",
      ],
      eyebrow: "PROTO MON / ELEMENTAL ALCHEMY",
      title: "ProtoMon",
      subtitle: "ELEMENTAL ALCHEMY",
      reactiveHeadlinePrefix: "The first trustless cross-chain roguelike driven by ",
      reactiveHeadlineHighlight: "Reactive Network",
      reactiveHeadlineSuffix: "",
      slogan: "Play in the cloud, own on-chain, fun without limits~",
      description:
        "The classic Yahtzee loop comes first, wrapped in a light ProtoMon shell. The backend owns authoritative dice, while the home page becomes a pixel-art lobby with wallet entry.",
      demoPlayerLabel: "Demo player",
      startButtonIdle: "PLAY NOW",
      startButtonBusy: "FORGING BATTLE…",
      startButtonCaption: "ERC-4337 GASLESS CAST",
      dealerOnline: "Upstash dealer online",
      dealerLabel: "Dealer Online",
      dealerStates: {
        idle: "Idle",
        waiting: "Syncing",
        online: "Online",
        error: "Error",
      },
      walletLabel: "Wallet",
      walletPreparing: "Booting connector",
      walletConnect: "Connect Wallet",
      walletDesktopHint: "Desktop full mode",
      walletWrongNetwork: "Wrong Network",
      walletSwitchNetwork: "Switch",
      walletConnected: "Connected",
      walletChainLabel: "Chain",
      walletAccountLabel: "Account",
      backToTop: "Back to top",
      meetTitle: "MEET THE PROTOMONS",
      meetCards: ["IGNIS FOX", "AQUA TORTOISE", "VOLT KITTEN"],
      alchemyTitle: "MASTER THE ALCHEMY",
      alchemyWorkbench: "Alchemy Workbench",
      alchemyCastPanel: "Cast Panel",
      crossChainTitle: "REACTIVE CROSS-CHAIN FLYWHEEL",
      reactiveNodeLabel: "Reactive Node",
      mainnetRewardLabel: "Mainnet Reward",
      crossChainCaption: "L2 bridge aligned. Mainnet reward beam is ready.",
      footerTagline: "FULLY ON-CHAIN. FULLY FUN.",
      footerCopyright: "© 2026 EIP-Playground ProtoMon",
      footerLeftLinks: ["GitHub", "X"],
      footerRightLinks: ["Team"],
      errorCreateGame: "Failed to create the battle room.",
    },
    battle: {
      boardEyebrow: "Classic Battle Board",
      boardTitle: "ProtoMon Yahtzee Battle",
      boardDescription:
        "The left column reserves ProtoMon and future passive slots, the center handles battle and dice flow, and the right column stays fixed on the score board.",
      backToLobby: "Back to Lobby",
      gameIdLabel: "gameId",
      restoringSnapshot: "Restoring local battle snapshot…",
      restoredSnapshot: "Recovered the local battle snapshot from this tab.",
      initialStatus: "The first roll uses backend authority. Every cast settles on chain.",
      requestingDice: "Requesting authoritative dice from the cloud dealer…",
      diceReceivedFirst: "Authoritative dice received. Lock what you want to keep, then press ROLL again.",
      diceReceivedReroll:
        "Reroll synced from backend. Locked dice stayed highlighted for the next decision.",
      diceRequestFailed: "Dice request failed.",
      finalCastWin: (damage) => `Final CAST dealt ${damage} damage and defeated the boss.`,
      finalCastLose: (damage) =>
        `Final CAST dealt ${damage} damage, but the boss survived all 13 slots.`,
      castWithBonus: (damage, bonusDamage) =>
        `CAST dealt ${damage} damage, including the +${bonusDamage} upper bonus.`,
      castNormal: (damage) => `CAST dealt ${damage} damage.`,
      spellSyncComplete: (baseMessage) => `${baseMessage} Spell sync complete. Next round is ready.`,
      localCastAdvanceFailed: (reason) =>
        reason
          ? `Local CAST applied, but backend round advance failed: ${reason}`
          : "Local CAST applied, but backend round advance failed.",
      boss: {
        eyebrow: "Boss",
        name: "Goblin Gear Shaman",
        description: "Classic Yahtzee battle wrapper. Bring down the 150 HP Goblin Gear Shaman.",
        turn: "Turn",
        localHp: "Local HP",
        chainHp: "Chain HP",
        slotsUsed: "Slots Used",
        defeated: "Boss defeated. The classic ProtoMon run is complete.",
        exhausted: "All 13 slots are consumed. This run ends in defeat.",
        instructions: "Roll, lock, reroll, then click a slot to cast local damage.",
      },
      dice: {
        eyebrow: "Dice",
        title: "Roll Board",
        rollCountLabel: "rollCount",
        rollButton: "ROLL",
        castingButton: "Casting…",
        battleFinished: "Battle finished",
        syncingCast: "Syncing local cast result",
        pendingChain: "Previous turn is still confirming on chain. You can keep rolling.",
        rolling: "Rolling authoritative dice…",
        clickToStart: "Press ROLL to start this turn",
        lockThenRoll: "Lock the dice you want to keep, then press ROLL",
        noRerolls: "No rerolls remain. Use the score board to CAST",
        die: (index) => `Die ${index + 1}`,
        unknownFace: "Unknown face",
        locked: "Locked",
        unlocked: "Unlocked",
      },
      score: {
        eyebrow: "Slots",
        title: "Score Board",
        upperSection: "Upper Section",
        lowerSection: "Lower Section",
        bonusTriggered: "Bonus Triggered",
        bonusReady: "Bonus Ready",
        bonusPending: "Bonus Pending",
        upperBonusTitle: "Upper Bonus",
        upperBonusDescription: (target, damage) =>
          `Reach ${target} points in the upper section to gain an extra ${damage} dmg.`,
        status: "Status",
        achieved: "Triggered",
        notAchieved: "Pending",
        currentSubtotal: (subtotal, target) => `Subtotal: ${subtotal} / ${target}`,
        reward: (damage) => `Reward: +${damage} dmg`,
        committed: (score) => `Committed: ${score} score`,
        preview: (score) => `Preview: ${score} score`,
        rollFirst: "Roll first to preview this slot",
        diceRecord: (dice) => `Dice: ${dice.join(" / ")}`,
        used: "Used",
        open: "Open",
        cast: "CAST",
        damage: (amount) => `${amount} dmg`,
        upperBonusTag: (bonusDamage) => `+${bonusDamage} upper bonus`,
        rewardHint: {
          summary: "Reach 63 points in the upper section to unlock +35 bonus damage.",
          detail: "As soon as the subtotal starts climbing, this row will show the reward progress.",
          exampleLabel: "Upper elements",
        },
        slotHints: {
          Upper1: {
            summary: "Convert every water face into current water damage.",
            detail: "Only water faces count on this row. Every matching die is added in.",
            exampleLabel: "Counted faces",
          },
          Upper2: {
            summary: "Convert every metal face into current metal damage.",
            detail: "Only metal faces count on this row. Every matching die is added in.",
            exampleLabel: "Counted faces",
          },
          Upper3: {
            summary: "Convert every earth face into current earth damage.",
            detail: "Only earth faces count on this row. Every matching die is added in.",
            exampleLabel: "Counted faces",
          },
          Upper4: {
            summary: "Convert every air face into current air damage.",
            detail: "Only air faces count on this row. Every matching die is added in.",
            exampleLabel: "Counted faces",
          },
          Upper5: {
            summary: "Convert every wood face into current wood damage.",
            detail: "Only wood faces count on this row. Every matching die is added in.",
            exampleLabel: "Counted faces",
          },
          Upper6: {
            summary: "Convert every fire face into current fire damage.",
            detail: "Only fire faces count on this row. Every matching die is added in.",
            exampleLabel: "Counted faces",
          },
          ThreeKind: {
            summary: "Three of a kind triggers this cast.",
            detail: "The damage is the sum of all 5 dice, not just the matching three.",
            exampleLabel: "Trigger example",
          },
          FourKind: {
            summary: "Four of a kind triggers this cast.",
            detail: "The damage is the sum of all 5 dice, so the leftover die is counted too.",
            exampleLabel: "Trigger example",
          },
          FullHouse: {
            summary: "Three of one face plus two of another triggers Full House.",
            detail: "This cast deals a fixed 25 damage.",
            exampleLabel: "Trigger example",
          },
          SmallStraight: {
            summary: "Any four-step consecutive sequence triggers Small Straight.",
            detail: "This cast deals a fixed 30 damage. The examples below use the current destiny-line ordering.",
            exampleLabel: "Valid sequences",
          },
          LargeStraight: {
            summary: "Any five-step consecutive sequence triggers Large Straight.",
            detail: "This cast deals a fixed 40 damage. The examples below use the current destiny-line ordering.",
            exampleLabel: "Valid sequences",
          },
          Yahtzee: {
            summary: "Five matching faces unleash the Yahtzee finisher.",
            detail: "This cast deals a fixed 50 damage.",
            exampleLabel: "Trigger example",
          },
          Chance: {
            summary: "Chance spends the total of all 5 dice as raw damage.",
            detail: "There is no pattern gate. Use it when the current total is worth cashing out.",
            exampleLabel: "Example dice",
          },
        },
        slotTitles: {
          Upper1: "Water / Ones",
          Upper2: "Metal / Twos",
          Upper3: "Earth / Threes",
          Upper4: "Air / Fours",
          Upper5: "Wood / Fives",
          Upper6: "Fire / Sixes",
          ThreeKind: "Triple Strike",
          FourKind: "Quad Breaker",
          FullHouse: "Full House",
          SmallStraight: "Small Straight",
          LargeStraight: "Large Straight",
          Yahtzee: "Yahtzee",
          Chance: "Chance",
        },
      },
      protomon: {
        eyebrow: "ProtoMon",
        title: "ProtoMon // Initiate",
        description: "Future passive items, relics, and fuller character growth will plug in here.",
        destiny: "Destiny Lines",
        preset: "Preset",
        passiveSlot: "Passive Slot",
        passiveDescription: "Future relic / passive item area. The current build keeps this as a placeholder only.",
      },
      session: {
        eyebrow: "Session Gate",
        description:
          "Wallet-linked on-chain settlement is live. Session-key / 4337 automation lands in the next phase.",
      },
      finish: {
        victoryTitle: "Victory",
        victoryBody: "Goblin Gear Shaman is down. This ProtoMon trial is complete.",
        victoryReturn: "Return to Lobby",
        victoryStay: "Keep Viewing",
        defeatTitle: "Defeat",
        defeatBody: "All 13 slots are exhausted. Forge a fresh battle room?",
        defeatRetry: "Retry in New Room",
        defeatReturn: "Return to Lobby",
        retrying: "Forging room…",
      },
      sync: {
        eyebrow: "Sync",
        title: "Settlement Status",
        statusCopy: {
          LOCAL_APPLIED: "Local optimistic settlement has been applied.",
          PENDING_CHAIN: "Waiting for on-chain receipt confirmation.",
          CONFIRMED: "On-chain state matches the local state.",
          RETRYABLE_FAIL: "Submission failed and can be retried.",
          ROLLBACK: "Chain result mismatched local state and was rolled back.",
        },
        lampCopy: {
          READY: "The on-chain state is confirmed and the local board is not ahead.",
          SYNCING: "The local or backend state is ahead of chain confirmation.",
          ERROR: "This sync step failed before a rollback was required.",
          ROLLBACK_REQUIRED: "The on-chain result diverged from the optimistic local state and must be rolled back.",
        },
        lampTooltipLabel: "Sync status details",
        castPendingHint: "The previous turn is still syncing on chain. Wait for confirmation before casting the next skill.",
        castSubmittingHint: "The current cast is still being submitted. Wait until this transaction is sent before acting again.",
        rollbackTitle: "Space Warp",
        rollbackBody: "The on-chain result diverged from the optimistic local state. Roll back to the latest confirmed chain state to continue.",
        rollbackAction: "Space Warp: Roll Back",
        pendingTxAssigned: (hash) => `pendingTxHash: ${hash}`,
        pendingTxMissing: "pendingTxHash: not assigned",
        debug: "Debug",
        redisKey: (key) => `Redis key: ${key}`,
        latestDiceRtt: (rttMs) =>
          `Latest dice RTT: ${rttMs === null ? "not sampled" : `${rttMs} ms`}`,
        storedFields:
          "Stored fields: player, rewardRecipient, bossId, turn, rollCount, currentDice, finalized, createdAt, expiresAt",
      },
      elementLabels: {
        1: "Water",
        2: "Metal",
        3: "Earth",
        4: "Air",
        5: "Wood",
        6: "Fire",
      },
    },
  },
};

export type AppMessages = (typeof MESSAGES)[Locale];

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function resolveLocale(input?: string | null): Locale | null {
  if (!input) {
    return null;
  }

  if (isSupportedLocale(input)) {
    return input;
  }

  if (input.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }

  if (input.toLowerCase().startsWith("en")) {
    return "en";
  }

  return null;
}
