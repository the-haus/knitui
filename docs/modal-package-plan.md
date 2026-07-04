# @knitui/modal — Package Plan

Extract `Modal` from `@knitui/components` into its own isolated package `@knitui/modal` (the way
`@knitui/sheet` is standalone), preserving the current API/behaviour 1:1, and **add the reanimated +
RNGH drag-to-dismiss** motion that `@knitui/sheet` pioneered as an opt-in enhancement.

Companion plan: `docs/drawer-package-plan.md` (shares the foundation + gesture primitive described
here). Reference impl for the gesture/animation approach: `docs/sheet-package-plan.md` + `packages/sheet`.

---

## 1. Goal & guardrails

- `@knitui/modal` exposes the same `Modal` compound component, props, slots, and per-slot `styles` as
  today — a drop-in replacement for `@knitui/components`' `Modal`.
- Keep the existing **Tamagui CSS motion** (drop-in fade + `AnimatePresence` exit) as the **default**
  so visual parity is exact and there's zero regression risk.
- **Add** an opt-in `dragToDismiss` layer (reanimated `SharedValue` + RNGH `Gesture.Pan` + native
  `useAnimatedStyle` / web imperative painter) reusing `@knitui/sheet`'s mechanics, so a modal card can
  be flicked away — iOS-card style.
- No duplication of the shared overlay foundation: it is **promoted to an importable surface** in
  `@knitui/components` and consumed by `@knitui/modal` (and `@knitui/drawer`).

---

## 2. The shared decision (applies to both this and the Drawer plan)

Modal and Drawer are both thin chrome over one foundation that is currently **internal-only** in
`@knitui/components/src/internal/`:

| Foundation piece                                                                                                                      | File                             | Status today          |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------- |
| `ModalBase` (portal + scrim + escape + scroll-lock + focus-trap + return-focus + `AnimatePresence`)                                   | `internal/modal-base.tsx`        | internal              |
| `ModalBaseInner` (+`.native`) positioning layer                                                                                       | `internal/modal-base-inner.tsx`  | internal              |
| `ModalBaseSharedProps`                                                                                                                | `internal/modal-base.tsx`        | internal              |
| `ModalChromeStyles` / `ModalChromeSlots` / `resolveModalChromeSlots` / `MODAL_CHROME_SLOTS`                                           | `internal/modal-base.tsx`        | internal              |
| `modalSizeVariant` / `panelWidthVariant` / `radiusVariant` / `shadowVariant`                                                          | `internal/style-props.ts`        | internal              |
| `renderTextChild`                                                                                                                     | `internal/render-text-child.tsx` | internal              |
| motion (`useMotionPreset`, `MotionPreset(Name)`, `DISTANCES`, …)                                                                      | `internal/motion.ts`             | **already public** ✅ |
| `Box`, `Text`, `CloseButton`, `Overlay`, `Portal`, `ScrollArea`                                                                       | various                          | **already public** ✅ |
| `slotStyles` / `SlotStyles` / `styled` / `GetProps` / `withStaticProperties` / `Theme` / `useThemeName` / `isWeb` / `AnimatePresence` | `@knitui/core`                   | **already public** ✅ |
| `useId` / `useFocusTrap` / `useReducedMotion`                                                                                         | `@knitui/hooks`                  | **already public** ✅ |

**Decision: export the foundation, do NOT copy it.** Copying `ModalBase`/variants into each package
would fork the overlay behaviour and let it drift. Instead add a small, additive public surface to
`@knitui/components` (a stable re-export of the overlay foundation) and have both leaf packages import it.

**Recommended export surface** (additive to `packages/components/src/index.ts`, no behaviour change):

