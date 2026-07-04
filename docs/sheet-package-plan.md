# @knitui/sheet — Package Plan

A cross-platform **bottom sheet** for React Native first, web second. Slides up from the
bottom, drags to dismiss, supports multiple snap points and a handle, auto-adjusts to screen
size, and is fully themeable / sizeable / animatable.

Design north star: **reuse what already exists**. Gestures + animation follow the
`@knitui/carousel` model (pure-TS engine + RNGH + reanimated native / imperative web painter).
Overlay/portal/focus concerns reuse `@knitui/components` `ModalBase`. Chrome, slots, and the
per-slot `styles` prop follow the exact conventions used across the kit.

---

## 1. Goals & feature map

The target feature set (from the Tamagui Sheet API the request is modelled on) maps onto this
codebase as follows:

| Feature                        | How we deliver it                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Lightweight drag-to-open/close | Pure-TS snap engine + shared RNGH `Gesture.Pan` (carousel `useDragGesture` template)      |
| Multiple snap points           | `snapPoints: number[]` (% of screen) → offsets in the engine; velocity-aware settle       |
| Handle                         | `Sheet.Handle` chrome part; tap cycles snap points (overridable `onPress`)                |
| Auto-adjusts to screen size    | Snap offsets computed from measured viewport height (`onLayout`/window)                   |
| Animations / themes / sizes    | Reanimated spring/timing (`animationConfig`); Tamagui theme tokens; `size` ladder         |
| Overlay + tap-to-dismiss       | Reuse `Overlay` scrim + `ModalBase` outside-press; opacity tracks drag offset             |
| Controlled / uncontrolled open | `opened` / `defaultOpened` / `onClose` (kit Modal house style)                            |
| Modal vs inline                | `modal` prop → teleport to `"root"` host (Portal) or render in place                      |
| Scroll inside sheet            | `Sheet.ScrollView` with scroll↔drag handoff (RNGH `simultaneous`/`blocksExternalGesture`) |
| Dismiss-on-snap-to-bottom      | Engine appends a `0` offset; settling there fires close                                   |
| Keyboard aware (native)        | `moveOnKeyboardChange` → `KeyboardAvoidingView` (kit already has the platform split)      |
| Web body scroll lock           | Inherited from `ModalBase` (`document.body.style.overflow`)                               |

---

## 2. Architecture — three clean layers

Exactly mirrors carousel's "platform-agnostic gesture + shared engine + platform-specific
rendering" separation. **Zero bare `react-native` imports in `src`** — primitives come from
`@knitui/components`, style types from `@knitui/core`.

```
┌──────────────────────────────────────────────────────────────┐
│  L3  Chrome + Slots + Public API                               │
│      Sheet, Sheet.Overlay/Frame/Handle/ScrollView,             │
│      per-slot `styles`, controlled/uncontrolled state          │
├──────────────────────────────────────────────────────────────┤
│  L2  Motion + Gesture (platform edges)                         │
│      offset SharedValue · RNGH Pan · native useAnimatedStyle / │
│      web imperative painter · re-targetable withTiming/Spring  │
├──────────────────────────────────────────────────────────────┤
│  L1  Engine (pure TS, "worklet", zero deps)                    │
│      snap-point math · velocity-aware settle · overlay-opacity │
└──────────────────────────────────────────────────────────────┘
```

### Why this split (and where it differs from "just use ModalBase")

`ModalBase` drives its show/hide with declarative **motion presets** (`enterStyle`/`exitStyle` +
`AnimatePresence`). A sheet can't use that for its primary motion, because the frame's `translateY`
and the overlay's opacity must follow the **finger in real time** and settle on velocity. So:

- The **visual** (frame translateY + overlay opacity) is driven by the L1/L2 reanimated layer.
- The **cross-cutting overlay concerns** (portal to root, web scroll-lock, Escape, outside-press,
  focus-trap, return-focus) are still reused from `ModalBase`/its hooks — we do **not** re-implement
  them.

Concretely: `SheetBase` wraps content in `Portal` + `Theme` + the same scroll-lock/Escape/focus-trap
effects `ModalBase` uses, but keeps the frame mounted while the **close animation** plays and unmounts
only when the settle callback reports "closed" (instead of `AnimatePresence`).

---

## 3. Package scaffold

Copy the carousel package skeleton verbatim, adjust name/port/exports.

