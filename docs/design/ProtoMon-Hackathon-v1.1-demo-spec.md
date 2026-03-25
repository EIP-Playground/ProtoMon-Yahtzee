# 🚀 黑客松 MVP 设计规范

**项目代号：** ProtoMon-Hackathon-v1.1  
**一句话定位：** 一款基于经典《快艇骰子》改造的全链 Boss Battle Demo。玩家在本地获得 Web2 级即时反馈，在 L2 获得最终可信结算，在胜利时由 Reactive Network 自动触发 L1 荣耀徽章发放。  
**核心叙事：** 体验在前端（Optimistic UI 即时反馈）、状态在链上（L2 真实存档）、交互无感（ERC-4337 Session Key）、触发在网（Reactive 跨链回调）、Agent 原生可读（Event Log 即世界状态）。

---

## 0. 设计原则（本版修订的目标）

本版规范以**“黑客松最小可交付”**为唯一目标，遵循以下原则：

1. **只做一条完整闭环。** 只完整实现第一关实机游玩，其余内容只做 UI 占位，不做半成品系统。
2. **只做一次真实上链结算。** 每回合最多摇 3 次骰，但只在玩家确定槽位并点击【CAST】后，发起一次链上结算。
3. **前端先爽，链上再裁决。** 前端即时播放掉血和特效；链上事件回执负责最终确认与对账。
4. **后端不碰战术，只证明客观事实。** 后端只对“本回合最终骰面”做签名证明，不参与 slot 选择，不计算伤害，不掌握 Boss 状态。
5. **所有安全约束都要写进规范，而不是靠口头约定。**

---

## 一、MVP 范围界定（Scope Definition）

### ✅ 必须实现的核心功能（In-Scope）

1. **纯净的 13 回合战斗循环**  
   每回合流程固定为：
   **ROLL -> 锁定 / 解锁 -> REROLL（最多两次）-> 选择计分槽位 -> CAST -> 链上结算**。

2. **经典《快艇骰子》计分逻辑（包装为伤害）**
   - **上半区（元素共鸣）**：1-6 点映射为 6 种元素，按经典规则计分。
   - **上半区奖励**：上半区小计**首次达到或超过 63** 时，立即触发 **35 点额外真实伤害**，且**整局只触发一次**。
   - **下半区（EIP 招式）**：严格沿用经典规则：
     - 三条：5 颗骰子总和
     - 四条：5 颗骰子总和
     - 葫芦：固定 25 伤害
     - 小顺：固定 30 伤害
     - 大顺：固定 40 伤害
     - 快艇（Yahtzee）：固定 50 伤害
     - 全选 / 机会（Chance）：5 颗骰子总和

3. **ERC-4337 静默交互**
   - 开局由主钱包**只签一次**，授权一个本局专用 **Session Key**。
   - 局内 13 回合的 `CAST` 通过 Session Key 静默提交，不再弹主钱包。
   - **MVP 不强依赖 Gas Sponsor**：若 Paymaster 可用则启用赞助；若来不及接入，则使用预充值 Smart Account 保证静默体验。
   - **MVP 极简做法（黑客松偷懒技巧）：** 为了在 48 小时内省去写复杂的 4337 鉴权逻辑，你的 L2 合约里可以直接写一个 `mapping(address => address) public sessionToMainWallet;`，在开局时绑定一下。局内所有状态全部挂载在 `MainWallet` 下。
   
4. **后端防作弊发牌器（Next.js + Redis）**
   - 后端作为“盲眼发牌器”，只负责生成权威骰面并维护最小状态缓存。
   - 后端**只在玩家结束本回合时**，对“最终骰面”签名。
   - 后端签名**不包含 `slotId`**，确保后端不知道玩家战术选择。

5. **双端同构计算与状态对账**
   - 前端 TypeScript 与链上 Solidity 使用**同一套计分规则**。
   - 点击【CAST】后，前端立即乐观渲染伤害与 Boss 掉血。
   - 链上确认后，前端依据 `TurnPlayed` 事件进行对账。
   - 若本地状态与链上状态不一致，则触发回滚并恢复链上真实状态。

