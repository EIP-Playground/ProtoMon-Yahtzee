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

## 2026-03-27 NES.css Font Integration Pass

- Reviewed the upstream `nostalgic-css/NES.css` README and aligned the app with its font guidance:
  - the library does not ship fonts
  - recommended usage is to apply your chosen font to base elements such as `html`, `body`, `pre`, `code`, `kbd`, and `samp`
- Updated `web/app/globals.css` so the app's base elements now inherit locale-aware pixel fonts instead of falling back to `Avenir Next`.
- Kept title font priority as `Press Start 2P -> Zpix`, while body/UI text now also uses the locale-aware pixel font stack.
- Increased homepage and loading typography so the hero title, section titles, CTA text, footer text, wallet/language controls, and loading copy are materially more readable.
- Restored the missing ProtoMon card labels in the meet section while adjusting the surrounding typography scale.

## Validation

- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## 2026-03-27 Homepage Mock Pass 3

- Removed the Hero fourth-line slogan from homepage rendering in both locales; Hero now renders only:
  - `ProtoMon`
  - `ELEMENTAL ALCHEMY`
  - the localized `Reactive Network` headline
- Strengthened the `Reactive Network` emphasis with a brighter cyan/blue color, heavier outline, and stronger breathing glow.
- Extended `HomeArtConfig` with mobile position support:
  - `mobileLeft`
  - `mobileTop`
  - `glowVariant`
- Repositioned homepage mobile art to better match the current desktop composition while keeping the mobile breakpoint at `768px`.
- Reworked the meet section cards:
  - removed the on-page card-name captions
  - restored a stable three-card single-row layout on desktop
  - kept mobile at a single-row three-card scaled layout
  - added stronger element-colored glow variants:
    - fire = red
    - water = blue
    - wood = green
- Added portal-specific glow treatment in the cross-chain section:
  - active portal now has a stronger breathing aura
  - inactive portal keeps a weaker background glow
- Rebuilt footer buttons to use NES.css icons:
  - GitHub -> `nes-icon github`
  - Twitter/X -> `nes-icon twitter`
  - Team -> `nes-icon star`
- Shifted footer buttons to a neutral stone/brick gray palette and compressed the footer stage height further.
- Removed extra homepage bottom padding so the page ends closer to the visible footer.

## Validation

- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

## 2026-03-27 Homepage Glow Removal + Footer Copy Pass

- Removed the visual glow treatment from the meet cards and cross-chain portal art.
- Simplified the meet-card art classes back to positional float-only rendering so the card row is not visually distorted by glow layers.
- Removed the homepage art glow-layer injection from `HomeArt`.
- Changed the `Reactive Network` emphasis to a stronger purple breathing treatment.
- Enlarged footer NES.css icons from `is-small` to `is-medium` and increased the footer stone-button size.
- Added the footer copyright line:
  - `2026 EIP-Playground ProtoMon`
- Removed the homepage shell’s extra bottom padding so the page no longer intentionally extends past the footer.

## Validation

- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

## 2026-03-27 Homepage Card Glow Isolation + Reactive Purple Pass

- Investigated the lingering meet-card row issue and moved homepage art glow off the positioned art container into a dedicated inner glow layer (`home-art-glow-layer`).
- This isolates glow rendering from the art wrapper’s position/size rules so card aura effects no longer share the same visual box as layout positioning.
- Tightened meet-card widths and offsets again for both desktop and mobile while keeping the mobile layout as a single scaled row under the `768px` breakpoint.
- Changed the Hero `Reactive Network` emphasis from cyan to purple and restored a stronger breathing glow treatment.
- Kept portal glow on the same isolated-layer pattern so the active portal aura remains visually strong without coupling to the art wrapper.

## Validation

- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

## Notes

- The `develop-web-game` Playwright loop is still blocked here because `playwright` is not installed in the local runtime (`require.resolve("playwright")` fails).

## 2026-03-27 Homepage Frosted Nav + Font Order Pass

