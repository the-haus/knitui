# Knit UI on Tamagui v3: authoring conventions

These are the binding rules for the v3 migration and for all kit code afterwards. The plan lives in `../tamagui-v3-migration-plan.md`.

Upstream reference material (v3 docs MDX and the 3.0.18 package sources) is extracted locally:

- docs: `/private/tmp/claude-501/-Users-thehaus-Workspaces-Testing-ui/a839ae9b-9469-4d66-81ec-481fae46a03b/scratchpad/tamagui3-docs/` (`guides_how-to-upgrade.mdx`, `guides_flat-values.mdx`, `core_styled.mdx`, `core_variants.mdx`, `core_style-pieces.mdx`, `core_compiler-tiers.mdx`, `core_settings.mdx`, …)
- sources: `/private/tmp/claude-501/-Users-thehaus-Workspaces-Testing-ui/a839ae9b-9469-4d66-81ec-481fae46a03b/scratchpad/tamagui3-pkgs/x/tamagui-web-3.0.18/package/src/` (plus `tamagui-3.0.18/package/src/components/*`, the official UI kit, which is useful as a reference for v3 idioms)

Breaking changes are allowed. The goal is an idiomatic, mature, **fast** v3 kit, not v2 compatibility. **No Tailwind / `@tamagui/tailwind` / `html.*` / `className` authoring.**

## 1. Imports

- Only `packages/core/src` imports `tamagui` / `@tamagui/*`. Everything else imports from `@knitui/core`.
- New v3 APIs that the kit needs are re-exported from `packages/core/src/essentials.ts`: `createStyledHOC` (internal), `splitStyleProps`, `getExpandedShorthand`, `ThemeUpdate`, `style`, `useStyle`, the animated-number hooks, and so on.

## 2. Tokens and values

- **There is no `$` sigil.** Write `p="md"`, `bg="color2"`, `c="color11"`, `borderRadius="sm"`, `fontSize="md"`. Write theme keys bare as well: `bg="background"`, `borderColor="borderColor"`.
- A string is a token lookup and a number is a raw value: `p="md"` vs `p={12}`. Inside a clause program, raw lengths need units: `y="enter:10px"`.
- **No spaces inside a single colour value** (`rgba(0,0,0,0.5)`), because a space separates clauses.
- Never detect tokens by sigil. Use the core helpers instead (`resolveToken` / `isToken`; see the "Core helpers" section below).
- Theme key names stay as the kit defines them (camelCase / numbered: `color11`, `blue9`, `backgroundHover`, `dropShadowColor`, `mediaScrim`). **Do not** rename them to v6 kebab-case.

## 3. Conditions (flat style values)

v2 condition objects are removed: `hoverStyle`, `pressStyle`, `focusStyle`, `focusVisibleStyle`, `focusWithinStyle`, `disabledStyle`, `enterStyle`, `exitStyle`, `$sm={{}}`, `$platform-web={{}}` and `$theme-dark={{}}`. Express each condition inside the property it changes:

| Form   | Example                                       | When to use                                                |
| ------ | --------------------------------------------- | ---------------------------------------------------------- |
| String | `bg="color2 hover:color3 press:color4"`       | Literals in JSX, `styled()` bases and variant bodies       |
| Object | `bg={{ default: computed, hover: "color3" }}` | The base value or a condition value is computed at runtime |

Further rules:

- Clause order inside a value does not matter. State clauses outrank media clauses.
- Modifiers available:
  - **Interaction:** `hover:`, `press:`, `focus:`, `focus-visible:`, `focus-within:`, `disabled:`
  - **Mount and unmount:** `enter:`, `exit:`
  - **Colour scheme:** `dark:`, `light:`
  - **Media:** the kit's media keys, e.g. `sm:`, `gtSm:`
  - **Platform:** `web:`, `native:`, `ios:`, `android:`
  - **Groups:** `group-hover:` and `group-hover/name:`
  - **Containers:** `@sm:`
- Modifiers chain, e.g. `dark:hover:`.

## 4. Transitions

- `transition="fast"`, or the object form `transition={{ preset: "fast", properties: "transform, opacity", enter: "lazy", exit: "fast" }}`.
- `animateOnly` is removed; use `properties`. `animateOnly={[]}` becomes `transition="none"`. The array form `transition={["fast", {...}]}` is removed.
- Mount and unmount styles are clauses: `opacity="enter:0 exit:0" y="enter:8px"`.
- `onTransition({ phase, cause, finished })` replaces completion hacks.
- Motion presets come from `packages/core/src/config/motion.ts`, which stays the motion source of truth.

## 5. Components: flatten-first (speed)

`createStyledHOC` output is **always `neverFlatten`**, so the compiler can never collapse it to a host element. Choose the lightest construct that does the job:

1. **`styled(Base, { …, variants })` with static variant bodies.** This is the default for anything that only maps props to styles.
2. **`styled.dynamic<T>((value, env) => ({...}))`** for a variant whose styles are computed from its value, e.g. sizes from `controlMetrics`. The compiler evaluates it when the prop is static, and it runs once per clause, so `size="sm md:lg"` works.
3. **`Frame.resolve((props, env) => ({...}))`** for styles derived from several props. The result stays a styled component.
4. **`styleable<P>(Frame, (props, ref) => …)`** from `@knitui/core` **only** when real behaviour exists: state, effects, refs, context providers, handlers, or child composition. The helper wraps `createStyledHOC`, memoizes (`staticConfig.memo`, opt out with `{ staticConfig: { memo: false } }`) and names the component after the render function. Never call `createStyledHOC` directly outside core.

