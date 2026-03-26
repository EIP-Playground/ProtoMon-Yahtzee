# Contract Code Review and Handoff

## Context

This document is the contract-side review and handoff note for the current hackathon implementation pass.

Goal of this pass:
- complete the minimum onchain workflow structure required for the Reactive hackathon
- verify the game scoring model in Solidity
- verify TS and Solidity scoring parity before teammate integration work

This pass intentionally did **not** finish:
- backend proof alignment
- frontend `CAST` integration to the onchain path
- full end-to-end deployment on live hackathon networks

## What Was Added

### 1. Origin contract

File:
- `contracts/origin/ProtoMonGame.sol`

Implemented:
- `startGame(...)`
- `playTurn(...)`
- per-game session state
- dealer-proof verification
- replay protection
- 13-slot Yahtzee scoring
- upper bonus handling
- `GameStarted`
- `TurnPlayed`
- `GameWon`

Purpose:
- make the origin layer the real state source for game settlement

### 2. Destination contract

File:
- `contracts/destination/ProtoMonBadge.sol`

Implemented:
- `reactiveMint(...)`
- callback sender validation
- reactive contract / rvmId validation
- duplicate mint prevention
- owner-managed `setReactiveContract(...)`

Purpose:
- make the destination layer accept Reactive callback results and record reward execution

Note:
- this is currently a reward-recording contract, not a full ERC721 / ERC1155 NFT implementation

### 3. Reactive contract

File:
- `contracts/reactive/ProtoMonReactiveBadge.sol`

Implemented:
- `react(...)`
- origin-chain / origin-contract / event-topic validation
- `GameWon` log parsing
- `Callback(...)` emission toward destination badge contract

Purpose:
- bridge `GameWon` into destination-side reward execution

### 4. Deployment skeleton

Files:
- `script/deploy-origin.s.sol`
- `script/deploy-destination.s.sol`
- `script/deploy-reactive.s.sol`
- `docs/deployment-workflow.md`

Purpose:
- define deployment order and required env inputs

### 5. Contract tests

Files:
- `test/ProtoMonGame.t.sol`
- `test/ProtoMonBadge.t.sol`
- `test/ProtoMonReactiveBadge.t.sol`
- `test/utils/MinimalTest.sol`

Coverage:
- origin scoring and state-machine behavior
- destination permissions and mint-guard behavior
- reactive constructor validation
- reactive invalid-log rejection
- reactive callback payload correctness

### 6. TS vs Solidity parity checks

Files:
- `contracts/dev/ProtoMonGamePreviewHarness.sol`
- `web/tests/scoring-parity.test.ts`
- `web/vitest.parity.config.ts`
- `docs/parity-workflow.md`

Purpose:
- prove the TS gameplay scoring logic and Solidity scoring logic match

Validated:
- all 252 unordered five-dice combinations
- all 13 slot scores
- upper bonus threshold boundary behavior

## Verification Status

Verified locally:

```bash
forge test
cd web && pnpm test:parity
```

Observed result in local developer environment:
- `forge test`: `37 passed, 0 failed`
- `pnpm test:parity`: `2 passed, 0 failed`

Meaning:
- contract suite is green
- stateless scoring parity is green
- stateful upper-bonus parity is green

## Main Review Findings

### 1. Contract layer is in a good handoff state

What is solid now:
- origin / destination / reactive boundaries are explicit
- origin rules are covered by tests
- destination and reactive have basic correctness tests
- scoring is cross-language verified

This is enough for teammate integration work to start without re-litigating the scoring model.

### 2. Biggest remaining gap is integration, not contract logic

Not yet completed:
- backend `finalize` output is not yet aligned to the current onchain proof-verification model
- frontend `CAST` still does not submit `playTurn(...)`
- destination / reactive live-network deployment has not yet been demonstrated end-to-end

This means:
- the contract package is reviewable and pushable
- the product workflow is still not fully wired

### 3. Reward contract is intentionally minimal

Current destination behavior:
- records mint completion by `gameId`
- records recipient
- records bossId
- emits `BadgeMinted`

It does **not** yet mint a real NFT standard token.

That was an intentional scope cut to keep the hackathon workflow moving.

### 4. Reactive contract currently uses a self-contained log shape

`ProtoMonReactiveBadge.sol` currently uses a local `LogRecord` struct and local callback event shape instead of importing the official Reactive library package.

Reason:
- avoid adding network dependency and external package setup during the core contract pass

Implication for teammate:
- if the final integration requires strict Reactive-library compatibility, this layer may need a final adaptation pass
- but the workflow shape and validation logic are already defined

## Non-Blocking Risks

These are important, but not blockers for pushing the current contract pass:

1. Naming / lint-style notes remain in Foundry output
   They are non-blocking and do not affect compile/test correctness.

2. `ProtoMonBadge` is not a final asset contract
   If demo value requires visible NFT ownership, this contract will need an ERC721 or ERC1155 upgrade.

3. Reactive live-network assumptions are not yet proven
   Current tests validate payload construction and rejection paths, not final live callback behavior.

## Integration Notes for Teammate

If teammate picks up integration next, the highest-priority sequence should be:

1. align backend proof format with `ProtoMonGame` verification
2. connect frontend `CAST` to:
   - backend finalize
   - origin `playTurn(...)`
   - event-based reconciliation
3. deploy destination and reactive contracts
4. run one real `GameWon -> Callback -> reactiveMint(...)` workflow
5. record addresses and tx hashes in docs

## Suggested Files To Read First

If the teammate wants the fastest ramp-up path:

1. `docs/implementation-log.md`
2. `contracts/origin/ProtoMonGame.sol`
3. `test/ProtoMonGame.t.sol`
4. `contracts/destination/ProtoMonBadge.sol`
5. `contracts/reactive/ProtoMonReactiveBadge.sol`
6. `docs/deployment-workflow.md`
7. `docs/parity-workflow.md`
8. `web/tests/scoring-parity.test.ts`

## Bottom Line

This contract pass should be treated as:

- contract architecture established
- scoring model frozen and verified
- contract test baseline established
- ready for teammate integration work

It should **not** yet be treated as:

- fully integrated gameplay
- final hackathon demo submission state