6. **通关判定与 Reactive 跨链发奖**
   - 击败 Boss 时，L2 合约发出 `GameWon` 事件。
   - Reactive Network 监听该事件，并在 L1 为预先指定的 `rewardRecipient` 铸造通关 SBT / NFT 徽章。
   - L1 发奖逻辑必须具备**来源校验**与**幂等防重铸**能力。

7. **Agent 原生接入**
   - AI Agent 不依赖前端私有接口。
   - Agent 可直接通过 RPC 读取 `TurnPlayed` / `GameWon` 事件，获知当前战况与最终结果。

---

### 🚧 仅做 UI 展示（UI Mockup / Coming Soon）

以下功能仅做视觉展示，点击弹出统一 16-bit 提示框：  
**“🚧 节点同步中...（v2.0 开放）”**

1. **御三家选择界面**：仅开放【焱炽猫】进入实机战斗。
2. **局内商店与遗物系统**：仅展示入口、金币余额与占位 UI。
3. **复杂 Buff / Debuff 状态**：MVP 不执行冻结、反伤、中毒、护盾等复杂状态。
4. **第二关 / 第三关实机玩法**：仅展示 Boss 卡面与目标血量，不开放真实战斗。

---

## 二、核心战斗规则（Hard Rules）

### 2.1 单局与回合规则

1. 单局固定 **13 个回合 / 13 个槽位**。
2. 每回合最多 **3 次掷骰机会**：
   - 第 1 次：必须掷全部 5 颗骰子
   - 第 2 次 / 第 3 次：可自由锁定任意骰子，只重掷未锁定的骰子
3. 玩家可在第 1 次或第 2 次掷骰后提前结束本回合。
4. 每回合结束时，必须选择**一个未使用槽位**结算。
5. 若当前骰面不满足该槽位条件，则该槽位结算为 **0**。
6. 当 13 个槽位全部用完，若 Boss 仍存活，则判定挑战失败。

### 2.2 元素映射规则

- 链上实际只使用数字 `1..6` 进行计算。
- 前端将数字映射为六种元素贴图，仅用于表现层。
- 建议映射如下：
  - 1 = 水
  - 2 = 金
  - 3 = 土
  - 4 = 气
  - 5 = 木
  - 6 = 火

### 2.3 上半区规则

- 上半区 6 个槽位分别对应 1 至 6 点。
- 某槽位得分 = 当前 5 颗骰子中，所有对应点数骰子的总和。
  - 例如：`[3,3,3,5,6]` 填入 3 点槽位，得分 = `3 + 3 + 3 = 9`
- 上半区累计分数首次 `>= 63` 时：
  - 当回合额外附加 **35 点真实伤害**
  - 仅触发 **一次**

### 2.4 下半区规则

- **三条**：至少 3 颗相同，伤害 = 5 颗骰子总和
- **四条**：至少 4 颗相同，伤害 = 5 颗骰子总和
- **葫芦**：3 + 2，固定 25 伤害
- **小顺**：任意连续 4 点，固定 30 伤害
- **大顺**：连续 5 点，固定 40 伤害
- **快艇**：5 颗完全相同，固定 50 伤害
- **机会**：无条件，伤害 = 5 颗骰子总和

### 2.5 明确不做的经典扩展规则

为避免双端判定分歧，MVP **明确不实现**以下经典扩展：

1. **额外 Yahtzee Bonus（再次掷出快艇的追加奖励）**
2. **Joker Rule（快艇作为百搭牌型填其他格）**
3. 任何与“二次快艇”相关的特殊衍生判定

---

## 三、关卡设计：三层以太秘境（The 3 Levels）

### 3.1 MVP 实装策略

- **只完整实现第一关实机游玩**。
- 第二、三关只在大厅或地图中展示卡面、血量与“Coming Soon”提示。
- 第一关的怪物血量，直接等同于玩家需要打出的总伤害阈值。