- Reworked the homepage top controls into a fixed frosted-glass nav that stays pinned to the top of the viewport.
- Removed the `Dealer Online` pill from the homepage nav so the top bar now only contains:
  - language switcher
  - wallet controls
- Added a mobile-specific square wallet button so the small-screen nav keeps a compact footprint while still opening the RainbowKit flows.
- Updated pixel button styling so borders, inner highlights, and pressed states all use sharper pixel-art treatment for both utility buttons and the main CTA.
- Changed locale-driven font priority:
  - `en` now prefers `Press Start 2P`
  - `zh-CN` now forces `Zpix` first for headings and body/UI text

## Validation

- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

## 2026-03-27 Homepage Existing Icon Swap + Footer Anchor Pass

- Added `lucide-react` to `web/` and replaced the remaining hand-drawn homepage control icons:
  - wallet button now uses `lucide-react` `Wallet`
  - network button now uses `lucide-react` `Globe2`
  - language switcher now uses `lucide-react` `Languages`
  - back-to-top button now uses `lucide-react` `ChevronUp`
- Kept the footer action buttons on NES.css icons, but enlarged the icon scale and stone-button size so the GitHub / Twitter / Team buttons read correctly.
- Moved the footer content block away from vertical centering and anchored it from the top of the footer stage so the tagline and copyright now stack downward from the footer start area.
- Added a dedicated `chest-float` animation class and applied it to the mainnet reward chest art so the chest now bobs independently in the cross-chain section.

## Validation

- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

## Notes

- The `develop-web-game` Playwright loop is still blocked because the local runtime still does not provide the `playwright` package (`require.resolve("playwright")` fails in `web/`).

## 2026-03-27 Footer Lucide + CTA Icon + Chest Float Verification

- Replaced homepage footer icons from NES.css glyphs to `lucide-react` icons:
  - left button 1: `Code2`
  - left button 2: `MessageCircle`
  - right button: `Users`
- Kept footer button labels unchanged while switching icon renderer implementation in `HomeLanding.tsx`.
- Replaced the Hero CTA leading triangle CSS shape with a real `lucide-react` `Play` icon and retained pixel-shadow styling through `.cta-play-icon`.
- Increased chest bob visibility by tuning chest float motion:
  - `@keyframes chest-bob` peak from `-8px` to `-14px`
  - `chest-float` duration tightened to `3.2s` and `will-change: transform` added
- Verified the chest art config still mounts `className: "chest-float"` on `mainnet-chest.png`.

## Validation

- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## 2026-03-27 Homepage Button Interaction Pass

- Moved the language switcher to the far-right side of the fixed homepage nav so the top bar reads `wallet -> language`.
- Tightened the homepage wallet controls:
  - desktop network/account buttons now use narrower widths, smaller icons, and smaller text
  - mobile wallet button now uses a smaller square footprint
  - nav gap was reduced so the right-aligned controls occupy less horizontal space
- Standardized homepage button interaction states:
  - hover now visibly changes brightness, shadow, and lift
  - active now has a clearer pixel-style press-down effect
  - focus-visible now gets a visible outline for keyboard access
- Unified the button interaction language across hero CTA, nav controls, footer stone buttons, and back-to-top.
- Switched the remaining homepage icons to `react-icons` and removed the `lucide-react` dependency.

## Validation

- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

## Notes

- The `develop-web-game` Playwright loop still cannot run here because the local runtime does not provide the `playwright` package.

## 2026-03-27 Loading Page Visual Pass

- Replaced the old gradient/grid/particle loading-screen treatment with a full-screen image-backed scene using `web/public/protomon-loading/loading-bg.webp`.
- Added a minimal readability overlay:
  - light atmospheric top overlay
  - darker bottom overlay behind the progress cluster
- Inserted the animated dice asset `web/public/dice/rolling-dice.webp` directly above the loading bar as the new focal element.
- Preserved existing loading behavior:
  - message rotation
  - timed-mode completion
  - pending-mode reveal cap and ready-to-100 transition
  - shared `LoadingPage` usage for both entry loading and create-game loading