```ts
// Overlay foundation (shared by @knitui/modal, @knitui/drawer)
export {
  ModalBase,
  type ModalBaseProps,
  type ModalBaseSharedProps,
  type ModalChromeStyles,
  type ModalChromeSlots,
  resolveModalChromeSlots,
  MODAL_CHROME_SLOTS,
} from "./internal/modal-base";
export { modalSizeVariant, panelWidthVariant } from "./internal/style-props";
export { renderTextChild } from "./internal/render-text-child";
```

`radiusVariant`/`shadowVariant` don't need exporting — Box already exposes `radius`/`shadow` as
inherited variants (use them on the element, as `@knitui/sheet` does for `shadow`).

### Dependency-cycle caveat (must respect)

`@knitui/modal` depends on `@knitui/components`. Therefore `@knitui/components` **must not** depend on
`@knitui/modal` (no re-export shim back into components, or we create a cycle). Consequences:

- The public `Modal` export is **removed** from `@knitui/components`' barrel; consumers import from
  `@knitui/modal`. (Migration step below.)
- The internal **Modals manager** (`@mantine/modals` port, memory `modals-manager`) currently rides
  on `Modal` _inside_ `@knitui/components`. Two options — **decide before milestone 5**:
  1. **Move the Modals manager into `@knitui/modal`** (it's modal-specific) — cleanest; components no
     longer references Modal at all.
  2. Keep a minimal components-internal modal for the manager only — avoids touching the manager but
     keeps a second modal impl alive. Not recommended.
     Plan assumes **option 1**.

> **Alternative considered:** a dedicated `@knitui/overlay-core` package holding `ModalBase` + the
> drag primitive, with `@knitui/components`, `@knitui/modal`, `@knitui/drawer`, `@knitui/sheet` all depending
> on it. Cleaner long-term, but a bigger move (ModalBase pulls Box/Overlay/Portal from components →
> would need those in overlay-core too). Deferred; the "export from components" path is the
> lower-risk first step and can be promoted to overlay-core later.

---

## 3. The shared drag-to-dismiss primitive (built once, used by Modal + Drawer)

`@knitui/sheet` already proved the cross-platform mechanic: a single `offset` `SharedValue`, one RNGH
`Gesture.Pan`, native `useAnimatedStyle` vs. web imperative painter (`useSharedValueListener`), and a
re-targetable spring. Modal/Drawer need a **simpler, single-axis "drag past a threshold → dismiss,
else spring back"** version (no snap points).

**Build a tiny shared primitive** — proposed location `@knitui/components/src/internal/dismiss/` (so it
ships with the foundation and `@knitui/sheet`'s richer engine stays separate but conceptually aligned):

```
dismiss/
├── engine.ts        # pure: dismissDecision({offset, velocity, extent, threshold}) → "dismiss" | "return"
├── useDragDismiss.ts# RNGH Pan on one axis (+sign), clamp/rubber-band, settle → spring(0) or dismiss
├── animated.tsx     # native: useAnimatedStyle translate{X|Y} + overlay opacity from |offset|/extent
└── animated.web.tsx # web: imperative painter via useSharedValueListener (sheet's pattern)
```

Axis/sign is a parameter: Modal uses **+Y (down)**; Drawer uses a per-edge axis+sign (see Drawer plan).
The overlay opacity fades from full at `offset 0` to 0 at `extent` (the same idea as sheet's
`overlayOpacity`). Pure `engine.ts` is unit-tested directly.

This primitive is reused verbatim by `@knitui/drawer`; only the axis/sign/extent differ.

---

## 4. Package structure

Mirror `packages/sheet` exactly (copy configs, change name + Storybook port to **6012**).

```
packages/modal/
├── package.json            # @knitui/modal, port 6012; deps below
├── tsconfig.json / .build.json / babel.config.js / eslint.config.mjs / jest.config.js / jest.setup.ts
├── .storybook/main.ts (port) + preview.tsx
├── README.md
└── src/
    ├── index.ts
    ├── Modal.tsx              # compound root (moved from components, imports foundation)
    ├── chrome.tsx            # ModalContentFrame/Header/Title/Body styled parts + slot/styles types
    ├── types.ts              # ModalProps, ModalSize, ModalStyles, ModalRef
    ├── motion/               # ONLY if drag layer needs local glue; else reuse components' dismiss/
    ├── Modal.stories.tsx     # 17 stories ported + a DragToDismiss story
    └── Modal.test.tsx        # 13 suites ported + drag-dismiss + engine tests
```

`package.json` deps: `@knitui/components`, `@knitui/core`, `@knitui/hooks`, `@knitui/icons`; peers
`react`/`react-native` + (for the drag layer) `react-native-reanimated`, `react-native-gesture-handler`,
`react-native-worklets` (optional peers, as in sheet).

---

## 5. Public API (unchanged — verbatim parity)

`ModalProps` is preserved exactly (extends `ModalBaseSharedProps` + `ModalContentFrameProps`):

`opened` / `onClose` / `closeOnEscape` / `closeOnClickOutside` / `lockScroll` / `returnFocus` /
`trapFocus` / `withinPortal` / `keepMounted` / `withOverlay` / `overlayProps` / `zIndex` /
`overlayAnimation` · `title` / `children` / `withCloseButton` / `closeButtonProps` / `padding` /
`withHeaderDivider` / `size` (xxs–xxl | number | string → `modalSizeVariant` maxWidth) / `centered` /
`fullScreen` / `radius` / `shadow` / `yOffset` / `xOffset` / `animation` / `duration` / `styles` +
a11y (`aria-label`/`aria-labelledby`/`aria-describedby`).

**New, additive:**

- `dragToDismiss?: boolean` (default `false`) — enable the reanimated/RNGH drag-down-to-dismiss layer.
- `dragThreshold?: number` (default ~0.3 of measured height) — distance/fraction past which release dismisses.
- `animationConfig?: WithSpringConfig` — spring for the drag settle (mirrors sheet).
- Optional `ref` exposing `{ close() }` (and `open()` if it ever owns uncontrolled state — currently
  Modal is controlled-only; keep controlled-only for parity).

Compound parts unchanged: `Modal.Content` / `Modal.Header` / `Modal.Title` / `Modal.Body` /
`Modal.CloseButton`. Per-slot `styles`: `overlay` / `content` / `header` / `title` / `body` /
`closeButton` via `resolveModalChromeSlots` (imported from the foundation).

---

## 6. Chrome (moves verbatim)

`chrome.tsx` holds the four `styled` parts unchanged: `ModalContentFrame` (`position:relative`,
`width:100%`, `maxHeight:100%`, `backgroundColor:$background`, variants `radius`/`shadow`/`size`
[→ `modalSizeVariant` maxWidth]/`fullScreen`), `ModalHeader` (`withBorder`), `ModalTitle`,
`ModalBody`; body wrapped in `ScrollArea scrollbars="y"`; header pinned (`flexShrink:0`). Centering,
`yOffset`/`xOffset`, `padding`, `withHeaderDivider` all preserved.

---

## 7. Animation — default unchanged + opt-in drag

### Default (parity, keep as-is)

`DEFAULT_MODAL_MOTION` = drop-in fade (`opacity:0, y:-DISTANCES.nudge`), resolved via
`useMotionPreset(animation, { duration })`, spread onto `ModalContentFrame`; `AnimatePresence` in
`ModalBase` plays the exit; overlay fades in lockstep. **No change** — this is the zero-risk path.

### Opt-in `dragToDismiss` (new, sheet-derived)

When `dragToDismiss`:

- Wrap the content frame in the shared **drag primitive** (§3), axis **+Y** (drag down).
- `GestureDetector` over the content; `offset` `SharedValue` tracks the finger (rubber-band upward).
- On release: `dismissDecision` (distance past `dragThreshold` OR downward fling) → animate `offset`
  → off-screen and call `onClose` on settle; else spring back to 0.
- Overlay opacity tracks `1 - |offset|/extent` so the scrim fades as the card is dragged away.
- Native uses `useAnimatedStyle`; web uses the imperative painter (reanimated `useAnimatedStyle` is
  dead under the repo's web tooling — the documented sheet constraint).
- Coexists with the CSS enter animation: the card still **enters** via the motion preset; drag only
  governs the **interactive dismiss**. (Open = preset; close-by-drag = spring; close-by-button/escape
  = preset exit via `AnimatePresence`, unchanged.)
- `fullScreen`/`centered` interactions: drag-to-dismiss is most natural for non-fullScreen cards;
  when `fullScreen`, default `dragToDismiss` off even if requested (document it), since there's no
  off-screen travel that reads as dismissal.

---

## 8. Migration (the breaking part)

1. Add the foundation exports to `@knitui/components` (§2) — additive, safe, ships first.
2. Create `@knitui/modal`, move `Modal.tsx`/stories/tests, rewrite imports to pull foundation +
   primitives from `@knitui/components`.
3. Move the **Modals manager** into `@knitui/modal` (option 1) and update its exports.
4. Remove `Modal` (+ `ModalProps` etc.) and the Modals manager from `@knitui/components`' barrel.
5. Update consumers: the **demo** (`packages/demo` — add `@knitui/modal` dep + the generator's
   `PACKAGES` list, regenerate sections; Storybook port 6012), plus any other in-repo importer
   (grep `from "@knitui/components"` for `Modal`/`openModal`/`modals`). `@knitui/dates`, `@knitui/carousel`
   etc. — verify none import `Modal` from components; repoint if they do.
6. Stories must be **CSF3 `StoryObj` with `render`** (the demo's `StorySection` ignores bare-function
   stories — the bug just fixed in `@knitui/sheet`).

---

## 9. Testing & verification

- Port all 13 Modal test suites (closed state, title/body, dialog role, size regression, ref,
  a11y labels, description combine, close button, fullScreen, scroll, compound API, styles
  distribution, static parts, exit animation, focus trap, return-focus, Escape).
- Add: drag primitive `engine.ts` unit tests (dismiss vs return by distance/velocity), and a
  `dragToDismiss` behavioural test (jsdom: assert `onClose` requested on a simulated past-threshold
  drag; note reanimated springs don't complete under jsdom — assert request, not unmount, per the
  sheet precedent).
- **Browser-verify** via Storybook + Playwright (as with sheet): enter animation, scrim, focus trap,
  drag-down dismiss + overlay fade, and per-slot `styles`.
- `typecheck` / `lint` / `jest` green before done.

---

## 10. Milestones

1. **Foundation export** — add the `@knitui/components` overlay-foundation exports; confirm nothing
   else breaks (`@knitui/components` typecheck/test green).
2. **Scaffold** `packages/modal` (copy sheet skeleton, port 6012).
3. **Move Modal** — `Modal.tsx`/chrome/types/stories(CSF3)/tests, imports repointed; `@knitui/modal`
   green standalone (default CSS motion only).
4. **Shared drag primitive** — `internal/dismiss/` (engine + hook + native/web animated) + engine tests.
5. **Wire `dragToDismiss`** into Modal; browser-verify.
6. **Migrate** — move Modals manager, remove Modal from components barrel, update demo + consumers,
   regenerate demo sections.
7. **Stories + tests + browser/sim verification**, README.

---

## Open questions

1. **Modals manager home** — move into `@knitui/modal` (recommended, option 1) vs. keep a
   components-internal modal (option 2). Decide before milestone 6.
2. **Foundation home** — export from `@knitui/components` now (recommended) vs. introduce
   `@knitui/overlay-core` up front. Plan takes the first; promotion path noted.
3. Confirm removing `Modal` from `@knitui/components`' barrel is acceptable as a breaking change (vs.
   keeping both temporarily — which the dependency cycle forbids cleanly).
