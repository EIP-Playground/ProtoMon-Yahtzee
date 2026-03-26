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

## 2026-03-26

- Reinstalled `nes.css` in `web/` and kept the official global import path in `web/app/layout.tsx` so the app uses the package-provided glove cursor behavior.
- Integrated `docs/reference/protomon-loading-pack` into the Next frontend with local assets copied under `web/public/protomon-loading/`.
- Added reusable loading UI components:
  - `web/components/loading/LoadingBar.tsx`
  - `web/components/loading/LoadingPage.tsx`
- Home page now shows a first-entry loading experience once per tab via `sessionStorage`.
- Home page now shows the ProtoMon loading overlay while `createGameSession()` is in flight.
- Added loading animation keyframes to `web/app/globals.css`.
- Switched loading fonts to `next/font/google` variables in `web/app/layout.tsx` and the loading components.

## Validation

- `rtk pnpm test` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## Notes

- The source art pack remains in `docs/reference/protomon-loading-pack/`; runtime assets are copied into `web/public/protomon-loading/` so Next can serve them directly.
- The `develop-web-game` Playwright client is still blocked in this environment because the external `playwright` package is not installed for the skill script.

## TODO

- If needed, add route-level loading states for direct entry into `/battle/[gameId]`.
- If desired, convert the create-game loading overlay from indefinite pending mode to a backend-aware finish animation before navigation.

## 2026-03-26 Loading Sync Fix

- Unified loading icon thresholds and horizontal positions under one shared reveal model in `web/lib/ui/loading.ts`.
- Confirmed reveal cap remains `83`, reveal mode is segment-end, and the six thresholds are `13.8 / 27.7 / 41.5 / 55.3 / 69.2 / 83`.
- `LoadingBar` now derives icon placement and reveal timing from the same helper functions, removing the prior mismatch between hardcoded thresholds and positions.
- `LoadingPage` pending mode now uses the shared reveal progress helper and still caps at `83` before `ready`.
- Home page create-game flow now imports the shared minimum create loading duration constant.
- Added loading-specific tests covering reveal thresholds, reveal positions, pending cap behavior, first-entry loading, same-tab no-replay, and minimum create loading duration.

## Validation

- `rtk pnpm test` passed (`33` tests).
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## 2026-03-26 Loading Visual Sync Pass 2

- Removed the fill-width CSS transition from `LoadingBar` and moved the elemental icon scene into the same masked fill layer so icon pixels cannot lead the bar front.
- Added shared loading bar width rules in `web/lib/ui/loading.ts`: container width minus 60px, clamped to `220..280`.
- `LoadingPage` now measures its loading row with `ResizeObserver` and passes the computed width into `LoadingBar`.
- Restored stronger six-color particle sparkle by switching to nested particles: outer drift + inner twinkle.
- Expanded loading tests to cover width clamping and masked icon rendering.

## Validation

- `rtk pnpm test` passed (`34` tests).
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `develop-web-game` Playwright client is still blocked here because the external `playwright` package is unavailable to the skill script.

## 2026-03-26 Loading Visual Sync Pass 3

- Reverted the loading bar back to a fixed-width model (`320px`) so it behaves like the original version again instead of being controlled by container measurement and clamp rules.
- Delayed the final elemental icon so it only appears after the fill front can cover the full icon width, avoiding the half-visible last-icon state.
- Reworked the six-color ambient particles from upward bubble motion into short-range shimmer motion with smaller scale deltas and a faceted sparkle shape.
- Updated loading tests to cover the delayed final icon behavior and removed the no-longer-relevant responsive-width assertions.

## Validation

- `rtk pnpm test` passed (`34` tests).
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `develop-web-game` Playwright client is still blocked here because the external `playwright` package is unavailable to the skill script.

## 2026-03-26 i18n Foundation

- Added a lightweight `i18n` foundation for `zh-CN` and `en`:
  - `web/lib/i18n/messages.ts`
  - `web/components/providers/LocaleProvider.tsx`
  - `web/components/ui/LanguageSwitcher.tsx`
- Wrapped the app with `LocaleProvider` in `web/app/layout.tsx`.
- Localized the currently visible UI surface:
  - home page
  - shared loading overlay
  - battle header, boss panel, dice board, score board, ProtoMon panel, session gate, and sync panel
- Kept backend contracts untouched; this pass is UI-copy only.
- Added locale persistence via `localStorage` and synced `document.documentElement.lang` on the client.
- Added a locale-provider test to verify language switching and persistence.

## Validation