`styleable` has two call shapes. Both accept a styleable result as the receiver, so chains (Input → InputBase → TextInput) type and run (proved in `packages/core/src/styled.test.tsx`):

```tsx
// A. Kit default: explicit FULL public props. P must include the frame's props
//    (`interface ButtonProps extends GetProps<typeof ButtonFrame> { … }`).
//    The result is `StyleableComponent<P, R>`: GetProps<typeof Button> is exactly P,
//    R (the ref element) defaults to TamaguiElement — pass it for other hosts:
//    styleable<TextProps, TamaguiTextElement>(TextFrame, …).
export const Button = styleable<ButtonProps>(ButtonFrame, function Button(props, ref) {
  const { loading, ...rest } = props; // props: ButtonProps, no implicit any
  return <ButtonFrame ref={ref} {...rest} />;
});
export const LinkButton = styleable<LinkButtonProps>(Button, function LinkButton(p, ref) {
  return <Button ref={ref} {...p} />; // receiver is itself a styleable
});

// B. Upstream idiom: inferred from the receiver, custom props annotated on the
//    render parameter. Keeps the frame's full tuple (variants, base styles,
//    statics) in the result. The annotation IS the body's view of props, so
//    annotate `Own & GetProps<typeof Frame>` when the body reads frame props.
export const Chip = styleable(ChipFrame, (props: { onToggle?: () => void }, ref) => …);
```

Rules: no explicit `any` on the render parameters; `withStaticProperties(styleable(…), { Part })` after, never before; `displayName` comes from a named render function (`function Button(…)`) or `{ displayName }`.

More rules for components:

- v2 spread or function variants (`":string"`, `":number"`, `"...size"`, plain functions) **do not run in v3**. Convert them to `styled.dynamic`.
- Keep variant bodies static: no spreads of runtime objects. Generate tables at module scope into literal-shaped objects.
- Variants may contain only styles and aria/data attributes, never `theme` keys or handlers.
- Keep `render` host props as strings (`render="button"`) in leaf components. JSX or function `render` values deopt the compiler.
- **Explicit `undefined` on a STYLE prop at the call site clears the base/variant value** (verified in 3.0.18, see §11). Never write `maxWidth={cond ? x : undefined}`; spread conditionally (`{...(cond ? { maxWidth: x } : null)}`). For variant/context props an explicit `undefined` counts as absent; use `null` to switch a default off.
- Use `withStaticProperties` and `createStyledContext` as before.

## 6. Theming