- Kept the loading language switcher in place.

## Validation

- `rtk pnpm lint` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

## Notes

- The `develop-web-game` Playwright loop remains blocked because `playwright` is not available in the local runtime.

## 2026-03-27 Homepage Nav + Hero Mock Pass 2

- Reworked the homepage top bar into a full-width fixed frosted-glass nav.
- Removed the homepage dealer-status widget from the top bar; the nav now only contains:
  - icon-based language dropdown (`中文` / `EN`)
  - RainbowKit wallet controls
- Rebuilt the wallet UI shell:
  - desktop: separate network and wallet buttons with inline SVG icons and text
  - mobile: single square wallet icon button
- Changed homepage hero copy structure to three lines:
  - `ProtoMon`
  - `ELEMENTAL ALCHEMY`
  - localized slogan line
- Strengthened pixel-art presentation:
  - more stepped button borders and pressed states
  - stronger title outlines and glow
  - CTA play-triangle glyph
  - ProtoMon card glow + float animation
- Enlarged the cross-chain labels and caption.
- Compressed the footer to a single row of square icon buttons using generic inline SVG icons.
- Updated locale labels so English now renders as `EN`.

## Validation

- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.

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

## 2026-03-27 Loading Page Background Transition Pass

- Restored a lightweight fallback loading visual layer so the loading screen no longer waits on the full background image before showing structure.
- `LoadingPage` now enters with:
  - a dark base backdrop
  - the old network/grid layer
  - the existing floating particle layer
- Added a local `backgroundReady` state driven by the loading background image load event.
- Updated loading background behavior so `/protomon-loading/loading-bg.webp` now fades in only after the image is ready.
- The network/grid layer now fades out after the real background becomes ready instead of disappearing immediately.
- The particle layer now persists after the background swap at reduced opacity so the transition keeps some ambient motion without fighting the final scene.
- Kept the animated dice asset and all loading progress/timing behavior unchanged.
- Added a dedicated component test for the fallback-to-final background transition in `web/tests/loading-page.test.tsx`.

## Validation

- `rtk pnpm vitest run tests/loading-page.test.tsx` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## Notes

- The `develop-web-game` Playwright loop is still blocked because the local runtime does not provide the `playwright` package.

## 2026-03-28 Battle HUD + Board Fit Cleanup Pass

- Fixed the battle HUD language switcher layering so the dropdown menu can open above the battle canvas:
  - `LanguageSwitcher` pixel dropdown now renders with an explicit high `z-index`
  - `BattleHudControls` and the battle header now keep `overflow-visible`
- Added a red battle-exit power button to the left side of the HUD using `react-icons/io5` `IoPowerSharp`.
  - Exit flow now asks for confirmation before routing back to `/`
- Enlarged the visible battle board by:
  - reducing inner viewport padding
  - slightly lowering the board base height used for scale-to-fit
  - widening and raising the right command panel in the battle scene layout config
- Reworked battle scene anchors:
  - mirrored the trainer sprite horizontally
  - removed background name plates
  - names are now plain outlined white pixel text
  - HP bars are anchored above the companion and boss sprites
  - HP numbers now render centered inside each bar
- Updated the boss display name to match the asset direction:
  - `zh-CN`: `哥布林机巧萨满`
  - `en`: `Goblin Gear Shaman`
- Split battle dice faces from right-panel element icons:
  - tray dice now use `/dice/dice-*.png`
  - right-panel element rows still use `/elements/icon-*.png`
- Reworked the dice tray presentation:
  - removed the separate roll-count badge
  - ROLL button label now embeds remaining throws as `ROLL(x/3)`
  - tray dice are larger, centered on the wood tray, and no longer sit inside framed boxes
- Tightened the right panel interaction model:
  - icon boxes removed; element and skill images now render directly with `#E1B800` borders
  - selected rows still expand and animate
  - inline CAST now slides in from the right and overlaps the row content
  - `Used` is suppressed while the selected row is still casting
