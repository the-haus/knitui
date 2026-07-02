# @knitui/drawer — Package Plan

Extract `Drawer` from `@knitui/components` into its own isolated package `@knitui/drawer` (the way
`@knitui/sheet` is standalone), preserving the current 4-edge API/behaviour 1:1, and **add the
reanimated + RNGH drag-to-dismiss** motion `@knitui/sheet` pioneered — mapped per edge — as an opt-in.

Companion plan: `docs/modal-package-plan.md`. **The shared overlay foundation and the single-axis
drag-to-dismiss primitive are defined in the Modal plan (§2 and §3); this plan does not restate them
— it builds on them and focuses on the per-edge geometry.** Reference impl for gesture/animation:
`docs/sheet-package-plan.md` + `packages/sheet`.

---

## 1. Goal & guardrails

- `@knitui/drawer` exposes the same `Drawer` compound component, the `position` (left/right/top/bottom)
  + `size` + `offset` + `radius` props, slots, and per-slot `styles` as today — a drop-in replacement.
- Keep the existing **per-edge Tamagui CSS slide** (`ENTER_OFFSET[position]` + `AnimatePresence` exit)
  as the **default** (exact parity, zero regression).
- **Add** an opt-in `dragToDismiss` layer: drag the panel **toward its own edge** to dismiss, reusing
  the shared single-axis drag primitive from the Modal plan (§3), with axis + sign chosen per edge.
- Reuse the **shared overlay foundation** exported from `@knitui/components` (Modal plan §2) — no copy.

---

## 2. Foundation & drag primitive — see the Modal plan

`@knitui/drawer` consumes exactly the same pieces as `@knitui/modal`:

- **Overlay foundation** (`ModalBase`, `ModalChromeStyles`/`resolveModalChromeSlots`/`MODAL_CHROME_SLOTS`,
  `panelWidthVariant`, `renderTextChild`, motion presets, `Box`/`Text`/`CloseButton`/`Overlay`/`Portal`)
  — imported from `@knitui/components` once the Modal plan's foundation exports land (Modal plan §2).
- **Shared drag-to-dismiss primitive** (`internal/dismiss/`: pure `engine.ts` + `useDragDismiss` +
  native/web `animated`) — built in the Modal plan §3, parameterised by axis/sign/extent.
- Same **dependency-cycle rule**: `@knitui/drawer` depends on `@knitui/components`; components must not
  depend back on `@knitui/drawer`. So `Drawer` is removed from the components barrel and consumers
  repoint (migration §7).

This plan assumes the Modal plan's milestones 1 (foundation export) and 4 (drag primitive) are done,
or it does them itself if Drawer ships first. **They should ship the primitive once and share it.**

---

## 3. Package structure

Mirror `packages/sheet`; name `@knitui/drawer`, Storybook port **6013**.

```
packages/drawer/
├── package.json            # @knitui/drawer, port 6013
├── (tsconfig/babel/eslint/jest/storybook configs — copied from sheet)
├── README.md
└── src/
    ├── index.ts
    ├── Drawer.tsx            # compound root (moved from components)
    ├── chrome.tsx           # DrawerContentFrame/Header/Title/Body + slot/styles types
    ├── geometry.ts          # per-edge tables (layout + enter-offset + drag axis/sign) — see §6
    ├── types.ts             # DrawerProps, DrawerPosition, DrawerSize, DrawerStyles, DrawerRef
    ├── Drawer.stories.tsx    # 9 stories ported (CSF3) + a DragToDismiss story
    └── Drawer.test.tsx       # 24 suites ported + drag-dismiss + engine tests
```

deps: `@knitui/components`, `@knitui/core`, `@knitui/hooks`, `@knitui/icons`; peers `react`/`react-native` +
optional `react-native-reanimated`/`react-native-gesture-handler`/`react-native-worklets` (for drag).

---

## 4. Public API (unchanged — verbatim parity)

