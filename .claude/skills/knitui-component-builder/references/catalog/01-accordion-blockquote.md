## Batch 1

### Accordion

- **Purpose:** Vertically stacked, collapsible sections with a chevron-headed control per item.
- **Source:** packages/components/src/Accordion/
- **Public API:** `Accordion` + compound `Accordion.Item`, `Accordion.Control`, `Accordion.Label`, `Accordion.Panel`, `Accordion.Chevron`.
- **Key props:** `multiple?: boolean` (generic-typed; toggles `value`/`defaultValue`/`onChange` between `string|null` and `string[]`), `value`/`defaultValue`/`onChange`, `variant?: "default"|"contained"|"filled"|"separated"`, `chevron?: ReactNode`, `chevronPosition?: "left"|"right"` (default right), `chevronSize?: number|string` (default `"auto"`; fixed centered slot), `chevronIconSize?: number|string` (default 14px glyph), `disableChevronRotation?`, `keepMounted?: boolean` (default true), `transitionDuration?` (default `DURATIONS.base`=200), `transitionTimingFunction?` (default "ease"), `order?: 2|3|4|5|6` (wraps control in `role="heading"` + `aria-level`), `radius?`. `Accordion.Control` adds `icon?`, `disabled?`.
- **Sizes:** Yes — `SizeKey` (xxs..xxl), default `md`. Header padding/minHeight/gap pull from `controlMetrics` (M) row; label font from `controlFontVariant`; chevron glyph from a bespoke `CHEVRON_GLYPH_SIZE` table (10–22px), deliberately NOT the CONTROL_ICON_SIZE ladder.
- **Variants/colors:** `default`/`contained`/`filled`/`separated` (structural, not the variant-colors ramp); uses raw theme tokens (`$color2`/`$color3`/`$borderColor`) for hover/press, not the surface/control color system.
- **Slots / `styles` keys:** `root`, `item`, `control`, `label`, `chevron`, `panel`. Distributed to consumer-rendered parts via a plain `AccordionSlotStylesContext` (styled context can't reach them). Explicit inline props win over slot sugar.
- **Platform:** shared (single .tsx).
- **Builds on:** `Box`, `Text`, `Collapse` (panel expand/collapse), `ControlIconProvider`, `useReducedTransition`, `useKeyboardActions` (focus/activate), `useUncontrolled`, `IconChevronDown`.
- **Gotchas:** Control is a plain `Box` (`<div role="button">`) — `useKeyboardActions` is required to make it focusable so `focusRingStyle` fires. Chevron glyph default is 14px (deliberate divergence from Mantine's 16).

### ActionIcon

- **Purpose:** Square, icon-only button mirroring the `Button` palette/press behavior.
- **Source:** packages/components/src/ActionIcon/
- **Public API:** `ActionIcon` + `ActionIcon.Text`, `ActionIcon.Loader`, `ActionIcon.Frame`, `ActionIcon.Group`, `ActionIcon.GroupSection`.
- **Key props:** `loading?: boolean` (swaps icon for a `Loader`, blocks interaction), `gradient?: GradientValue` (only when `variant="gradient"`), `loaderProps?` (**deprecated** alias for `styles.loader`; explicit wins), `disabled?`, `radius?`. `ActionIcon.Group` adds `orientation?: "horizontal"|"vertical"`, `borderWidth?: number` (default 1, shared dividing border via negative margins + edge-radius stripping).
- **Sizes:** Yes — `SizeKey`, default `md`; uses `squareSizeRoundedVariant` (square metrics) + `fontSizeVariant` for the glyph.
- **Variants/colors:** `filled`/`light`/`outline`/`subtle`/`transparent`/`white`/`default`/`gradient`, default `filled`. Uses the variant-colors system (`controlColorVariant` frame + `controlTextColorVariant` glyph). `transparent` overridden to a fully transparent hover / no press. Accent from `theme` prop, never a `color` prop.
- **Slots / `styles` keys:** `icon` (glyph `Text` wrapper around string children), `loader` (the loading spinner).
- **Platform:** shared. Uses `webButton()` to render a real focusable `<button>` on web.
- **Builds on:** `Box`, `Text`, `Loader`, `ControlIconProvider`, `useGradient`, `usePressScale`, `createStyledContext`.
- **Gotchas:** String children render as `ActionIconText`; node children ARE the icon (published through `ControlIconProvider` for auto-size/color). `loaderProps` deprecated in favor of `styles.loader`.

### Affix

- **Purpose:** Fixed-position viewport layer (e.g. a scroll-to-top button) pinned to a corner/edge.
- **Source:** packages/components/src/Affix/
- **Public API:** `Affix` (single component).
- **Key props:** `position?: AffixPosition` (`{ top, left, bottom, right }`, default `{ bottom: 0, right: 0 }`; left/right map to inline-start/end for RTL), `zIndex?: number` (default 200), `withinPortal?: boolean` (default true — renders through `Portal` hostName "root" to escape `overflow:hidden`/transformed ancestors), `shadow?` variant.
- **Sizes:** No size scale.
- **Variants/colors:** Only `shadow` (`shadowVariant` ladder). No color/variant system.
- **Slots / `styles` keys:** none (no `styles` prop / slot map).
- **Platform:** shared but branches at render via `isWeb`: `position:"fixed"` on web, `"absolute"` on native (RN has no fixed) — pins to nearest filling ancestor/screen.
- **Builds on:** `Box`, `Portal`, `shadowVariant`.
- **Gotchas:** The portal layer is `pointer-events:none` (so its full-viewport box doesn't swallow page clicks); the frame re-enables `pointerEvents:"auto"` so affixed content stays interactive.

### Alert

- **Purpose:** Feedback/notification panel with optional title, icon, and close button.
- **Source:** packages/components/src/Alert/
- **Public API:** `Alert` + `Alert.Frame`, `Alert.Icon`, `Alert.Body`, `Alert.Content`, `Alert.Title`, `Alert.Message`.
- **Key props:** `title?: ReactNode`, `icon?: ReactNode`, `withCloseButton?: boolean` (default false), `onClose?`, `closeButtonLabel?: string` (default "Close"), `gradient?: GradientValue`, `radius?`, `shadow?` (opt-in, not default).
- **Sizes:** Yes — `SizeKey`, default `md`. Bespoke per-size padding/borderRadius; gaps on wrapper/body/content; font from `fontSizeVariant`. Close-button size mapped down one step via `getCloseButtonSize`.
- **Variants/colors:** `filled`/`light`/`outline`/`default`/`transparent`/`white`/`gradient`, default `light`. Uses variant-colors (`surfaceColorVariant` fill, `controlTextColorVariant` title, `mutedTextColorVariant` message). Accent from `theme` prop.
- **Slots / `styles` keys:** `icon`, `body`, `title`, `message`, `content`, `closeButton`.
- **Platform:** shared.
- **Builds on:** `Box`, `Text`, `CloseButton`, `ControlIconProvider`, `useGradient`, `renderTextChild`, `useId`, `createStyledContext`.
- **Gotchas:** Text-only children (`isTextOnly`) render as a single themed `AlertMessage`; the moment any element child appears it switches to the `AlertContent` Box so rich content isn't trapped in a `<Text>`. Close-button variant chosen for contrast (filled→filled, white→white, else subtle). Wires `role="alert"` + `aria-labelledby`/`aria-describedby`.

### Anchor

- **Purpose:** Link text — a `Text` that renders an `<a>` with link semantics.
- **Source:** packages/components/src/Anchor/
- **Public API:** `Anchor` (single component).
- **Key props:** `href?: string` (forwarded to the `<a>`), `underline?: "always"|"hover"|"not-hover"|"never"` (default `hover`), plus inherited `Text` surface (`size`, `lineClamp`, `truncate`, `inline`, `inherit`).
- **Sizes:** Yes — `SizeKey`, default `md`, via `fontSizePassthroughVariant`.
- **Variants/colors:** No variant prop. Default color is `$color11` (theme accent ramp) — a deliberate kit divergence; recolor via `theme` prop, never `color`.
- **Slots / `styles` keys:** none.
- **Platform:** shared. Renders host element `<a>` via `render:"a"` + `role:"link"`; `href` narrowed to a local `AnchorHostProps` type (not in generated style props).
- **Builds on:** `Text`, `focusRingStyle`, `webCursor`.
- **Gotchas:** Focus ring only fires because the `<a>` (with `href`) is natively focusable; `underline` controls WHEN the underline shows, not styling.

### AngleSlider

- **Purpose:** Circular slider selecting an angle 0–359°, with optional marks and centre label.
- **Source:** packages/components/src/AngleSlider/
- **Public API:** `AngleSlider` + `AngleSlider.Frame`, `.Label`, `.Thumb`, `.ThumbKnob`, `.Marks`, `.Mark`, `.MarkTick`, `.MarkLabel`.
- **Key props:** `value`/`defaultValue`/`onChange`, `onChangeEnd?`, `onScrubStart?`/`onScrubEnd?`, `step?` (default 1), `withLabel?` (default true), `marks?: AngleSliderMark[]` (`{ value, label? }`), `restrictToMarks?` (default false), `thumbSize?: number` (derived from size by default), `formatLabel?: (v)=>ReactNode`, `disabled?`, `name?` (hidden-input form submission), `aria-label?`, `tabIndex?`.
- **Sizes:** Yes — `size?: SizeKey | number`, default `"xxl"` (=64px). Uses `squareSizeVariantFallthrough`; token sizes resolve via `getTokenValue($size,"size")`, numbers are px.
- **Variants/colors:** No variant prop; uses raw ramp tokens (`$color3` track, `$color11` knob, `$color6` ticks). Only a `disabled` variant.
- **Slots / `styles` keys:** `frame`, `label`, `thumb`, `thumbKnob`, `marks`, `mark`, `markTick`, `markLabel`.
- **Platform:** shared. `useRadialMove` handles pointer (web) vs gesture-responder (native); keyboard nav (`onKeyDown` Arrow/Home/End) is web focus prop cast via `object`.
- **Builds on:** `Box`, `Text`, `HiddenInput`, `useRadialMove`, `useUncontrolled`, `useMergedRef`, `getTokenValue`.
- **Gotchas:** A `stateRef` mirrors snapping props so the stable `applyValue` never reads stale `step`/`marks`/`restrictToMarks`. `role="slider"` with `aria-valuemin/max/now`. Mark labels counter-rotate `360-value` to stay upright.

### AspectRatio

- **Purpose:** Maintains a fixed width-to-height ratio for its content.
- **Source:** packages/components/src/AspectRatio/
- **Public API:** `AspectRatio` + `AspectRatio.Frame`.
- **Key props:** `ratio?: number` (width/height fraction, e.g. `16/9`; default 1 = square).
- **Sizes:** No size scale.
- **Variants/colors:** Only the `ratio` variant. No color system (inherits from `Box`).
- **Slots / `styles` keys:** none (`AspectRatioProps` = plain frame props).
- **Platform:** shared — uses the native `aspectRatio` style prop (no web-only CSS variable).
- **Builds on:** `Box`.
- **Gotchas:** Uses `alignSelf:"stretch"` (not hardcoded `width:100%`) so it fills the parent's cross-axis in either flex direction; child overflow is clipped. Override with explicit width/height/flex.

### Autocomplete

- **Purpose:** Free-text input with a filtering suggestion dropdown (the input value IS the typed text).
- **Source:** packages/components/src/Autocomplete/
- **Public API:** `Autocomplete` (sugar wrapper) + `Autocomplete.Root`, `.Trigger`, `.Dropdown`, `.Options`, and re-exported `.Option`/`.Group`/`.Empty`/`.ClearButton` (from `Combobox`).
- **Key props:** `data?: ComboboxData`, `value`/`defaultValue`/`onChange`, `onOptionSubmit?`, `onClear?`, `openOnFocus?` (default true), `selectFirstOptionOnChange?` (default false), `autoSelectOnBlur?` (default false), `clearable?` (default false), `clearSectionMode?: "clear"|"default"|"rightSection"|"both"` (default 'both'), `nothingFoundMessage?`, `limit?` (default Infinity), `filter?: OptionsFilter`, `renderOption?`, `maxDropdownHeight?` (default 250), `withScrollArea?` (default true), `dropdownOpened`/`defaultDropdownOpened` + open/close callbacks, `comboboxProps?`, `clearButtonProps?` (deprecated → `styles.clearButton`).
- **Sizes:** Yes — `size?: ComboboxSize`, default `md`.
- **Variants/colors:** No variant prop; accent from `theme` prop + ramp (inherits Combobox/InputBase). No variant-colors set of its own.
- **Slots / `styles` keys:** `root`, `trigger`, `dropdown`, `options`, `option`, `group`, `empty`, `clearButton`. (No `chevron` slot — free-text field, not a select trigger.)
- **Platform:** shared; keyboard navigation is web-only (documented same gap as Menu/Select).
- **Builds on:** `Combobox` (+ `useCombobox`, `getParsedComboboxData`, `defaultOptionsFilter`, `flattenComboboxOptions`, `composeTriggerRightSection`), `InputBase`, `useUncontrolled`, `useId`.
- **Gotchas:** Sugar `<Autocomplete>` funnels its chrome props/ref to `Autocomplete.Trigger` through Root context (`__triggerProps`) so sugar and composable paths converge on one trigger. Precedence: explicit Trigger props > funneled > `trigger` slot sugar. Only INPUT_WRAPPER_SLOTS of `styles` are forwarded to the trigger (so Input.Wrapper doesn't warn about slots it doesn't own). Context value intentionally not memo-stable (handlers close over render state).

### Avatar

- **Purpose:** Circular avatar rendering an image, initials, or a placeholder, with an overlapping group.
- **Source:** packages/components/src/Avatar/
- **Public API:** `Avatar` + `Avatar.Text`, `Avatar.Image`, `Avatar.Frame`, `Avatar.Group`.
- **Key props:** `src?: string|null` (image; falls back to placeholder on load error/absence), `name?: string` (rendered as up-to-2 initials via `getInitials`), `alt?`, `autoColor?: boolean` (default true — hashes `name` to a theme color when no explicit `theme`; mirrors Mantine `color="initials"`), `allowedInitialsColors?: readonly string[]`, `gradient?: GradientValue`, `radius?` (default full circle). `Avatar.Group` adds `spacing?: number` (default 8px overlap).
- **Sizes:** Yes — `SizeKey`, default `md`, via `squareSizeVariantFallthrough` (diameter) + `fontSizePassthroughVariant` (initials).
- **Variants/colors:** `filled`/`light`/`outline`/`transparent`/`default`/`white`/`gradient`, default `light`. Uses variant-colors (`surfaceColorVariant` fill, `controlTextColorVariant` initials); base `borderWidth:0`, `outline`/`default` re-add border. Accent from `theme` prop.
- **Slots / `styles` keys:** `root`, `image`, `text`.
- **Platform:** shared.
- **Builds on:** `Box`, `Text`, `Image`, `Theme` (autoColor wrap), `useGradient`, `createStyledContext` (`AvatarGroupContext`).
- **Gotchas:** Load-error state resets on `src` change (`useEffect`). `Avatar.Group` provides overlap (negative left margin) + `$background` ring via context; group frame pads left by `spacing` to cancel the first child's negative margin. `autoColor` wraps in a name-hashed `<Theme>`.

### BackgroundImage

- **Purpose:** Renders content over a cover-positioned image layered behind it (cross-platform, real `Image` not CSS bg).
- **Source:** packages/components/src/BackgroundImage/
- **Public API:** `BackgroundImage` (single styleable component).
- **Key props:** `src: string` (required), `fit?: ImageProps["fit"]` (object-fit, default cover), `objectPosition?` (honored web + native), `resizeMode?: BackgroundImageResizeMode` (**deprecated** except `"repeat"`), `imageProps?: Partial<ImageProps>` (alias for `styles.image`), `radius?`, `shadow?`.
- **Sizes:** No size scale (sized via inherited Box width/height/padding).
- **Variants/colors:** Only `radius` + `shadow` variants. No color system.
- **Slots / `styles` keys:** `root` (the frame Box), `image` (the layered backing `<Image>`).
- **Platform:** shared, with a web-only branch: `resizeMode="repeat"` (no object-fit/expo-image equivalent) uses a web `background-image` tile Box (gated by `isWeb`).
- **Builds on:** `Box`, `Image`, `radiusVariant`, `shadowVariant`.
- **Gotchas:** Backing image/tile is `zIndex:-1` (frame sets `zIndex:0` to establish a stacking context) so positioned image paints BEHIND non-positioned in-flow children on web (CSS paint order) — without it overlay text would be hidden. Engine-owned props (src/fit/objectPosition/resizeMode/positioning) always win over `imageProps`/`styles.image`.

### Badge

- **Purpose:** Compact status/label pill with optional left/right sections and a dot variant.
- **Source:** packages/components/src/Badge/
- **Public API:** `Badge` + `Badge.Text`, `Badge.Dot`, `Badge.Frame`.
- **Key props:** `leftSection?: ReactNode`, `rightSection?: ReactNode` (content slots, not style slots), `circle?: boolean` (square-aspect for a single glyph), `fullWidth?: boolean`, `gradient?: GradientValue`, `radius?` (pill/999 by default).
- **Sizes:** Yes — `size?: SizeKey | number`, default `md`. Frame gap from `controlGapVariant`; label font from `controlFontVariant` (numeric size → `max(10, round(val*0.5))`); dot uses an intentionally non-1:1 smaller ladder.
- **Variants/colors:** `filled`/`light`/`outline`/`dot`/`transparent`/`white`/`default`/`gradient`, default `light`. Uses variant-colors (`surfaceColorVariant` fill, `controlTextColorVariant` label); `dot` replaces `subtle` for the pill family. Accent from `theme` prop.
- **Slots / `styles` keys:** `root`, `text`, `dot`. (`leftSection`/`rightSection` stay content props, not style slots.)
- **Platform:** shared.
- **Builds on:** `Box`, `Text`, `ControlIconProvider` (section icons auto-match label color/size), `useGradient`, `renderTextChild`, `createStyledContext`.
- **Gotchas:** Label text is uppercase, `numberOfLines:1`. `dot` variant renders `BadgeDot` in place of a left section. `text` slot props are injected into the `renderTextChild` auto-wrapper via a memoized `BadgeLabel` closure so the slot reaches auto-wrapped string children.

### Blockquote

- **Purpose:** Quotation block with an accent left border, tinted surface, optional corner icon badge, and cite.
- **Source:** packages/components/src/Blockquote/
- **Public API:** `Blockquote` + `Blockquote.Frame`, `Blockquote.Icon`, `Blockquote.Text`, `Blockquote.Cite`.
- **Key props:** `icon?: ReactNode` (floated badge, top-left), `iconSize?: SizeKey | number` (default `"xl"`), `cite?: ReactNode` (attribution beneath), `radius?` (rounds only inline-END corners via `endRadiusVariant`; bordered edge stays square).
- **Sizes:** Yes — `size?: SizeKey`, default `md`. Bespoke per-size padding (vertical one step below horizontal), body font from `fontSizeVariant`, cite marginTop/fontSize ladder.
- **Variants/colors:** No variant prop. Uses raw ramp tokens (`$color9` left border, `$color2` surface, `$color11`/`$background` icon badge); recolor via `theme` prop.
- **Slots / `styles` keys:** `icon`, `text`, `cite`. (Root frame reached via top-level props — no `root` slot.)
- **Platform:** shared. Renders host `<blockquote>` (and cite as `<cite>`) via `render`.
- **Builds on:** `Box`, `Text`, `renderTextChild`, `useSlotTextWrapper` (pre-binds `text` slot props onto `BlockquoteText`), `getTokenValue`, `createStyledContext`.
- **Gotchas:** Icon badge offset = `-iconSize/2` (via `resolveIconOffset`, token or px) with `x`/`y` translate so it straddles the top-left corner; the component's controlled geometry wins over `icon` slot sugar. String `cite` wraps in `BlockquoteCite`, non-string cite renders as-is.