```
packages/sheet/
├── package.json            # name @knitui/sheet, storybook port 6010, deps below
├── tsconfig.json           # copy from carousel
├── tsconfig.build.json     # copy from carousel
├── babel.config.js         # copy
├── eslint.config.mjs       # copy
├── jest.config.js          # copy
├── jest.setup.ts           # copy
├── .storybook/main.ts      # copy, bump port
├── README.md
└── src/
    ├── index.ts                       # barrel
    ├── Sheet.tsx                      # compound root (controlled/uncontrolled state, context)
    ├── chrome.tsx                     # styled parts + slots + per-slot styles interface + context
    ├── types.ts                       # SheetProps, SheetStyles, engine types
    ├── context.tsx                    # SheetContext (offset SV, controller, config)
    ├── engine/
    │   ├── snap.ts                    # offsets ↔ snap index, clamp, dismiss point
    │   ├── settle.ts                  # velocity-aware landing snap (pure, "worklet")
    │   ├── overlay.ts                 # offset → overlay opacity (pure)
    │   └── __tests__/engine.test.ts   # canonical engine unit suite
    ├── motion/
    │   ├── useSheetMotion.ts          # owns offset SharedValue, resolves config, controller
    │   └── animate.ts                 # animateOffset (re-targetable withTiming/withSpring)
    ├── input/
    │   ├── useSheetDrag.ts            # RNGH Pan (both platforms) → settle
    │   ├── useScrollHandoff.ts        # scroll↔drag coordination for Sheet.ScrollView
    │   └── types.ts                   # gesture param contract
    ├── view/
    │   ├── SheetBase.tsx              # portal/scroll-lock/escape/focus-trap scaffold (reuses ModalBase parts)
    │   ├── Frame.tsx                  # native: Reanimated.View + useAnimatedStyle
    │   ├── Frame.web.tsx              # web: Box + imperative painter registration
    │   ├── Overlay.tsx / .web.tsx     # scrim; opacity painted from offset
    │   ├── Handle.tsx                 # handle bar (tap-cycles snap points)
    │   ├── ScrollView.tsx             # Sheet.ScrollView w/ handoff
    │   └── painter.web.ts             # web: addListener → imperative transform/opacity writes
    └── Sheet.stories.tsx
```

`package.json` deps: `@knitui/core`, `@knitui/components`, `@knitui/hooks`, `@knitui/icons`,
peer `react`/`react-native`, plus `react-native-reanimated`, `react-native-gesture-handler`,
`react-native-worklets` (same set carousel already pulls). Storybook port **6010** (6008 carousel,
6009 video are taken).

---

## 4. L1 — The engine (pure TS, the part worth getting right first)

No React, no reanimated, no DOM. All functions `"worklet"`-tagged so native runs them UI-thread;
the babel plugin strips the directive on web/jest. **Unit-tested directly**, the way carousel tests
`engine.test.ts`.

```ts
// engine/snap.ts
// snapPoints are 0–100 (% of available height), ordered most-visible → least-visible.
// We convert to translateY offsets where 0 = fully at the resting top, larger = pushed down.
export function snapOffsets(snapPoints: number[], maxHeight: number): number[];
export function resolveSnapHeight(snapPoint: number, maxHeight: number): number;
export function clampOffset(offset: number, offsets: number[], overdrag: number): number;
export function nearestSnapIndex(offset: number, offsets: number[]): number;

// engine/settle.ts  — the heart: where does a release land?
export interface SettleInput {
  offset: number; // current translateY
  velocity: number; // px/s (down = +)
  offsets: number[]; // sorted snap offsets (incl. dismiss 0-height if enabled)
  dismissIndex: number; // -1 if dismissOnSnapToBottom is off
  flickThreshold?: number; // default 300 px/s
  projection?: number; // velocity projection factor, default 0.2
}
export interface SettleResult {
  index: number;
  offset: number;
  dismiss: boolean;
}
export function settle(input: SettleInput): SettleResult;

// engine/overlay.ts
// Overlay fully opaque at the most-open snap, fades to 0 at the dismiss/closed offset.
export function overlayOpacity(
  offset: number,
  openOffset: number,
  closedOffset: number,
  max: number,
): number;
```

Notes

