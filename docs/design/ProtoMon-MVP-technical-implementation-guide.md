# ProtoMon Hackathon MVP 技术实现落地文档

版本：v1.0  
项目代号：ProtoMon-Hackathon-v1  
目标：让团队按本文一步一步实现，即可完成可路演、可提交、可验收的黑客松 MVP。

---

## 0. 先定死的技术边界

### 0.1 这次 MVP 必须交付什么

1. **前端可玩的一整局 13 回合战斗**
   - 第 1 次 roll 必须投 5 颗骰子
   - 第 2 / 3 次允许锁定后重摇
   - 每回合必须选择 1 个未使用槽位结算
   - 13 个槽位全部填满则战斗结束

2. **后端只做“盲眼防作弊发牌器”**
   - 后端只负责生成权威骰面
   - 后端不计算伤害、不关心 Boss 血量、不关心 slot 选择
   - 后端只在玩家结束本回合时，对“最终骰面事实”出 1 次签名证明

3. **链上 L2 合约做唯一真实裁决**
   - 校验后端证明
   - 校验本回合 / 槽位是否可用
   - 计算伤害
   - 更新 Boss 血量与战斗进度
   - emit `TurnPlayed`
   - 击杀时 emit `GameWon`

4. **4337 零弹窗体验**
   - 进入战斗前仅 1 次主钱包签名
   - 局内每回合 `castTurn()` 使用 session key 静默提交 `UserOperation`

5. **Reactive 跨链发奖**
   - Reactive Contract 监听 L2 的 `GameWon`
   - 自动向 L1 / Sepolia Badge 合约发 callback
   - L1 Badge 合约完成一次性 mint

6. **满足黑客松提交要求**
   - 仓库中必须包含 origin / destination / reactive 合约、部署脚本、说明文档、已部署地址、工作流说明、交易哈希记录、演示视频说明页。

---

## 1. 黑客松对齐方案

### 1.1 推荐测试网选择

为了最小化开发复杂度，建议固定如下：

- **Origin 链（游戏主战场 / L2）**：Base/Arbitrum Sepolia
- **Reactive 链**：Reactive Lasna Testnet
- **Destination 链（发奖链 / L1 testnet）**：Ethereum Sepolia

原因：

- Base/Arbitrum Sepolia 与 Ethereum Sepolia 都可作为 Reactive 的 testnet origin 和 destination。
- Reactive Lasna 是官方测试环境，便于部署和演示。
- 全链路都在 testnet，不会踩“mainnet / testnet 不能混用”的坑。

### 1.2 我们的项目对应黑客松提交材料

最终仓库必须包含：

- `contracts/origin/ProtoMonGame.sol`
- `contracts/destination/ProtoMonBadge.sol`
- `contracts/reactive/ProtoMonReactiveBadge.sol`
- `script/deploy-origin.s.sol`
- `script/deploy-destination.s.sol`
- `script/deploy-reactive.s.sol`
- `README.md` 中的英文部署与 workflow 说明
- `docs/addresses.md` 中列出的全部已部署地址
- `docs/tx-hashes.md` 中列出的 origin tx / reactive tx / destination tx
- `demo/demo-script.md` 或 5 分钟内视频说明

---

## 2. 总体架构

```text
[Frontend / Next.js]
  ├─ 本地 UI 状态、锁骰、动画、optimistic damage
  ├─ 调用 Backend 获取权威骰面
  ├─ 调用 AA wallet 发送 castTurn UserOp
  └─ 监听 L2 receipt / events 对账

[Backend / Next.js API + Redis]
  ├─ createSession
  ├─ roll
  ├─ reroll
  └─ finalizeRound -> 仅签名最终骰面证明

[L2 Origin / Base Sepolia]
  └─ ProtoMonGame.sol
      ├─ startGame
      ├─ castTurn
      ├─ scoreUpper / scoreLower
      ├─ emit TurnPlayed
      └─ emit GameWon

[Reactive Lasna]
  └─ ProtoMonReactiveBadge.sol
      ├─ subscribe GameWon event
      ├─ react(LogRecord)
      └─ emit Callback(destinationChain, badgeContract, gasLimit, payload)

[L1 Testnet Destination / Ethereum Sepolia]
  └─ ProtoMonBadge.sol
      └─ reactiveMint(address rvmId, bytes32 gameId, address recipient, uint8 bossId)
```

---

## 3. 统一数据模型

### 3.1 核心枚举

