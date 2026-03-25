<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ProtoMon Web Agent Guide

This file applies to the `web/` Next.js app only.

## Goal

Build the hackathon MVP web loop:

- frontend playable 13-turn battle flow
- backend blind dealer APIs with Redis session cache
- frontend optimistic damage and chain reconciliation
- session-key based silent casting path in the frontend shell

The Next.js app is responsible for UX, API orchestration, Redis-backed round state, and typed integration boundaries. The Solidity contracts remain the source of truth for damage and final battle state.

## Hard Product Rules

- Only one fully playable boss in MVP: `bossId = 1`, `Goblin Hacker`, `150 HP`.
- One battle is exactly `13` turns and `13` score slots.
- Each turn allows up to `3` rolls:
  - roll 1 must throw all 5 dice
  - roll 2 and 3 may reroll unlocked dice only
- Every turn must consume one unused slot.
- If a slot does not qualify, the score is `0`.
- Upper bonus triggers once when upper subtotal first reaches `>= 63`, adding `35` damage.
- Lower scores are fixed as:
  - `ThreeKind` / `FourKind` = sum of all dice
  - `FullHouse` = `25`
  - `SmallStraight` = `30`
  - `LargeStraight` = `40`
  - `Yahtzee` = `50`
  - `Chance` = sum of all dice

## Web Scope

### Frontend responsibilities

- Build the lobby flow:
  - connect wallet
  - enable session key
  - create backend game session
  - call chain `startGame`
  - navigate to `/battle/[gameId]`
- Build the battle page flow:
  - `ROLL`
  - lock or unlock dice
  - `REROLL`
  - choose score slot
  - optimistic `CAST`
  - fetch dealer proof from backend
  - send chain transaction
  - reconcile from `TurnPlayed`
- Maintain a battle store with:
  - `gameId`
  - `smartAccount`
  - `rewardRecipient`
  - `bossHpLocal`
  - `bossHpChain`
  - `turn`
  - `rollCount`
  - `dice`
  - `locked`
  - `usedSlots`
  - `upperSubtotalLocal`
  - `upperBonusClaimedLocal`
  - `syncStatus`
  - `pendingTxHash`
- Implement local battle helpers:
  - `computeLocalScore`
  - `applyLocalCast`
  - `reconcileFromReceipt`
  - `resetRoundLocal`
- Keep five explicit sync states in UI:
  - `LOCAL_APPLIED`
  - `PENDING_CHAIN`
  - `CONFIRMED`
  - `RETRYABLE_FAIL`
  - `ROLLBACK`
- Use frontend wrappers instead of inline fetch or contract logic:
  - `lib/api/backend.ts`
  - `lib/chain/gameContract.ts`
  - `lib/aa/smartAccount.ts`

### Backend responsibilities

- Backend is a blind dealer only.
- Backend must not know:
  - chosen `slotId`
  - boss HP
  - final damage
  - battle outcome
- Backend must only maintain:
  - `turn`
  - `rollCount`
  - `currentDice`
  - `finalized`
- Implement Redis-backed session state under key `game:{gameId}` with:
  - `gameId`
  - `player`
  - `rewardRecipient`
  - `bossId`
  - `turn`
  - `rollCount`
  - `currentDice`
  - `finalized`
  - `createdAt`
  - `expiresAt`
- Implement backend helpers:
  - `generateDice`
  - `rerollWithMask`
  - `buildDealerProof`
  - Redis read or write helpers in `lib/server/gameSession.ts`
- Implement API routes:
  - `POST /api/game/create`
  - `POST /api/game/roll`
  - `POST /api/game/reroll`
  - `POST /api/game/finalize`
  - optional `POST /api/game/advance`

## API Contracts

### `POST /api/game/create`

- Input:
  - `player`
  - `rewardRecipient`
  - `bossId`
- Behavior:
  - generate `gameId`
  - initialize Redis session
  - TTL should be about 2 hours
- Output:
  - `gameId`
  - `player`
  - `rewardRecipient`
  - `bossId`
  - `turn = 1`
  - `rollCount = 0`

### `POST /api/game/roll`

- Input:
  - `gameId`
  - `player`
- Validate:
  - session exists
  - player matches
  - `rollCount == 0`
  - `finalized == false`
- Output:
  - `gameId`
  - `turn`
  - `rollCount = 1`
  - `dice`

### `POST /api/game/reroll`

- Input:
  - `gameId`
  - `player`
  - `holdMask`
- Validate:
  - session exists
  - `rollCount >= 1 && rollCount < 3`
  - `finalized == false`
  - `holdMask` is within `0..31`
- Output:
  - `gameId`
  - `turn`
  - updated `rollCount`
  - updated `dice`

### `POST /api/game/finalize`

- Input:
  - `gameId`
  - `player`
  - `rewardRecipient`
- Validate:
  - `rollCount >= 1`
  - `finalized == false`
- Behavior:
  - sign final dice only
  - set `finalized = true`
- Output:
  - `DealerProof`

### `POST /api/game/advance`

- Optional strictness endpoint.
- Use only after chain confirmation if the implementation chooses server-side round advancement.

## Proof Rules

- Dealer proof must include:
  - `gameId`
  - `player`
  - `rewardRecipient`
  - `turn`
  - `finalRollCount`
  - `dice`
  - `expiry`
  - `chainId`
  - `verifyingContract`
  - `backendSig`
- Dealer proof must be signed with EIP-712 typed data.
- Dealer proof must never include `slotId`.
- `finalize` must block any later `reroll` in the same round.

## File Ownership Inside `web/`

- `app/battle/[gameId]/page.tsx`: playable battle route
- `components/battle/*`: UI surface for dice, score board, boss panel, sync state, session gate
- `store/battleStore.ts`: frontend round state and optimistic update helpers
- `lib/game/*`: shared TypeScript rule helpers used by frontend logic
- `lib/api/backend.ts`: typed wrapper over backend routes
- `lib/server/*`: Redis, RNG, dealer proof, session persistence
- `lib/chain/gameContract.ts`: chain calls and event reconciliation
- `lib/aa/smartAccount.ts`: session key enable or revoke flow
- `types/game.ts`: shared request, response, proof, and battle types

## Out Of Scope For This App

- No backend damage calculation.
- No backend slot strategy awareness.
- No extra Yahtzee bonus.
- No Joker rule.
- No relic or shop logic.
- No second or third boss real gameplay.
- No complex buff or debuff resolution.
- No hidden private frontend-only game state that an agent needs to read from the UI.

## Delivery Order

1. Finish Redis-backed backend routes and proof generation.
2. Finish frontend dice flow and battle store.
3. Wire temporary EOA chain calls for `castTurn`.
4. Upgrade frontend sender to ERC-4337 session key flow.
5. Keep `web/` ready to consume deployed contract addresses from env.

## Acceptance Criteria For `web/`

- Frontend can start a game and enter battle.
- Frontend can roll, lock, reroll, pick a slot, and cast.
- Frontend immediately updates local Boss HP on cast.
- Frontend reconciles from chain receipt and rolls back if needed.
- Backend enforces max three rolls.
- Backend prevents reroll after finalize.
- Backend proof includes `gameId`, `turn`, `dice`, `chainId`, `verifyingContract`, and `expiry`.
- Session key permissions are scoped to the current game and contract.

## Environment Variables Used By `web/`

- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`
- `NEXT_PUBLIC_PROTO_MON_GAME_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`
- `BACKEND_DEALER_PRIVATE_KEY`
- `REDIS_URL`
- `AA_BUNDLER_URL`
- `AA_PAYMASTER_URL`
