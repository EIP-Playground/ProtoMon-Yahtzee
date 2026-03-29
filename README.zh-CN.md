<p align="center">
  <img src="web/public/protomon-logo.png" alt="ProtoMon Logo" width="180" />
</p>

<h1 align="center">ProtoMon</h1>

<p align="center">
  <strong>一个通过 Reactive Contracts 自动触发跨链奖励的链上 Roguelite 骰子战斗游戏：本地手感即时、回合结算可验证、奖励跨层自动落地。</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <strong>视频介绍</strong>：
  <a href="https://youtu.be/es3eoCkF-TE">观看 YouTube 演示视频</a> |
  <strong>在线 Demo</strong>：
  <a href="https://protomon-yahtzee.vercel.app/">protomon-yahtzee.vercel.app</a> |
  <strong>PPT</strong>：
  <a href="./ProtoMon-demo-day-deck.pptx">ProtoMon-demo-day-deck.pptx</a>
</p>

<p align="center">
  <a href="#项目要解决的问题">项目要解决的问题</a> •
  <a href="#解决方案">解决方案</a> •
  <a href="#本项目如何使用-reactive-contracts">Reactive Contracts</a> •
  <a href="#已部署合约">已部署合约</a> •
  <a href="#部署后工作流">工作流</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#参赛材料检查清单">参赛清单</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Solidity-0.8.26-363636?style=flat-square&logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Foundry-latest-FFDB1C?style=flat-square" alt="Foundry" />
  <img src="https://img.shields.io/badge/wagmi-2.19.5-1C1C1C?style=flat-square" alt="wagmi" />
  <img src="https://img.shields.io/badge/Reactive-Network-7C3AED?style=flat-square" alt="Reactive Network" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## 项目要解决的问题

ProtoMon 关注的是链上游戏里一个很实际的矛盾：

- 玩家希望战斗体验是**即时响应**的
- 关键结算又必须是**链上可验证**的
- 通关奖励最好能**自动跨合约、跨网络执行**
- 如果只靠传统后端 watcher / cron / relayer，就会引入额外信任、额外运维和额外失败点

如果没有 Reactive 层，奖励工作流通常需要一个额外中心化服务去：

1. 监听 Origin 合约上的胜利事件
2. 判断奖励应该发给谁
3. 再人工或程序化提交一笔 Destination 交易
4. 处理重试、失败和竞态问题

这会让奖励路径更脆弱，也更依赖中心化操作。

## 解决方案

ProtoMon 是一个 Reactive 驱动的链上 Roguelite 骰子战斗游戏：

- 玩家通过类似快艇骰子的 13 槽位系统攻击 Boss
- 前端提供即时、乐观的战斗手感
- Origin 合约负责回合结算和最终状态
- Reactive Contract 监听 `GameWon`，自动触发目标奖励工作流
- Destination 合约负责记录奖励执行结果

目标是让“打赢 Boss”这件事不只是一个前端状态变化，而是真正变成可被链上事件驱动的自动奖励流程。

## 本项目如何使用 Reactive Contracts

本仓库不是把普通 Solidity 合约机械地部署到 Reactive 网络上，而是把 Reactive Contract 作为真实业务层使用。

### Origin

`contracts/origin/ProtoMonGame.sol`

- 通过 `startGame(...)` 创建战局
- 通过 `playTurn(...)` 结算回合
- 发出 `TurnPlayed`
- 胜利时发出 `GameWon`

### Reactive

`contracts/reactive/ProtoMonReactiveBadge.sol`

- 监听 Origin 侧的 `GameWon`
- 校验来源链、来源合约和事件 topic
- 发出回调请求，驱动 Destination 奖励执行

### Destination

`contracts/destination/ProtoMonBadge.sol`

- 通过 `reactiveMint(...)` 接受回调
- 校验 callback sender 和授权的 Reactive 身份（`rvmId`）
- 防止同一个 `gameId` 重复发奖
- 记录奖励完成，并发出 `BadgeMinted`

这一步正是本项目满足 Reactive 黑客松要求的关键：奖励副作用来自链上事件响应，而不是人工触发。

