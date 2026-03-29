<p align="center">
  <img src="web/public/protomon-logo.png" alt="ProtoMon Logo" width="180" />
</p>

<h1 align="center">ProtoMon</h1>

<p align="center">
  <strong>A reactive onchain roguelite dice battler with optimistic gameplay, verifiable turn settlement, and automatic cross-chain reward delivery via Reactive Contracts.</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <strong>Video Intro</strong>:
  <a href="https://youtu.be/es3eoCkF-TE">Watch on YouTube</a> |
  <strong>Online Demo</strong>:
  <a href="https://protomon-yahtzee.vercel.app/">protomon-yahtzee.vercel.app</a> |
  <strong>Pitch Deck</strong>:
  <a href="./ProtoMon-demo-day-deck.pptx">ProtoMon-demo-day-deck.pptx</a>
</p>

<p align="center">
  <a href="#problem">Problem</a> •
  <a href="#solution">Solution</a> •
  <a href="#reactive-contracts-in-this-project">Reactive Contracts</a> •
  <a href="#deployed-contracts">Deployed Contracts</a> •
  <a href="#post-deployment-workflow">Workflow</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#submission-checklist">Submission Checklist</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Solidity-0.8.26-363636?style=flat-square&logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Foundry-latest-FFDB1C?style=flat-square" alt="Foundry" />
  <img src="https://img.shields.io/badge/wagmi-2.19.5-1C1C1C?style=flat-square" alt="wagmi" />
  <img src="https://img.shields.io/badge/Reactive-Network-7C3AED?style=flat-square" alt="Reactive Network" />
</p>

---

## Problem

ProtoMon targets a specific product gap in onchain games:

- turn-based games want **instant local responsiveness**
- settlement still needs to be **verifiable onchain**
- rewards should move **automatically across contracts and networks**
- a normal offchain watcher or cron job introduces extra trust, extra operations, and extra failure points

Without a reactive layer, the reward workflow would require a separate backend or relayer service to:

1. monitor the origin contract for a win event
2. detect the correct reward recipient
3. submit a follow-up transaction to the destination contract
4. handle retries and race conditions centrally

That makes the reward path harder to operate, easier to break, and less trust-minimized.

## Solution

ProtoMon is a reactive onchain roguelite dice battler:

- players fight a boss with Yahtzee-style dice slots
- the web client provides fast, optimistic battle UX
- the origin contract is the source of truth for turn settlement
- a Reactive Contract listens for `GameWon` and automatically emits the destination callback workflow
- the destination contract records the badge reward execution

The intended result is a full gameplay loop where battle outcome becomes an onchain event, and the reward side-effect happens automatically from that event.

## Reactive Contracts In This Project

This repository uses Reactive Contracts as an actual workflow layer, not as a passive deployment target.

### Origin

`contracts/origin/ProtoMonGame.sol`

- starts a battle session with `startGame(...)`
- settles turns with `playTurn(...)`
- emits `TurnPlayed`
- emits `GameWon` on victory

### Reactive

`contracts/reactive/ProtoMonReactiveBadge.sol`

- listens for the origin-side `GameWon` event
- validates origin chain / contract / topic inputs
- emits the callback request toward the destination reward contract

### Destination

`contracts/destination/ProtoMonBadge.sol`

- accepts the callback via `reactiveMint(...)`
- validates callback sender and authorized Reactive identity (`rvmId`)
- prevents duplicate reward execution per `gameId`
- records reward completion and emits `BadgeMinted`

This reactive step is the core eligibility point for the hackathon submission: the reward execution is driven by an observed EVM event, not by a manual operator action.

## Architecture

### High-Level Stack

- **Web app**: `web/`
  - Next.js App Router frontend
  - wallet connection via RainbowKit / wagmi
  - battle UI, optimistic local state, and API route handlers
- **Backend game session layer**: inside `web/app/api/game/*`
  - authoritative roll / reroll session state
  - dealer proof generation
  - Redis-backed session persistence
- **Contract layer**
  - Origin: `ProtoMonGame`
  - Reactive: `ProtoMonReactiveBadge`
  - Destination: `ProtoMonBadge`
- **Deployment / testing**
  - Foundry scripts in `script/`
  - Solidity tests in `test/`
  - TS/Solidity parity checks in `web/tests/scoring-parity.test.ts`

## Deployed Contracts

### Network Topology

- **Origin**: Ethereum Sepolia (`11155111`)
- **Reactive**: Reactive Lasna (`5318007`)
- **Destination**: Ethereum Sepolia (`11155111`)

### Current Addresses

| Layer | Contract | Address |
|------|------|------|
| Origin | `ProtoMonGame` | `0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1` |
| Reactive | `ProtoMonReactiveBadge` | `0xD58e8A8f8BB05badDc2D5fe9AC1957d1e1aa90cE` |
| Destination | `ProtoMonBadge` | `0x34bF4ce1CF676c540fd931B5b4E2012E84ebcDb4` |
| Destination auth | authorized `rvmId` | `0x1662C438F7ACEC993993607fC963e279136acEd6` |

## Post-Deployment Workflow

The intended deployed workflow is:

