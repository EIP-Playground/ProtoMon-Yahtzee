Original prompt: PLEASE IMPLEMENT THIS PLAN:
# ProtoMon Frontend Battle Loop Plan

## 2026-03-25

- Implemented a playable classic Yahtzee-style frontend loop in `web/`.
- Home page now creates a backend game session and routes to `/battle/[gameId]`.
- Battle page now uses a client component with backend-backed `roll` and `reroll`.
- Local scoring is implemented for all 13 slots.
- Local cast applies damage, consumes the slot, resets dice/locks, and advances the local turn.
- Added a minimal backend `/api/game/advance` route so multi-round frontend play stays aligned with Redis session state.
- Added logic tests for scoring, local cast state transitions, and dice lock mask conversion.
- Existing backend route tests were expanded to cover `/api/game/advance`.
- Stabilized the frontend battle UX:
  - replaced the split `ROLL` / `REROLL` controls with one `ROLL` button
  - added client-side roll animation with a minimum visual duration to mask Upstash latency
  - separated dice waiting state from cast waiting state so the button no longer shows `Rolling...` during score submission
  - preserved locked-dice highlight across rerolls
  - persisted committed slot results so used rows keep their original score and damage
  - added visible upper-bonus progress and claim state
  - added `sessionStorage` battle snapshot recovery per `gameId`
  - redesigned the battle layout into left / center / right columns
  - surfaced the Redis key string and latest client-measured dice RTT in the UI
- Added component tests for single-button dice flow, cast-state button text, all-locked reroll disabling, and sessionStorage hydration.
- Fixed reroll animation so locked dice stay visually fixed while only unlocked dice animate.

## Validation

- `rtk pnpm test` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## Notes

- The current phase intentionally keeps `CAST` local-only. `finalize` and chain settlement are still not wired into the battle UI.
- `BattleState` still uses the field name `smartAccount` internally even though backend contracts use `player`. This is cosmetic right now, but could be normalized later.
- The `develop-web-game` Playwright client could not run in this environment because the external `playwright` package was unavailable to the skill script.
- Refresh recovery is local-only via `sessionStorage`, so it is intentionally same-tab / same-browser rather than cross-device or multi-tab synchronized.

## TODO

- Wire `finalizeRound()` into the UI and reconcile local state with backend proof flow.
- Replace demo addresses with real wallet/session-key plumbing.
- Decide whether `/api/game/advance` remains a temporary frontend-support route or gets folded into a later finalized turn flow.
