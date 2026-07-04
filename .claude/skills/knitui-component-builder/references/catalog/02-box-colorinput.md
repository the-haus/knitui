## Batch 2

### Box

- **Purpose:** The single base primitive the whole kit composes from — a thin `styled(View)` from `@knitui/core`.
- **Source:** packages/components/src/Box/
- **Public API:** `Box`, `BoxProps` (`GetProps<typeof Box>`).
- **Key props:** Inherits Tamagui token style props + all Mantine-style config-level shorthands (`m`/`my`/`mx`/`mt`/`ms`/`mis`/`p`/`px`/`bdrs`/`bg`/`c`/`ff`/`fz`/`fw`/`lts`/`ta`/`lh`/`fs`/`tt`/`td`/`w`/`miw`/`maw`/`h`/`mih`/`mah`/`pos`) plus native Tamagui props (`opacity`/`top`/`left`/`right`/`bottom`/`inset`/`display`/`flex`). One named variant: `shadow`.
- **Sizes:** No size scale.
- **Variants/colors:** Only `shadow` (the shared `shadowVariant` elevation ladder xxs→xxl, theme-aware `$dropShadowColor`). Opt-in (no shadow unless set). Because every component is `styled(Box, …)`, they ALL accept `shadow`; a component may re-declare it (e.g. Drawer pins `defaultVariants: { shadow: "xl" }`).
- **Slots / `styles` keys:** none.
- **Platform:** shared.
- **Builds on:** Tamagui `View` (`@knitui/core`); `shadowVariant` from internal/style-props.
- **Gotchas:** It's the base of nearly every other component; the `shadow` variant is declared here once so it's globally available. A local re-definition wins.

### Breadcrumbs

- **Purpose:** Row of navigational crumbs separated by a `separator`, interleaved only BETWEEN items (never trailing). Renders semantic `<nav aria-label="Breadcrumb">`.
- **Source:** packages/components/src/Breadcrumbs/
- **Public API:** `Breadcrumbs` with `.Frame` / `.Label` / `.Separator` static parts.
- **Key props:** `children` (each becomes a crumb), `separator?: React.ReactNode` (@default `'/'`), `separatorMargin?` (BoxProps marginHorizontal, @default `'$xs'`, **deprecated** in favor of `styles.separator`), `aria-label?` (@default `"Breadcrumb"`), `styles?`.
- **Sizes:** No size scale.
- **Variants/colors:** none; separator dimmed via theme ramp (`opacity 0.6`).
- **Slots / `styles` keys:** `root` (nav frame), `label` (string/number crumb wrapper), `separator`. String/number crumbs auto-wrap in themed `Text`; element crumbs (e.g. `Anchor`) render as-is. `separatorMargin` merges OVER the `separator` slot (explicit beats sugar).
- **Platform:** shared.
- **Builds on:** Box, Text; `renderTextChild`, `useSlotTextWrapper`, `slotStyles`.
- **Gotchas:** `aria-label` is a runtime-only web prop narrowed locally with `render="nav"`. Boolean/null children are filtered out.

### Burger

- **Purpose:** Hamburger menu button whose three bars morph into an X when `opened`.
- **Source:** packages/components/src/Burger/
- **Public API:** `Burger` with `.Root` / `.Icon` / `.Line` / `.Text` static parts; exports `BurgerSize`.
- **Key props:** `size?: SizeKey | number` (@default `'md'`), `color?` (line color, @default `'$color12'`), `lineSize?` (line thickness; derived from size by default = diameter/12), `opened?: boolean` (@default false), `transitionDuration?` (ms, @default 300), `transitionTimingFunction?` (@default `'ease'`), `aria-label?`, `children?`, `styles?`.
- **Sizes:** Yes — `SizeKey`; icon square uses `squareSizeVariantFallthrough` off `controlMetrics[key].height`; `resolveSquareSide` resolves the SAME canonical token to px for bar geometry. Default `md`.
- **Variants/colors:** none (color via `color` prop, not variant-colors).
- **Slots / `styles` keys:** `root` (focusable button wrapper), `icon` (square), `line` (all three bars), `text`.
- **Platform:** shared.
- **Builds on:** `UnstyledButtonFrame` (inherits role/cursor/focusVisible/disabled), Box, Text; `useReducedTransition`, `timedTransition`, `renderTextChild`, `useSlotTextWrapper`.
- **Gotchas:** Bar animation geometry is computed in px from the resolved square side, so it must resolve the same height token the icon renders at, not a parallel table. `aria-pressed` reflects `opened`. Line transitions run through `useReducedTransition` (reduced-motion aware).