- `<Theme name="…">` mounts a sub-theme. For local key overrides, prefer `<ThemeUpdate keyName="value dark:value">` on web: it restyles through CSS variables without a re-render.
- Configuration that is not a design token lives in `createTamagui({ variables })` and is read as a bare name in style values.
- **Focus ring names** (defined in `packages/core/src/config/focus-ring.ts`):

  | Name              | Kind                                               | Value                                        | Use                                           |
  | ----------------- | -------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
  | `focusRingColor`  | theme key in every theme (= that theme's `color8`) | follows accents: `theme="blue"` recolours it | `outlineColor="focus-visible:focusRingColor"` |
  | `focusRingWidth`  | config variable                                    | `2` (px on web)                              | `outlineWidth`                                |
  | `focusRingOffset` | config variable                                    | `0`                                          | `outlineOffset`                               |

  `focusRingColor` is a theme key rather than a config variable because v3 resolves config variables once, on the base themes, so a `"color8"` variable would freeze to the neutral ramp. Override any of the three for a subtree with `<ThemeUpdate focusRingColor="red9">`.
  **Typing caveat (3.0.18):** only colour props accept theme/variable names in their types, so `outlineWidth="focusRingWidth"` is a type error. Write the number from `FOCUS_RING_VARIABLES` (exported by `@knitui/core`) for width and offset.

## 7. Core helpers (owned by `packages/core`)

- `styleable<P, R = TamaguiElement>(Frame, render: (props: P, ref: Ref<R> | null) => ReactNode, opts?: { displayName?, disableTheme?, staticConfig? }): StyleableComponent<P, R>`, plus the inferred overload (§5). `StyleableComponent<P, R>` is `TamaguiComponent<P, R, P, {}, {}, {}>`.
- `resolveToken(value: unknown, category: TokenCategory, opts?: { theme?, font? }): string | number | undefined`. It asks the active config what `value` names and returns the raw value, or `undefined` for anything it does not know. Callers keep literals with `resolveToken(v, "size") ?? v`.
  - `TokenCategory` is `"color" | "space" | "size" | "radius" | "zIndex" | "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing"`. The font categories read the default font, or `opts.font`.
  - For `"color"`, `opts.theme` (from `useTheme()`) is consulted first, so `color11` resolves through the active theme. Without a theme, only colour tokens are known.
  - Qualified names (`"radius.md"`) override the category. A legacy `"$md"` is accepted defensively. Numbers are never tokens.
- `isToken(value: unknown, category?: TokenCategory, opts?): value is string`. Without a category it matches any token category, any font key of the default font, or any theme key of the config (`color11`, `background`, `focusRingColor`).
- Re-exported from v3: `createStyledHOC` (internal), `splitStyleProps`, `getExpandedShorthand`, `style`, `useStyle(piece)`, `ThemeUpdate`, the `useAnimatedNumber*` hooks, and the types `FlatStyleValue`, `OnTransition`, `TransitionEvent`, `TransitionProp`, `TransitionKeys`, `StylePiece`, `TamaguiComponent`, `SplitStylePropsOptions`/`Result` and `UniversalAnimatedNumber`. `useProps`, `usePropsAndStyle`, v2 `useStyle(props)`, `SizeVariantSpreadFunction` and `VariantSpreadFunction` are gone.
- Motion: `MOTION_PRESETS` (core `motion.ts`) is the one preset table both drivers are built from: `fast`, `medium`, `slow`, `bouncy`, `pulse`, `spin`, `stripe`, `linear`, `ease`, `ease-in`, `ease-out` and `ease-in-out`. The `"100ms"` key is gone because a duration is plain CSS in v3. `bouncy` is now the same spring (`BOUNCY_SPRING`) on web and native.
- Themes are precomputed. Edit `config/themes.source.ts`, then run `pnpm --filter @knitui/core generate:themes` (core `build` also runs it). `themes.generated.test.ts` fails while the frozen file is stale.

## 8. Tests

- Assert behaviour and real host elements, not v2 class-name spellings. Update class assertions to the v3 output.
- No test may log React's "does not recognize the `xxxStyle` prop", or Tamagui's "removed in v3" / "no "$" prefix" warnings. The jest setup fails on them (`scripts/jest/v3-guard.js`, installed by every Tamagui package's `jest.setup.ts`).
- Jest resolves v3's ESM `@tamagui/*` builds through pinned `customExportConditions` (`browser` under jsdom, `require` under node) and transforms them with babel. Keep `@tamagui/.*` in `transformIgnorePatterns`' allow-list.

## 9. Process rules for agents

- **Never run git write commands** (commit, checkout, stash, reset, branch, rebase, add). Never run `git checkout -- <file>` to revert. Only edit files.
- Stay inside your assigned files and directories. If you must change a shared file outside them, stop and report the needed change instead.
- Don't run `pnpm install` or change dependencies unless your brief says so.
- Don't run builds that write `packages/*/lib` unless your brief says so; typecheck with `tsc --noEmit`.

## 10. Tooling

- **Lint** (`eslint.config.base.mjs`, `tamaguiV3Restrictions()`): in `src/**`, it is an error to import `tamagui`/`@tamagui/*` (except in core and plugins), to call `.styleable(` and to detect tokens by sigil (`[0] === "$"`, `charCodeAt(0) === 36`, `charAt(0) === "$"`, `startsWith("$")`; core and map are exempt).
- **`tamagui check`**: run `pnpm tamagui:check` from the repo root, which runs `tamagui generate && tamagui check`. Use `pnpm tamagui:check:strict` to also validate conditional payloads. The root `tamagui.build.ts` points at `packages/core/src/config/config.ts` and lists the six component packages. The root devDepends on those packages (`workspace:*`), so the CLI can resolve them. `generate` writes the gitignored `.tamagui/` artifact that `check` reads.
  - **Known state:** `generate` stops at the first package that cannot run in Node. Until the codemod lands, that is `@knitui/components` (`X.styleable is not a function`).
- **Compiler wrappers**: `@knitui/plugins/metro` wraps `@tamagui/cli/metro`, `@knitui/plugins/vite` wraps `@tamagui/cli/vite`, and `@knitui/plugins/next-plugin` wraps `@tamagui/next-plugin` (webpack only, so keep `next build --webpack`).
  - `@knitui/plugins/babel-plugin` is a deprecated no-op that warns.
  - After a Tamagui config change, restart Metro with `npx expo start -c`.
- **Storybook compiler**: the components Storybook wires `@knitui/plugins/vite` behind `KNITUI_STORYBOOK_COMPILER=1`, and it is **off by default**. Under Storybook's Vite config, the compiler's evaluation environment inlines `react`'s CommonJS entry and fails with "module is not defined" in `react/index.js`. Re-test this once components load, then turn it on by default and add it to the other package Storybooks.

## 11. Internal helpers (`packages/components/src/internal`)

The shared style systems every component builds on, re-expressed in v3. Import them from `../internal/style-props` (it re-exports the colour and focus-ring modules too). Tests for all of them: `internal/style-props.test.tsx`, `variant-colors.test.ts`, `shadow.test.tsx`, `motion.test.tsx`, `transition.test.ts`, and the guardrail `__tests__/focus-ring.test.tsx`.

**Variant shapes.**

- Static exact-key maps (compiler-friendly; they work per clause, so `size="sm md:lg"` is fine): `controlVariant`, `controlFontVariant`, `squareSizeVariant`, `fontSizeVariant`, `kbdSizeVariant`, `shadowVariant`, `controlColorVariant` (= `VARIANT_CONTROL`), `surfaceColorVariant` (= `VARIANT_FILL`), `controlTextColorVariant`, `mutedTextColorVariant`, and the data tables `MODAL_SIZES`, `CONTAINER_SIZES`, `PANEL_WIDTH`, `PROGRESS_THICKNESS`, `SLIDER_TRACK_SIZES`, `SLIDER_THUMB_SIZES`, `CONTROL_GAP_SIZES`, `SQUARE_ROUNDED_SIZES`. Spread these only at module scope (`{ ...controlVariant.md, gap: "xs" }`).
- `styled.dynamic` variants for an open domain (key or raw number / CSS value): `radiusVariant`, `endRadiusVariant`, `alignVariant`, `justifyVariant`, `wrapVariant`, `gapVariant`, `overflowVariant`, `maxWidthVariant`, `modalSizeVariant`, `containerSizeVariant`, `panelWidthVariant`, `heightVariant`, `fieldHeightVariant`, `progressThicknessVariant`, `sliderTrackVariant`, `sliderThumbVariant`, `controlGapVariant`, `squareSizeRoundedVariant`, `squareSizeVariantFallthrough`, `fontSizePassthroughVariant`, `fontWeightVariant`, `textAlignVariant`, `textTransformVariant`, `textWrapVariant`. Outputs are memoised per value (no per-render allocation). Use them **as** the variant (`radius: radiusVariant`). **Never spread one**: spreading a dynamic copies only its brand symbol and turns the variant into a style-less bare dynamic, silently.
- Builders: `tableVariant(table, fallback?)` (a key table plus a fallthrough for any other value; the v2 `{ md: {...}, ":number": fn }` replacement), `passthroughVariant<V>("prop", ...)` (value straight onto style props). Fallthrough bodies are exported for reuse: `squareSizeOf`, `fontSizeOf`.
- **Build every `tableVariant` / `passthroughVariant` at module scope and reference it in `variants`.** An inline generic call inside a `styled()` config defeats TypeScript's inference of the whole variant set (every variant and `defaultVariants` collapse to `undefined`). `styled.dynamic<T>(fn)` with an explicit `T` is fine inline.

```ts
const titleSize = tableVariant({ h1: { fontSize: "xxl" }, ...fontSizeVariant }, fontSizeOf);
const Title = styled(Text, { variants: { size: titleSize, radius: radiusVariant } as const });
```

**Colour ladder** (`variant-colors.ts`). `VARIANT_COLOR_LADDER` is the one source of truth; `VARIANT_FILL`, `VARIANT_INTERACTION` (clauses only: `{ backgroundColor: "hover:color10 press:color8" }`), `VARIANT_CONTROL` (`{ backgroundColor: "color9 hover:color10 press:color8" }`) and the foreground ladders are generated from it at module load. Foreground values stay single theme names because `ControlIconProvider` reads them as data.

**Focus ring** (`focus-ring.ts`). `FOCUS_RING` === `focusRingStyle` = `{ outlineColor: "focus-visible:focusRingColor", outlineWidth: "focus-visible:focusRingWidth", outlineStyle: "focus-visible:solid", outlineOffset: "focus-visible:focusRingOffset" }`, valid in a `styled()` base and as JSX props (`<Frame {...FOCUS_RING} />`). The clause strings name core's theme key and variables, so `<ThemeUpdate focusRingColor=… focusRingWidth=…>` re-themes every control. `focusRingResetStyle` adds a resting reset (`"0px focus-visible:focusRingWidth"`) for frames that also kill the UA outline; `FOCUS_WITHIN_RING` is the `focus-within:` twin. The two-layer contract is unchanged; the guardrail detects rings by their CSS rule (`:focus-visible` + `outline-color`), not by class names.

**Press and transitions.** `pressScaleStyle = { scale: "press:0.97" }` goes in the base; `usePressScale()` returns `{ transition }` or, under reduced motion, `{ transition: null, scale: "press:1" }`. Clause slots merge per (property, condition) across tiers, so a base press dip and a variant's press colour compose, and a call-site `press:` clause replaces only that slot. `TransitionValue = TransitionName | TransitionSpec | null`, where `TransitionSpec` is the v3 object (`preset`, `duration`, `easing`, `delay`, `properties`, `enter`, `exit`). Helpers: `timedTransition(ms, easing?, properties?)` → `{ duration, easing, properties }` (the exact CSS curve, on both drivers), `transitionProps(value, properties?)`, `withTransitionProperties`, `scopeTransition(result, properties)` (the cached replacement for v2's `{...fade} {...animateOnlyProps(keys)}`), and `useReducedTransition(value, properties?)` (memoised on the value). `animateOnlyProps` is gone.

**Motion recipes** (`motion.ts`). `MotionPreset = { transition?, enter?, exit?, properties? }` (renamed from `enterStyle` / `exitStyle` / `animateOnly`). `useMotionPreset(name | recipe | false)` returns `{ transition, opacity: "enter:0 exit:0", y: "enter:30px exit:30px", … }`, built by `compileMotion(recipe)` (cached per recipe object) and memoised. Lengths carry `px`. Spread it after any props it doesn't name: a later JSX `opacity` / `y` prop replaces the clause program whole. A styled base value composes with it.

**Shadows.** `shadowVariant` stays static (`"0px 5px 12px 0px dropShadowColor"`). v3 resolves a bare theme name embedded in a `boxShadow` recipe as a colour against the active theme, on web (`var(--dropShadowColor)`) and native (raw value). See `getSplitStyles` `configuredValue` → `grammar.embeddedTokens`.

**Name resolution.** `themeColorToCssVar` (web, theme-free) asks the config through `isToken`: colour tokens map to their own variable, theme keys to `var(--key)`, and literals pass through. `resolveThemeColor(theme, name)` uses the theme as the oracle. `resolveSizePx` and `floating-arrow`'s radius both use `resolveToken`. `controlIconSize` reads bare keys only.

**Verified 3.0.18 behaviour that bites:**

- An explicit **`prop={undefined}` at the call site still claims the call-site slot and CLEARS a base or variant value** for that style prop. For example, `maxWidth={cond ? "100%" : undefined}` wipes the `size` variant's `maxWidth`. This contradicts §5's "counts as absent". Spread conditionally instead (`{...(cond ? { maxWidth: "100%" } : null)}`). Modal's `maxWidth` override currently hits this.
- One JSX prop holds one value: `<Box opacity={0.5} {...motion} />` keeps only the motion's clauses.
- Test helpers for v3 output live in `src/__tests__/css-rules.test.helper.ts`: `cssRulesOf(el)`, `declarationsUnder(el, ":hover")`, `hasFocusRing(el)`. Use them instead of v2 class-name spellings.

### W2 findings (component wave 2: Button … AngleSlider)

- **`styled(Base, { name: "X" })` is NOT a v3 option.** v3's `styledImpl` only lifts `variants`, `defaultVariants`, `displayName`, `context`, `contextProps` out of the options; every other key (including `name`) becomes a **default prop** and is forwarded to the host, so `<button name="Button">` lands in the DOM (and in `FormData` inside a `<form>`). Write `displayName: "X"` instead (upstream's own kit does). W2 converted its directories; ~130 component files still use `name:`.
- **Variant props that the render reads as data must be narrowed.** `GetProps<Frame>` widens every variant to `FlatStyleValue<V>` (clause programs like `size="sm md:lg"`). When the body passes `size` / `variant` to a data consumer (`controlIconSize`, `ControlIconProvider`, edge tables, `orientation` lookups), `Omit` them from the frame props and redeclare the single key (`size?: ButtonSize`). This is the v2 surface, so it is not a breaking change. Slot types (`styles.box`, …) should also `Omit` the variants the component owns; otherwise tsc reports the error on an earlier `size={size}` attribute, not on the spread.
- **A numeric `lineHeight` is a ratio in v3** (web and native): `lineHeight={35}` emits `line-height: 35`. Write absolute values as px strings (`"35px"`). Any kit code that passes numeric px line heights needs auditing.
- **CSS longhands are typed style props in v3.** A Mantine-named prop that collides (`transitionDuration`, `transitionTimingFunction`, `animationDuration`) breaks `interface … extends`. `Omit` it from the frame props and redeclare it with the component's own meaning.
- **A style prop whose value changes continuously** (a drag position) injects one CSS rule per distinct value on web. Put value-following geometry in inline `style={{ left: "37%" }}`, which stays inline. Transforms do not stay inline: v3 moves `transform` into classes, and `rotate` emits the CSS `rotate: 45deg` property.
- Colour output names: theme keys compile to `var(--red9)` / `var(--color9)`, but the `white` colour **token** compiles to `var(--c-white)`. Font sizes compile to `var(--f-size-<key>)`, sizes to `var(--t-size-<key>)`, space to `var(--t-space-<key>)` and radii to `var(--t-radius-<key>)`.
- Transition `properties` take camelCase (`["backgroundColor"]` → `transition: background-color …`). `transform` expands to transform, translate, scale and rotate.
- `tableVariant({}, fn)` (an empty table plus a fallback) is the drop-in for v2 `":number"`-only variants.
- **`useKeyboardActions()` (`@knitui/hooks`) does not type-check when spread onto a v3 frame.** It types `onAccessibilityAction` with RN's `AccessibilityActionEvent`, but v3's view event has `currentTarget: number | ReactNativeElement`. Chip, Rating, Checkbox and Radio cast it locally (`as object`, the same as Pagination). The hook's type should be fixed once.
- Test helper `src/Button/css-base.test.helper.ts` provides `baseDeclarations(el)` / `baseValue(el, "background-color")`, the resting-state twin of `declarationsUnder`. It could move into `src/__tests__/css-rules.test.helper.ts`.
- jsdom drag tests: stub `getBoundingClientRect` on the move target, dispatch `new MouseEvent("pointerdown", { clientX, clientY })` (jsdom has no PointerEvent), and send move/up events to `window` inside `act()`.