| 关卡 / Boss | 目标血量（Target） | 实装状态 | 难度描述 | 容错空间 |
|---|---:|---|---|---|
| 第一关：哥布林黑客 | **150 HP** | **完整可玩** | 新手测试 | 允许出现 2-3 个 0 伤槽位，不强求 35 分奖励 |
| 第二关：MEV 夹子机甲 | **190 HP** | UI 展示 | 进阶挑战 | 文案展示“通常需要拿到上半区 35 奖励” |
| 第三关：混沌分叉兽 | **235 HP** | UI 展示 | 专家噩梦 | 文案展示“通常需要 35 奖励 + 多个高分牌型” |

---

## 四、三端架构（The 3 Realms Architecture）

### 4.1 盲眼的防作弊发牌器（Next.js + Redis）

后端**不知道**：
- 玩家当前选择了哪个槽位
- Boss 剩余血量
- 实际伤害结算结果

后端**只知道并维护**：
- 当前回合 `turn`
- 当前回合掷骰次数 `rollCount`
- 当前权威骰面 `currentDice[5]`
- 本回合是否已经 `finalized`

### 4.2 Redis 最小状态模型

每局在 Redis 中维护以下字段：

```ts
GameRoundState {
  gameId: string,
  player: address,
  rewardRecipient: address,
  turn: number,          // 1..13
  rollCount: number,     // 0..3
  currentDice: uint8[5],
  finalized: boolean,
  ttl: timestamp
}
```

### 4.3 后端接口（严格最小化）

#### `/api/roll`
- 用于本回合第一次掷骰
- 校验当前回合尚未开始
- 生成 5 颗骰子
- 写入 Redis：`rollCount = 1`, `currentDice = [...]`, `finalized = false`
- 返回权威骰面

#### `/api/reroll`
- 用于第 2 / 3 次掷骰
- 输入：锁定掩码 `lockMask`
- 读取 Redis 中的 `currentDice`
- 只重掷未锁定位置
- 更新 Redis：`rollCount += 1`, `currentDice = [...]`
- 若 `rollCount > 3`，直接拒绝
- 返回新权威骰面

#### `/api/finalize`
- 玩家决定结束本回合时调用，也就是将分数写入计分板
- 后端读取 Redis 中的**最终权威骰面**
- 后端生成 **Dealer Final Proof**
- 更新 Redis：`finalized = true`
- 返回签名证明 `proof`

### 4.4 后端签名规则（Dealer Final Proof）

后端**不对中间摇骰结果出链上证明**，只对**最终骰面**签名。  
签名必须使用 **EIP-712 Typed Data**，至少包含以下字段：

```ts
DealerFinalProof {
  gameId: bytes32,
  player: address,
  rewardRecipient: address,
  turn: uint8,
  finalRollCount: uint8,
  finalDice: uint8[5],
  expiresAt: uint64,
  chainId: uint256,
  verifyingContract: address,
  dealerVersion: uint32
}
```

> 关键约束：`proof` **绝不包含 `slotId`**。  
> 这样后端只证明“这 5 颗骰子确实出现过”，不证明“玩家拿它打了哪一招”。

### 4.5 乐观渲染的前端（Optimistic Frontend）

点击【CAST】后的处理顺序：

1. 前端依据本地骰面 + 选定 `slotId`，即时计算伤害
2. 本地立即扣除 Boss 血量、播放攻击动画
3. 同步使用 Session Key 提交 `playTurn(...)` 到 L2
4. 等待链上事件回执
5. 用事件中的真实 `bossHpAfter`、`upperSubtotal`、`filledMask` 对账

### 4.6 前端同步状态灯（必须区分 5 种）

右上角同步状态不应把所有失败都渲染成“作弊”。必须区分：

1. **Local Applied**：本地已播放
2. **Pending Chain**：等待打包 / Bundler / RPC 中
3. **Confirmed**：链上对账成功
4. **Retryable Fail**：交易未上链，可提示重试
5. **Rollback**：链上真实状态与本地状态不一致，执行回滚

其中只有 `Rollback` 状态，才显示：  
**“⚠️ 时空扭曲：已回滚至真实世界线！”**

