# @knitui/media — styling-system & Tamagui alignment plan

**Status:** implemented (2026-06-22) · **Created:** 2026-06-22 · **Owner:** TBD

> **Implementation note.** Phases 0–5 landed. Two deviations from the proposal,
> both for the better:
> - **Gap C used the token route (§3.1 option a), not the dark-`Theme` wrapper.**
>   A dark theme's `$color11` (≈#b4b4b4) would dim the glyphs; theme-independent
>   `OVER_MEDIA` tokens in `@knitui/core` `themes.ts` (`$mediaOnScrim`/`$mediaScrim`/
>   `$mediaControlSurface`/`$mediaOverlay`/`$mediaHighlight`) keep them crisp white.
>   Video glyphs go through an `OnScrimIcons` (`ControlIconProvider color=…`) wrapper.
> - **The scrim is ONE cross-platform `backgroundImage` linear-gradient** (not a
>   web-only `style` + native flat fallback): Tamagui 2.3 maps `backgroundImage` to
>   RN's `experimental_backgroundImage`, so the gradient renders on native too.
> A `control-size.ts` bridge (`MediaSize`/`clampMediaSize`) holds the size logic.
> Guardrail tests added: `components/src/__tests__/control-system.test.ts` (export
> shape) and `media/src/__tests__/no-color-literals.test.ts`. Visual verification on
> web + native sim (§5.3) remains the one manual step.

Goal: bring `packages/media` (Audio / Video players, Playlist, Recorder, and all
chrome/controls) into line with the `@knitui/components` architecture for its
**API, prop, and style usage**, so that a media player feels native to the kit —
same size keys, same `variant` semantics, same per-slot `styles` precedence,
same theme-driven color, same icon auto-wiring, same reduced-motion-safe motion.

---

## 1. Where media already aligns (keep, don't touch)

The package is **not** starting from zero. It already does the hardest part right:

- **Per-slot `styles` (Pillar B).** Every public component already accepts
  `styles?: SlotStyles<XxxStyles>` and resolves it through `slotStyles(...)` from
  `@knitui/core` — the exact canonical helper Button/Combobox use.
  - `Audio` → `AudioStyles` (`root`/`header`/`artwork`/`controlBar`/`title`/`artist`/`time`)
  - `AudioPlaylist` → `AudioPlaylistStyles`, `AudioRecorder` → `AudioRecorderStyles`
  - `Video` → `VideoStyles` (`root`/`surface`/`controlBar`/`scrim`/`bigPlay`/`buffering`/`captions`/`captionText`)
- **Tamagui `styled()` frames.** All layout frames are `styled(Box, { … })` with
  token-based base styles (`$color2`, `$lg`, `$borderColor`, `$sm`…). No raw
  `react-native` `View`/`StyleSheet` in layout (raw `<audio>`/`<video>` surfaces
  are the only unavoidable inline-style exceptions, web-only).
- **Chrome built on kit primitives.** Controls use `ActionIcon`, `Button`,
  `Slider`, `Menu` from `@knitui/components`, plus icons from `@knitui/icons`.
- **Compound parts via `withStaticProperties`.** `Audio.PlayPause`, `Video.Scrubber`,
  etc. are real behavioural sub-components reading controller/state from context —
  the **Combobox model** (`Combobox.Option`), which is a sanctioned canonical
  pattern. (See §6 — we are *not* converting these to marker slots.)

So this plan is about **closing four specific gaps**, not a rewrite.

---

## 2. The four gaps

