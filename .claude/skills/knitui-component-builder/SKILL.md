---
name: knitui-component-builder
description: >-
  Build, extend, or review components in the Knit UI (@knitui/*) cross-platform
  Tamagui kit — React Native + web from one source. Use whenever creating a new
  component, adding variants/sizes/slots to an existing one, writing its stories
  or tests, or answering "how does this kit do X". Encodes the kit's conventions:
  styled(Box) frames, controlMetrics sizing, the variant-colors ladder, the
  two-layer focus contract, marker slots + per-slot `styles`, gradient wiring,
  .native splits, CSF3 stories, jsdom tests, and src-ship packaging. Ships a
  per-component catalog of all 103 shipped components.
---

# Knit UI component builder

This kit ships **one source** that runs on **React Native and web** via Tamagui. Components live in `packages/components/src/<Name>/`, are published as `@knitui/*`, and are **src-shipped** (consumers resolve `./src`, not a build). The kit is deliberately, aggressively consistent — the right way to build a component is to **find the nearest existing one and copy its shape.** This skill gives you that shape and a reference for every component.

## Start here

1. **Reuse before building.** Almost everything composes `Box`, `Text`, `UnstyledButton`, `InputBase`, `Combobox`, or `Popover`. Open `references/catalog/_index.md`, find 2–3 analogs to what you're building, and read their catalog entries.
2. **Copy the templates.** `templates/Component.tsx`, `.stories.tsx`, `.test.tsx`, `index.ts` are a working component wired into every system. Rename `Widget`/`widget` and delete what you don't need.
3. **Work the checklist.** `checklists/new-component.md` is the full gate — every box maps to a real convention (a test, a lint rule, or the module resolution chain).
4. **Verify** with typecheck + jest + lint + Storybook (light and dark). See the checklist's Verify section.

## The mental model — five systems a component plugs into

| System            | Where                                | One-liner                                                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Anatomy**       | `references/anatomy.md`              | `styled(Box)` frame → `Frame.styleable<Props>()` → `withStaticProperties`; imports from `@knitui/core`; `render="<tag>"` for semantic hosts; `.native.tsx` split + shared `types.ts` when web ≠ native.                                                                                        |
| **Sizing**        | `references/control-systems.md` §1   | `controlMetrics` is the single source of truth (`xxs..xxl`, default `md`). Spread `controlVariant`/`controlFontVariant` from `internal/style-props`; never hand-roll per-size objects.                                                                                                         |
| **Color + focus** | `references/control-systems.md` §2–3 | Spread `controlColorVariant` (interactive) or `surfaceColorVariant` (static) so `theme` recolors for free. **Focus contract:** `focusRingStyle` (ring) MUST pair with focusability (`webButton()`/roving tabIndex) on the same frame, or it's a dead ring — guarded by a cross-component test. |
| **Composition**   | `references/slots-and-styles.md`     | Per-slot `styles` prop (Pillar B) is near-universal (62 components) — declare a `Styles` map, consume with `slotStyles().get/merge`. Marker slots (Pillar A, `defineSlots`/`createSlot`) only when users inject/reorder named regions.                                                         |
| **Gradient**      | `references/control-systems.md` §4   | `gradient?: GradientValue` + a `"gradient"` variant; `useGradient(variant === "gradient" ? gradient : undefined)`; spread `grad.frameProps`, render `grad.layer` first. Web = CSS backgroundImage, native = SVG.                                                                               |

Then two cross-cutting concerns:

- **Stories** (`references/stories.md`) — CSF3, Vite builder, `satisfies Meta`, story-per-axis, `Styles` story last, port 6006.
- **Tests** (`references/tests.md`) — jsdom + react-native-web, `@testing-library/react`, assert real host tags, the shared `test-utils` Provider wrapper, the focus-ring guardrail.
- **Packaging** (`references/packaging.md`) — src-ship (kit) vs lib-ship (hooks/plugins), token scales, Turborepo, changesets, and the root `pnpm.overrides` native pins.

## Non-negotiable rules (the contract)

These are enforced by tests, lint, or the resolution chain — violating them breaks something:

1. **Import from `@knitui/core`, never `@tamagui/core`.**
2. **Frames are `styled(Box)` / `styled(Text)`**, never bare RN/HTML hosts (except the deliberate native escape hatch `styled(TextInput)` / `usePropsAndStyle`).
3. **Size and color come from the shared ladders** (`controlMetrics` / `variant-colors`), spread via `internal/style-props`. No inlined palette values, no per-size objects. This is what makes `theme="red"` and `size="lg"` work everywhere.
4. **Focus ring ⇒ focusability on the same frame.** Add every new interactive component to `src/__tests__/focus-ring.test.tsx`'s `CASES`.
5. **Multi-part components must accept `styles?: SlotStyles<...>`** and ship a `Styles` story + test. Precedence is always `defaults < styles[slot] < explicit xxxProps < inline`.
6. **Add the export block to `src/index.ts`** or the component isn't public.
7. **Web/native parity via a shared `types.ts`** when you split — the public API must not drift between platforms.
8. **Don't fight src-ship.** The kit ships source because Tamagui generics can't round-trip through bob `.d.ts`. Don't "fix" it by pointing `main` at `lib/`.
9. **New native dep ⇒ pin it in root `pnpm.overrides`** (with its reanimated/RN/skia peers) to avoid duplicate-copy crashes.
10. **Tamagui v2 host prop is `render`**, not `as`/`tag`.

## The per-component catalog

`references/catalog/` documents **all 103 shipped components** (`_index.md` is the map, `01`–`09` are the entries). Use it to:

- find the nearest analog before building,
- understand a component before extending it,
- see which components use which systems (the `_index.md` tables list platform splits and system adopters).

## Files in this skill

```
SKILL.md                         ← you are here
references/
  anatomy.md                     ← file layout, styled()/styleable/withStaticProperties, render prop, splits
  control-systems.md             ← sizing, variant-colors, focus contract, gradient
  slots-and-styles.md            ← marker slots (A) + per-slot styles (B)
  stories.md                     ← Storybook CSF3 conventions
  tests.md                       ← jest/jsdom conventions + guardrails
  packaging.md                   ← package.json, tsconfig, tokens, monorepo, pnpm pins
  catalog/
    _index.md                    ← map of all 103 components + exemplars + system-usage tables
    01..09-*.md                  ← per-component entries
templates/
  Component.tsx  Component.stories.tsx  Component.test.tsx  index.ts
checklists/
  new-component.md               ← the full build gate
```