### W4 findings (overlays: Modal/Drawer/Dialog, Popover/Tooltip/HoverCard/Menu, Combobox family, Collapse/Spoiler)

- **AnimatePresence exit in jsdom completes on its own** (≈10 ms; no `transitionend` needed). While exiting, the subtree carries the `t_exiting` class and the `exit:` clauses apply as `:where(.t_exiting, .t_exiting *)` rules. With **no** exit clauses (`animation={false}`, reduced motion) the child is removed **in the same commit**, so `waitForElementToBeRemoved` fails with "already removed". Assert removal synchronously there, and use `await waitFor(() => expect(…).not.toBeInTheDocument())` after an animated close. A test that closes an animated overlay and returns without awaiting the removal logs "update to AnimatePresence … not wrapped in act".
- **v3 frame props that collide with kit prop names**: `animation` (CSS animation), `offset`, `transitionDuration`, `transitionTimingFunction` and `maxHeight` are real v3 style props. A component whose own prop has the same name (Modal/Drawer/Dialog `animation`, Drawer/Tooltip `offset`, Collapse/Spoiler `transitionDuration`, Spoiler `maxHeight`) must `Omit` it from the inherited frame props, or the interface fails to extend.
- **`useElementSize().rootProps.onLayout` is typed with React Native's `LayoutChangeEvent`**, which v3's `onLayout` (from `@tamagui/react-native-types`) rejects (wider `currentTarget`). It's the same runtime object, so W4 casts at the spread (`rootProps as Pick<BoxProps, "onLayout">`). The proper fix is in `@knitui/hooks`: type `ElementSizeRootProps.onLayout` with core's structural `LayoutChangeEvent`.
- **Optional layout pass-throughs must be conditional too.** For example, `ModalBase` passed `padding={padding}` / `alignItems={align}` straight to its layer, and Popover's `borderRadius={ctx.radius}` wiped the frame's default `sm` radius when no `radius` was given. Spread only when the value is set.
- **Recipes must have a stable identity.** `useMotionPreset` / `compileMotion` cache per recipe object, so per-variant defaults (Drawer per edge) are built at module scope, never inline in render.
- **React 19**: read a cloned child's ref from `child.props.ref`. `element.ref` logs "Accessing element.ref was removed in React 19" (fixed in FocusTrap, Popover.Target and Tooltip.Target).
- **Web hover**: `onHoverIn` / `onHoverOut` alone attach no listeners on v3 web. `createComponent` wires hover only for `onMouseEnter` / `onMouseLeave`, a `hover:` style or group children. Popover/HoverCard/Menu use a local `hoverIntentProps` (mouse events on web). `internal/style-props` `hoverProps` should do the same so every caller works.
- **Portal in tests**: the root teleport host lives inside core's Provider, i.e. inside the RTL container. To assert "portalled", check that the overlay left its render-site subtree (`<div data-testid="site">`), not that it is outside `container`.
- **Assert positioning/sizing through rules**: e.g. `cssRulesOf(dialog)` contains `max-width: 380px;`. The layer is `dialog.parentElement` and the scrim is its first child. The `is_Text` / `is_View` host classes still exist; `is_<ComponentName>` classes do not.
- **Floating position goes in inline `style`.** Popover's and Tooltip's `top` / `left` come from the floating engine and change on every scroll or resize. As style props they would inject one CSS rule per value on web, so they now ride the `style` array (`{ top: y, left: x }`, before the transition style). `internal/floating-arrow` should do the same for the arrow offset (not W4-owned).

