# Contract Code Review and Handoff

## Context

This document is the contract-side review and handoff note for the current hackathon implementation and deployment pass.

Goal of this pass:
- complete the minimum onchain workflow structure required for the Reactive hackathon
- verify the Yahtzee scoring model in Solidity
- verify TS and Solidity scoring parity before teammate integration work
- complete a real first deployment pass on the intended testnets

This pass intentionally did **not** finish:
- backend proof alignment to the current onchain verifier
- frontend `CAST` integration to the onchain path
- one real `GameWon -> Reactive -> Destination` business-flow callback confirmation

## Current Status

### Local verification

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

### Real deployment status

Deployed topology:
- `Origin`: `Ethereum Sepolia (11155111)`
- `Reactive`: `Reactive Lasna (5318007)`
- `Destination`: `Ethereum Sepolia (11155111)`

Deployed contracts:
- `Origin / ProtoMonGame`
  - address: `0x743aAd4ab89EaE037Fce8f69bB8e0937B566C9f1`
  - tx: `0x05c25503d28f1cef762424d54c11aea1e57f32ba121ea00f0e9cb6f9f963052`
- `Destination / ProtoMonBadge`
  - address: `0x34bF4ce1CF676c540fd931B5b4E2012E84ebcDb4`
  - tx: `0xaac37388f09032e636aef4dfc4db2178defec4e72e5052b0a4a9d1cd9af9f36ca`
- `Reactive / ProtoMonReactiveBadge`
  - address: `0xD58e8A8f8BB05badDc2D5fe9AC1957d1e1aa90cE`
  - deployer / callback identity / authorized RVM ID:
    `0x1662C438F7ACEC993993607fC963e279136acEd6`

Destination authorization backfill:
- `ProtoMonBadge.setAuthorizedRvmId(...)`
  - tx: `0x25028338ad4d1ec67644afed18483c9794d90691ec3dd4e3d34c253dd230dc5f`

Meaning:
- all three contract layers are now truly deployed
- destination-side callback authorization is configured
- contract deployment is no longer “theoretical” or local-only

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
- destination-side `rvmId` validation
- duplicate mint prevention
- owner-managed `setAuthorizedRvmId(...)`

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
- `Callback(...)` emission toward the destination badge contract

Real-deployment adjustments:
- constructor-side subscription registration against the Reactive system contract
- low-level subscription call that tolerates ReactVM-side revert semantics
- local-VM detection for Foundry tests by checking system-contract code presence
- payable deployment path for initial REACT funding

Purpose:
- bridge `GameWon` into destination-side reward execution
- remain deployable both in local tests and on Reactive Lasna

### 4. Deployment scripts and workflow

Files:
- `script/deploy-origin.s.sol`
- `script/deploy-destination.s.sol`
- `script/deploy-reactive.s.sol`
- `script/set-destination-rvm-id.s.sol`
- `docs/deployment-workflow.md`

Purpose:
- define deployment order and required env inputs
- support real Lasna deployment with initial funding
- support destination-side RVM authorization backfill

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

## Main Review Findings

### 1. The contract package is now in a real deployable state

This is no longer just a local-code pass.

What is true now:
- origin / destination / reactive boundaries are explicit
- scoring is tested and parity-checked
- all three contracts have real deployed addresses
- destination-side authorization has been configured onchain

This is enough for teammate integration work to start against real contract addresses.

### 2. The hardest deployment issue was constructor-time Reactive subscription handling

Main issue encountered:
- early `Reactive Lasna` deployments kept reverting in constructor during `subscribe(...)`

Root cause:
- the first implementation used a direct interface call to the Reactive system contract
- official Reactive guidance requires constructor subscriptions to handle ReactVM-side reverts gracefully

Fix applied:
- changed constructor subscription setup to a low-level call pattern
- added a local-system-contract-code check so Foundry tests still treat local deployments as VM instances

Practical implication:
- this was the critical change that moved Reactive deployment from “test-only shape” to “real Lasna deployable”

### 3. Destination authorization must use callback identity, not the Reactive contract address

Important rule for teammate:
- `authorizedRvmId` is **not** the plain deployed `ProtoMonReactiveBadge` address
- it must match the callback identity injected by Reactive
- in the current testnet model, that identity is the Reactive contract deployer address

This is already backfilled onchain for the current deployment.

Practical implication:
- if teammate redeploys Reactive with a different deployer wallet, destination authorization must be updated again

### 4. The biggest remaining gap is integration, not contract logic

Not yet completed:
- backend `finalize` output is not aligned to the current onchain proof-verification model
- frontend `CAST` still does not submit `playTurn(...)`
- no real game transaction has yet been used to prove the full `GameWon -> Callback -> reactiveMint(...)` runtime path

Meaning:
- the contract package is ready for integration
- the overall product workflow is still not fully wired

### 5. Reward handling is intentionally minimal

Current destination behavior:
- records mint completion by `gameId`
- records recipient
- records bossId
- emits `BadgeMinted`

It does **not** yet mint a real NFT standard token.

That was an intentional scope cut to keep the hackathon workflow moving.

## Non-Blocking Risks

These are important, but not blockers for the current handoff:

1. Foundry lint-style notes remain
   They do not affect compile/test correctness.

2. `ProtoMonBadge` is not a final asset contract
   If the demo needs visible NFT ownership, the contract will need an ERC721 or ERC1155 upgrade.

3. Full live callback proof is still pending
   Deployment succeeded, but the business-flow callback still needs one real winning game to validate end to end.

4. Dealer signer is currently coupled to the deployed configuration
   If backend later uses a different signer, `ProtoMonGame` would need redeployment or signer support changes.

## Integration Notes For Teammate

If teammate picks up integration next, the highest-priority sequence should be:

1. align backend proof format with `ProtoMonGame` verification
2. connect frontend `CAST` to:
   - backend finalize
   - origin `playTurn(...)`
   - event-based reconciliation
3. use the deployed addresses already recorded in this document
4. run one real winning game to trigger `GameWon`
5. confirm Reactive callback reaches `ProtoMonBadge.reactiveMint(...)`
6. record addresses and tx hashes in durable submission docs

## Suggested Files To Read First

Fastest ramp-up path:

1. `docs/implementation-log.md`
2. `docs/contract-code-review.md`
3. `contracts/origin/ProtoMonGame.sol`
4. `test/ProtoMonGame.t.sol`
5. `contracts/destination/ProtoMonBadge.sol`
6. `contracts/reactive/ProtoMonReactiveBadge.sol`
7. `docs/deployment-workflow.md`
8. `docs/parity-workflow.md`
9. `web/tests/scoring-parity.test.ts`

## Bottom Line

This pass should now be treated as:

- contract architecture established
- scoring model frozen and verified
- contract test baseline established
- real first deployment pass completed
- ready for teammate integration work against live addresses

It should **not** yet be treated as:

- fully integrated gameplay
- final hackathon demo submission state
- end-to-end callback workflow already proven in production conditions