- `rtk pnpm test` passed (`35` tests).
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `develop-web-game` Playwright client is still blocked here because the external `playwright` package is unavailable to the skill script.

## 2026-03-26 i18n Locale Toggle Fix

- Fixed a locale flip-loop in `LocaleProvider`: the initial preferred-locale sync now runs only once on mount instead of re-reading `localStorage` after every locale change.
- Added a regression test to ensure clicking `English` no longer bounces the UI back to `zh-CN`.

## Validation

- `rtk pnpm test` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## 2026-03-26 Public Asset Naming Cleanup

- Normalized `web/public/` asset filenames to lowercase kebab-case where names were still mixed or Chinese.
- Removed stray `.DS_Store` files from the `web/public/` subtree.
- Verified the renamed Chinese-named assets had no live code references before renaming, so no runtime import paths needed updates in this pass.

## 2026-03-26 Homepage Mock + Wallet Pass

- Rebuilt `/` as a long-form pixel-art landing page assembled from the four `home-bg-*` stage backgrounds plus `footer-bg`.
- Added new home-specific components and proportional asset layout config so foreground art positions are driven by percentages instead of fixed pixel coordinates.
- Integrated locale-aware pixel typography:
  - English keeps `Press Start 2P`
  - Chinese now uses local `Zpix` loaded from `web/app/fonts/zpix.ttf`
  - `LocaleProvider` now also syncs `document.documentElement.dataset.locale` for CSS font switching.
- Added homepage floating controls:
  - pixel-style language switcher
  - dealer status pill with color/blink states (`idle`, `waiting`, `online`, `error`)
  - RainbowKit wallet area with custom pixel-styled connect / chain / account buttons
- Added RainbowKit + wagmi + viem + TanStack Query integration for the homepage wallet button.
- Scoped the web3 provider to a homepage-only client island (`HomeWalletHud`) so static build no longer touches WalletConnect/`indexedDB` during prerender.
- Updated the shared loading page to use locale-aware pixel font variables and the pixel language switcher style.
- Added `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` and `NEXT_PUBLIC_BASE_RPC_URL` to `.env.example`; WalletConnect project id defaults to the supplied `3c8abab3d6209b3a73ae523efba1524a`.

## Validation

- `rtk pnpm test` passed (`36` tests).
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## Notes

- RainbowKit is only mounted for the homepage controls in this pass; battle flow is still demo-address based.
- Wallet button visuals are custom, but modal behavior remains RainbowKit-default.
- The build-time `indexedDB` warning was eliminated by removing the global provider from `layout.tsx` and loading the wallet HUD with `ssr: false`.

## 2026-03-27 Homepage Mock Refinement + ETH Sepolia

- Refined the homepage mock implementation for `/`:
  - tightened hero title, CTA, and section heading positions
  - reduced oversized foreground art across hero / meet / alchemy / cross-chain sections
  - expanded home art layout config with `mobileWidth`, `maxWidthVw`, and clearer `zIndex` control
  - improved cross-chain foreground layering so portal / well / arrow / chest stack more predictably against the stage background
- Moved the homepage control cluster into the hero top band instead of keeping it fixed for the full page.
- Removed the duplicate homepage wallet HUD render so the wallet / language / dealer controls now appear only in the hero area.
- Added a pixel-style back-to-top button that appears after scrolling past roughly 60% of the first viewport.
- Tightened the control sizing:
  - compacted the dealer status pill
  - compacted the language switcher pixel variant
  - compacted the RainbowKit wallet button group
  - reduced the start-battle CTA footprint
- Switched default wallet chain handling to `Ethereum Sepolia` while keeping `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` as a temporary fallback.
- Added a pure `web/lib/web3/chain.ts` helper so chain/RPC resolution can be tested without importing the full RainbowKit config path.
- Updated `.env.example` to prefer:
  - `NEXT_PUBLIC_CHAIN_ID=11155111`
  - `NEXT_PUBLIC_SEPOLIA_RPC_URL`
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Tightened homepage/loading pixel-font enforcement so locale-driven fonts apply more consistently:
  - `en` -> `Press Start 2P`
  - `zh-CN` -> `Zpix`
- Added/updated tests for:
  - homepage back-to-top affordance
  - ETH Sepolia env resolution and legacy Base Sepolia fallback

## Validation

- `rtk pnpm test` passed (`39` tests).
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## Notes

- This pass still keeps the wallet integration homepage-only; battle flow remains demo-address based.
- The current homepage is closer to the mock, but not yet pixel-perfect. The remaining differences are mainly fine-grained spacing, asset scale, and footer/control polish.