- Added pixel-rounded clip-path styling to battle panels, rows, HP bars, passive cells, and hover tooltips.
- Updated battle tests for:
  - new `ROLL(x/3)` button labels
  - updated boss name
  - exit-button confirm flow

## Validation

- `cd web && rtk pnpm vitest run tests/battle-client.test.tsx tests/game-logic.test.ts` passed.
- `cd web && rtk pnpm lint` passed with only existing `@next/next/no-img-element` warnings.

## Notes

- `cd web && rtk pnpm build` is currently blocked in this environment by `next/font` fetching Google Fonts (`Orbitron`, `Press Start 2P`) from the network. The latest failure was environmental, not a local TypeScript or test failure.

## 2026-03-28 Loading Page Visual Pass 2

- Removed the remaining loading-page top control so the loading screen no longer shows the language switcher or any top-right nav affordance.
- Replaced the animated loading dice asset with a static dice face chosen from the six existing element dice images under `web/public/dice/`.
- Kept the dice decorative and centered above the loading bar, but switched its motion to a simple float animation instead of rotation.
- Added background-aware subtitle styling so the loading subtitle turns purple after the final loading background image finishes loading.
- Slowed the rotating loading message cadence by increasing the message interval and lengthening the fade swap timing.
- Preserved all existing loading behavior:
  - timed-mode completion
  - pending-mode reveal cap and ready-to-100 transition
  - fallback network/particles to final background transition

## Validation

- `rtk pnpm vitest run tests/loading-page.test.tsx` passed.
- `rtk pnpm vitest run tests/home-loading.test.tsx tests/home-scroll.test.tsx tests/locale-provider.test.tsx` passed.
- `rtk pnpm lint` passed.
- `rtk pnpm build` passed.

## Notes

- The loading dice face is randomized once per loading-screen mount and remains fixed for that loading session.
- The `develop-web-game` Playwright loop is still blocked because the local runtime does not provide the `playwright` package.

## 2026-03-28 Battle UI Phase 1.5 Single-Screen Board

- Reworked `web/components/battle/BattleClient.tsx` into a fixed-height `100dvh` shell with a compact top HUD and a centered scene board that scales the full battle layout as one desktop-first surface.
- Switched the battle route to use `web/public/battle/battle-bg.webp` as the unified scene background instead of separate stacked battle sections.
- Added a compact battle HUD that reuses the homepage wallet and language controls while surfacing only:
  - current turn
  - current boss indicator
  - sync/cloud status badge derived from `syncStatus`
  - used-slot count
- Removed the large descriptive battle header and removed the old primary developer/debug panel from the main battle UI.
- Rebuilt the battle stage into one in-scene composition:
  - trainer art
  - active ProtoMon art
  - boss goblin art
  - compact HP/name overlays only
- Rebuilt the passive item panel as an in-scene bottom-left relic grid with names under icons and basic hover tips for descriptions.
- Reworked the dice tray into an integrated in-scene wood board with:
  - existing backend-backed `ROLL` / `REROLL`
  - existing lock behavior
  - compact status copy
  - lock icon overlays instead of extra descriptive labels
- Rebuilt the right panel into a pixel-framed board with:
  - upper `ELEMENTS` rows mapped to the original 6 upper slots
  - lower `EIP SPELLS` rows mapped to the original 7 lower slots
  - row selection state driven by `selectedSlotId`
  - selected rows expanding vertically and revealing an inline `CAST` button
  - removal of the previous standalone bottom `CAST` button
- Kept current gameplay rules and backend flow intact:
  - roll / reroll still call the backend routes
  - cast still uses the existing local scoring and `applyLocalCast`
  - round advance still uses `/api/game/advance`
  - sessionStorage hydration still restores battle state
- Added a local `castingSlotId` UI hold so the inline cast button remains visible in the selected row during cast sync, which preserves the `正在施法` / `Casting…` feedback after local cast applies.
- Updated `web/tests/battle-client.test.tsx` to match the new HUD and inline cast flow while keeping the existing roll/reroll/cast/hydration regression coverage.