1. the frontend creates a game session and starts the origin-side game
2. the backend finalizes the current turn and returns a dealer proof
3. the frontend submits `playTurn(...)` to `ProtoMonGame`
4. `ProtoMonGame` updates state and emits `TurnPlayed`
5. on victory, `ProtoMonGame` emits `GameWon`
6. `ProtoMonReactiveBadge` reacts to `GameWon`
7. the Reactive callback reaches `ProtoMonBadge.reactiveMint(...)`
8. the destination contract records the reward and emits `BadgeMinted`

For deployment order and env requirements, see [docs/deployment-workflow.md](docs/deployment-workflow.md).

## Transaction Records

### Deployment Transactions

| Step | Network | Transaction Hash |
|------|------|------|
| Deploy `ProtoMonGame` | Ethereum Sepolia | `0x05c25503d28f1cef762424d54c11aea1e57f32ba121ea00f0e9cb6f9f963052` |
| Deploy `ProtoMonBadge` | Ethereum Sepolia | `0xaac37388f09032e636aef4dfc4db2178defec4e72e5052b0a4a9d1cd9af9f36ca` |
| Deploy `ProtoMonReactiveBadge` | Reactive Lasna | `0x0ee3a7e04bfad6c99594db858ab7c58aac1dbd3f9dffad46bc77b9ef7be34e8d` |
| `setAuthorizedRvmId(...)` | Ethereum Sepolia | `0x25028338ad4d1ec67644afed18483c9794d90691ec3dd4e3d34c253dd230dc5f` |

### End-to-End Workflow Transactions

The following live workflow transactions have been confirmed onchain:

| Workflow Step | Status | Transaction Hash |
|------|------|------|
| One successful `startGame(...)` | Confirmed | `0x645a4194005341e80087cb7de8e3bd8359980c5ba9c65ce8d87b8d960ef4b062` |
| One successful `playTurn(...)` | Confirmed | `0x4b5f6fbb0f0d125cfdd2a7fb015f9ca0e249b912c6073073dc6bd065cb66de02` |
| One Reactive callback transaction | Confirmed | `0xef81ed4d730b68624e0c1a881d09cb5fe17b3c1682274d076d71c952229ad43` |
| One destination reward execution / `reactiveMint(...)` | Confirmed | `0xbefc88d8c8f45f22b68a6b4b5edf7cb1686eec2b54acfd4ff4677ee5271a5112` |

## Repository Structure

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

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Foundry
- Redis or Upstash Redis credentials for backend session storage

### 1. Clone the repository

```bash
git clone <YOUR_FORK_OR_REPO_URL>
cd ProtoMon-Yahtzee
```

### 2. Run contract tests

```bash
forge test
```

### 3. Set up the web app

```bash
cp web/.env.example web/.env.local
cd web
pnpm install
```

### 4. Configure environment variables

Key values in `web/.env.local`:

```env
NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS=0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
BACKEND_DEALER_PRIVATE_KEY=YOUR_PRIVATE_KEY
NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL=YOUR_RPC_URL

# Choose one backend session store
# REDIS_URL=redis://127.0.0.1:6379
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 5. Recommended local development mode

For the current stable local path:

- use the standard wallet sender flow
- keep Redis local if possible for faster iteration
- treat AA/session-key envs as experimental until Pimlico access is fully available

If you want the most stable current local setup, set:

```env
NEXT_PUBLIC_AA_ENABLED=false
```

### 6. Start the web app

```bash
cd web
pnpm dev
```

### 7. Useful validation commands

```bash
# from repo root
forge test

# from web/
pnpm test
pnpm test:parity
pnpm lint
pnpm build
```

## Current Status And Known Gaps

### What is already in place

- deployed origin / reactive / destination contracts
- deployment scripts and handoff docs
- Solidity tests for all three contract layers
- TS/Solidity scoring parity checks
- web battle UI with origin contract settlement wiring
- local Redis support for faster development

### What is not finished yet

- production-ready ERC-4337 session-key UX
- final NFT-standard reward contract upgrade, if required beyond reward recording

## Submission Checklist

This section maps the current repository to the hackathon requirements.

| Requirement | Status | Notes |
|------|------|------|
| Effective use of Reactive Contracts | Ready | `ProtoMonReactiveBadge` reacts to origin events and drives destination reward execution. |
| Full contract code included | Ready | Origin, Reactive, Destination contracts and scripts are in the repo. |
| Origin contract included | Ready | `contracts/origin/ProtoMonGame.sol` is included. |
| Deployed contract addresses disclosed | Ready | Addresses are listed in this README. |
| Problem and solution explained | Ready | See the Problem / Solution sections above. |
| Post-deployment workflow described | Ready | See the workflow section above. |
| Complete workflow tx hashes attached | Ready | Deployment and live workflow tx hashes are attached in the transaction records section above. |
| Demo video attached | Ready | Public demo video link is attached near the top of this README. |

## Team

- David — Design & Full-Stack
- Swen — Smart Contracts & Reactive Workflow

## Acknowledgements

- Reactive Network for the reactive execution model
- Foundry for the Solidity development workflow
- Next.js, wagmi, viem, and RainbowKit for the web stack
- OpenZeppelin and the broader Ethereum tooling ecosystem

## License

This project is released under the [MIT License](LICENSE).