| # | Gap | Canonical source of truth | Media today |
|---|-----|---------------------------|-------------|
| A | **Size scale** | `SizeKey = xxs…xxl` (7 keys), `controlMetrics` | `"xs"\|"sm"\|"md"\|"lg"\|"xl"` (5 keys), **re-declared 3×** (`AudioSize`, `VideoSize`, `AudioRecorderSize`) |
| B | **Icon sizing** | `CONTROL_ICON_SIZE` (14/14/16/20/24/28/32) + `controlIconSize()` | own `CONTROL_ICON_SIZE` (14/16/18/22/26) re-declared per domain; manual `size={iconSize}` on each icon |
| C | **Color / variant** | `variant-colors.ts` ladders (`VARIANT_FILL`/`_INTERACTION`/`_FOREGROUND_*`), theme-driven, `ControlIconProvider` | video hardcodes `ON_DARK = "white"` + `rgba(0,0,0,0.x)` literals (menus, scrim, overlays, captions); no `variant` prop, no on-dark token story |
| D | **Motion** | `motionPresets` + `useMotionPreset` + `usePressScale` (reduced-motion safe) | **none** — control-bar auto-hide, `BigPlay`, buffering/error overlays animate ad-hoc or not at all |

### 2.1 The blocking constraint (must solve first)

The canonical utilities for gaps A/B/C — `controlMetrics`, `SizeKey`,
`CONTROL_ICON_SIZE`, `controlIconSize`, the `variant-colors` ladders, and
`ControlIconProvider` — **all live in `packages/components/src/internal/` and are
NOT exported** from the `@knitui/components` public barrel (only `internal/motion`
is re-exported). Media consumes `@knitui/components` exclusively through its public
barrel (19 import sites, all `from "@knitui/components"`).

**Therefore media physically cannot reach the canonical ladders today, which is
*why* it re-declares them.** Any real alignment requires first exposing these
primitives. This is the linchpin — see §3.

---

## 3. Foundation: expose the control-system primitives (do this first)

We need one shared, importable home for the control-system primitives. Three options:

- **Option 1 — Public subpath from `@knitui/components` (RECOMMENDED).**
  Add a `@knitui/components/control-system` entry (or extend the main barrel) that
  re-exports the stable primitives: `SizeKey`, `SIZE_KEYS`, `DEFAULT_SIZE`,
  `controlMetrics`, `CONTROL_ICON_SIZE`, `controlIconSize`, `ControlIconProvider`,
  and the read-only color ladders (`VARIANT_FILL`, `VARIANT_INTERACTION`,
  `VARIANT_FOREGROUND_EMPHASIS`, `VARIANT_KEYS`).
  - *Why:* media already depends on `@knitui/components`; these are component-kit
    concerns (they reference Tamagui theme + `IconProvider`), so they belong with
    the kit, not in `@knitui/core`. Lowest-risk, no dependency-graph change.
  - *Cost:* commits us to these as public API (versioning surface). Mitigate by
    grouping them under a clearly-named `control-system` subpath documented as
    "the contract sized controls share."

- **Option 2 — Promote to `@knitui/core`.**
  Follows the precedent of `slots`, `slot-styles`, and motion tokens
  (`config/motion.ts`) already living in core.
  - *Why not (primary):* `variant-colors` + `ControlIconProvider` depend on
    Tamagui theme resolution and `IconProvider` — moving them drags
    component-kit + icon concerns into core, which today stays primitive. Bigger
    blast radius (every `internal/*` consumer in components must be repointed).
  - *Viable for the pure-data tables only* (`controlMetrics`, `CONTROL_ICON_SIZE`,
    `SizeKey`) if we want a stricter separation later.

- **Option 3 — Do nothing; reconcile values by hand.**
  Keep media's own ladders but hand-edit them to match canonical numbers.
  - *Why not:* leaves four duplicate sources of truth that silently drift the next
    time someone retunes `controlMetrics`. Explicitly rejected.

> **OPEN DECISION (needs sign-off):** Option 1 vs Option 2. Recommendation: **Option 1**
> for the icon-provider + color ladders; optionally also move the pure-data size
> tables to `@knitui/core` later if we want components+media to share them without a
> components dependency. The rest of this plan assumes Option 1.

**Foundation deliverable:** a documented `@knitui/components/control-system` export.
No behaviour change to `@knitui/components` itself — pure re-export.

---

## 4. Work plan (phased, each phase shippable)