## Validation

- `cd web && rtk pnpm vitest run tests/battle-client.test.tsx tests/game-logic.test.ts` passed.
- `cd web && rtk pnpm lint` passed with `@next/next/no-img-element` warnings only.
- `cd web && rtk pnpm build` passed.

## Notes

- The battle board is now desktop-first single-screen. Narrow viewports scale the full board down instead of switching to a separate mobile layout.
- Passive-item tooltips are intentionally minimal in this pass; broader tooltip coverage is still deferred.
- The `develop-web-game` Playwright screenshot loop is still blocked locally because `playwright` is not installed in the current runtime.

## 2026-03-28 Public Asset Naming Cleanup

- Normalized the remaining non-uniform `web/public` asset names to lowercase ASCII kebab-case.
- Removed stray `.DS_Store` files from `web/public` subtrees.
- Fixed the dice asset typo:
  - `dice-glod.png` -> `dice-gold.png`
- Renamed battle/passive/skill assets from mixed Chinese filenames to consistent English kebab-case names, including:
  - passive relic icons -> `passive-*.png`
  - skill icons -> `skill-*.png`
  - `觉醒能量-icon.png` -> `awakening-energy-icon.png`
- Updated all code references that used the renamed files in:
  - `web/lib/battle/config.ts`
  - `web/components/loading/LoadingPage.tsx`
  - `web/tests/loading-page.test.tsx`

## Validation

- `cd web && rtk pnpm vitest run tests/loading-page.test.tsx tests/battle-client.test.tsx tests/game-logic.test.ts` passed.
- `cd web && rtk pnpm lint` passed with existing `@next/next/no-img-element` warnings only.
- `cd web && rtk pnpm build` passed.

## 2026-03-28 Battle Mock Rebuild on `battle-bg-full.webp`

- Rebuilt the battle scene around `web/public/battle/battle-bg-full.webp` as the sole full-screen battle background.
- Removed the previous boxed battle wrapper and kept the gameplay UI as a transparent overlay scaled against a `1200x896` mock-aligned board.
- Reworked the battle HUD to reuse the homepage frosted nav style and changed the content order to:
  - left: `BOSS 01 · Goblin Hacker`, slot progress
  - center: dynamic `TURN`, dynamic sync badge
  - right: shared wallet + language controls
- Added config-driven battle scene placement data in `web/lib/battle/config.ts` for trainer, ProtoMon, boss, passive items, tray, roll area, and right panel.
- Extended the active companion config with hover-only ProtoMon destiny lines and added a hover tooltip on the ProtoMon art.
- Rebuilt the right command panel to match the new mock direction:
  - 6 element rows in fixed `1 -> 6` order
  - reward / awakening row placed directly beneath them
  - spell rows with icon + bracketed slot label + damage
  - selected rows expand and reveal inline `CAST`
  - used rows show `Used`
- Added local battle feedback effects without changing battle logic:
  - element-row number / bar pulse on cast
  - spell-row damage popup on cast
  - boss-side floating red damage number
- Simplified the passive items area to a 2x3 icon grid with the sixth slot empty and hover tooltips for item details.
- Reworked the dice tray to remove the verbose top status block and keep only the tray, element-face dice, lock states, roll-count badge, and `ROLL` button.
- Preserved pre-roll local visual dice faces so the initial board no longer shows the generic six-sided placeholder cube.

## Validation

- `cd web && rtk pnpm vitest run tests/battle-client.test.tsx tests/game-logic.test.ts` passed.
- `cd web && rtk pnpm lint` passed with only existing `@next/next/no-img-element` warnings.
- `cd web && rtk pnpm build` passed.

## Notes

- The battle scene is now desktop-first and scales to fit the viewport; no separate mobile battle layout was introduced in this pass.
- `playwright` is still not available in the local runtime, so this pass was validated with Vitest + lint + build only.

