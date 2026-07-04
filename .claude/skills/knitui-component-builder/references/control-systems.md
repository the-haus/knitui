# The four control systems

A new interactive control plugs into four shared systems. All live under `packages/components/src/internal/`. The three **canonical tables** are `control-metrics.ts` (size), `variant-colors.ts` (color + focus ring), and `gradient-shared.ts` (gradient). **`style-props.ts` is the derivation/bridge layer** that turns them into spread-ready `variants` maps. **`control-system.ts`** is the public barrel (shape-pinned by a test) exposing the tables to sibling packages.

> A control plugs in by: spreading `controlVariant` / `controlColorVariant` / `focusRingStyle` into its `styled()` frame, calling `webButton()` (or another focusability primitive) at render, and calling `useGradient(...)` gated on `variant === "gradient"`.

---

## 1. Sizing — `internal/control-metrics.ts`

Single source of truth for size. Keyed `xxs → xxl`. Every value is a **token key string** (`"$md"`) that resolves per-property (`$md` = `size.md` on `height`, `space.md` on `padding`/`gap`, `font.md` on `fontSize`, `radius.md` on `borderRadius`):

```ts
export const controlMetrics = {
  xxs: { height: "$xxs", fontSize: "$xxs", paddingHorizontal: "$xxs",
         paddingHorizontalPill: "$xs", gap: "$xxs", borderRadius: "$xs" },
  md:  { height: "$md",  fontSize: "$md",  paddingHorizontal: "$md",
         paddingHorizontalPill: "$lg", gap: "$xs", borderRadius: "$sm" },
  // xs, sm, lg, xl, xxl ...
} as const;

export const SIZE_KEYS = ["xxs","xs","sm","md","lg","xl","xxl"] as const;
export type SizeKey = (typeof SIZE_KEYS)[number];
export const DEFAULT_SIZE = "md" as const satisfies SizeKey;   // library default is md

// RENDER-TIME px resolution (needs live Tamagui config; NEVER call at module load)
export const resolveSizePx = (size: SizeKey | number): number => { ... };
```

Table facts: `fontSize` is **clamped** at the two smallest steps (xxs/xs borrow `$xxs`); `borderRadius` is **capped at `$lg`**; `paddingHorizontalPill` is the one sanctioned divergence (Badge/Chip/Pill).

**Consume via `style-props.ts`, not a runtime hook.** It derives ready-to-spread `variants.size` maps:

```ts
import { controlMetrics as M } from "./control-metrics";
export const controlVariant     = { md: { height: M.md.height, paddingHorizontal: M.md.paddingHorizontal }, ... }; // Button, SegmentedControl.Control
export const controlFontVariant = { md: { fontSize: M.md.fontSize }, ... };   // label text
export const controlGapVariant  = { ... };   // pill family (height + pill padding + gap)
export const squareSizeVariant  = { ... };   // ActionIcon/Avatar (width=height)
export const fieldHeightVariant = { ... };   // Input root frame height
```

Button wires `size: { ...controlVariant }` on the frame and `size: { ...controlFontVariant }` on the label text; default via `defaultVariants: { size: "md" }`.

**Auxiliary size bridges (render-time):**

- `internal/embedded-control-size.ts` — `toEmbeddedControlSize(size)` steps a nested control **down one key** (a `md` field → `sm` chip inside it). Used in `Combobox`.
- `internal/control-icon-size.ts` — `controlIconSize` (via `ControlIconProvider`) auto-sizes icons to the control's `size`.

---

## 2. Variant-colors — `internal/variant-colors.ts`

The COLOR twin of `control-metrics.ts`. Every value is a palette-ramp token (`$color1…$color12`, `$white`, `$borderColor`) from the **active theme**, so `theme="red"` recolors with zero per-component logic.

```ts
export const VARIANT_KEYS = ["filled","light","outline","subtle","default",
                             "white","transparent","dot","gradient"] as const;
export type VariantKey = (typeof VARIANT_KEYS)[number];

export const VARIANT_FILL = {                       // background + border for the frame
  filled:  { backgroundColor: "$color9" },
  outline: { backgroundColor: "transparent", borderColor: "$color7" },
  default: { backgroundColor: "$color3", borderColor: "$borderColor" },
  gradient:{ backgroundColor: "transparent" },      // painted at render by useGradient
  ...
} as const;

export const VARIANT_INTERACTION = {                // hover/press for INTERACTIVE controls
  filled: { hoverStyle: { backgroundColor: "$color10" },
            pressStyle: { backgroundColor: "$color8" } }, ...
};                                                  // NO dot/gradient entry

export const VARIANT_FOREGROUND_EMPHASIS = { filled: { color: "$color1" }, ... }; // labels
export const VARIANT_FOREGROUND_MUTED    = { filled: { color: "$color1" }, ... }; // body copy
```