### Phase 0 — Foundation (gate for everything else)
1. Add the `control-system` public export to `@knitui/components` (§3, Option 1).
2. Add a guardrail test asserting the export shape is stable.

### Phase 1 — Unify the size scale (Gap A)
1. Replace the three local `type AudioSize / VideoSize / AudioRecorderSize =
   "xs"|…|"xl"` with `SizeKey` from the new export. Keep domain aliases as
   `export type AudioSize = SizeKey` so public type names don't churn.
2. Decide the **supported subset**: media controls realistically use `xs…xl`.
   Adopt the full `SizeKey` type but document/clamp unsupported keys (`xxs`,`xxl`)
   to the nearest supported metric, mirroring how components `pickVariants`/clamp.
   Default stays `md`.
3. Delete `CONTROL_ACTION_SIZE` / `SCRUBBER_SIZE` maps where they merely re-key the
   same scale; pass `size` straight through to `ActionIcon`/`Slider` (which already
   speak `SizeKey`). Keep a map **only** where media genuinely steps a nested
   control down a key (the Combobox `toEmbeddedControlSize` pattern) — e.g. a
   scrubber that should render one size smaller than its bar.

### Phase 2 — Icon auto-wiring (Gap B + half of C)
1. Delete media's per-domain `CONTROL_ICON_SIZE` re-declarations and `iconSizeFor()`
   helpers; import `controlIconSize` / `CONTROL_ICON_SIZE` from the new export.