## 架构说明

### 高层架构

- **Web 应用**：`web/`
  - Next.js App Router 前端
  - RainbowKit / wagmi 钱包接入
  - battle UI、乐观状态管理、API route
- **后端会话层**：位于 `web/app/api/game/*`
  - 权威 roll / reroll
  - dealer proof 生成
  - Redis 会话存储
- **合约层**
  - Origin：`ProtoMonGame`
  - Reactive：`ProtoMonReactiveBadge`
  - Destination：`ProtoMonBadge`
- **部署 / 测试层**
  - Foundry 部署脚本位于 `script/`
  - Solidity 测试位于 `test/`
  - TS / Solidity parity 检查位于 `web/tests/scoring-parity.test.ts`

## 已部署合约

### 部署拓扑

- **Origin**：Ethereum Sepolia (`11155111`)
- **Reactive**：Reactive Lasna (`5318007`)
- **Destination**：Ethereum Sepolia (`11155111`)

### 当前地址

| 层 | 合约 | 地址 |
|------|------|------|
| Origin | `ProtoMonGame` | `0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1` |
| Reactive | `ProtoMonReactiveBadge` | `0xD58e8A8f8BB05badDc2D5fe9AC1957d1e1aa90cE` |
| Destination | `ProtoMonBadge` | `0x34bF4ce1CF676c540fd931B5b4E2012E84ebcDb4` |
| Destination 授权 | authorized `rvmId` | `0x1662C438F7ACEC993993607fC963e279136acEd6` |

## 部署后工作流

当前设计的部署后工作流如下：

1. 前端创建游戏 session，并在 Origin 合约上开局
2. 后端 finalize 当前回合并返回 dealer proof
3. 前端把 `playTurn(...)` 提交到 `ProtoMonGame`
4. `ProtoMonGame` 更新状态并发出 `TurnPlayed`
5. 如果玩家获胜，`ProtoMonGame` 发出 `GameWon`
6. `ProtoMonReactiveBadge` 响应 `GameWon`
7. Reactive callback 到达 `ProtoMonBadge.reactiveMint(...)`
8. Destination 合约记录奖励执行，并发出 `BadgeMinted`

部署顺序和环境变量细节见：[docs/deployment-workflow.md](docs/deployment-workflow.md)

## 交易哈希记录

### 已有部署交易

| 步骤 | 网络 | 交易哈希 |
|------|------|------|
| 部署 `ProtoMonGame` | Ethereum Sepolia | `0x05c25503d28f1cef762424d54c11aea1e57f32ba121ea00f0e9cb6f9f963052` |
| 部署 `ProtoMonBadge` | Ethereum Sepolia | `0xaac37388f09032e636aef4dfc4db2178defec4e72e5052b0a4a9d1cd9af9f36ca` |
| 部署 `ProtoMonReactiveBadge` | Reactive Lasna | `0x0ee3a7e04bfad6c99594db858ab7c58aac1dbd3f9dffad46bc77b9ef7be34e8d` |
| `setAuthorizedRvmId(...)` | Ethereum Sepolia | `0x25028338ad4d1ec67644afed18483c9794d90691ec3dd4e3d34c253dd230dc5f` |

### 完整工作流交易

以下真实工作流交易已经在链上确认：

| 工作流步骤 | 状态 | 交易哈希 |
|------|------|------|
| 一笔成功的 `startGame(...)` | 已确认 | `0x645a4194005341e80087cb7de8e3bd8359980c5ba9c65ce8d87b8d960ef4b062` |
| 一笔成功的 `playTurn(...)` | 已确认 | `0x4b5f6fbb0f0d125cfdd2a7fb015f9ca0e249b912c6073073dc6bd065cb66de02` |
| 一笔 Reactive callback 交易 | 已确认 | `0xef81ed4d730b68624e0c1a881d09cb5fe17b3c1682274d076d71c952229ad43` |
| 一笔目标奖励执行 / `reactiveMint(...)` | 已确认 | `0xbefc88d8c8f45f22b68a6b4b5edf7cb1686eec2b54acfd4ff4677ee5271a5112` |

