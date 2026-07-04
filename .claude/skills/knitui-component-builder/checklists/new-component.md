# New component checklist

Work top to bottom. Every box is a real convention enforced somewhere in the repo (a test, a lint rule, or the resolution chain).

## 0. Before writing

- [ ] **Reuse first.** Search `packages/components/src/` for an existing primitive to compose. Most components build on `Box`, `Text`, `UnstyledButton`, `InputBase`, `Combobox`, `Popover`. Read the closest analog in the catalog (`references/catalog/`) before starting.
- [ ] Decide the **category** (`Inputs/`, `Feedback/`, `Overlays/`, `Navigation/`, `Data Display/`, `Layout/`, `Typography/`) — check sibling `title:` fields.
- [ ] Decide if web ≠ native structurally. If yes, plan a `.native.tsx` split + shared `types.ts`/`shared.tsx` (see anatomy.md). If the divergence is small, branch inline with `isWeb`.

## 1. Files

- [ ] `src/<Name>/<Name>.tsx` (start from `templates/Component.tsx`)
- [ ] `src/<Name>/index.ts` (`export * from "./<Name>";`)
- [ ] `src/<Name>/<Name>.stories.tsx` (from `templates/Component.stories.tsx`)
- [ ] `src/<Name>/<Name>.test.tsx` (from `templates/Component.test.tsx`)
- [ ] Split extras only if needed: `<Name>.native.tsx`, `<Name>.shared.tsx`, `<Name>.types.ts`

## 2. Implementation

- [ ] Imports from **`@knitui/core`**, never `@tamagui/core`.
- [ ] Frame is `styled(Box, ...)` (or `styled(Text)` for typography), never a bare RN/HTML host.
- [ ] `name:` set on the frame; shared `context` via `createStyledContext` if it has styled sub-parts.
- [ ] **Sizing** spread from the shared ladder (`controlVariant` / `controlFontVariant` / `squareSizeVariant` / `fieldHeightVariant`), `defaultVariants.size` = `"md"`. Never hand-roll per-size objects — derive from `controlMetrics`.
- [ ] **Color** spread from `controlColorVariant` (interactive) or `surfaceColorVariant` (static). Use `pickVariants` to expose a subset. Don't inline palette values — go through the ladder so `theme` recolors.
- [ ] Own-prop name collides with a frame style prop (`disabled`, `shadowColor`)? `Omit` it from the frame type and redeclare.
- [ ] Wrap with `Frame.styleable<Props>()`; forward `ref`.
- [ ] Use `render="<tag>"` for a semantic host (not `as`/`tag`).

## 3. Focus contract (interactive components) — see control-systems.md

- [ ] Spread `focusRingStyle` onto the frame (Layer 1).
- [ ] Make the SAME frame focusable (Layer 2): `webButton()`, or `useKeyboardActions()`, or a roving `tabIndex`. **A ring without focusability is a shipped bug.**
- [ ] Add the component to the `CASES` array in `src/__tests__/focus-ring.test.tsx`.
- [ ] Text fields are the exception — express focus via `borderColor` swap, not the ring.

## 4. Composability (Pillar B) — required for any multi-part component

- [ ] Declare a `<Name>Styles` interface (slot → part props) + `<NAME>_SLOT_KEYS as const satisfies ...`.
- [ ] Accept `styles?: SlotStyles<<Name>Styles>`.
- [ ] Consume with `slotStyles(styles, KEYS, "<Name>")`; `get()` where no explicit prop competes, `merge(key, explicit)` where one does (explicit wins).
- [ ] Text slots go through `useSlotTextWrapper` + `renderTextChild`.
- [ ] Marker slots (Pillar A) only if users need to inject/reorder named regions (`defineSlots`/`createSlot`).

## 5. Gradient (optional)

- [ ] Add `gradient?: GradientValue` prop and a `"gradient"` variant carrying a transparent fill (no hover/press color).
- [ ] `const grad = useGradient(variant === "gradient" ? gradient : undefined)`; spread `grad.frameProps`, render `grad.layer` as the first child.

## 6. Barrel

- [ ] Add the export block (component + public types) to `src/index.ts`, alphabetically. **Not public until you do.**

## 7. Stories — see stories.md

- [ ] `meta` uses `satisfies Meta<typeof X>`; `Story = StoryObj<ComponentProps<typeof X>>`.
- [ ] `Playground` first (empty args); one story per variant/size/state axis with a JSDoc caption.
- [ ] `Matrix` grid for visual regression.
- [ ] `Styles` story LAST demonstrating per-slot targeting.

## 8. Tests — see tests.md

- [ ] Import `render`/`screen` from the shared `test-utils` (not RTL directly).
- [ ] Assert real host tag/role + real attributes (`aria-disabled`), not testIDs-for-everything.
- [ ] Web-leak guard for any RN-only prop (`nativeID`).
- [ ] `styles` map test (inject a `testID` through a slot).
- [ ] Render-prop payload test if applicable.
- [ ] Fixed dates / restored fake timers if time-dependent.

## 9. Verify

- [ ] `pnpm --filter @knitui/components typecheck`
- [ ] `pnpm --filter @knitui/components test` (or root `turbo run test --concurrency=1`)
- [ ] `pnpm --filter @knitui/components lint`
- [ ] `pnpm --filter @knitui/components storybook` — eyeball light + dark, every variant/size, the Styles story.
- [ ] If you added a native dep, pin it (and its reanimated/RN/skia peers) in root `pnpm.overrides`.
- [ ] Commit message is Conventional Commits: `feat(components): add <Name>`. (Only commit when explicitly asked.)