```solidity
enum SlotId {
    Upper1,   // 0
    Upper2,   // 1
    Upper3,   // 2
    Upper4,   // 3
    Upper5,   // 4
    Upper6,   // 5
    ThreeKind,      // 6
    FourKind,       // 7
    FullHouse,      // 8
    SmallStraight,  // 9
    LargeStraight,  // 10
    Yahtzee,        // 11
    Chance          // 12
}
```

说明：

- 前 6 个是上半区，对应 6 元素。
- 后 7 个是下半区，对应经典快艇牌型。
- 合约内一律用 `uint8` / `SlotId`，前端再映射中文名和图标。

### 3.2 Dice 表示方式

```ts
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
export type DiceArray = [DiceValue, DiceValue, DiceValue, DiceValue, DiceValue];
```

MVP ProtoMon 映射如下：

- 1 = 水
- 2 = 金
- 3 = 土
- 4 = 气
- 5 = 木
- 6 = 火

### 3.3 Boss 配置

```ts
export type BossConfig = {
  bossId: number;
  name: string;
  targetHp: number;
}
```

MVP 固定：

```ts
export const BOSS_1 = {
  bossId: 1,
  name: 'Goblin Hacker',
  targetHp: 150,
};
```

### 3.4 Dealer Proof 结构

后端只在玩家结束本回合时签一次。

```ts
export type DealerProof = {
  gameId: string;
  player: `0x${string}`;
  rewardRecipient: `0x${string}`;
  turn: number;
  finalRollCount: number;
  dice: DiceArray;
  expiry: number;
  chainId: number;
  verifyingContract: `0x${string}`;
  backendSig: `0x${string}`;
}
```

字段说明：

- `gameId`：本局唯一 ID，建议 `bytes32`。
- `player`：AA smart account 地址，不是 EOA。
- `rewardRecipient`：最终接收徽章的钱包地址，建议用主钱包 EOA。
- `turn`：当前第几回合，范围 `1..13`。
- `finalRollCount`：本回合最终第几次掷骰，范围 `1..3`。
- `dice`：最终锁定骰面。
- `expiry`：证明过期时间戳。
- `chainId`：L2 origin 链 ID，避免跨链重放。
- `verifyingContract`：`ProtoMonGame` 地址，避免跨合约重放。
- `backendSig`：后端 EIP-712 签名。

### 3.5 链上 GameSession 结构

```solidity
struct GameSession {
    address playerSmartAccount;
    address rewardRecipient;
    uint8 bossId;
    uint8 turn;              // 当前回合，初始为 1
    uint16 bossHp;
    uint8 rollLimit;         // 固定 3
    uint16 upperSubtotal;
    bool upperBonusClaimed;
    uint16 usedSlotsBitmap;  // 13 个槽位够用
    bool finished;
    bool won;
}
```

字段说明：

- `playerSmartAccount`：发起 `castTurn()` 的 4337 账户地址。
- `rewardRecipient`：未来在 destination 链 mint badge 的目标地址。
- `bossId`：当前关卡 boss。
- `turn`：当前回合。
- `bossHp`：Boss 剩余血量。
- `rollLimit`：固定写 3，方便前端读配置。
- `upperSubtotal`：上半区累计分，用于判断 63 bonus。
- `upperBonusClaimed`：35 bonus 是否已经触发过。
- `usedSlotsBitmap`：13 个槽位占用情况。
- `finished`：局是否结束。
- `won`：是否胜利。

---

## 4. 规则锁定

### 4.1 本次 MVP 采用的固定规则

- 共 13 回合。
- 每回合最多 3 次掷骰。
- 第 1 次必须投 5 颗。
- 玩家可以在第 1 或第 2 次后提前结束本回合。
- 每回合必须选 1 个未使用槽位。
- 不满足条件时可填 0。
- 上半区累计首次达到 `>= 63` 时，立即额外造成 **35 点真实伤害**。
- 下半区分值：
  - `ThreeKind` = 五骰总和
  - `FourKind` = 五骰总和
  - `FullHouse` = 25
  - `SmallStraight` = 30
  - `LargeStraight` = 40
  - `Yahtzee` = 50
  - `Chance` = 五骰总和

### 4.2 本次 MVP 明确不做

- 额外 Yahtzee bonus
- Joker rule
- 遗物 / shop 实际逻辑
- 御三家数值差异
- Buff / Debuff 实际结算
- 局外资产系统

---

## 5. 前端实现说明（Next.js）

推荐目录：