- "Auto-adjust to screen size" lives here: callers pass measured `maxHeight`; engine stays unitless.
- Rubber-band overdrag past the most-open snap mirrors carousel's `value * 0.5` damping.
- `settle` projects the release point with velocity (carousel's `velocity * 2` analogue) then snaps to
  the nearest offset, so a fast flick skips intermediate snaps — matches native sheet feel.

---

## 5. L2 — Motion + gesture (platform edges)

### Offset SharedValue + controller (`motion/useSheetMotion.ts`)

Owns `offset = useSharedValue(closedOffset)`. Resolves `animationConfig` (spring vs timing).
Exposes an imperative controller (snapping is just `animate(offset → offsets[index])`):

```ts
interface SheetController {
  snapTo(index: number): void; // programmatic snap (Handle tap, `position` prop, keyboard)
  open(): void;
  close(): void;
  offset: SharedValue<number>; // for painters / derived overlay
}
```

### Programmatic animation (`motion/animate.ts`)

Lifted straight from carousel's `animateOffset`/`applySettle` — generalized, not carousel-specific:

```ts
export function animateOffset(
  offset: SharedValue<number>,
  target: number,
  config: WithSpringConfig | WithTimingConfig | undefined,
  onFinished?: () => void, // scheduleOnRN hop → fires onOpenChange/onPositionChange
): void;
```

`animationConfig` prop → `withSpring(target, config, cb)`; default → `withTiming` with the kit's
motion-token easing. On settle-to-dismiss, `onFinished` flips `open=false` (uncontrolled) /
calls `onOpenChange(false)` (controlled) **after** the close animation, then unmounts.

### Drag gesture (`input/useSheetDrag.ts`)

One `Gesture.Pan()` for **both platforms** (carousel proved RNGH Pan works identically on web).
`onUpdate`: `offset.value = clampOffset(start + e.translationY, offsets, overdrag)` (rubber-band
past the open edge). `onEnd`: call `settle({...})`, then `animateOffset` to the result; if
`result.dismiss`, run close. Disabled when `disableDrag`.

### Native vs web rendering (the carousel pattern, 1:1)

- **Native** (`Frame.tsx`, `Overlay.tsx`): `Reanimated.View` + `useAnimatedStyle` →
  `transform:[{translateY: offset.value}]`; overlay `opacity` via `useDerivedValue(overlayOpacity)`.
  Declarative, UI-thread.
- **Web** (`Frame.web.tsx`, `painter.web.ts`): `useAnimatedStyle`/`useAnimatedReaction` are dead under
  Storybook's Vite tooling (documented carousel gotcha), so subscribe to `offset` with
  `useSharedValueListener` (`addListener`) and imperatively write `element.style.transform` /
  overlay `opacity`. Same imperative-painter approach as `Item.web.tsx`/`painter.web.ts`.

**Critical gotcha (from carousel memory):** never spread a Tamagui animation driver onto the same node
that reanimated drives — animated frame is its own `Reanimated.View`/`Animated.View` host, chrome
styling sits on a child or via props, not a shared animated node.

### Scroll ↔ drag handoff (`Sheet.ScrollView`)

The marquee native-feel feature. Use RNGH composition:

- `Gesture.Native()` for the inner ScrollView, `Gesture.Pan()` for the sheet drag.
- `Gesture.Simultaneous(...)` + a worklet guard: the sheet drag only engages when the ScrollView is at
  `scrollY <= 0` and the drag direction is **down** (or when the sheet isn't at its top snap). Otherwise
  the ScrollView owns the gesture. This is the "scroll up at top → drag the sheet" behaviour.
- Use RNGH `blocksExternalGesture`/`simultaneousWithExternalGesture` refs to wire the two without
  conflicts. Web: native overflow scrolling + the same at-top check.

---

## 6. L3 — Chrome, slots, per-slot styles, public API

### Chrome (`chrome.tsx`) — follows the kit convention exactly

`styled(Box, …)` parts, **`position:"relative"` on the frame** (the documented Tamagui-vs-RN-View
default gotcha — invisible to jsdom, must verify in a real browser):

```ts
export const SheetFrame   = styled(Box, { name: "Sheet", position: "relative", ...,
  variants: { size: { sm:{borderRadius:"$sm"}, md:{borderRadius:"$md"}, lg:{borderRadius:"$lg"} } },
  defaultVariants: { size: "md" } } as const)
export const SheetOverlay = styled(Box, { name: "SheetOverlay", position: "absolute", inset: 0,
  backgroundColor: "$shadowColor" /* theme-aware scrim */ })
export const SheetHandle  = styled(Box, { name: "SheetHandle", alignSelf: "center", width: 40,
  height: 4, borderRadius: "$round", backgroundColor: "$color7" })
export const SheetScrollFrame = styled(Box, { name: "SheetScrollView", flex: 1 })
```

### Slots (`@knitui/core` `defineSlots`)

```ts
export const SheetSlots = defineSlots({
  Overlay: createSlot<"Overlay">("Overlay"),
  Handle: createSlot<"Handle">("Handle"),
  Frame: createSlot<"Frame">("Frame"),
});
// collected at render: SheetSlots.collect(children, { displayName: "Sheet" })
```

Anatomy stays identical to the requested API:

```tsx
<Sheet open={open} onOpenChange={setOpen} snapPoints={[80, 40]}>
  <Sheet.Overlay />
  <Sheet.Handle />
  <Sheet.Frame>{/* contents, or <Sheet.ScrollView/> */}</Sheet.Frame>
</Sheet>
```

### Per-slot `styles` prop (`@knitui/core` `slotStyles`)

```ts
export interface SheetStyles {
  root?: GetProps<typeof SheetFrame>;
  overlay?: GetProps<typeof SheetOverlay>;
  handle?: GetProps<typeof SheetHandle>;
  scrollView?: GetProps<typeof SheetScrollFrame>;
}
export const SHEET_SLOT_KEYS = ["root", "overlay", "handle", "scrollView"] as const;
```

Resolve with `slotStyles<SheetStyles>(props.styles, SHEET_SLOT_KEYS, "Sheet")`; use `s.get(k)` where
there is no competing prop, `s.merge(k, explicit)` where one exists. Precedence
(low→high): `defaults < styles[slot] < explicit props < inline props on the composed part`. A
`SheetStylesProvider` (React context) lets `Sheet.Frame`/`Sheet.Handle` read their slot styles when
authored as children. This is the same mechanism carousel's `chrome.tsx` uses.

### Compound assembly

`withStaticProperties(Sheet, { Overlay, Frame, Handle, ScrollView, Slots: SheetSlots, Styles })`.

### Public API (`types.ts`)

Match the requested feature contract while staying consistent with the kit. **Decided:** the
controlled/uncontrolled surface uses the kit's Modal house style — `opened` / `onClose` (+
`defaultOpened`) — for consistency across `@knitui/components`. The sheet-specific surface keeps the
Tamagui spec names (`snapPoints`, `position`, `dismissOnSnapToBottom`, `modal`, …).

```ts
interface SheetProps {
  opened?: boolean;
  defaultOpened?: boolean;
  onClose?: () => void;
  // onClose() fires for any dismissal (overlay press, drag-to-dismiss, Escape, snap-to-bottom).
  position?: number;
  defaultPosition?: number;
  onPositionChange?: (i: number) => void;
  snapPoints?: number[]; // default [80, 10] — % of screen, most→least visible
  dismissOnOverlayPress?: boolean; // default true
  dismissOnSnapToBottom?: boolean; // appends a 0 snap that closes
  disableDrag?: boolean;
  modal?: boolean; // teleport to root host vs inline
  animationConfig?: WithSpringConfig; // spring passed to animate layer
  moveOnKeyboardChange?: boolean; // native KeyboardAvoidingView
  disableRemoveScroll?: boolean; // web body-scroll-lock opt-out
  zIndex?: number;
  size?: SizeKey; // border-radius / handle scale
  styles?: SlotStyles<SheetStyles>;
  children: React.ReactNode;
}
```

> **API naming (resolved):** uses `opened`/`onClose`/`defaultOpened` to match the kit's Modal house
> style. `onClose` is a single dismissal callback (no boolean arg), fired after the close animation
> settles, for every dismissal path.

---

## 7. Overlay / modal integration (reuse, don't rebuild)

`SheetBase.tsx` reuses, from `packages/components/src/internal/modal-base.tsx` and friends:

- **Portal** to the `"root"` host (`@knitui/components` Portal, react-native-teleport) when `modal`,
  wrapped in `<Theme>` so tokens survive the boundary; inline render otherwise.
- **Web body scroll-lock** (`document.body.style.overflow`) gated by `!disableRemoveScroll`.
- **Escape to close** (web document keydown) and **outside/overlay press** (`dismissOnOverlayPress`).
- **Focus trap** + **return-focus** via `useFocusTrap` (no-op native).

What SheetBase does _differently_ from ModalBase: it does **not** use `AnimatePresence`/motion presets
for show/hide. Mount on open; on close, run the reanimated close animation and unmount in the settle
`onFinished`. The overlay opacity is derived from the live `offset` (fades with the drag), which
`AnimatePresence` can't express.

---

## 8. Keyboard (native)

`moveOnKeyboardChange` → wrap the frame in `KeyboardAvoidingView` (`behavior="padding"`) on native; the
kit already ships the `.native.tsx`/`.web.tsx` split (web is a stripping pass-through). Matches how
`modal-base-inner.native.tsx` swaps it in. Web needs nothing — the browser reflows.

---

## 9. Accessibility

- Frame: `role="dialog"` + `aria-modal` (web) / `accessibilityViewIsModal` (iOS) / `importantForAccessibility`
  sibling muting (Android).
- Handle: `role="slider"`/button with `aria-label`, keyboard up/down to cycle snaps (reuses the
  controller `snapTo`).
- Escape closes (web); focus moves into the sheet on open and returns on close (focus-trap reuse).
- Respect `useReducedMotion` (`@knitui/hooks`) → collapse animation duration, like carousel.

---

## 10. Testing & verification

- **Engine unit tests** (`engine/__tests__/engine.test.ts`): `snapOffsets`, `nearestSnapIndex`,
  `settle` (flick vs slow drag vs dismiss), `overlayOpacity`. Pure, fast, the primary correctness gate
  — same posture as carousel.
- **Component tests** (`Sheet.test.tsx`): controlled/uncontrolled open, `dismissOnOverlayPress`,
  snap via `position` prop, slot collection, per-slot `styles` precedence.
- **Browser verification**: jsdom can't see the `position:relative` frame bug or real transforms —
  verify drag, snap, overlay fade, and scroll-handoff in Storybook (Playwright) and on an Android
  emulator (drag/fling), exactly as the carousel workflow does.

## 11. Storybook stories

`Default`, `SnapPoints`, `Handle`, `Modal vs Inline`, `ScrollView` (handoff), `DragToDismiss`,
`KeyboardAware`, `Animations` (spring configs), `Sizes`, `Styles` (per-slot `styles` demo — required
for kit parity), `Themed`.

---

## 12. Milestones

1. **Scaffold** — copy carousel skeleton, package.json/tsconfig/storybook (port 6010), empty barrel,
   `pnpm install`, typecheck green.
2. **Engine** — `snap.ts`/`settle.ts`/`overlay.ts` + full unit suite. No UI yet.
3. **Motion + native frame** — offset SV, `animate.ts`, `useSheetMotion`, `Frame.tsx`/`Overlay.tsx`
   (native), `useSheetDrag`. Drag + snap working on a device.
4. **Web painter** — `Frame.web.tsx` + `painter.web.ts` via `useSharedValueListener`; verify in browser.
5. **Overlay/modal** — `SheetBase` reusing Portal/scroll-lock/escape/focus-trap; `modal` vs inline.
6. **Chrome + slots + styles** — `chrome.tsx`, compound API, per-slot `styles`, `Sheet.Handle` cycling.
7. **ScrollView handoff** — `Sheet.ScrollView` + `useScrollHandoff` (RNGH composition); verify on device.
8. **Keyboard + a11y + reduced motion**, then **stories + tests + browser/emulator verification**.

---

## Open questions

None blocking. Prop naming resolved to `opened`/`onClose` (kit Modal house style). Everything else
has a clear precedent in carousel / ModalBase.

---

## Build status (2026-06-20)

Milestones 1–6 + 8 **implemented and verified**; milestone 7 (deep scroll↔drag handoff) is the one
remaining follow-up.

- Package `packages/sheet` scaffolded (Storybook port **6011**), engine + tests, motion/gesture,
  native + web surfaces, chrome/slots/per-slot `styles`, compound API, stories, component tests.
- `pnpm typecheck` / `lint` / `jest` all green (engine: 23 tests; component: 9 tests).
- **Browser-verified** (Playwright on Storybook): open animation lands exactly on the snap offset,
  scrim fades, overlay-press runs the close spring → unmounts, and all three per-slot `styles`
  (`root`/`overlay`/`handle`) apply.
- Web measurement note: Tamagui `onLayout` on the `position:fixed` portal layer reports 0 on web, so
  web seeds `maxHeight` from `window.innerHeight` (+ resize listener); native keeps `onLayout`.
- `Sheet.ScrollView` is a working `ScrollArea` wrapper; the gesture handoff (drag-at-top vs scroll)
  is milestone 7, deferred.
