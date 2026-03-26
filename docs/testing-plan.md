# ProtoMon Contract Testing Plan

## Purpose

This document defines the minimum testing priorities for the current contract-first phase.

The team decision at this stage is:
- keep frontend/backend and contracts temporarily decoupled
- make Solidity rules correct first
- confirm TS and Solidity scoring parity before final integration

## Current Priorities

1. Validate `ProtoMonGame` scoring logic
2. Validate `ProtoMonGame` state transitions
3. Validate one-time upper bonus behavior
4. Validate slot-consumption behavior
5. Later: validate TS and Solidity parity on all 252 unordered dice combinations

## Solidity Test Scope

### A. `previewScore(...)`

Must cover:
- upper slots 1..6
- three of a kind
- four of a kind
- full house
- small straight
- large straight
- yahtzee
- chance
- invalid lower-slot pattern returns zero

### B. `previewDamageWithState(...)`

Must cover:
- upper subtotal increment
- bonus not triggered below 63
- bonus triggered on first crossing of 63
- bonus does not trigger twice
- lower slots do not alter upper subtotal

### C. `startGame(...)`

Must cover:
- valid game creation
- duplicate game id rejection
- unsupported boss rejection
- zero reward recipient rejection

### D. `playTurn(...)`

Must cover:
- valid turn submission
- slot is marked used
- boss hp decreases correctly
- turn increments when game continues
- win path emits `GameWon`
- thirteenth-slot loss path ends the run
- reused proof is rejected
- reused slot is rejected
- expired proof is rejected
- wrong player is rejected

## TS vs Solidity Parity Plan

Goal:
- confirm that TypeScript scoring and Solidity scoring produce identical results

Scope:
- enumerate all 252 unordered 5-dice combinations
- for each combination, compare:
  - each slot score from TS
  - each slot score from Solidity `previewScore(...)`
- separately compare stateful upper-bonus logic using:
  - TS `computeLocalScore(...)`
  - Solidity `previewDamageWithState(...)`

Important note:
- 252 combinations are enough for score-rule parity because slot scoring ignores dice order.
- 252 combinations are not enough for lock-mask / reroll position logic.

## Operational Note

Current local environment gap:
- the repo does not yet include a ready-to-run Foundry test dependency setup such as `forge-std`
- before full contract tests are added, confirm the chosen test harness strategy:
  - install `forge-std`
  - or write minimal self-contained Solidity tests

## Handoff Note

Once the test harness decision is made, the next concrete implementation step is:
- add the first batch of `ProtoMonGame` scoring and state tests