```text
app/
  battle/[gameId]/page.tsx
  api/
components/
  battle/
    DiceBoard.tsx
    ScoreBoard.tsx
    BossPanel.tsx
    SyncStatus.tsx
    SessionGate.tsx
lib/
  game/
    scoring.ts
    slots.ts
    dice.ts
  aa/
    smartAccount.ts
  api/
    backend.ts
  chain/
    gameContract.ts
store/
  battleStore.ts
types/
  game.ts
```

### 5.1 前端 Battle Store

```ts
type SyncStatus = 'LOCAL_APPLIED' | 'PENDING_CHAIN' | 'CONFIRMED' | 'RETRYABLE_FAIL' | 'ROLLBACK';

type BattleState = {
  gameId: string;
  smartAccount: `0x${string}`;
  rewardRecipient: `0x${string}`;
  bossHpLocal: number;
  bossHpChain: number;
  turn: number;
  rollCount: number;
  dice: DiceArray | null;
  locked: [boolean, boolean, boolean, boolean, boolean];
  usedSlots: Record<number, boolean>;
  upperSubtotalLocal: number;
  upperBonusClaimedLocal: boolean;
  syncStatus: SyncStatus;
  pendingTxHash?: `0x${string}`;
}
```

### 5.2 前端本地函数

#### `computeLocalScore(slotId, dice, state)`

作用：本地乐观计算本回合伤害。  
输入：

- `slotId: number`
- `dice: DiceArray`
- `state: BattleState`

输出：

```ts
{
  slotScore: number;
  bonusDamage: number;
  totalDamage: number;
  nextUpperSubtotal: number;
  nextUpperBonusClaimed: boolean;
}
```

说明：

- `slotScore` 是本槽位原始得分。
- `bonusDamage` 仅在上半区累计首次达到 63 时为 35。
- `totalDamage = slotScore + bonusDamage`。

#### `applyLocalCast(slotId)`

作用：点击 CAST 后立刻更新本地 UI。  
逻辑：

1. 调用 `computeLocalScore`
2. 立刻扣减 `bossHpLocal`
3. 标记 `usedSlots[slotId] = true`
4. `syncStatus = 'PENDING_CHAIN'`
5. 播放伤害动画

#### `reconcileFromReceipt(turnPlayedEvent)`

作用：链上回执返回后对账。  
输入：解析出的 `TurnPlayed` event。  
逻辑：

1. 用事件里的 `bossHpAfter` 覆盖 `bossHpChain`
2. 比较 `bossHpAfter` 与当前 `bossHpLocal`
3. 一致则：`syncStatus = 'CONFIRMED'`
4. 不一致则：
   - `bossHpLocal = bossHpAfter`
   - `upperSubtotalLocal = upperSubtotalAfter`
   - `usedSlots = bitmapToSlots(usedSlotsBitmap)`
   - `syncStatus = 'ROLLBACK'`

#### `resetRoundLocal()`

作用：链上确认后进入下一回合的前端收尾。  
逻辑：

- `dice = null`
- `locked = [false, false, false, false, false]`
- `rollCount = 0`
- `turn += 1`

### 5.3 前端 API 封装函数

#### `createGameSession(input)`

```ts
type CreateGameSessionInput = {
  smartAccount: `0x${string}`;
  rewardRecipient: `0x${string}`;
  bossId: number;
}
```

返回：

```ts
{
  gameId: string;
  bossId: number;
  bossHp: number;
  turn: number;
}
```

#### `rollDice(input)`

```ts
type RollDiceInput = {
  gameId: string;
  player: `0x${string}`;
}
```

返回：

```ts
{
  gameId: string;
  turn: number;
  rollCount: number;
  dice: DiceArray;
}
```

#### `rerollDice(input)`

```ts
type RerollDiceInput = {
  gameId: string;
  player: `0x${string}`;
  holdMask: number; // 5 bit，例如 0b10110
}
```

说明：

- bit = 1 表示保留该骰子
- bit = 0 表示该位置重摇

返回：

```ts
{
  gameId: string;
  turn: number;
  rollCount: number;
  dice: DiceArray;
}
```

#### `finalizeRound(input)`

```ts
type FinalizeRoundInput = {
  gameId: string;
  player: `0x${string}`;
  rewardRecipient: `0x${string}`;
}
```

返回：

```ts
DealerProof
```

### 5.4 前端链交互函数

#### `sendCastTurnUserOp(input)`

```ts
type SendCastTurnUserOpInput = {
  gameId: string;
  slotId: number;
  proof: DealerProof;
}
```

作用：通过 4337 smart account 发送 `castTurn()`。

返回：

```ts
{
  userOpHash: string;
  txHash?: string;
}
```

#### `waitForTurnPlayed(txHash)`

输入：`txHash`  
输出：