`DrawerProps` preserved exactly (extends `ModalBaseSharedProps` + `DrawerContentFrameProps`):

`opened`/`onClose`/`closeOnEscape`/`closeOnClickOutside`/`lockScroll`/`returnFocus`/`trapFocus`/
`withinPortal`/`keepMounted`/`withOverlay`/`overlayProps`/`zIndex`/`overlayAnimation` · `title` /
`children` / `withCloseButton` / `closeButtonProps` / **`position`** (`"left"|"right"|"top"|"bottom"`,
default `"left"`) / **`size`** (xxs–xxl | number | string → `panelWidthVariant`, width for
left/right, height for top/bottom) / `radius` / **`offset`** (gap from the viewport edge) /
`animation` / `duration` / `styles` + a11y (`aria-label`/`aria-describedby`).

**New, additive:**
- `dragToDismiss?: boolean` (default `false`) — enable the per-edge drag-to-dismiss layer.
- `dragThreshold?: number` (default ~0.3 of the panel extent) — release past this dismisses.
- `animationConfig?: WithSpringConfig` — spring for the drag settle.
- Optional `ref` (`{ close() }`); Drawer stays controlled-only for parity.

Compound parts unchanged: `Drawer.Content` / `Drawer.Header` / `Drawer.Title` / `Drawer.Body`.
Per-slot `styles`: `overlay`/`content`/`header`/`title`/`body`/`closeButton` (same `resolveModalChromeSlots`).

---

## 5. Chrome (moves verbatim)

`DrawerContentFrame` (`position:relative`, `backgroundColor:$background`, `flexDirection:column`,
`alignSelf:"stretch"` so it fills the cross-axis, variants `radius`/`shadow` default `xl`),
`DrawerHeader` (row, space-between), `DrawerTitle`, `DrawerBody` (`flex:1`). Extent applied per edge:
`width = extent` for left/right, `height = extent` for top/bottom (via `panelWidthVariant` /
number / string).

---

## 6. Per-edge geometry — the Drawer-specific core (`geometry.ts`)

One table keyed by `DrawerPosition` drives layout, default slide, and the drag axis/sign. This is the
single place edges are expressed; chrome, motion, and the drag primitive all read it.

```ts
// Where the panel sits in the full-cover layer (ModalBaseInner flex), moved verbatim:
const LAYOUT = {
  left:   { direction: "row",    justify: "flex-start" },
  right:  { direction: "row",    justify: "flex-end"   },
  top:    { direction: "column", justify: "flex-start" },
  bottom: { direction: "column", justify: "flex-end"   },
} as const;

// Default CSS enter/exit nudge (parity with today's ENTER_OFFSET):
const ENTER_OFFSET = {
  left:   { x: -DISTANCES.enter }, right:  { x: DISTANCES.enter },
  top:    { y: -DISTANCES.enter }, bottom: { y: DISTANCES.enter },
} as const;

// NEW — drag-to-dismiss axis + the sign that travels OFF-SCREEN (toward the edge):
const DRAG = {
  left:   { axis: "x", sign: -1 }, // drag left  → dismiss
  right:  { axis: "x", sign: +1 }, // drag right → dismiss
  top:    { axis: "y", sign: -1 }, // drag up    → dismiss
  bottom: { axis: "y", sign: +1 }, // drag down  → dismiss
} as const;
```

- `isHorizontal = position === "left" || "right"` → `extent` is `width` (else `height`); the drag
  primitive's `extent` = the measured panel width/height for that axis.
- The shared drag primitive (Modal plan §3) is instantiated with `DRAG[position].axis`/`.sign` and the
  measured `extent`. Dragging in the dismiss direction is free; the opposite direction rubber-bands.
  Release past `dragThreshold` or a fling toward the edge → animate off-screen + `onClose`; else spring
  back to 0. Overlay opacity = `1 - |offset|/extent`.
- Native: `useAnimatedStyle` `translateX|translateY` per axis. Web: imperative painter
  (`useSharedValueListener`) — the documented "reanimated style is dead under web tooling" constraint.