### Dates findings (@knitui/dates)

- **Active variants apply in PROP order at the call site, not in `variants` declaration order** (verified 3.0.18). `<DayFrame selected inRange>` with both setting `backgroundColor` resolves to `inRange`'s tint. The v2-era comment "later declared wins" was wrong for v3. Where two boolean variants touch the same property, the B wrapper must pass them in precedence order (Day/PickerControl now pass `inRange`, `firstInRange`/`lastInRange`, then `selected` last). Pinned by `dates/src/__tests__/cell-styles.test.tsx`.
- **`styled()` over a plain React component (a `forwardRef` that renders `Text`) loses theme-name values.** v3 resolves the styles into an inline `style` prop with raw values; `color: "color1"` never reached the DOM (font size did). Style a real Tamagui leaf (`styled(Text)`) and render the formatted content inside it.
- **`cursor: "web:pointer"`** replaces the `isWeb ? { cursor } : {}` spread helper in styled bases/variants: static, compiler-evaluable, and a variant's `web:not-allowed` replaces the base's `web:` slot.
- Range hover preview rides `onHoverIn`, which v3 web only wires because the cell also has a `hover:` clause (see W4). Cells that drop their `hover:` styles must switch to `onMouseEnter`.
- A variant prop declared on the frame is `FlatStyleValue<boolean>` in `GetProps<Frame>`; an interface that extends both the frame props and a settings type declaring `fullWidth?: boolean` fails with TS2320. `Omit` the variant key from the frame props.
- Test helpers: `dates/src/__tests__/css-rules.test.helper.ts` adds `baseStyle(el)` (resolved unconditional declarations as a map) and `stateStyle(el, ":hover")`. `dates/src/__tests__/stories.test.tsx` smoke-renders every story under jsdom and fails on any console error/warning, which is a cheap per-package guard for v2 leftovers in story sources.