## 项目结构

```text
ProtoMon-Yahtzee/
├── contracts/
│   ├── destination/
│   │   └── ProtoMonBadge.sol
│   ├── origin/
│   │   └── ProtoMonGame.sol
│   └── reactive/
│       └── ProtoMonReactiveBadge.sol
├── docs/
│   ├── contract-code-review.md
│   ├── deployment-workflow.md
│   ├── parity-workflow.md
│   └── testing-plan.md
├── script/
│   ├── deploy-origin.s.sol
│   ├── deploy-destination.s.sol
│   ├── deploy-reactive.s.sol
│   └── set-destination-rvm-id.s.sol
├── test/
│   ├── ProtoMonBadge.t.sol
│   ├── ProtoMonGame.t.sol
│   └── ProtoMonReactiveBadge.t.sol
└── web/
    ├── app/
    ├── components/
    ├── lib/
    ├── public/
    └── tests/
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm
- Foundry
- Redis 或 Upstash Redis 凭据

### 1. 克隆仓库

```bash
git clone <YOUR_FORK_OR_REPO_URL>
cd ProtoMon-Yahtzee
```

### 2. 运行合约测试

```bash
forge test
```

### 3. 配置 web 应用

```bash
cp web/.env.example web/.env.local
cd web
pnpm install
```

### 4. 配置环境变量

`web/.env.local` 关键字段：

```env
NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS=0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
BACKEND_DEALER_PRIVATE_KEY=YOUR_PRIVATE_KEY
NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL=YOUR_RPC_URL

# 二选一
# REDIS_URL=redis://127.0.0.1:6379
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 5. 当前推荐的本地开发模式

当前更稳定的本地路径是：

- 使用普通钱包 sender 流程
- 尽量使用本地 Redis 提高响应速度
- 把 AA / session-key 相关环境变量视为实验路径

如果你想走当前最稳定的本地模式，建议设置：

```env
NEXT_PUBLIC_AA_ENABLED=false
```

### 6. 启动 web 应用

```bash
cd web
pnpm dev
```

### 7. 常用验证命令

```bash
# repo root
forge test

# web/
pnpm test
pnpm test:parity
pnpm lint
pnpm build
```

## 当前状态与已知缺口

### 已完成

- Origin / Reactive / Destination 三层合约已部署
- Foundry 部署脚本和文档已补齐
- 三层 Solidity 测试已具备
- TS / Solidity 计分 parity 已建立
- battle 前端和 origin 合约的结算链路已接上
- 本地 Redis 开发路径已支持

### 未完成

- 可稳定使用的 ERC-4337 session-key UX
- 如果需要最终 NFT 标准资产，还需要升级当前 Destination 奖励合约

## 参赛材料检查清单

下表用于把当前仓库内容映射到黑客松要求：

| 要求 | 状态 | 说明 |
|------|------|------|
| 有效使用 Reactive Contracts | 已满足 | `ProtoMonReactiveBadge` 真实响应 Origin 事件并驱动奖励流程。 |
| 提交完整合约代码 | 已满足 | Origin / Reactive / Destination 合约与脚本均在仓库中。 |
| 包含 Origin 合约 | 已满足 | `contracts/origin/ProtoMonGame.sol` 已包含。 |
| 公示已部署合约地址 | 已满足 | 本 README 已列出地址。 |
| 解释问题与解决方案 | 已满足 | 见上方问题 / 解决方案章节。 |
| 提供部署后工作流说明 | 已满足 | 见部署后工作流章节。 |
| 提供完整工作流 tx hashes | 已满足 | 部署交易和 live workflow 交易已在上方交易记录章节列出。 |
| 提交 demo video | 已满足 | README 顶部已附公开视频链接。 |

## 团队

- David — 设计与全栈
- Swen — 智能合约与 Reactive 工作流

## 致谢

- Reactive Network 提供响应式执行模型
- Foundry 提供 Solidity 开发与测试工作流
- Next.js、wagmi、viem、RainbowKit 支撑 web 端体验
- OpenZeppelin 与以太坊开源工具生态

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。