### Button

- **Purpose:** THE KIT PILOT component — composed from Box + Text; the template for slots, sizing, variant-colors, focus ring, and gradient wiring.
- **Source:** packages/components/src/Button/
- **Public API:** `Button` with static markers `Left` / `Label` / `Right` (from `ButtonSlots.markers`) plus `Text`, `Section`, `Loader`, `Frame`, `Group`, `GroupSection`. Exports `ButtonSize`, `ButtonVariant`.
- **Key props:** `variant?: ButtonVariant` (@default `'filled'`), `size?: SizeKey` (@default `'md'`), `radius?` (@default `'md'`), `justify?` (overrides inner `justifyContent`), `fullWidth?` (@default false), `disabled?`, `loading?` (replaces the left visual with a `Loader`), `leftSection?`/`rightSection?`, `loaderProps?` (**deprecated** → `styles.loader`), `gradient?: GradientValue`, `styles?`.
- **Sizes:** Yes — `SizeKey` via `controlVariant` (frame metrics) + `controlFontVariant` (label). Default `md`. Icon sections auto-size via `ControlIconProvider`; the loading `Loader` takes `controlIconSize(size)`.
- **Variants/colors:** `filled | light | outline | subtle | default | white | transparent | gradient`. Frame fill + hover/press sourced from the shared **variant-colors** system (`controlColorVariant`); label color from `controlTextColorVariant` (via `pickVariants`). Colors reference the active theme ramp (`$color1…$color12`) so `theme="red"` recolors with zero per-component logic. Both frame and text read `ButtonContext` (size+variant) via `createStyledContext`.
- **Slots / `styles` keys:** `left` (leading `ButtonSection`), `label` (`ButtonText`), `right` (trailing section), `loader` (`Loader`). Also marker slots in children: `Button.Left` / `Button.Label` / `Button.Right` (`Label` is the default slot; plain text children fold into it). Precedence: marker slot → legacy prop → plain children; marker's own props win over slot sugar; `loaderProps` wins over `loader` slot.
- **Focus ring:** `focusRingStyle` spread on the base frame (variant-independent), so every variant shows the same web `:focus-visible` outline; frame made focusable via `webButton()`.
- **Press:** base `pressScaleStyle` dip on the frame, eased at render by `usePressScale()` (reduced-motion aware).
- **Gradient:** `useGradient(variant === "gradient" ? gradient : undefined)` → web paints CSS `backgroundImage` (`grad.frameProps`); native renders `grad.layer` (an SVG fill) behind content. `gradient` is `{from,to,deg}` or `{stops,deg}`; defaults to active theme ramp.
- **Platform:** shared (gradient split handled inside `useGradient`; `nativeID` gated by `isWeb`).
- **Builds on:** Box, Text, Loader; ControlIconProvider, createSlot/defineSlots, createStyledContext, gradient, motion, slotStyles.
- **Sub-components:** `Button.Group` (flush attached row/column, `orientation` horizontal|vertical, gap 0, strips inner border-radii + overlaps borders by -1px). `Button.GroupSection` (non-interactive segment with border/background, `size`+`radius` variants).
- **Gotchas:** `disabled` is remapped (`isDisabled = disabled || loading`); the frame's `disabled` variant applies `opacity 0.6` + `pointerEvents:none`. Icon sections are wrapped in `ControlIconProvider` so a bare `@knitui/icons` icon auto-sizes/colors to the button's size/variant.

### Card

- **Purpose:** Card surface with full-bleed sections; mirrors Mantine's `Card`.
- **Source:** packages/components/src/Card/
- **Public API:** `Card` with `.Header` / `.Footer` / `.Section` static parts.
- **Key props (Card):** `shadow?`, `radius?`, `withBorder?`, `orientation?: 'horizontal'|'vertical'` (@default vertical), `padding?` (@default `'$lg'`), `styles?`. **Card.Section:** `withBorder?` (dividers on edges adjacent to siblings), `inheritPadding?` (re-inset content), plus `@internal __first`/`__last` flags injected by Card.
- **Sizes:** No size scale (uses padding + radius/shadow ladders).
- **Variants/colors:** `shadow` (shadowVariant), `radius` (radiusVariant), `withBorder`, `orientation`. Not variant-colors.
- **Slots / `styles` keys:** `header` (Card.Header), `footer` (Card.Footer), `section` (Card.Section). Distributed onto matching children via `cloneElement`; child's own props win over sugar; `__first`/`__last` applied last.
- **Platform:** shared.
- **Builds on:** Box; `radiusVariant`, `shadowVariant`, `slotStyles`. Provides `CardContext` (resolved padding px + orientation).
- **Gotchas:** `Card.Section` negates the card's padding to span edge-to-edge; first/last sections also cancel leading/trailing padding via the injected flags. Bleed math resolves padding token → px via `getTokenValue(..., "space")`. Orientation controls which axis bleeds.