```ts
{
  eventName: 'TurnPlayed';
  args: {
    gameId: string;
    player: string;
    rewardRecipient: string;
    turn: number;
    slotId: number;
    damage: number;
    bossHpAfter: number;
    upperSubtotalAfter: number;
    usedSlotsBitmap: number;
    won: boolean;
  }
}
```

### 5.5 前端页面流程

#### A. 大厅页

1. 连接主钱包
2. 调用 `enableSessionKey()`
3. 调用 `createGameSession()`
4. 调用链上 `startGame(gameId, rewardRecipient, bossId)`
5. 跳转 `/battle/[gameId]`

#### B. 战斗页

1. 点击 `ROLL`
2. 调用 `rollDice()`
3. 展示骰面
4. 锁定 / 解锁
5. 若需要重摇，调用 `rerollDice()`
6. 玩家点某个槽位 `CAST`
7. 前端执行 `applyLocalCast(slotId)`
8. 同时调用 `finalizeRound()` 获取 `DealerProof`
9. 调用 `sendCastTurnUserOp({ gameId, slotId, proof })`
10. 等待 `TurnPlayed`
11. 执行 `reconcileFromReceipt()`
12. 若 `won == true`，跳转 Victory 页面
13. 否则 `resetRoundLocal()`

### 5.6 Session Key 前端接口

#### `enableSessionKey(input)`

```ts
type EnableSessionKeyInput = {
  ownerEoa: `0x${string}`;
  smartAccount: `0x${string}`;
  gameId: string;
  gameContract: `0x${string}`;
  validUntil: number;
  allowedSelectors: `0x${string}`[]; // 只允许 castTurn(bytes32,uint8,proof)
}
```

约束：

- 只允许本局 `gameId`
- 只允许 `ProtoMonGame` 合约
- 只允许 `castTurn` / 可选 `startGame`
- 只允许指定链
- 有效期建议 30~60 分钟

#### `revokeSessionKey(gameId)`

作用：战斗结束、退出页面、超时后撤销 session 权限。

---

## 6. 后端实现说明（Next.js API + Redis）

推荐目录：

```text
app/api/game/create/route.ts
app/api/game/roll/route.ts
app/api/game/reroll/route.ts
app/api/game/finalize/route.ts
lib/server/redis.ts
lib/server/rng.ts
lib/server/dealerSigner.ts
lib/server/gameSession.ts
```

### 6.1 Redis Key 设计

#### `game:{gameId}`

```json
{
  "gameId": "0x...",
  "player": "0x...",
  "rewardRecipient": "0x...",
  "bossId": 1,
  "turn": 1,
  "rollCount": 0,
  "currentDice": [0,0,0,0,0],
  "finalized": false,
  "createdAt": 0,
  "expiresAt": 0
}
```

字段说明：

- `turn`：当前后端认为的回合号。
- `rollCount`：当前回合已经摇了几次。
- `currentDice`：当前回合后端权威骰面。
- `finalized`：该回合是否已经签发 proof。
- `expiresAt`：清理过期 session 用。

### 6.2 后端公共函数

#### `generateDice(): DiceArray`

作用：生成 5 个 `1..6` 骰子。

#### `rerollWithMask(currentDice, holdMask): DiceArray`

输入：

- `currentDice: DiceArray`
- `holdMask: number`

逻辑：

- 遍历 5 位
- `holdMask` 中 bit=1 保持原值
- bit=0 生成新值

#### `buildDealerProof(input): DealerProof`

```ts
type BuildDealerProofInput = {
  gameId: string;
  player: `0x${string}`;
  rewardRecipient: `0x${string}`;
  turn: number;
  finalRollCount: number;
  dice: DiceArray;
  expiry: number;
  chainId: number;
  verifyingContract: `0x${string}`;
}
```

作用：按 EIP-712 domain + typed data 签名。

### 6.3 API 1：`POST /api/game/create`

作用：创建后端对局 session。

请求：

```json
{
  "player": "0xSmartAccount",
  "rewardRecipient": "0xEOA",
  "bossId": 1
}
```

响应：

```json
{
  "gameId": "0xBytes32",
  "player": "0xSmartAccount",
  "rewardRecipient": "0xEOA",
  "bossId": 1,
  "turn": 1,
  "rollCount": 0
}
```

逻辑：

1. 生成 `gameId`
2. 初始化 Redis
3. 设置 TTL，建议 2 小时

### 6.4 API 2：`POST /api/game/roll`

作用：本回合第一次掷骰。

请求：

