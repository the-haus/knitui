# `_reference/` — the gold-standard for `@knitui/dates`

`ExampleControl.tsx` is a small, **working** component that exercises every
convention a `@knitui/dates` component is expected to follow. It is **not** a real
Mantine port and is **not** exported from `src/index.ts` — it's a documentation
artifact and a target for the per-component improvement loop
(`scripts/loop-improve-dates-kit.sh`).

The numbered rules below map 1:1 onto the numbered comments in
`ExampleControl.tsx`. When improving a component, use this as the checklist.

## The checklist

1. **File header.** Document provenance (mirrors `@mantine/dates` API; built on
   `@knitui/components` + `@knitui/core` + dayjs) and the cross-platform stance.
2. **Shared context.** Use `createStyledContext` to carry `size` (and any other
   cross-part axis) so leaf parts share it without prop-drilling.
3. **Derived sizing.** Scale on the shared `cell-metrics` ladders
   (`CELL_WIDTH`/`CELL_FONT`) — the calendar twin of components' `controlMetrics`.
   No magic pixels. Express variants with raw ladder values at module-load (never
   `getTokenValue`, which needs the live config).
4. **Theme-ramp colors only.** `$color1…$color12` / semantic neutrals — never hex,
   never a Mantine-style `color` prop. Accent is the Tamagui `theme=` prop, so
   `theme="red"` recolors with zero per-component logic.
5. **Styled Frame + leaf parts**, each opting into the context.
6. **Marker-slot composition.** `createSlot`/`defineSlots` from `@knitui/core` for
   the optional bits a consumer composes (sections, custom content). Markers
   render nothing; the parent owns layout.
7. **Per-slot `styles` + per-item passthrough.** Accept `styles?: SlotStyles<…>`,
   declare the slot→part map once, and distribute it with `slotStyles().merge`
   (from `@knitui/core`). Per-item dynamics stay on a `getXxxProps(date)` callback.
   Precedence is fixed: `defaults < styles[slot] < explicit xxxProps < inline
   props on a composed part` — **explicit beats sugar**.
8. **Controlled + uncontrolled value** through `useUncontrolled`.
9. **Locale + formatting** via `useDatesContext().getLocale(locale)` + dayjs
   (consumer `locale` prop wins over the provider).
10. **`min`/`max` bounds** via the shared `isAfterMinDate`/`isBeforeMaxDate` utils,
    normalized through `toDateString` once.
11. **A11y on both axes.** Web (`role`/`aria-*`) and native (`accessibility*` via
    `internal/a11y` `controlA11yProps`) set side-by-side — neither replaces the other.
12. **Interaction in style, not state.** `webCursor`, real `hoverStyle`/`pressStyle`,
    a `disabled` variant (Mantine parity: 0.3 + `pointerEvents: "none"`). No runtime
    hover state machines.
13. **`.styleable` wrapper** forwarding a ref + the frame's style props (the dates norm).
14. **`withStaticProperties`** exposing the slot markers (single source of truth) and
    the styled parts, so consumers can compose and `styled(X.Part, …)`.
15. **Compiler-safe styling.** The `apps/web` build runs the Tamagui optimizing
    compiler. A **dynamic** style prop that can evaluate to a hide value
    (`opacity={cond ? 1 : 0}`) gets its `0` branch extracted into an
    `._o-0 { opacity: 0 }` class and flattened onto the whole cell — blanking
    content (a bug that actually shipped in `MiniCalendar`). Show/hide by toggling
    **text content** or a **boolean variant**; keep constant dims as a baked-in
    style. Never a per-render dynamic `opacity`/`display` style prop.

## Also expected (not unique to this file)

- **No loose typing.** No `any`, `as any`, `as unknown as`, `any[]`, `<any>`, or
  `@ts-ignore`/`@ts-nocheck`/`@ts-expect-error`. Narrow locally instead.
- **Every export is TSDoc'd**, and every public prop has a one-line doc + `@default`.
- **A `.stories.tsx`** (Playground + Default + the meaningful states) and a
  **`.test.tsx`** covering render, selection, bounds, passthrough, and composition.
- **`pnpm --filter @knitui/dates typecheck`** and the component's jest test pass.

## Sibling references in `@knitui/components`

- `Button` — the slot-system pilot (`Left`/`Label`/`Right` + `styles` + `Group`).
- `Notification` / `Alert` — `styles` sugar over a multi-part surface.
- `internal/control-metrics.ts` / `internal/variant-colors.ts` — the sizing/color
  source-of-truth tables (the dates twin is `cell-metrics.ts`).