### Center

- **Purpose:** Centers children on both axes; `inline` switches to `inline-flex`.
- **Source:** packages/components/src/Center/
- **Public API:** `Center`, `CenterProps`.
- **Key props:** `inline?: boolean` (@default false).
- **Sizes:** none.
- **Variants/colors:** only `inline` (true→`display:inline-flex`, false→`display:flex`).
- **Slots / `styles` keys:** none.
- **Platform:** shared.
- **Builds on:** Box; `renderTextChild` (wraps string children in `Text`).
- **Gotchas:** none noted.

### Checkbox

- **Purpose:** Accessible checkbox with label/description/error chrome, plus `Group`, `Indicator`, and pressable `Card` variants.
- **Source:** packages/components/src/Checkbox/ (Checkbox.tsx + CheckIcon.tsx)
- **Public API:** `Checkbox` with `.Group` / `.Indicator` / `.Card` static parts; exports `CheckboxIconComponent`, `CheckboxVariant`, `CheckboxSize`.
- **Key props:** `checked?`/`defaultChecked?` (@default false), `onChange?: (checked: boolean)=>void` (boolean payload, not a DOM event), `onCheckedChange?` (**deprecated** Tamagui alias), `size?: SizeKey` (@default md), `variant?: 'filled'|'outline'` (@default filled), `indeterminate?` (ignores `checked` for display, `aria-checked="mixed"`), `icon?`, `iconColor?`, `readOnly?`, `withErrorStyles?` (@default true), `label`/`description`/`error`/`labelPosition`, `value?` (for Group), `rootRef?`, `id?`, `styles?`.
- **Sizes:** Yes — `SizeKey` via `squareSizeVariant` for the box. Default `md`. Size can be inherited from surrounding `Checkbox.Group`.
- **Variants/colors:** `filled` (checked = `$color9` bg/border, `$color1` icon) / `outline` (checked = transparent bg, `$color9` border+icon). Unchecked = `$background`/`$borderColor`. Error border uses `$color8` wrapped in `<Theme name="red">` so it stays red under any accent theme. Not the shared variant-colors ladder — colors resolved by local `checkColors()`.
- **Slots / `styles` keys:** own: `box` (the square), `icon` (glyph); PLUS inherited `InlineControlSlots` chrome (`label`/`description`/`error`/`root`). Chrome slots forwarded to `InlineControl` via `pick`.
- **Platform:** shared.
- **Builds on:** Box, Text, `InlineControl`, `CheckboxIcon` (CheckIcon.tsx); `useUncontrolled`, `useId`, `useKeyboardActions`, `FOCUS_RING`, `squareSizeVariant`.
- **Sub-components:** `Checkbox.Group` (context-driven single-column set; `value`/`defaultValue: string[]`, `maxSelectedValues` caps + disables unselected, `readOnly`, `disabled`, `label`/`description`, `name` = web-form metadata only). `Checkbox.Indicator` (presentational, no input; can read `CheckboxCardContext`). `Checkbox.Card` (pressable card acting as a checkbox; `withBorder` @default true, `radius`/`shadow` variants, provides `CheckboxCardContext` to a nested Indicator).
- **Gotchas:** `role="checkbox"` with `aria-checked` mixed for indeterminate. `readOnly` blocks toggling but stays focusable. In a Group, checked state defers to context (`ctx.value.includes(value)`).

### Chip