### W1 findings (component wave 1: layout + typography primitives)

- **`toHaveStyle` is VACUOUS for `var(...)` values.** jest-dom parses the expectation through a CSS declaration that drops `var(--x)` values, so `toHaveStyle({ backgroundColor: "var(--color9)" })` passes against anything (verified: a deliberately wrong `var(--color9)` passes). Assert token output on the injected rules instead: `expect(cssRulesOf(el).join("\n")).toContain("background-color: var(--color2)")`. `toHaveStyle` with plain px / keyword / number values does work (jsdom cascades the atomic rules).
- **jsdom doesn't expand v3's logical shorthands.** `marginHorizontal` / `paddingHorizontal` / `paddingVertical` emit `margin-inline` / `padding-inline` / `padding-block`, so `toHaveStyle({ paddingLeft })` fails; assert the rule text. `x`/`y` emit `--t-x` / `--t-y` custom properties composed by a shared `translate: var(--t-x) var(--t-y)` rule (not `transform: translateX(...)`).
- **Spaces inside parentheses are fine in a flat value.** `rgba(0, 0, 0, 0.5)` and `linear-gradient(black, white)` emit intact (clauses split on top-level whitespace only). Embedded bare names inside a function value are resolved as tokens (`linear-gradient(black, white)` → `linear-gradient(var(--black), var(--white))` because `black`/`white` are colour tokens).
- **A key declared in `variants` beats the same-named host style key.** `getSplitStyles` skips the direct-style path for `keyInit in variants`, so a `direction` variant (Flex) works even though `direction` is a valid style prop.
- **`.resolve(props)` receives the raw props (shorthands unexpanded)**: read `props.w ?? props.width`. It runs per render with clause values passed through, and a resolver returning a clause string (`"sm md:lg"`) still emits the media rule. Resolver output beats variants regardless of prop order — the robust fix for "flag X must win over variant Y" (Container `fluid` vs `size`), since active variants otherwise apply in call-site prop order.
- **Bare `styled.dynamic<T>()`** is the v3 way to declare a typed, consumed prop with no style of its own (Container `fluid`, Text `span`); it is never forwarded to the DOM.
- **A variant body cannot carry `render`** (typed `never`). Host derived from a prop (`Title` order → `h1`…, `Code` block → `pre`) stays a thin `styleable`; a static host is a `render: "kbd"` base default in `styled()` (overridable at the call site).
- **`pointerEvents: "auto"`** also emits `:where(._pe-…) > * { pointer-events: auto }` on web, i.e. it re-enables direct children too (relevant under a `pointer-events: none` portal host).
- **The Provider renders its own `<span>`s**, so `container.querySelector("span")` does not find a component's host; query by text/testID.
- **`createStyledContext` + `context:` on a frame turns every context key into a frame prop** (`GridProps` failed to extend because `gutter` became `FlatStyleValue<number>`). If a component provides the context itself and its frames don't read context-driven variants, drop `context:` from the frames.