2. Wrap each control's icon content in **`ControlIconProvider size={size}
   variant={…}`** instead of manually threading `size={iconSize}` and
   `color={ON_DARK}` onto every `<Icon>`. This makes icons auto-size **and**
   auto-color, and is the mechanism that fixes the "on-dark" color story (next phase).

### Phase 3 — Color / variant system (Gap C)
This is the largest and is **video-specific** (audio is already fully tokenized).
1. **Introduce an on-dark surface story.** Video chrome sits on top of video pixels,
   so it can't use the normal `$colorN` ramp the way a card does. Define the
   over-media palette as **theme tokens**, not literals:
   - Add scrim / over-media tokens (e.g. `$mediaScrim`, `$mediaOnDark`,
     `$mediaControlBg`) to the theme, OR drive the chrome through a dedicated
     dark-themed `Theme` wrapper so `ControlIconProvider variant="filled"` and
     frame `$colorN` tokens resolve against a guaranteed-dark scale.
   - **Recommendation:** wrap video chrome in `<Theme name="dark">` (or the
     project's equivalent inverse theme) so all existing token references "just
     work" on dark, and `ControlIconProvider` produces white-equivalent glyphs via
     `VARIANT_FOREGROUND_EMPHASIS` instead of the literal `ON_DARK = "white"`.
2. **Replace every `rgba(…)` literal** in `Video.chrome.menus.tsx`,
   `Video.chrome.tsx`, `Video.chrome.overlays.tsx`, `Video.shared.ts`, and the
   `Video.tsx` scrim gradient with the new tokens. Inventory (from audit):
   - caption bubble `rgba(0,0,0,0.75)` → `$mediaCaptionBg`
   - scrim gradient `linear-gradient(... rgba(0,0,0,0.75) → 0)` → token-based stops
   - white overlay `rgba(255,255,255,0.35)` → token
   - menu bg `rgba(0,0,0,0.7)` → `$mediaControlBg`
   - error overlay `rgba(0,0,0,0.6)` → token
   - root native scrim `rgba(0,0,0,0.45)` (the `isWeb ? 'transparent' : …` branch) → token
   - delete the `ON_DARK = "white"` constant once `ControlIconProvider` covers glyphs.
3. **Optional `variant` prop on players.** Components expose a `variant` from
   `VARIANT_KEYS`. Media's natural axis is smaller — most players want exactly one
   look. Recommendation: **do not** add the full 9-variant API; instead expose a
   focused `appearance`/`tone` if a real second look is needed, and keep the
   internal chrome on `ControlIconProvider variant` so it benefits from the ladders
   without surfacing a confusing 9-way prop. (Mark as a follow-up, not in scope.)

### Phase 4 — Motion (Gap D)
1. Adopt `usePressScale()` on the custom control buttons that don't already inherit
   it from `ActionIcon`/`Button` (most do — audit and only add where a raw frame is
   pressable).
2. Drive the **chrome auto-hide**, **`BigPlay`**, **buffering**, **error**, and
   **caption** enter/exit through `useMotionPreset` (e.g. `fade` / `fade-up` /
   `pop`) instead of ad-hoc opacity. This makes them reduced-motion-safe for free
   (`useMotionPreset` returns `INERT` under reduced motion / disabled config).
3. Reuse the existing `useHoldWhileOpen` hook for menu-open auto-hide suppression —
   no change, just confirm it composes with the preset-driven fade.

### Phase 5 — Verification & docs
1. Add/extend `Styles` stories per component (the kit convention — every public
   component has a `Styles` demo) proving per-slot overrides + `theme="…"` recolor.
2. Add a guardrail test: **no `rgba(`/hardcoded color literals** in
   `packages/media/src/**` (allow-list the web `<video>`/`<audio>` surface files).
3. Verify in the media Storybooks (Audio 6010 / Video 6009) on web + native sim,
   including `theme="dark"`/`theme="red"` recolor and reduced-motion.
4. Update memory notes (`video-package`, `audio-package`, `media-provider`).

---

## 5. Concrete change inventory (by file)

- `audio/Audio.shared.ts`, `video/Video.shared.ts`,
  `audio/recorder/AudioRecorder.shared.ts` — drop local `*Size` type + local
  `CONTROL_ICON_SIZE`/`CONTROL_ACTION_SIZE`/`SCRUBBER_SIZE` maps; alias to `SizeKey`.
- `audio/Audio.chrome.internal.tsx`, `video/Video.chrome.internal.tsx` — drop
  `iconSizeFor`/local size import; use `controlIconSize` + `ControlIconProvider`.
- `video/Video.chrome.tsx`, `video/Video.chrome.menus.tsx`,
  `video/Video.chrome.overlays.tsx` — remove `ON_DARK`, all `rgba()`; wrap in dark
  `Theme` + `ControlIconProvider`.
- `video/Video.tsx`, `video/Video.shared.ts` — tokenize scrim gradient + native
  scrim + caption bubble.
- `audio/Audio.chrome.controls.tsx`, `audio/playlist/AudioPlaylist.chrome.tsx` —
  pass `size` straight through; `ControlIconProvider` wrap.
- `packages/components/src/index.ts` (+ new `control-system` entry) — Phase 0 export.

---

## 6. Explicitly out of scope / non-goals

- **Marker slots (Pillar A, `createSlot`/`defineSlots`).** Media's compound parts
  are behavioural controls (read controller + capabilities), like `Combobox.Option`,
  not layout markers like `Button.Left`. Converting them buys nothing and loses
  behaviour. Keep `withStaticProperties` as-is.
- **Full 9-key `variant` API on players** (see Phase 3.3) — deferred.
- **Headless controller / engine / provider architecture** — untouched; this plan is
  strictly the presentation layer (props/style/size/color/motion).
- **Promoting color ladders into `@knitui/core`** — deferred unless Option 2 is chosen.

---

## 7. Risks

- **Public-API surface growth** in `@knitui/components` (the `control-system` export)
  — mitigated by a stable, documented, intentionally-small re-export + guardrail test.
- **Video on-dark recolor regressions** — the dark-`Theme` wrapper is the riskiest
  change; verify pixel output on iOS sim specifically (cf. the prior
  `shadowColor`/`dropShadowColor` iOS alpha-drop incident — RN-reserved style names
  + token alpha on iOS have bitten this kit before).
- **Size-key clamping** for `xxs`/`xxl` must not change existing `xs…xl` rendering.
```