```json
{
  "gameId": "0xBytes32",
  "player": "0xSmartAccount"
}
```

响应：

```json
{
  "gameId": "0xBytes32",
  "turn": 1,
  "rollCount": 1,
  "dice": [1,4,4,2,6]
}
```

校验：

- session 存在
- `player` 一致
- `rollCount == 0`
- `finalized == false`

状态更新：

- `currentDice = newDice`
- `rollCount = 1`

### 6.5 API 3：`POST /api/game/reroll`

作用：第 2 / 3 次重摇。

请求：

```json
{
  "gameId": "0xBytes32",
  "player": "0xSmartAccount",
  "holdMask": 22
}
```

响应：

```json
{
  "gameId": "0xBytes32",
  "turn": 1,
  "rollCount": 2,
  "dice": [1,4,5,2,5]
}
```

校验：

- session 存在
- `rollCount >= 1 && rollCount < 3`
- `finalized == false`
- `holdMask` 在 `0..31`

状态更新：

- `currentDice = rerollWithMask(currentDice, holdMask)`
- `rollCount += 1`

### 6.6 API 4：`POST /api/game/finalize`

作用：本回合结束，后端只对最终骰面签发证明。

请求：

```json
{
  "gameId": "0xBytes32",
  "player": "0xSmartAccount",
  "rewardRecipient": "0xEOA"
}
```

响应：

```json
{
  "gameId": "0xBytes32",
  "player": "0xSmartAccount",
  "rewardRecipient": "0xEOA",
  "turn": 1,
  "finalRollCount": 2,
  "dice": [1,4,5,2,5],
  "expiry": 1749999999,
  "chainId": 84532,
  "verifyingContract": "0xProtoMonGame",
  "backendSig": "0x..."
}
```

校验：

- `rollCount >= 1`
- `finalized == false`

状态更新：

- `finalized = true`

注意：

- `finalize` 之后，本回合不能再 `reroll`
- 只有前端拿到 proof 后，才能调用链上 `castTurn`

### 6.7 API 5：`POST /api/game/advance`

**可选**。若你们想把 Redis 回合推进做得更严谨，可以加这个接口。

用途：前端在链上 `TurnPlayed` 确认后，通知后端进入下一回合。

请求：

```json
{
  "gameId": "0xBytes32",
  "player": "0xSmartAccount",
  "nextTurn": 2,
  "txHash": "0x..."
}
```

逻辑：

- 把 Redis 中：
  - `turn = nextTurn`
  - `rollCount = 0`
  - `currentDice = [0,0,0,0,0]`
  - `finalized = false`

如果想进一步简化，也可以不做 `/advance`，改由前端在下一次 `roll` 时附带 `turn`，后端自动检查是否与缓存一致。

---

## 7. 链端实现说明（Base Sepolia + Sepolia + Reactive）

链端分 3 块：

1. `ProtoMonGame.sol` on Base Sepolia
2. `ProtoMonBadge.sol` on Ethereum Sepolia
3. `ProtoMonReactiveBadge.sol` on Reactive Lasna

### 7.1 L2 Origin：`ProtoMonGame.sol`

#### 7.1.1 合约状态变量

```solidity
address public immutable backendSigner;
bytes32 public immutable DEALER_PROOF_TYPEHASH;
mapping(bytes32 => GameSession) public games;
mapping(bytes32 => bool) public usedDealerProofs;
```

说明：

- `backendSigner`：后端 EIP-712 验签地址。
- `DEALER_PROOF_TYPEHASH`：DealerProof typed data hash。
- `games`：本局状态。
- `usedDealerProofs`：防 proof 重放。

#### 7.1.2 `startGame()`

```solidity
function startGame(
    bytes32 gameId,
    address rewardRecipient,
    uint8 bossId
) external;
```

参数说明：

- `gameId`：本局 ID，必须唯一。
- `rewardRecipient`：将来目的链接收 badge 的地址。
- `bossId`：目前只支持 `1`。

逻辑：

1. `require(games[gameId].playerSmartAccount == address(0))`
2. 根据 `bossId` 取初始 HP
3. 初始化 `GameSession`
4. `playerSmartAccount = msg.sender`
5. `turn = 1`
6. `bossHp = 150`
7. emit `GameStarted`

#### 7.1.3 `castTurn()`

```solidity
struct DealerProofInput {
    bytes32 gameId;
    address player;
    address rewardRecipient;
    uint8 turn;
    uint8 finalRollCount;
    uint8[5] dice;
    uint64 expiry;
    uint256 chainId;
    address verifyingContract;
    bytes backendSig;
}

function castTurn(
    bytes32 gameId,
    uint8 slotId,
    DealerProofInput calldata proof
) external;
```