### 4.7 L2 智能合约（Source of Truth）

L2 合约负责：
- 校验 Dealer 签名
- 校验 turn 顺序
- 校验 `slotId` 未被使用
- 按 Solidity 规则计算本回合伤害
- 扣减 Boss 血量
- 更新上半区累计分、奖励触发状态、已使用槽位掩码
- 发出标准事件

建议最小状态结构：

```solidity
struct GameState {
    address playerSmartAccount;
    address rewardRecipient;
    uint8 turn;
    uint16 bossHp;
    uint8 upperSubtotal;
    bool upperBonusClaimed;
    uint16 filledMask;   // 13 bits used
    bool isOver;
    bool isWon;
}
```

建议最小入口：

```solidity
playTurn(bytes32 gameId, uint8 slotId, DealerFinalProof proof, bytes dealerSig)
```

### 4.8 事件设计（Agent / 前端统一读取）

#### `TurnPlayed`
至少包含：

```solidity
event TurnPlayed(
  bytes32 indexed gameId,
  address indexed playerSmartAccount,
  address indexed rewardRecipient,
  uint8 turn,
  uint8 slotId,
  uint8[5] finalDice,
  uint8 finalRollCount,
  uint16 damage,
  uint16 bossHpAfter,
  uint8 upperSubtotal,
  uint16 filledMask
);
```

#### `GameWon`
至少包含：

```solidity
event GameWon(
  bytes32 indexed gameId,
  address indexed playerSmartAccount,
  address indexed rewardRecipient,
  uint16 finalBossHp,
  uint8 clearedLevel
);
```

> `GameWon` 必须显式携带 `rewardRecipient`，不能在跨链时根据 `msg.sender` 猜测奖励归属。

---

## 五、ERC-4337 账户抽象规则（Session Key Hard Constraints）

### 5.1 开局唯一一次主钱包授权

玩家进入战斗时，主钱包仅做一次签名，用于：

1. 创建 / 授权本局专用 Session Key
2. 指定本局 `rewardRecipient`
3. 初始化 `gameId`

### 5.2 Session Key 必须限制在“铁笼”里

Session Key 不是通用热钥匙，必须至少限制以下范围：

- **仅限当前链**
- **仅限当前游戏合约**
- **仅限 `playTurn()` 相关函数选择器**
- **仅限当前 `gameId`**
- **有效期 30-60 分钟**
- **禁止任何 token approve / transfer / arbitrary call**
- **战斗结束、退出大厅或过期后可撤销 / 自动失效**

### 5.3 不做的承诺

本 Demo 只承诺：
- **局内静默交互**
- **主钱包不重复弹窗**

本 Demo **不承诺**：
- 通用委托标准化
- 跨应用复用 Session Key
- 完整钱包兼容矩阵

---

## 六、Reactive 跨链发奖（L2 -> L1）

### 6.1 触发逻辑

- L2 合约在 Boss 血量 `<= 0` 时发出 `GameWon`
- Reactive Network 监听 `GameWon`
- 触发 L1 Badge Minter 合约铸造通关徽章

### 6.2 L1 回调验证（必须实现）

L1 Badge Minter 必须校验：

1. 调用者是否为预期的 **Callback Proxy**
2. 回调中携带的来源标识是否对应预期的 Reactive Contract / RVM ID
3. `gameId` 是否已被处理过

### 6.3 幂等防重铸（必须实现）

L1 合约至少维护其一：

```solidity
mapping(bytes32 => bool) public badgeMinted;
```

或

```solidity
mapping(address => mapping(uint8 => bool)) public badgeMintedByLevel;
```

确保即使回调重复到达，也只会成功铸造一次。

---

## 七、AI Agent 原生参与（Agent as First-Class Citizen）

Agent 视角仅依赖后端发牌器，不读取前端内部状态。

1. 学习 md 游戏游玩说明
2. 通过发送交易与游戏合约互动

Agent 可通过以下方式获取战况：