- **Purpose:** Pill-shaped toggle (checkbox or radio-in-group); mirrors Mantine's `Chip`.
- **Source:** packages/components/src/Chip/
- **Public API:** `Chip` with `.Group` / `.Label` / `.Icon` / `.Frame` static parts; exports `ChipSize`, `ChipVariant`.
- **Key props:** `variant?: 'outline'|'filled'|'light'` (@default outline), `size?: SizeKey` (@default `'sm'`), `checked?`/`defaultChecked?`, `onChange?: (checked)=>void`, `value?` (for Group), `icon?: React.ReactNode` (replaces default ✓; `null`/`false` hides it), `children` (label), `styles?`.
- **Sizes:** Yes — `SizeKey`; `controlGapVariant` on frame, `controlFontVariant` on label/icon. Default `sm`. Check glyph px from `controlIconSize(size)`.
- **Variants/colors:** 3 variants × checked = a derived combined `ChipState` (`variant` | `${variant}-on`) fed to the frame + label + icon via `ChipContext` (since Tamagui has no compound variants). Accent from the active theme ramp via `theme` prop, NOT a `color` prop. Not the shared controlColorVariant system — Chip defines its own state ladder inline.
- **Slots / `styles` keys:** `root` (ChipFrame), `label` (ChipLabel), `icon` (ChipIcon wrapper; `icon.color` is routed to the `IconCheck` SVG).
- **Platform:** shared.
- **Builds on:** Box, Text, `IconCheck` (@knitui/icons); `useUncontrolled`/`useToggle`, `useKeyboardActions`, `usePressScale`, `resolveThemeColor`, `focusRingStyle`, `pressScaleStyle`.
- **Sub-components:** `Chip.Group` (single- or multi-select via `multiple`; value is `string`|`string[]`; hands `isChipSelected`/`onChange` through context). Role becomes `radio` for single-select group members, else `checkbox`.
- **Gotchas:** `ChipIcon` is a Box (not Text) because the check is an SVG (native SVGs must live in a View); its `state`/`size` style props are inert. The check color must be resolved to a concrete value via `resolveThemeColor` (react-native-svg can't resolve theme tokens). Only `-on` icon states are reachable (icon renders only when checked).

### CloseButton

- **Purpose:** Close control (✕) built on `ActionIcon`; mirrors Mantine's `CloseButton`.
- **Source:** packages/components/src/CloseButton/
- **Public API:** `CloseButton` with `.Frame` / `.Icon` static parts.
- **Key props:** `iconSize?` (px number or token/CSS string; falls back to size-derived icon px), `icon?: React.ReactNode` (replaces default glyph; when set `iconSize` ignored), `variant?` (@default `'subtle'`), `size?` (@default `'md'`), `gradient?: GradientValue`, `children?`, `styles?`. `aria-label` defaults to `"Close"`.
- **Sizes:** Yes — inherits ActionIcon sizing; default `md`. Glyph px via `ControlIconProvider` (or explicit `iconSize`).
- **Variants/colors:** Inherits ActionIcon variants (default `subtle`); supports `gradient`. Accent via `theme` prop + palette ramp, never a `color` prop.
- **Slots / `styles` keys:** single `icon` slot → the `.Icon` glyph wrapper; `icon.color` is routed to the `IconX` SVG. (Restyle the pressable itself via plain frame style props — no `root` slot.)
- **Platform:** shared (gradient split inside `useGradient`).
- **Builds on:** `ActionIcon` (`ActionIcon.Frame`, `ActionIcon.Text`), Box, `IconX` (@knitui/icons); ControlIconProvider, useGradient, usePressScale, `fontSizePassthroughVariant`.
- **Gotchas:** `.Icon` wrapper is a Box (not Text) because the default glyph is an SVG. Supplies its own render-time press easing (ActionIcon's base dip has no easing). `iconSize` variant kept only for back-compat with `styles={{ icon: { iconSize } }}`.

### Code

- **Purpose:** Inline `<code>` / block `<pre>` monospace code on a tinted surface; mirrors Mantine's `Code`.
- **Source:** packages/components/src/Code/
- **Public API:** `Code`, `CodeProps`.
- **Key props:** `block?: boolean` (switches inline `<code>` → full-width `<pre>` with larger padding), `size?` (@default `'xs'`).
- **Sizes:** `size` via `fontSizePassthroughVariant`; default `xs`.
- **Variants/colors:** `size` + `block`. Tint from theme ramp (`$color3` surface, `$color12` text, `$mono` font); recolor via `theme` prop. Not variant-colors.
- **Slots / `styles` keys:** none.
- **Platform:** shared (`render` switches host element `pre`/`code`).
- **Builds on:** Text; `fontSizePassthroughVariant`.
- **Gotchas:** `block` sets `display:block` + width 100% (web semantics via `render="pre"`).

### Collapse

- **Purpose:** Animated height/width clip that expands/collapses content between 0 and its measured natural size.
- **Source:** packages/components/src/Collapse/
- **Public API:** `Collapse` with `.Frame` / `.Content` static parts; exports `CollapseOrientation`.
- **Key props:** `expanded?` (canonical) with legacy aliases `in?` / `opened?` (expanded wins), `orientation?: 'vertical'|'horizontal'` (@default vertical), `transitionDuration?` (ms, @default `DURATIONS.base` = 200), `transitionTimingFunction?` (@default `'ease'`), `animateOpacity?` (@default true), `keepMounted?` (@default false — content unmounts after exit), `onTransitionStart?`/`onTransitionEnd?`, `styles?`.
- **Sizes:** No size scale.
- **Variants/colors:** none.
- **Slots / `styles` keys:** `root` (outer animated clip box, `.Frame`), `content` (inner measured natural-size wrapper, `.Content`).
- **Platform:** shared via `CollapseBox` (internal/collapse-box) — web uses CSS driver, native uses reanimated `Animated.View`. Both driven only with concrete px numbers (neither can interpolate `auto`).
- **Builds on:** Box, `CollapseBox`; `useElementSize` (ResizeObserver web / onLayout native, retains last value across unmount), `useDidUpdate`, `useReducedMotion`, `DURATIONS`.
- **Gotchas:** `CollapseContent`'s `flexShrink: 0` is load-bearing — without it the wrapper shrinks to the 0-height clip, `onLayout` reports 0, and the panel never opens (e.g. Accordion on native). Reduced-motion or 0ms duration snaps with no transition and drives the unmount timer. First-render-expanded instances paint open immediately (height `auto`) until first measure; opening-from-closed animates 0→measured. `crossSize` passed so native clip renders at natural cross-axis size.

### ColorInput

- **Purpose:** Text input that opens a `Popover` dropdown hosting a `ColorPicker`; assembled like `Select`. Mirrors Mantine's `ColorInput`.
- **Source:** packages/components/src/ColorInput/
- **Public API:** `ColorInput` with `.Root` (Popover) / `.Target` / `.Dropdown` / `.Picker` / `.Swatch` / `.Swatches` static parts (picker parts re-exported from ColorPicker). Exports `ColorInputRef`.
- **Key props:** `value?`/`defaultValue?` (@default `''`), `onChange?: (value)=>void`, `onChangeEnd?` (fires when a drag/keyboard change finishes), `format?: ColorPickerFormat` (@default `'hex'`), `swatches?: string[]`, `swatchesPerRow?` (@default 7), `withPicker?` (@default true), `disallowInput?` (@default false — value only picked), `fixOnBlur?` (@default true — restore last valid on blur), `withPreview?` (@default true — left-section swatch), `closeOnColorSwatchClick?` (@default false), `popoverProps?` (**deprecated** → `styles.dropdown`, but targets the Popover root), `withEyeDropper?`/`eyeDropperIcon?` (documented no-ops, API parity only), `size?` (@default md), `styles?`.
- **Sizes:** `size` forwarded to InputBase (default md); preview swatch is a step-DOWN via `toEmbeddedControlSize(size)`.
- **Variants/colors:** Inherits InputBase field variants; accent via Tamagui `theme` prop + ramp, never a Mantine `color` prop.
- **Slots / `styles` keys:** inherited field chrome from `InputWrapperSlots` (`wrapper`/`label`/`description`/`error`/`required`, forwarded to Input.Wrapper via `pick`), plus own `preview` (left-section swatch), `dropdown` (Popover.Dropdown surface), `picker` (ColorPicker), `swatch` (each predefined swatch in the dropdown), `eyedropper` (reserved no-op slot). `swatch` reaches the picker's swatch slot; explicit `picker.styles` wins.
- **Platform:** shared. The web-only `EyeDropper` API is a documented no-op (no cross-platform eyedropper).
- **Builds on:** `InputBase`, `Popover` (Target/Dropdown), `ColorPicker`, `ColorSwatch`; internal/color (`isColorValid`/`parseColor`/`convertHsvaTo`), `useUncontrolled`, `useDidUpdate`, `toEmbeddedControlSize`, slotStyles/pick.
- **Gotchas:** Dropdown closes on outside-click/Escape (Popover's own listeners wired back through `onChange`), NOT on input blur — documented divergence, more robust cross-platform. `fixOnBlur` restores the last known-valid value (tracked in a ref updated inline so typing doesn't lag a render). Changing `format` reconverts a valid value. `dropdownDisabled` when readOnly, or when picker is off and no swatches. Uses `forwardRef` (not `styleable`).