### W3 findings (inputs: Input family, PinInput, Fieldset, FileInput, PillsInput, NativeSelect, ColorPicker, ColorInput)

- **Input colours are v3 style props.** With `styled(X, config, { isInput: true })` the frame accepts `placeholderTextColor`, `selectionColor`, `cursorColor`, `selectionHandleColor` (theme names): web compiles them to `::placeholder` / `::selection` / `caret-color` rules on the atomic class, native hands the resolved colour to `TextInput`. No CSS custom-property bridge or `useTheme()` is needed. `staticConfig.accept` is gone and `validStyles` defaults to `stylePropsInput` when `isInput` is set.
- **Typing gap (3.0.18):** those four props are typed only in VARIANT bodies (`VariantStyleProps`) and on raw `TextInput` parents, not in a `styled(Box, …)` base literal or in `GetProps` of the result. Put them in a const that is spread into the config (spread members escape excess-property checks) and add them to the public props by hand (`InputColorStyleProps` in `Input/types.ts`).
- **`render` on native:** keep `render` out of a config that is also used for `styled(TextInput, …)`; the native host is the RN component itself.
- **DOM-only attributes** (`readOnly`, `rows`, `type`, `required`, …) are not in a `styled(Box)` frame's types. Pass them as one cast bag (`{...(domAttrs as object)}`) rather than widening the frame.
- **Explicit-props `styleable<P>` drops the frame's style props from the public type.** v2 `.styleable<Extra>()` merged them; now write `P = Omit<GetProps<typeof Frame>, keyof Own> & Own` when a component's style props are public (Input: padding, text styles, `opacity`, …).
- **`useCallbackRef` for handlers on keystroke-driven fields:** `Input`, `NumberInput`, `PillsInput.Field`, `PinInput`, `ColorInput`, `NativeSelect` hand stable handler identities to their hosts, so the memoised chain (TextInput → InputBase → Input) only re-renders for real prop changes. Section insets come from four frozen module constants.
- **Test helpers for computed values:** `src/Input/input-css.test.helper.ts` has `baseStyle(el, prop, shorthands)` (the effective unconditional value from the injected rules, highest specificity wins, so `padding-left: 0px` beats `padding-inline`), `paddingX(el)` and `pseudoStyle(el, "::placeholder", "color")`.
- `"$0"` survived the codemod in object literals inside JSX props (PillsInput); grep for `"\$` after the codemod.
- Native-only paths (`Input.native.tsx`, `NativeSelect.native.tsx`, Android sentinel in PinInput) have no jest coverage: the jsdom suite renders web only. They typecheck; verify on device.

### Media/Sheet/Carousel findings