参数说明：

- `gameId`：局 ID。
- `slotId`：要结算的槽位 `0..12`。
- `proof`：后端对最终骰面签发的证明。

执行逻辑：

1. 加载 `GameSession storage g = games[gameId]`
2. `require(msg.sender == g.playerSmartAccount)`
3. `require(!g.finished)`
4. `require(g.turn == proof.turn)`
5. `require(proof.player == g.playerSmartAccount)`
6. `require(proof.rewardRecipient == g.rewardRecipient)`
7. `require(block.timestamp <= proof.expiry)`
8. `require(proof.chainId == block.chainid)`
9. `require(proof.verifyingContract == address(this))`
10. `require(!_isSlotUsed(g.usedSlotsBitmap, slotId))`
11. `_verifyDealerProof(proof)`
12. `proofHash = _hashDealerProof(proof)`，并检查 `usedDealerProofs[proofHash] == false`
13. `damage = _computeDamage(slotId, proof.dice, g)`
14. `g.usedSlotsBitmap = _markSlotUsed(...)`
15. 更新 `g.upperSubtotal / g.upperBonusClaimed`
16. `g.bossHp = max(0, g.bossHp - damage)`
17. 若 `g.bossHp == 0`：
    - `g.finished = true`
    - `g.won = true`
18. 否则若 `g.turn == 13`：
    - `g.finished = true`
    - `g.won = false`
19. 否则 `g.turn += 1`
20. `usedDealerProofs[proofHash] = true`
21. emit `TurnPlayed`
22. 若胜利，额外 emit `GameWon`

#### 7.1.4 `getGame()`

```solidity
function getGame(bytes32 gameId) external view returns (GameSession memory);
```

作用：前端和 agent 查询当前链上真实状态。

#### 7.1.5 `previewScore()`

```solidity
function previewScore(uint8 slotId, uint8[5] calldata dice)
    external
    pure
    returns (uint16 slotScore, bool qualifies);
```

作用：便于前端 / agent / 测试脚本复用链上规则。

#### 7.1.6 内部函数

```solidity
function _computeDamage(
    uint8 slotId,
    uint8[5] calldata dice,
    GameSession storage g
) internal returns (uint16 damage);

function _scoreUpper(uint8 slotId, uint8[5] calldata dice)
    internal
    pure
    returns (uint16);

function _scoreLower(uint8 slotId, uint8[5] calldata dice)
    internal
    pure
    returns (uint16 score, bool qualifies);

function _isSmallStraight(uint8[5] calldata dice) internal pure returns (bool);
function _isLargeStraight(uint8[5] calldata dice) internal pure returns (bool);
function _countFaces(uint8[5] calldata dice) internal pure returns (uint8[7] memory);
```

#### 7.1.7 事件定义

```solidity
event GameStarted(
    bytes32 indexed gameId,
    address indexed player,
    address indexed rewardRecipient,
    uint8 bossId,
    uint16 bossHp
);

event TurnPlayed(
    bytes32 indexed gameId,
    address indexed player,
    address indexed rewardRecipient,
    uint8 turn,
    uint8 slotId,
    uint16 damage,
    uint16 bossHpAfter,
    uint16 upperSubtotalAfter,
    uint16 usedSlotsBitmap,
    bool won
);

event GameWon(
    bytes32 indexed gameId,
    address indexed player,
    address indexed rewardRecipient,
    uint8 bossId,
    uint16 finalBossHp
);
```

### 7.2 Destination：`ProtoMonBadge.sol`

用途：接收 Reactive callback，给 `rewardRecipient` mint 一次性 badge。

#### 7.2.1 状态变量

```solidity
address public immutable callbackProxy;
address public reactiveContract;
mapping(bytes32 => bool) public badgeMinted;
```

说明：

- `callbackProxy`：对应 destination 链的 Reactive Callback Proxy。
- `reactiveContract`：被允许触发 callback 的 RC 对应 RVM ID。
- `badgeMinted`：按 `gameId` 防止重复 mint。

#### 7.2.2 `reactiveMint()`

```solidity
function reactiveMint(
    address rvmId,
    bytes32 gameId,
    address recipient,
    uint8 bossId
) external;
```

参数说明：

- `rvmId`：Reactive 系统塞进 payload 的第一个参数。
- `gameId`：局 ID。
- `recipient`：接收 badge 的地址。
- `bossId`：关卡编号。

逻辑：

