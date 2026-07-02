# Carousel — Tamagui styling + slot system integration audit

> Audit of how to bring `@knitui/carousel` onto the kit's Tamagui styling model, a
> proper slot system, and a per-slot `styles` customization API — matching the
> conventions already used by `@knitui/components` (`Button`, `Alert`, `Tabs`).
>
> Status: **verified against source — implementing**. The audit below was
> re-checked line-by-line against the tree on 2026-06-20; corrections from that
> pass are folded in (see [§0](#0-audit-corrections)).

---

## 0. Audit corrections

The original proposal was sound but carried a few claims that don't match the
actual code. These are fixed throughout and called out here so the diff is
auditable:

1. **`Box` lives in `@knitui/components`, not `@knitui/core`.** `@knitui/core` only
   re-exports the raw Tamagui primitives (`styled`, `View`, `GetProps`,
   `withStaticProperties`, `createSlot`/`defineSlots`/`slotStyles`/`SlotStyles`).
   The kit's `Box` (`styled(View, { shadow })`) is in `@knitui/components/Box`. So
   the styled chrome is `styled(Box, …)` with `Box` imported from
   `@knitui/components` and `styled`/`GetProps` from `@knitui/core`. Carousel already
   declares both as deps.
2. **`react-native-web` is already in the web bundle.** Every view file imports
   `View`/`Text` from `react-native` (→ RNW on web via the jest/metro alias), so
   `styled(Box)` adds *no new* RNW dependency — the §7 risk is smaller than
   stated. The pure `engine/` + `painter.web.ts` stay RNW-free regardless.
3. **`progress` is always available internally.** `useCarouselCore` owns a
   `progress` SharedValue (`motion/useCarouselCore.ts:132`, returned at `:313`)
   regardless of whether the consumer passes `props.progress`. Built-in
   indicators read `core.progress` directly — no consumer wiring, no extra prop.
4. **The Tamagui config registers via the barrel import (tests are safe).**
   Importing `@knitui/components`/`@knitui/core` pulls `provider/Provider.shared` →
   `config/config` → `createTamagui()` as a side effect, so styled parts resolve
   tokens in jsdom with no `TamaguiProvider` wrapper (same as every
   `@knitui/components` test).
5. **`SlideBox` wraps inside each `Item` variant, not in `Item.shared.ts`.**
   `slideContent()` stays a plain content helper (no JSX literal, keeps the
   `.ts`); each `Item.tsx` / `Item.web.tsx` renders `<SlideBox>{slideContent(…)}`
   under its own animated/painted host and reads `styles.slide` from context via
   a `useSlideStyle()` hook.
6. **Controller surface is `next/prev/scrollTo/getCurrentIndex`** (`CarouselRef`,
   `types.ts:82`) — built-in controls/indicators drive it directly.

---

## 1. Verdict

The carousel is a clean, lean motion engine with an almost non-existent styling
surface. It is a **good** integration target, but with one hard rule that shapes
the entire design:

> **The per-item animated host and the dot animated layer are driven by
> Reanimated worklets (native) / an imperative rAF painter (web). They must NOT
> become Tamagui `styled()` nodes.** (See [§4](#4-the-hard-constraint).)

So the integration is *not* "make everything Tamagui." It is: **wrap every
animated node in a thin plain host that owns only `transform`/`opacity`/`zIndex`,
and put a Tamagui `styled()` Box *inside* it that owns all the themeable visuals.**
On top of that, adopt the two existing composition primitives verbatim:

- **Slots (Pillar A)** — `createSlot` / `defineSlots` from `@knitui/core`.
- **Per-slot `styles` (Pillar B)** — `slotStyles` / `SlotStyles` from `@knitui/core`.

---

## 2. Current state

### 2.1 What it renders

| Part | File | Element today | Styling today |
|------|------|---------------|---------------|
| Root region | `view/Carousel.tsx:144` | RN `View` | inline array: `{overflow,flexDirection}` + `touchAction` + `props.style` |
| Content container | `view/Carousel.tsx:157` | RN `View` | `{flex:1,pointerEvents:"box-none"}` + `props.contentContainerStyle` |
| Track | `view/Track.tsx` | Fragment (no element) | — |
| Slide host (native) | `view/Item.tsx:47` | `Animated.View` | `{position:"absolute"}` + dimension + **`animatedStyle` (worklet)** |
| Slide host (web) | `view/Item.web.tsx:54` | RN `View` + rAF painter | `{position:"absolute"}` + dimension + **painter writes transform** |
| Live region (web a11y) | `view/Carousel.tsx:181` | RN `View` + `Text` | `VISUALLY_HIDDEN` |
| Pagination container | `pagination/Pagination.tsx:138` | RN `View` | `{flexDirection,alignSelf,alignItems}` + `containerStyle` |
| Dot | `pagination/Pagination.tsx:82` | `Pressable` → `Animated.View` | `DEFAULT_DOT` (**hardcoded `#11181C`**) + `dotStyle`/`activeDotStyle` + **`animatedStyle` (worklet)** |

### 2.2 Customization API today

- `style` / `contentContainerStyle` — `StyleProp<ViewStyle>`, container only.
- `renderItem` / `renderPlaceholder` — full render-prop escape hatch (per-slide).
- `mode` / `modeConfig` / `customAnimation` — motion, not chrome.
- `Pagination`: `containerStyle` / `dotStyle` / `activeDotStyle` / `renderDot`.

### 2.3 Gaps vs. the rest of the kit

1. **Zero Tamagui.** Despite declaring `@knitui/components` + `@knitui/core` as deps,
   the source imports neither (only `useReducedMotion` from `@knitui/hooks`).
2. **Not theme-aware.** Hardcoded `#11181C`, `8px` dots, raw pixel insets — no
   tokens, no light/dark, no theme overrides.
3. **No `styles` prop**, no slot system, no `Carousel.*` sub-components.
4. **No built-in chrome.** Prev/next controls must be hand-wired via `ref`
   (`Carousel.stories.tsx → ImperativeControls`); `Pagination` is decoupled and
   must be wired by hand to `progress` + `onPress`.
5. **Inconsistent shape.** `containerStyle`/`dotStyle`/`activeDotStyle`/`renderDot`
   is exactly the ad-hoc `xxxProps` sprawl that `slotStyles` was built to replace.

---

## 3. The conventions to adopt (from `@knitui/core` + `@knitui/components`)

### 3.1 Marker slots — `@knitui/core/composition/slots.tsx`

```ts
const ButtonSlots = defineSlots({
  Left: createSlot<"Left">("Left"),
  Label: createSlot<"Label">("Label"),
  Right: createSlot<"Right">("Right"),
});
// render:
const slots = ButtonSlots.collect(children, { defaultSlot: "Label", displayName: "Button" });
const left = slots.Left?.children ?? leftSection;
```

Markers render nothing; matched by **reference identity**; collected at runtime
via `React.Children` (no babel transform → identical web/native surface).

### 3.2 Per-slot `styles` — `@knitui/core/composition/slot-styles.ts`

```ts
export interface ButtonStyles {
  left?: GetProps<typeof ButtonSection>;
  label?: GetProps<typeof ButtonText>;
  right?: GetProps<typeof ButtonSection>;
  loader?: Partial<LoaderProps>;
}
const BUTTON_SLOT_KEYS = ["left","label","right","loader"] as const
  satisfies readonly (keyof ButtonStyles)[];

// render:
const s = slotStyles<ButtonStyles>(styles, BUTTON_SLOT_KEYS, "Button");
<ButtonText {...s.get("label")} />
<ButtonSection {...s.merge("left", slots.Left?.props)} />   // explicit beats sugar
```

Precedence (the one rule): `defaults < styles[slot] < explicit xxxProps < inline`.
`merge(key, explicit)` spreads sugar *under* explicit. Dev-warns unknown keys.
`pick(styles, keys)` forwards a subset of slots into a child (avoids its dev-warn).
For parts rendered by *child* compound components, distribute `styles` via a
React context (the `Tabs` pattern: `TabsSlotStylesContext` + `useTabsSlots`).

### 3.3 Styled + attachment

> Imports: `styled`, `GetProps`, `withStaticProperties`, `createSlot`,
> `defineSlots`, `slotStyles`, `SlotStyles` from **`@knitui/core`**; `Box` and
> `ActionIcon`/`ActionIconProps` from **`@knitui/components`**; chevrons from
> **`@knitui/icons`**.

```ts
const ButtonFrame = styled(Box, { name:"Button", context: ButtonContext, variants:{...} as const, defaultVariants:{...} });
const ButtonComponent = ButtonFrame.styleable<ButtonProps>(function Button(props, ref) { ... });
export const Button = withStaticProperties(ButtonComponent, {
  ...ButtonSlots.markers,            // slot markers = single source of truth
  Text: ButtonText, Section: ButtonSection, Frame: ButtonFrame, ...
});
```

Prop types via `GetProps<typeof Styled>`; platform splits via inline `isWeb` for
small diffs, `.web.tsx`/`.native.tsx` for large ones. Shared helpers live in
`@knitui/core/composition` (re-exported from `@knitui/components/internal/styles`).

---

## 4. The hard constraint

Two nodes are animated by drivers that are incompatible with Tamagui styled
components:

- **Slide host** — native uses `useAnimatedStyle` on `Animated.View`
  (`Item.tsx:37`); web uses an imperative rAF painter writing
  `el.style.transform` directly (`Item.web.tsx:35`, `painter.web.ts`). The web
  path exists *specifically because* `useAnimatedStyle` doesn't re-run under this
  repo's Vite tooling.
- **Dot** — `useAnimatedStyle` scale/opacity on `Animated.View`
  (`Pagination.tsx:64`).

Repo memory is explicit that sharing a node between a Tamagui animation driver
and Reanimated breaks (`loop-animation-reanimated-host`:
*"never share a node with a Tamagui animation driver"*; `reanimated-singleton-override`).
Making these `styled(Animated.View)` would also force a `react-native-web`
dependency into the web bundle, which the engine deliberately avoids.

**Resolution — the two-layer node:**

```
Animated.View / painted View   ← owns transform / opacity / zIndex ONLY (plain RN)
  └─ <SlideBox> (styled Box)    ← owns padding / radius / bg / border / shadow / tokens
       └─ renderItem(...)        ← consumer content (unchanged escape hatch)
```

The visual, themeable layer is a real Tamagui `styled()` Box; the driver never
touches it. This is the single most important design decision and it cascades to
every animated part (slides and dots).

---

## 5. Proposed architecture

### 5.1 New styled chrome (all in `@knitui/core` `styled()`)

| Styled part | Base | Owns | Animated? |
|-------------|------|------|-----------|
| `CarouselFrame` | `styled(Box)` | region: overflow, flex-direction, size tokens, theme | no |
| `CarouselViewport` | `styled(Box)` | `flex:1`, `pointerEvents:"box-none"` | no |
| `SlideBox` | `styled(Box)` | per-slide padding/radius/bg/border/shadow | no (child of the animated host) |
| `CarouselControls` | `styled(Box)` | absolute overlay row holding nav buttons | no |
| `CarouselDots` | `styled(XStack/Box)` | dots row/column container | no |
| `CarouselDot` | `styled(Box)` | dot size/color/radius tokens; `active` variant | no (child of the animated `Animated.View`) |

Nav buttons are **not** new primitives — reuse `ActionIcon` from
`@knitui/components` with `@knitui/icons` chevrons (matches `icons-in-components`).

`CarouselFrame` becoming `styled(Box)` means the public component accepts Tamagui
props (`width`, `height`, `$theme` tokens, `bg`, …) *and* still accepts `style`
(Tamagui merges `style` last). This subsumes the current `style` prop without
removing it.

### 5.2 Slot system — two layers, used for different things

**Marker slots** (`defineSlots`) for *optional, consumer-placed chrome* — this is
where the carousel is children-driven rather than data-driven:

```ts
const CarouselSlots = defineSlots({
  Controls:   createSlot<"Controls">("Controls"),    // custom prev/next cluster
  Indicators: createSlot<"Indicators">("Indicators"),// custom pagination cluster
  Overlay:    createSlot<"Overlay">("Overlay"),      // arbitrary absolute overlay
});
```

Attached as statics so consumers can compose:

```tsx
<Carousel data={...} renderItem={...}>
  <Carousel.Overlay><GradientScrim /></Carousel.Overlay>
</Carousel>
```

> Note: slides themselves stay **data + `renderItem`** driven (virtualization
> needs the data model); we do **not** turn slides into `<Carousel.Slide>`
> children. Marker slots are for the chrome around the track only.

**Per-slot `styles`** (`slotStyles`) for *styling the parts the carousel owns*:

```ts
export interface CarouselStyles {
  root?:        GetProps<typeof CarouselFrame>;
  viewport?:    GetProps<typeof CarouselViewport>;
  slide?:       GetProps<typeof SlideBox>;       // applied to every slide's SlideBox
  controls?:    GetProps<typeof CarouselControls>;
  control?:     ActionIconProps;                 // each nav button
  dots?:        GetProps<typeof CarouselDots>;
  dot?:         GetProps<typeof CarouselDot>;
  activeDot?:   GetProps<typeof CarouselDot>;
  liveRegion?:  GetProps<typeof Box>;
}
const CAROUSEL_SLOT_KEYS = [
  "root","viewport","slide","controls","control","dots","dot","activeDot","liveRegion",
] as const satisfies readonly (keyof CarouselStyles)[];
```

### 5.3 Built-in chrome (the common case needs no wiring)

Add opt-in props so the 90% case is one line, while the escape hatches remain:

```ts
withControls?: boolean;                 // render ActionIcon prev/next (uses ref internally)
controlsPosition?: "inside" | "outside";
withIndicators?: boolean;               // render the built-in dots, auto-wired to progress
renderControl?: (dir, props) => ReactNode;   // full nav-button override
// `styles.control` covers the light-touch case; renderControl the heavy one.
```

Internally these reuse the same `progress` SharedValue the carousel already
publishes, so indicators need no manual `progress`/`onPress` plumbing. The
existing decoupled `<Pagination>` stays as a standalone for advanced layouts but
is re-skinned to `CarouselDots`/`CarouselDot` + `slotStyles` (kills `#11181C`,
`dotStyle`/`activeDotStyle` become `styles.dot`/`styles.activeDot`).

### 5.4 Distributing `styles` to `SlideBox`

`SlideBox` is rendered inside `Item`/`Item.web` (a child component), so thread the
slot value down. Two equivalent options; prefer **context** (the `Tabs` pattern)
to avoid widening `Track`/`Item` prop contracts:

```ts
const CarouselStylesContext = React.createContext<SlotStyles<CarouselStyles> | undefined>(undefined);
const useCarouselSlots = () => slotStyles<CarouselStyles>(
  React.useContext(CarouselStylesContext), CAROUSEL_SLOT_KEYS, "Carousel");
// Item: const s = useCarouselSlots(); <SlideBox {...s.get("slide")}>{renderItem(...)}</SlideBox>
```

### 5.5 Final public surface (`Carousel`)

```ts
export const Carousel = withStaticProperties(CarouselComponent, {
  ...CarouselSlots.markers,   // Controls, Indicators, Overlay
  Frame: CarouselFrame,
  Viewport: CarouselViewport,
  Slide: SlideBox,
  Controls: CarouselControls,
  Dots: CarouselDots,
  Dot: CarouselDot,
});
// CarouselProps<T> gains:  styles?: SlotStyles<CarouselStyles>;  + the withControls/withIndicators props
```

---

## 6. Migration plan (incremental, each phase ships green)

1. **Wire deps.** Import `styled`, `GetProps`, `withStaticProperties`,
   `createSlot`, `defineSlots`, `slotStyles`, `SlotStyles`, `SlotAccessor` from
   `@knitui/core`; `Box`, `ActionIcon`, `ActionIconProps` from `@knitui/components`;
   chevrons from `@knitui/icons`. (All deps already declared in `package.json`.)
2. **Static chrome → Tamagui.** Convert `CarouselFrame`/`CarouselViewport`/live
   region to `styled(Box)`. Keep `style`/`contentContainerStyle` working
   (Tamagui merges `style` last). No behavior change. Add `styles.root/viewport`.
3. **Two-layer slides.** Introduce `SlideBox` *inside* the existing
   `Animated.View`/painted `View` (host keeps owning transform). Add
   `styles.slide` via `CarouselStylesContext`. **Do not touch the painter or
   `useAnimatedStyle`.** Verify web rAF transforms still apply to the host, not
   `SlideBox`.
4. **Pagination re-skin.** `CarouselDots`/`CarouselDot` styled (theme tokens,
   `active` variant); dot keeps the outer `Animated.View` for scale/opacity, with
   `CarouselDot` as its child. Map `dotStyle`/`activeDotStyle` → `styles.dot`/
   `styles.activeDot` (keep old props as deprecated aliases for one release).
5. **Built-in controls + indicators.** `withControls`/`withIndicators` using
   `ActionIcon` + chevron icons, auto-wired to the controller + `progress`.
6. **Marker slots.** `Carousel.Controls/Indicators/Overlay` + `collect`.
7. **Stories.** Add `Styles`, `CustomChrome`, `Theming` stories (every public
   component in the kit ships a `Styles` demo — `composability-rollout`). Update
   the auto-generated demo (`demo-generated-from-stories`).
8. **Tests.** Slot-collection + `styles` precedence tests (mirror
   `slots.test.tsx`); a guardrail that the animated host is never a styled node.

---

## 7. Risks & open questions

- **Web painter coupling (highest risk).** `painter.web.ts` selects the host
  `el` via the registered ref and writes `transform`. `SlideBox` must sit *under*
  that node; confirm the painter still targets the right element and that adding a
  styled child doesn't introduce an extra `react-native-web` wrapper that shifts
  layout. Pixel-verify a parallax/stack fling on web.
- **`react-native-web` in the web bundle.** *Re-assessed (audit #2): low.* The
  view layer already imports `View`/`Text` from `react-native` (→ RNW on web), so
  `styled(Box)` adds no new RNW dependency — only Tamagui's style runtime, which
  every other kit already ships. The engine/painter stay RNW-free regardless.
- **`style` vs Tamagui props precedence.** Document that `style` still wins last
  (Tamagui behavior) so the migration is non-breaking for current `style` users.
- **Dot animated layer.** Keep `Animated.View` (transform/opacity) wrapping
  `CarouselDot` (visuals). Verify the worklet scale interpolation is unaffected.
- **API surface for slides.** Decision taken: slides stay `data`+`renderItem`
  (virtualization requires it); `SlideBox` is the styling seam, not a child slot.
- **Deprecations.** `Pagination`'s `dotStyle`/`activeDotStyle`/`containerStyle`
  become `styles.*` — keep aliases one release with a dev-warn.

---

## 8. TL;DR for implementers

1. Add `styles?: SlotStyles<CarouselStyles>` to `CarouselProps`; build the
   accessor with `slotStyles(styles, CAROUSEL_SLOT_KEYS, "Carousel")`.
2. Convert **static** nodes (frame, viewport, dots container, dot visual,
   slide visual) to `styled(Box)`; leave the **animated** hosts as plain
   `Animated.View` / painted `View`, with the styled Box as their child.
3. Distribute slide-level `styles` via `CarouselStylesContext` (the `Tabs`
   pattern).
4. Add marker slots `Controls`/`Indicators`/`Overlay` + opt-in `withControls`/
   `withIndicators` built on `ActionIcon` + `@knitui/icons`.
5. Attach everything via `withStaticProperties(..., { ...CarouselSlots.markers,
   Frame, Viewport, Slide, Controls, Dots, Dot })`.
6. Never let a Reanimated/painter node be a Tamagui styled node.