- **Embedded theme names resolve in `backgroundImage` too, not only in `boxShadow`.** `backgroundImage="linear-gradient(to top, mediaScrim 0%, transparent 100%)"` compiles to `var(--mediaScrim)` on web. Gradient recipes can be static `styled()` values with no `useTheme()` / `variableToString` read (Video scrim).
- **Platform clauses work for `position`:** `position: "absolute web:fixed"` emits both rules, and the `fixed` one comes later and wins on web. This replaces `style={{ position: isWeb ? "fixed" : "absolute" }}` (sheet layer).
- **`pointerEvents` as an inline `style` key reaches the DOM verbatim on v3 web** (`pointer-events: box-none` is invalid CSS and silently becomes `auto`). Use the `pointerEvents` prop, or the key in a `styled()` base, which compiles to the `_pe-boxnone` child rule. The carousel's `SLIDE_BASE` had it in a style object.
- **Kit `ViewStyle` (reanimated `StyleProps`) is not assignable to a v3 `Box` `style`.** Its colours admit native `OpaqueColorValue`. Carousel types geometry that goes to both hosts as `LayoutStyle = HostStyle & ViewStyle` (`carousel/src/style.ts`, `HostStyle` = one object of `StyleProp`). Layout-worklet output passes through the documented `toHostStyle()` narrowing. No more `as unknown as ViewStyle`.
- **Palette names outside the theme are type errors in v3 and never resolved in v2.** `green9`, `green3`, `yellow9` silently painted nothing. Use `color9` under a `theme="green"` sub-theme (recorder meter, deck stamp), `blue*`/`red*` extras, or a literal.
- **`"sideEffects": false` dropped `import "../expo-globals"` in bundles.** Verified with esbuild: 0 vs 1 `import "expo-modules-core"` in the output. Media now lists the module in a `sideEffects` allow-list (`./src/shared/expo-globals*.ts`, `./lib/*/shared/expo-globals*.js`), guarded by `shared/expo-globals.test.ts`; it covers `expo-audio` too, whose web build needs the global since SDK 58. Since SDK 58 the web module also uses `SharedObject` instead of a bare import, because `expo-modules-core` now resolves to `build/index.js`, which its own `sideEffects` list omits, so even a kept bare import of it is dropped. Any package with a bare side-effect import needs the same.
- **Typecheck against sibling sources while their libs are stale:** `npx tsc --noEmit -p tsconfig.json --customConditions source` resolves `@knitui/*` through the `source` export condition, so you see your own errors without waiting for a components rebuild.
- **Value-tracking widths** (scrubber buffered range, input level) go through `percentWidth()` (media `shared/chrome.tsx`): 101 prebuilt inline style objects, no per-value CSS rule, no per-tick allocation.
- **Story smoke tests** (`src/__tests__/stories.test.tsx`, the dates pattern) now run in media, sheet and carousel.

### W5 findings (data display + navigation: Table, Tree, VirtualList, Tabs, Accordion, Pagination, Stepper, TableOfContents, NavLink, Image, ScrollArea, …)

- **Two variants that set different clauses of one property merge.** `striped: { backgroundColor: "color2" }` plus `highlightOnHover: { backgroundColor: "hover:color3" }` yields both the resting fill and the `:hover` rule (Table rows, pinned by `Table.test.tsx`). Use separate boolean variants per clause instead of a combinatorial look key.
- **A call-site bare value claims only the resting slot.** `backgroundColor="transparent"` on a frame whose base is `"background hover:color3"` keeps the inherited `hover:color3`. To neutralise every state write each slot (`"transparent hover:transparent press:transparent"`), ideally in a derived `styled()` frame (Pagination dots).
- **`styled()` over a non-Tamagui host drops theme-name colours on web, and so does jsdom's CSSOM.** Image's backend wrapper (`styled(ExpoImage | WebImage)`) lost `bg="color3"`; createImage now lifts colour props into the inline style as `themeColorToCssVar(...)` on web. Native is unverified (no device run). Note that jsdom's `el.style` ALSO silently rejects `var()` colours (box-shadow survives), so assert on the props the backend receives, not on `el.style.backgroundColor`.
- **`type` is not a styled() base option.** `styled(Frame, { type: "button" })` is a TS error; keep `type` as a module-constant JSX spread. `render: "button"` / `role` / `"aria-label"` in a base are fine.
- **`aria-current` and other a11y attributes go in the base when they are static** (`role: "navigation"`, `render: "nav"`); dynamic ones stay on the JSX.
- **`Collapse` unmounts collapsed subtrees by default in Tree**: tests that look for `ul[role=group]` must expand first.
- **The Provider renders an `aria-hidden` config-revision `<span>`** inside the test container, so `container.querySelectorAll('[aria-hidden="true"]')` over-counts. Scope queries to the component root (`getByTestId`).
- **Per-row geometry in virtualized lists belongs in inline `style`** (VirtualList row `top`, spacer `height`, ScrollArea web thumb length). The `top` style prop would compile one atomic rule per distinct offset; `VirtualList.test.tsx` asserts no `{top: Npx}` rule appears.
- **Tabs indicator has no animated slide**: the active accent is a static `indicator` variant (border/fill swap), not continuous geometry, so it needs no inline style.
- `useKeyboardActions()` gives `tabIndex: -1` when `disabled`, so non-interactive parts (Stepper steps without `onStepClick`) spread it conditionally (`{...(clickable ? keyboardProps : null)}`) to stay out of focus entirely.

### Shared-fixes findings

- `defaultVariants` keys keep their declared precedence order no matter which order props are passed at the call site. All other variants follow call-site prop order (see "Dates findings").
- v3 does not export `StyledDynamicFn`, so emitted `.d.ts` files cannot name an exported `styled.dynamic` value (TS2883). Type exported dynamic variants as `DynamicVariant<V>` from `internal/style-props.ts`, which intersects a brand so declarations print the kit alias.
- `hoverProps()` is the only way to attach hover handlers. It maps to `onMouseEnter`/`onMouseLeave` on web and `onHoverIn`/`onHoverOut` on native. Never pass `onHoverIn` directly on web-facing code: it attaches nothing in v3 web.
- Core font line heights are emitted through `toLineHeightUnits` (`"Npx"` on native, rem on web). Never put bare px numbers in a `lineHeight` table.