**Spread-ready builders live in `style-props.ts`:**

```ts
// INTERACTIVE fill = fill + hover/press (Button, ActionIcon)
export const controlColorVariant = {
  filled: { ...VARIANT_FILL.filled, ...VARIANT_INTERACTION.filled },
  gradient: { ...VARIANT_FILL.gradient },   // no hover/press — runtime gradient would hide it
  ...
} as const;

// STATIC surface fill = fill only, no pseudo states (Badge, Alert); includes `dot`
export const surfaceColorVariant = { ...VARIANT_FILL } as const;

export const controlTextColorVariant = { ...VARIANT_FOREGROUND_EMPHASIS };
export const mutedTextColorVariant   = { ...VARIANT_FOREGROUND_MUTED };
export const pickVariants = (map, keys) => { ... };   // expose only a SUBSET of the vocabulary
```

Spread into a component:

```ts
const ButtonFrame = styled(Box, {
  variants: { variant: { ...controlColorVariant }, size: { ...controlVariant } },
});
const ButtonText = styled(Text, {
  variants: {
    variant: { ...pickVariants(controlTextColorVariant, ["filled", "light", "default"]) },
  },
});
```

`pickVariants` is how a component exposes only the variants it supports while still sourcing from the shared ladder.

---

## 3. Focus ring — `internal/variant-colors.ts` (+ `style-props.ts`)

```ts
export const FOCUS_RING = {
  outlineColor: "$color8",
  outlineWidth: 2,
  outlineStyle: "solid",
} as const;
export const focusRingStyle = { focusVisibleStyle: FOCUS_RING } as const; // pre-wrapped for spreading
```

Renders a `:focus-visible` outline on **web only** (react-native-web maps `outline*` → CSS outline; no-op on native).

### The two-layer FOCUS CONTRACT (guardrail)

> **INVARIANT:** never spread `focusRingStyle` onto a frame you don't also make focusable — that produces a DEAD ring. A styled `Box` renders a `<div>`, which the browser will NOT tab to, so `:focus-visible` never fires unless the SAME frame is also made focusable.

Satisfy **Layer 2 (focusability)** with one of:

- `webButton()` — renders a real `<button>` (from `style-props.ts`): `isWeb ? { render: "button", type: "button" } : {}`
- `useKeyboardActions()` (from `@knitui/hooks`) — for non-button roles
- a roving `tabIndex` — for composite widgets

Text fields are the deliberate exception — they express focus as a `borderColor` swap (`$borderColorFocus`), not the ring.

Applied in Button — both layers together:

```ts
const ButtonFrame = styled(Box, { ...pressScaleStyle, ...focusRingStyle, variants: { ... } });  // Layer 1
// at render:
<ButtonFrame ... {...webButton()}>   // Layer 2
```

Enforced by `src/__tests__/focus-ring.test.tsx` (see tests.md) — a cross-component guardrail. **Add every new interactive component to its `CASES` array.**

---

## 4. Gradient — `internal/gradient-shared.ts` + `gradient.tsx` / `gradient.native.tsx`

Shared contract:

```ts
export interface GradientValue {
  from?: string; // @default "$color5"
  to?: string; // @default "$color9"
  stops?: GradientStop[]; // 3+ steps; wins over from/to
  deg?: number; // @default 45 (CSS convention: 0=up, 90=right)
}
export interface GradientResult {
  frameProps: { backgroundImage?: string; overflow?: "hidden" }; // spread onto the frame
  layer: React.ReactNode; // rendered as first child
}
```

- **Web** (`gradient.tsx`): `useGradient` returns `{ frameProps: { backgroundImage: cssString }, layer: null }` — no extra DOM.
- **Native** (`gradient.native.tsx`): returns `{ frameProps: { overflow: "hidden" }, layer: <absolute Svg LinearGradient> }`. `overflow: hidden` clips the layer to rounded corners.

Uniform `GradientResult` shape → components wire identically on both platforms:

```ts
import { type GradientValue, useGradient } from "../internal/gradient";
// prop: gradient?: GradientValue;   // only honored when variant="gradient"
const grad = useGradient(variant === "gradient" ? gradient : undefined);   // GATE on variant
// on the frame:
<ButtonFrame ... {...grad.frameProps} {...webButton()}>
  {grad.layer}      {/* first child: null on web, SVG on native */}
  {children}
</ButtonFrame>
```

The `gradient` variant in `controlColorVariant` carries only a transparent fill (no hover/press color — the runtime gradient sits in `backgroundImage`/SVG and would hide a `backgroundColor`); tactile feedback still comes from `pressScaleStyle`. Same wiring in ActionIcon, Alert, Avatar, Badge, Pill, ThemeIcon, CloseButton.