## 2026-03-28 Battle Hold-to-Cast Fix + Panel Density Pass

- Shortened battle hold-to-cast from `3000ms` to `1500ms`.
- Replaced the old interval-only hold trigger with a deterministic hold model:
  - one hold timeout decides when the cast fires
  - UI progress still animates while holding
  - releasing early eases the fill overlay back to zero
- Fixed the regression where a fully filled hold bar could fail to actually release the slot.
- Added left-side hover tooltips for all 13 score slots with localized one-line hints in `web/lib/i18n/messages.ts`.
- Kept the upper bonus reward row non-castable and added a persistent gradient progress bar tied to `upperSubtotalLocal / 63`.
- Tightened right-panel spacing while increasing lower spell-row typography so all rows remain visible and easier to read.

## Validation

- `cd web && rtk pnpm vitest run tests/battle-client.test.tsx tests/game-logic.test.ts` passed.
- `cd web && rtk pnpm lint` passed with only existing `@next/next/no-img-element` warnings.
- `cd web && rtk pnpm build` could not be revalidated in this environment because a stale `next build` process lock remained and escalation to inspect/clear it was not approved.

## 2026-03-28 Stage 1 Sync Stability + Local Redis Pass

- Fixed the Stage 1 optimistic-sync overwrite bug where a delayed `TurnPlayed` confirmation from the previous turn could overwrite the active next-round dice UI.
- Added `pendingCast` state to the battle client/store so receipt reconciliation now compares against a stored optimistic snapshot instead of stale closure state.
- Changed confirmation reconciliation to merge into the latest live battle state:
  - confirmed anchor fields update from chain
  - active round UI is preserved if the player has already started the next round
- Tightened rollback semantics so post-tx mismatches and confirmation failures always enter `ROLLBACK_REQUIRED` behavior:
  - red sync lamp
  - blocking rollback modal
  - dice/cast interaction blocked until rollback
- Raised rollback modal priority above finish overlays and made persisted `ROLLBACK` snapshots restore into a blocked rollback state.
- Added local Redis development support in `web/lib/server/redis.ts`:
  - prefer `REDIS_URL`
  - fall back to Upstash REST envs
- Added `ioredis` as a direct web dependency for local Redis/Valkey TCP connections.
- Updated `.env.example` to document `REDIS_URL` precedence for local development.
- Expanded tests:
  - battle client keeps second-round dice visible when previous-turn receipt resolves later
  - battle client shows rollback modal on optimistic mismatch
  - game API confirms and rollback routes now have explicit coverage

## Validation

- `cd web && rtk pnpm vitest run tests/battle-client.test.tsx tests/game-api.test.ts tests/game-logic.test.ts` passed.
- `cd web && rtk pnpm lint` passed with existing `@next/next/no-img-element` warnings only.
- `cd web && rtk pnpm build` passed.

## Notes

- `develop-web-game` Playwright validation is still blocked here because the local runtime does not provide the `playwright` package in `web/` (`require.resolve("playwright")` fails).

## 2026-03-29 Project README Rewrite

- Replaced the minimal root `README.md` with a submission-oriented English project README.
- Added a full Chinese companion file at `README.zh-CN.md`.
- Reframed the repo landing docs around the Reactive hackathon review criteria:
  - problem statement
  - solution overview
  - explicit Reactive Contract usage
  - deployed addresses
  - post-deployment workflow
  - transaction record placeholders
  - quick start
  - current gaps
- Pulled deployed contract addresses and known deployment transaction hashes from the existing docs and kept still-missing workflow artifacts clearly marked as `TODO`.
- Added explicit language switch links between the English and Chinese README files.

## Validation

- Manually reviewed both README files for structure, link targets, and repo-path references.
- Verified referenced local paths exist:
  - `web/public/protomon-logo.png`
  - `docs/deployment-workflow.md`
  - `contracts/origin/ProtoMonGame.sol`
  - `contracts/reactive/ProtoMonReactiveBadge.sol`
  - `contracts/destination/ProtoMonBadge.sol`