1. 监听 `TurnPlayed` 事件，读取：
   - 当前回合数
   - 本回合伤害
   - Boss 剩余血量
   - 上半区累计值
2. 监听 `GameWon` 事件，判断通关完成
3. 如需恢复现场，可直接查询链上 `GameState`

**结论：** Agent 与人类玩家共享同一“世界真相来源”，即 L2 Event Log + 合约状态。

---

## 八、黑客松舞台路演脚本（Pitch Flow）

建议在舞台上只强调以下三件事：

1. **一次签名，整局无弹窗**
2. **本地先爽，链上再裁决**
3. **赢了以后，不靠中心化后台，跨链自动发勋章**

### 推荐 5 步展示流程

#### Step 1. AA 无感登入
- 展示 16-bit 大厅
- MetaMask / 主钱包只签一次，授权 Session Key
- 文案：  
  **“这是本局唯一一次钱包交互。接下来 13 回合，都会像 Web2 一样即时响应。”**

#### Step 2. 极速发牌与本地流转
- 点击 `ROLL`
- 演示锁定 / 解锁 / REROLL
- 文案：  
  **“后端只证明骰面真实出现过，不知道你的战术，不参与伤害结算，也不掌握 Boss 状态。”**

#### Step 3. 乐观渲染与链上对账（高光时刻）
- 凑出葫芦或大顺
- 点击 `CAST`
- 画面立即爆炸，Boss 掉血
- 数秒后状态灯变为 `Confirmed`
- 文案：  
  **“我们让前端先给你即时反馈，但最终世界线由链上事件裁决。若本地被篡改，系统会自动回滚到真实状态。”**

#### Step 4. AI 一等公民视角
- 展示一段读取 `TurnPlayed` 事件的代码或日志
- 文案：  
  **“因为规则和结算都在 L2，AI Agent 直接读 Event Log 就能理解世界，不需要接你们前端私有接口。”**

#### Step 5. 跨链自动化结尾
- 击杀 Boss
- 展示 Reactive 捕获 `GameWon`
- L1 钱包收到徽章
- 文案：  
  **“战斗发生在廉价 L2，荣耀资产落在安全 L1，中间不需要中心化发奖服务器。”**

---

## 九、实现验收标准（Definition of Done）

只要满足以下条件，即可判定 MVP 成功：

### A. 游戏闭环验收
- 可以完整开始一局第一关战斗
- 可以进行 13 回合以内的 Roll / Reroll / Cast
- 可正常击杀第一关 Boss 或战败结束
- 局内所有槽位只能使用一次
- 上半区 35 奖励仅触发一次

### B. 安全与状态验收
- 无法跳过 `rollCount` 规则伪造额外重掷
- 无法复用旧回合 proof 到新回合
- 无法将同一 proof 重放到错误链 / 错误合约
- 无法重复使用已结算槽位
- 前端篡改本地 Boss 血量后，会在链上确认时被回滚
- 同一 `gameId` 不会重复发放 L1 徽章

### C. 双端一致性验收
- TS 与 Solidity 对所有核心牌型判定一致
- 至少覆盖 **252 种排序后唯一骰面组合** 的计分单元测试
- 关键事件字段完整，可供前端与 Agent 读取

### D. 路演可见性验收
- 右上角能清楚显示同步状态
- `GameWon` 触发后能展示跨链结果
- “Coming Soon” 功能入口清晰，不会被误认为损坏功能

---

## 十、明确的非目标（Non-Goals）

以下内容不属于本次黑客松交付目标：

1. 多角色平衡性与完整 Roguelite 数值系统
2. 完整遗物、商店、Buff、Debuff、元素克制体系
3. 多 Boss 实机关卡与完整剧情
4. 完整经济系统与局外成长
5. 真正去中心化 RNG
6. 通用化 Session Key 基础设施
7. 面向生产环境的合约审计与全钱包兼容

---

## 最终一句话版本（给评委）

**ProtoMon 是一个黑客松最小全链游戏闭环：玩家在前端即时打击 Boss，在 L2 接受最终裁决，在通关时由 Reactive 自动把荣耀资产送到 L1。**