1. `require(msg.sender == callbackProxy)`
2. `require(rvmId == reactiveContract)`
3. `require(!badgeMinted[gameId])`
4. `badgeMinted[gameId] = true`
5. `_mint(recipient, tokenId)` 或 `_safeMint`
6. emit `BadgeMinted(gameId, recipient, bossId)`

#### 7.2.3 `setReactiveContract()`

```solidity
function setReactiveContract(address newReactiveContract) external onlyOwner;
```

用途：Reactive RC 地址部署后回填。

### 7.3 Reactive：`ProtoMonReactiveBadge.sol`

职责：监听 Base Sepolia `GameWon` 事件，并向 Ethereum Sepolia badge 合约 callback。

#### 7.3.1 构造参数

```solidity
constructor(
    uint256 originChainId,
    address originGame,
    uint256 destinationChainId,
    address destinationBadge,
    uint64 callbackGasLimit,
    address callbackProxy
)
```

参数说明：

- `originChainId`：Base Sepolia = `84532`
- `originGame`：`ProtoMonGame` 地址
- `destinationChainId`：Ethereum Sepolia = `11155111`
- `destinationBadge`：`ProtoMonBadge` 地址
- `callbackGasLimit`：目的链执行 gas 上限
- `callbackProxy`：Reactive 文档里的 destination callback proxy 地址

#### 7.3.2 构造函数逻辑

1. 调用 Reactive library 基类构造函数
2. 记录 origin / destination 参数
3. 订阅 `GameWon(bytes32,address,address,uint8,uint16)` 事件 topic

#### 7.3.3 `react()`

```solidity
function react(LogRecord calldata log) external vmOnly;
```

逻辑：

1. 校验 `log.chain_id == originChainId`
2. 校验 `log._contract == originGame`
3. 解析 `GameWon` 事件 data / topics
4. 取出：
   - `gameId`
   - `rewardRecipient`
   - `bossId`
5. 构造 payload：

```solidity
bytes memory payload = abi.encodeWithSignature(
    "reactiveMint(address,bytes32,address,uint8)",
    address(0),
    gameId,
    rewardRecipient,
    bossId
);
```

注意：第一个 `address(0)` 只是占位，Reactive 会自动替换成真实 `rvmId`。

6. emit callback：

```solidity
emit Callback(destinationChainId, destinationBadge, callbackGasLimit, payload);
```

---

## 8. 规则函数的精确实现建议

### 8.1 `ThreeKind` / `FourKind`

```solidity
if (maxCount >= 3) return sumAllDice(dice);
return 0;
```

```solidity
if (maxCount >= 4) return sumAllDice(dice);
return 0;
```

### 8.2 `FullHouse`

要求计数数组中存在 `3` 和 `2`。

```solidity
if (hasThree && hasTwo) return 25;
return 0;
```

### 8.3 `SmallStraight`

去重后检查是否包含以下任一序列：

- `1,2,3,4`
- `2,3,4,5`
- `3,4,5,6`

命中返回 `30`。

### 8.4 `LargeStraight`

排序去重后必须等于：

- `1,2,3,4,5`
- 或 `2,3,4,5,6`

命中返回 `40`。

### 8.5 `Yahtzee`

五个骰子相同则返回 `50`。

### 8.6 `Upper Bonus`

在 `_computeDamage()` 中处理：

```solidity
if (isUpperSlot) {
    uint16 nextSubtotal = g.upperSubtotal + slotScore;
    if (!g.upperBonusClaimed && nextSubtotal >= 63) {
        bonusDamage = 35;
        g.upperBonusClaimed = true;
    }
    g.upperSubtotal = nextSubtotal;
}
```

---

## 9. 4337 集成边界

### 9.1 我们的集成原则

- 不把 session key 写死成某个钱包厂商特性
- 只要求当前 smart account SDK 支持：
  - session delegation / permission plugin
  - 静默发送 `UserOperation`
  - 等待 tx receipt

### 9.2 必须限制的权限

session key 必须至少限制：

- `chainId == 84532`
- `targetContract == ProtoMonGame`
- `allowedSelector == castTurn(bytes32,uint8,(...))`
- `gameId == 当前 gameId`
- `validUntil <= now + 3600`
- 不允许 `approve/transfer` 任意 token

### 9.3 最小可行实现

若你们时间极紧：

- 第一天先用普通 EOA 直连把 `castTurn()` 跑通
- 第二天再把外层发送器替换成 4337 smart account
- 不要先把时间耗死在 AA 集成里

---

## 10. 实现顺序（照着做就能做完）

### Phase 1：规则与链端最小闭环

