# TS and Solidity Parity Workflow

## Goal

Prove that the TypeScript gameplay scoring logic and the Solidity origin-contract scoring logic produce the same results for the same dice input.

This parity work is about scoring and scoring-adjacent state only.
It is not a replacement for state-machine tests, roll/reroll flow tests, or backend proof integration.

## Source Functions

TypeScript:
- `web/lib/game/scoring.ts`
  - `getSlotScore(slotId, dice)`
  - `computeLocalScore(slotId, dice, state)`

Solidity:
- `contracts/origin/ProtoMonGame.sol`
  - `previewScore(slotId, dice)`
  - `previewDamageWithState(slotId, dice, upperSubtotal, upperBonusClaimed)`

## Scope Split

### Layer A: Stateless slot-score parity

Purpose:
- Verify that raw slot scoring matches across languages for all 13 slots.

Compared functions:
- TS: `getSlotScore(...)`
- Solidity: `previewScore(...)`

Dice coverage:
- all unordered 5-dice combinations from values `1..6`
- expected unique combinations: `252`

Comparison per case:
- `slotScore`
- derived qualification behavior

Qualification mapping:
- TS does not expose a separate `qualifies` field.
- For parity purposes:
  - upper slots `0..5`: `qualifies = slotScore > 0`
  - lower slots `6..11`: `qualifies = slotScore > 0`
  - chance slot `12`: `qualifies = true`

Rationale:
- This layer isolates the core scoring table without any battle-state history.

### Layer B: State-aware upper-bonus parity

Purpose:
- Verify that bonus-trigger behavior matches when historical state matters.

Compared functions:
- TS: `computeLocalScore(...)`
- Solidity: `previewDamageWithState(...)`

State inputs to cover:
- `upperSubtotal`
- `upperBonusClaimed`

Primary focus:
- upper slots `0..5`
- boundary states around the upper bonus threshold `63`

Recommended boundary matrix:
- `upperSubtotal`: `0, 57, 58, 59, 60, 61, 62, 63, 64`
- `upperBonusClaimed`: `false`, `true`

Compared outputs:
- `slotScore`
- `bonusDamage`
- `totalDamage`
- `nextUpperSubtotal`
- `nextUpperBonusClaimed`

Rationale:
- The bonus rule is the only part of the scoring model that depends on prior state.
- Lower slots do not depend on upper bonus history, so they do not need full state-matrix coverage here.

## Explicit Non-Scope

The following are not covered by the 252-combination parity sweep:
- roll / reroll position semantics
- lock-mask behavior
- replay protection
- turn progression
- finish / win / loss transitions
- proof signing
- frontend-to-contract integration

These are already covered elsewhere or will be handled in later integration work.

## Execution Strategy

Phase 1:
- Build the stateless slot-score parity runner first.
- This is the highest-signal and lowest-ambiguity comparison.

Phase 2:
- Build the upper-bonus parity runner using the boundary matrix.

Phase 3:
- Only after both parity layers are stable, resume integration work:
  - backend proof alignment
  - frontend `CAST` chain path

## Preferred Implementation Shape

Preferred first implementation:
- a parity runner driven from the repo root
- uses the existing TS scoring functions on one side
- uses local Foundry tooling on the other side
- designed to run on a developer machine without requiring external RPC infrastructure

Reason:
- This keeps parity verification local and repeatable.
- It avoids tying the parity check to the unfinished backend / frontend / chain integration path.

## Acceptance Criteria

Layer A is accepted when:
- all 252 unordered dice combinations match for all 13 slots

Layer B is accepted when:
- all boundary-matrix cases match for every upper slot
- no mismatch exists for:
  - bonus trigger
  - subtotal update
  - claimed-state persistence

## Output Expectation

When implemented, the parity runner should produce:
- total cases checked
- mismatch count
- first mismatch details if any
- clear pass / fail summary