---

## 7. Animation — default unchanged + opt-in drag

### Default (parity)
`defaultMotion` keyed to `position` (`enterStyle`/`exitStyle` = `opacity:0` + `ENTER_OFFSET[position]`,
`animateOnly:["transform","opacity"]`), via `useMotionPreset(animation ?? defaultMotion, { duration })`,
spread onto `DrawerContentFrame`; `AnimatePresence` plays exit; overlay fades in lockstep. **No change.**

### Opt-in `dragToDismiss`
As §6: per-edge single-axis drag using the shared primitive. The panel still **enters** via the CSS
slide preset; drag governs interactive dismiss. Close-by-button/escape/outside still uses the preset
exit (`AnimatePresence`), unchanged.

---

## 8. Migration

Same shape as the Modal plan §8:
1. Foundation exports land in `@knitui/components` (shared with Modal — do once).
2. Create `@knitui/drawer`, move `Drawer.tsx`/stories/tests, repoint imports to the foundation.
3. Remove `Drawer` (+ `DrawerProps` etc.) from `@knitui/components`' barrel.
4. Update consumers: **demo** (add `@knitui/drawer` dep + generator `PACKAGES` entry "drawer",
   regenerate sections, port 6013), plus grep `@knitui/components` importers of `Drawer`.
5. Stories must be **CSF3 `StoryObj` with `render`** (demo `StorySection` requirement — the sheet bug).
6. No Drawer-specific manager exists (unlike Modal's Modals manager), so the migration is lighter than
   Modal's — the only cross-package user is the demo + any direct `Drawer` importer.

---

## 9. Testing & verification

- Port all 24 Drawer test suites (visibility/keepMounted, title/body, dialog role, a11y label
  fallback + labelledby/describedby, close button + custom label + `withCloseButton=false`, **all 4
  positions**, **all 7 sizes**, ref forwarding, cross-axis `alignSelf:stretch`, portal interactivity,
  styles distribution across slots, static parts, offset gap, shadows).
- Add: shared drag `engine.ts` unit tests (per-axis dismiss vs return), and a per-edge `dragToDismiss`
  behavioural test (jsdom asserts `onClose` requested on a simulated toward-edge past-threshold drag;
  springs don't complete under jsdom — assert request, per sheet precedent). Parameterise over the 4
  edges so each axis/sign is covered.
- **Browser-verify** via Storybook + Playwright: each edge slides from the correct side, drag toward
  the edge dismisses with overlay fade, drag away rubber-bands, per-slot `styles` apply.
- `typecheck` / `lint` / `jest` green.

---

## 10. Milestones

1. **(Shared) Foundation export + drag primitive** — done once with the Modal plan (or here if Drawer
   ships first): `@knitui/components` overlay exports + `internal/dismiss/` engine+hook+animated.
2. **Scaffold** `packages/drawer` (copy sheet skeleton, port 6013).
3. **Move Drawer** — `Drawer.tsx`/`chrome.tsx`/`geometry.ts`/types/stories(CSF3)/tests, imports
   repointed; green standalone (default CSS slide only, all 4 edges).
4. **Wire `dragToDismiss`** per edge via `geometry.ts` `DRAG` table + the shared primitive; browser-
   verify all four edges.
5. **Migrate** — remove Drawer from components barrel, update demo + consumers, regenerate sections.
6. **Stories + tests + browser/sim verification**, README.

---

## Open questions

1. **Sequencing with Modal** — build the shared foundation export + drag primitive once (jointly) vs.
   whichever package ships first owning it. Recommend doing the shared bits in one PR, then Modal and
   Drawer as thin follow-ups.
2. **Foundation home** — `@knitui/components` export (recommended) vs. `@knitui/overlay-core` (see Modal
   plan §2 alternative).
3. Confirm removing `Drawer` from `@knitui/components`' barrel is acceptable (breaking change; the
   dependency cycle forbids a clean re-export shim back into components).