1. 写 `ProtoMonGame.sol`
2. 完成 `startGame()`
3. 完成 `_scoreUpper()` / `_scoreLower()`
4. 完成 `castTurn()`
5. 完成 `TurnPlayed` / `GameWon` 事件
6. 写 Foundry 单测：
   - 13 槽位得分测试
   - 63 bonus 测试
   - proof replay 测试
   - slot reuse 测试
   - expired proof 测试

### Phase 2：后端权威骰面

1. 写 `/api/game/create`
2. 写 `/api/game/roll`
3. 写 `/api/game/reroll`
4. 写 `/api/game/finalize`
5. 用 Postman / curl 跑通：
   - create -> roll -> reroll -> finalize
6. 保证 finalize 后不能再次 reroll

### Phase 3：前端可玩

1. 写战斗页基础 UI
2. 接通 `rollDice()` / `rerollDice()`
3. 实现本地 `computeLocalScore()`
4. 实现 `applyLocalCast()`
5. 用 EOA 临时直发 `castTurn()`
6. receipt 回来后 `reconcileFromReceipt()`

### Phase 4：4337 Session Key

1. 接 smart account provider
2. 实现 `enableSessionKey()`
3. 用 session key 替换 EOA 发送器
4. 页面退出时 `revokeSessionKey()`

### Phase 5：Reactive 跨链发奖

1. 写 `ProtoMonBadge.sol`
2. 写 `ProtoMonReactiveBadge.sol`
3. 部署 badge 合约到 Ethereum Sepolia
4. 部署 reactive 合约到 Lasna
5. 在 Base Sepolia 打出 `GameWon`
6. 记录：
   - origin tx
   - reactive tx
   - destination tx
7. 验证 badge 已 mint

### Phase 6：黑客松提交流水线

1. README 改英文
2. 补部署步骤
3. 补合约地址表
4. 补交易哈希表
5. 录 5 分钟视频
6. 准备 Demo Day 英文 1 页总结

---

## 11. 最低验收标准

### 11.1 前端验收

- 可以开局
- 可以 roll / lock / reroll
- 可以点击一个槽位 CAST
- 本地立即掉血
- 2~10 秒内出现链上同步状态
- 若链上结果不同，会回滚到链上真实血量

### 11.2 后端验收

- 同一回合最多 3 次 roll
- finalize 后不能 reroll
- 不保存 slotId
- proof 带 `gameId / turn / dice / chainId / verifyingContract / expiry`

### 11.3 链端验收

- slot 不能重复使用
- proof 不能重复使用
- 过期 proof 不能用
- 伤害完全由合约计算
- `GameWon` 事件能被 Reactive 订阅到

### 11.4 跨链验收

- `ProtoMonReactiveBadge` 成功监听 `GameWon`
- `ProtoMonBadge.reactiveMint()` 只能由 callback proxy 触发
- `rvmId` 校验通过
- 同一 `gameId` 只 mint 一次

---

## 12. 建议的环境变量

### 前端 / 后端

```env
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=
NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=84532
BACKEND_DEALER_PRIVATE_KEY=
REDIS_URL=
AA_BUNDLER_URL=
AA_PAYMASTER_URL=
```

### Foundry / 合约部署

```env
BASE_SEPOLIA_RPC_URL=
ETHEREUM_SEPOLIA_RPC_URL=
REACTIVE_RPC_URL=https://lasna-rpc.rnk.dev/
PRIVATE_KEY=
BACKEND_SIGNER_ADDRESS=
CALLBACK_PROXY_BASE_SEPOLIA=0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6
CALLBACK_PROXY_ETH_SEPOLIA=0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA
```

---

## 13. 建议的仓库结构

```text
/contracts
  /origin
    ProtoMonGame.sol
  /destination
    ProtoMonBadge.sol
  /reactive
    ProtoMonReactiveBadge.sol
/script
  deploy-origin.s.sol
  deploy-destination.s.sol
  deploy-reactive.s.sol
/test
  ProtoMonGame.t.sol
/web
  app/
  components/
  lib/
/docs
  addresses.md
  tx-hashes.md
  architecture.md
/demo
  pitch-script.md
  checklist.md
README.md
```

---

## 14. 最后一句话版本

你们这次 MVP 的本质不是“做一个完整游戏”，而是做一条**可以玩的全链工作流**：

- 前端负责手感
- 后端负责权威骰面证明
- L2 合约负责真实裁决
- Reactive 负责自动跨链发奖

只要这 4 根骨头接上，ProtoMon 这只链上小怪兽就能站起来了。
