## Batch 4

Components: Grid, Group, Highlight, HoverCard, Image, Indicator, Input, InputBase, Kbd, KeyboardAvoidingView, KeyboardAwareScrollView, List

### Grid

- **Purpose:** 12-column flex-wrap grid mirroring Mantine's `Grid` + `Grid.Col`.
- **Source:** packages/components/src/Grid/
- **Public API:** `Grid` (withStaticProperties) → `Grid.Col`, `Grid.Frame`.
- **Key props:** Grid — `columns?: number` (@default 12), `gutter?: GridGutter` (space key `xxs`–`xxl` | `$space` token | px number, @default `"md"`), `grow?: boolean` (@default false). Grid.Col — `span?: GridColSpan` (number | `"auto"` | `"content"`, @default 12), `offset?: number`, `order?: number` (web-only flex, spread as precise obj), `align?: BoxProps["alignSelf"]`.
- **Sizes:** No control-size scale. `gutter` resolves against the space token scale via `getTokenValue(..., "space")`.
- **Variants/colors:** Frame has `align`/`justify`/`overflow` variants (from `internal/style-props`). No variant-colors; accent theme-driven.
- **Slots / `styles` keys:** None (no `styles` prop). Composed via `Grid.Col` children.
- **Platform:** Shared. `order`/`listStyleType`-style web-only props spread as precise objects so native ignores them.
- **Builds on:** Box; `alignVariant`/`justifyVariant`/`overflowVariant`. Uses `createStyledContext` (GridContext carries `columns`/`gutter`/`grow` to each Col).
- **Gotchas:** Responsive per-breakpoint object `span`/`offset`/`order` (`{ base, sm, lg }`) is DEFERRED BY DESIGN — no cross-platform breakpoint primitive in core; single values only. Gutter implemented as Mantine's negative-margin track (`margin={-g/2}` on frame) + per-col `padding: gutter/2` (border-box). Col width carried by `flexBasis` %, with `maxWidth` cap unless `grow`.

### Group

- **Purpose:** Horizontal flex group mirroring Mantine's `Group`.
- **Source:** packages/components/src/Group/
- **Public API:** `Group` (single component, `GroupFrame.styleable`).
- **Key props:** `grow?: boolean` (each child fills the row equally, @default false), `preventGrowOverflow?: boolean` (@default true — caps each grown child to `100/n%`). Frame variants: `align`/`justify`/`wrap` (Mantine names). `gap` defaults `$md`.
- **Sizes:** No control-size scale.
- **Variants/colors:** `align`/`justify`/`wrap` variants; `defaultVariants: { align: "center", justify: "flex-start", wrap: "wrap" }`. No variant-colors.
- **Slots / `styles` keys:** None.
- **Platform:** Shared, but `grow` routes child sizing three different ways (`withGrowStyle`): Tamagui children get it as **props** (through their variant/atomic-CSS pipeline), web DOM host elements get a plain `style` object, raw RN host components get a `style` array. Detection via `staticConfig` presence (Tamagui) and `typeof child.type === "string"` (web host).
- **Builds on:** Box; `alignVariant`/`justifyVariant`/`wrapVariant`.
- **Gotchas:** `grow` clones children via `React.Children.toArray().filter(Boolean)` and re-keys them; a wide single child can't push others out because `preventGrowOverflow` caps `maxWidth`. `GroupProps` Omits `grow` from the frame prop type before re-adding its own.

### Highlight

- **Purpose:** Renders text with matched substrings wrapped in `Mark` — mirrors Mantine's `Highlight`.
- **Source:** packages/components/src/Highlight/
- **Public API:** `Highlight` (single component, `Text.styleable`).
- **Key props:** `children: string` (required; non-string bypasses highlighting), `highlight: string | string[]`, `caseInsensitive?: boolean` (@default true), `wholeWord?: boolean` (@default false), `accentInsensitive?: boolean` (@default false, strips diacritics via NFD). Inherits full `Text` surface (`size`, `fw`, `c`, …).
- **Sizes:** Inherits `Text` size (font scale), no control metrics.
- **Variants/colors:** Highlight tint comes from `Mark` (theme ramp); recolor via `styles={{ mark: { theme: "yellow" } }}` or the legacy per-term map.
- **Slots / `styles` keys:** `mark` — props spread onto every generated `<Mark>`. (Can't expose a `Highlight.Mark` static since marks are generated per chunk at runtime.)
- **Platform:** Shared.
- **Builds on:** Text, Mark; `slotStyles`/`SlotStyles`.
- **Gotchas:** `highlightStyles` prop is DEPRECATED but retained: single `MarkProps` object (all matches) OR `Record<term, MarkProps>` (per-term, the documented exception with no `styles` equivalent). Precedence low→high: `styles.mark` < `highlightStyles` single-object < per-term entry. Matcher tries terms longest-first per position to resolve overlaps; empty/whitespace terms ignored.

### HoverCard

- **Purpose:** Hover-intent open/close card — delegates positioning/overlay/arrow/dropdown chrome entirely to `Popover`.
- **Source:** packages/components/src/HoverCard/
- **Public API:** `HoverCard` (withStaticProperties) → `HoverCard.Target`, `HoverCard.Dropdown`, `HoverCard.Arrow` (= FloatingArrow).
- **Key props:** `openDelay?` (@default 0), `closeDelay?` (@default 150), `initiallyOpened?`, `position?: Placement` (@default `"bottom"`), `offset?: FloatingOffset` (@default 8), `width?: "target" | "max-content" | number` (@default `"max-content"`), `withinPortal?` (@default true), `keepMounted?`, `zIndex?` (@default 300), `shadow?` (@default `"md"`), `withOverlay?`, `withArrow?`/`arrowSize`/`arrowOffset`/`arrowRadius`/`arrowPosition`, `transitionProps?: OverlayTransitionConfig`, `animation?: MotionPresetName`, `onOpen`/`onClose`/`onPositionChange`.
- **Sizes:** No control-size scale (overlay chrome).
- **Variants/colors:** Dropdown frame has `hidden`/`shadow` variants. Theme-driven.
- **Slots / `styles` keys:** `target` (cloned onto target child, HoverCard-owned), `overlay`, `dropdown`, `arrow`. The canonical `overlay`/`dropdown`/`arrow` are forwarded wholesale to Popover's own `styles`; only `target` resolved here. Resolved via `useOverlayChrome`.
- **Platform:** Shared. Dropdown frame uses `position: isWeb ? "fixed" : "absolute"`. Hover-intent handlers split web (`onMouseEnter`/`onMouseLeave`) vs native (`onHoverIn`/`onHoverOut`).
- **Builds on:** Popover (Target/Dropdown), Box, FloatingArrow, Overlay; `floating` engine.
- **Gotchas:** Hover-driven, not value-controlled — drives Popover as a controlled popover from internal timer state. `Popover.Target` used with `withPressToggle={false}` (positioning ref only). Passes `closeOnClickOutside={false}` + `closeOnEscape={false}` to Popover or the native scrim would swallow the hover and self-dismiss. Compound sub-components throw if rendered outside `<HoverCard>`.

### Image

- **Purpose:** Cross-platform image backed by expo-image on web+iOS+Android; Mantine-compatible API over expo-image's surface.
- **Source:** packages/components/src/Image/ (`Image.tsx`, `createImage.tsx`, `shared.ts`, `types.ts`)
- **Public API:** `Image = createImage({ Component: ExpoImage, ... })` (withStaticProperties) → `Image.Root`, `Image.Image`, `Image.Fallback`, `Image.Placeholder`, `Image.Overlay`, plus forwarded expo-image statics (`prefetch`, `clearMemoryCache`, `clearDiskCache`, `getCachePathAsync`, `generateBlurhashAsync`, `loadAsync`). Factory `createImage` exported for reuse.
- **Key props:** `src?: ImageSrc` (string | require number | source obj; preferred over deprecated `source`), `fit?: ImageObjectFit` (→ `contentFit`, @default `"cover"`; aliases `objectFit`, deprecated `resizeMode`), `objectPosition?` (→ `contentPosition`), `radius?: string | number`, `fallbackSrc?: string`, normalized `onLoad`/`onError` (RN-shape events). Plus forwarded expo props (`transition`, `placeholder`, `cachePolicy`, `tintColor`, `blurRadius`, `priority`, `recyclingKey`, …) and Tamagui `ViewProps` styling (`w`/`h`/`bg`/`$token`s).
- **Sizes:** No control scale; sized via style props. `radius` resolves against the radius token scale (`resolveRadiusValue`).
- **Variants/colors:** No variant/variant-colors (media element).
- **Slots / `styles` keys:** `root`, `image`, `fallback`, `placeholder`, `overlay`. Legacy `fallbackProps` = same target as `image` slot. Engine props win over slot sugar.
- **Platform:** Shared — NO `.native` split; expo-image ships platform builds (`<img>` on web, native views on device).
- **Builds on:** expo-image (`Image as ExpoImage`), RN `View`; `slotStyles`. `Image.Root` owns shared fallback/load state via context; parts (`Fallback`/`Placeholder`/`Overlay`) layer absolutely over the image and read that state.
- **Gotchas:** `ForwardedExpoProps` is `Pick`ed from expo-image's own `ImageProps` so the surface tracks the installed version (adding a dropped key is a compile error). Bare `<Image.Image>` (no Root) self-manages its own `fallbackSrc` swap. `ViewProps` `transition` is Omitted (collides with expo `transition`).

### Indicator

- **Purpose:** Overlays a small dot / label badge on a corner/edge of its children — mirrors Mantine's `Indicator`.
- **Source:** packages/components/src/Indicator/
- **Public API:** `Indicator` (withStaticProperties) → `Indicator.Dot`, `Indicator.Frame`, `Indicator.Label`.
- **Key props:** `position?: IndicatorPosition` (9-way `top-start`…`bottom-end`, @default `"top-end"`), `offset?: IndicatorOffset | {x,y}` (space token or px, @default 0), `size?: IndicatorSize | number` (@default `"xxs"`), `radius?`, `label?: ReactNode` (turns dot into pill), `withBorder?` (adds `$background` ring), `disabled?` (hidden, children still render), `processing?` (opacity pulse + scale-in entrance, @default false), `maxValue?` (`{n}+`), `showZero?` (@default true), `zIndex?` (@default 1), `inline?`.
- **Sizes:** Dot square sized via `squareSizeVariantFallthrough` off the size scale; numeric size resolves via `getTokenValue(..., "size")`.
- **Variants/colors:** Accent from `theme` prop + palette ramp (`$color9` fill, `$color1` contrast text, `$background` border ring). No Mantine `color` prop; `autoContrast` accepted but no-op (ramp already contrasts).
- **Slots / `styles` keys:** `root`, `dot`, `label`. Slot sugar spreads UNDER engine-computed state (explicit beats sugar).
- **Platform:** Shared. Processing pulse rides `asLoopHost(Box)` (reanimated host on native, identity on web).
- **Builds on:** Box, Text; `useLoopingAnimation` + `asLoopHost`, `useMotionPreset`, `radiusVariant`/`squareSizeVariantFallthrough`, `slotStyles`.
- **Gotchas:** The pulse (looping opacity) MUST live on its own `IndicatorAnchor` node, separate from the dot's Tamagui `entrance` (scale-in) driver — driving both reanimated systems on one node throws `Invalid value passed to shareableViewDescriptors`. Anchor owns absolute corner placement; dot sits `position: relative` in the anchor's flow. Dot pokes out `OVERLAP_PX` (2px) past the anchored edge, not centered on the corner (avoids web-only `%` transforms). Labelled dot forces `width: auto` so the pill grows past the fixed square.

### Input

- **Purpose:** Foundational cross-platform text-input primitive; the field chrome (border, sections, states) lives in `InputChrome`, the host control stays visually bare.
- **Source:** packages/components/src/Input/ (`Input.tsx` = web, `Input.native.tsx` = native, `shared.tsx`, `types.ts`, `InputNativeProps.ts`, `useAutosize.ts`)
- **Public API:** `Input` (withStaticProperties) → `Input.Wrapper`, `Input.Chrome`, `Input.Label`, `Input.Error`, `Input.Description`, `Input.Placeholder`, `Input.ClearButton`.
- **Key props:** `variant?: "default" | "filled" | "unstyled"` (@default `"default"`), `size?: InputSize` (token or number), `radius?`, `error?: ReactNode` (→ red border + `aria-invalid`), `disabled`/`readOnly`/`required`, `leftSection`/`rightSection` (+ `*Width`/`*Props`/`*PointerEvents`, @default `"none"`), `loading?`/`loadingPosition?` (@default `"right"`), `pointer?`, `unstyled?` (strips host chrome for composite inputs), `multiline`/`rows`/`autosize`/`minRows`/`maxRows`, `component?: InputHostTag` (web: `"input"|"textarea"|"select"|"button"` — used by NativeSelect/FileInput), plus unified callback surface (`onChangeText`, `onChange`, `onInput`, `onKeyDown`, `onSubmitEditing`, `onSelectionChange`; native adds `onEndEditing`/`onContentSizeChange`/`onScroll`/`onKeyPress`). Internal `__clearSection`/`__clearable`/`__clearSectionMode`/`__defaultRightSection` power Clearable inputs.
- **Sizes:** Uses the canonical `controlMetrics` table (`M[key].height` for section width, `M[key].fontSize` for host font + native line-height math). `InputSize = InputTokenSize | (string & {})`. Default `"md"`.
- **Variants/colors:** Root frame (`InputRootFrame`) variants: `size`/`radius`/`variant` (`default`/`filled: bg $color2`/`unstyled: no border, transparent`) + state variants `focused` (`$borderColorFocus`), `error` (`$red9` border), `disabled` (opacity 0.6, pointerEvents none), `pointer`, `multiline`. Not variant-colors; theme-ramp driven. **Error token = `$red9`** (raw palette token on every theme via base theme `extra`, so error border stays red under any accent theme without a hardcoded hex and without theming the frame).
- **Slots / `styles` keys:** Full `InputWrapperSlots`: `wrapper`, `label`, `description`, `error`, `required`, `root`, `leftSection`, `rightSection`. Chrome slots (`root`/`leftSection`/`rightSection`) consumed by `InputChrome`; field-chrome slots (`wrapper`/`label`/`description`/`error`/`required`) by `Input.Wrapper`. Deprecated aliases (`wrapperProps`/`leftSectionProps`/`rightSectionProps`) merge OVER their slot.
- **Platform:** `.native` split. **Web** (`Input.tsx`): `styled(Box, ...)` renders `<input>`/`<textarea>`/`<select>`/`<button>` host; placeholder/selection colors injected as CSS custom props (`--t_placeholderColor`/`--t_selectionColor`) resolved from theme. **Native** (`Input.native.tsx`): host is `styled(TextInput, styledBody)` rendered directly (Tamagui's own Input pattern). Native resolves styles through Tamagui's `styled()` internals (usePropsAndStyle-style — size/unstyled variants, tokens, the `accept` color mapping) onto the bare RN `TextInput`; underlying TextInput identity stays stable across renders (controlled-input safe).
- **Builds on:** Box, Text, `InputChrome`/`InputWrapper` (shared.tsx); `controlMetrics`, `registerFocusable`/`registerInputFocusable`, `useWebRef` (web) / `useNativeInputRef` + `useCallbackRef` (native), `useTextareaAutosize` (web).
- **Gotchas:** Host always renders `unstyled` — so `defaultStyles.color`/`fontFamily` (in the never-run `unstyled:{false}` branch) don't apply; both are set directly on `styledBody` host config (web `<input>` doesn't inherit color, native TextInput doesn't inherit color from ancestors). Consumer `color` still wins (set before `{...rest}`). Native multiline height is controlled ONLY via `minHeight`/`maxHeight` (never explicit `height`) — driving `height` from `onContentSizeChange` collapses/oscillates on Android; also DON'T derive `numberOfLines` from rows (Android `setLines()` fights style height). Native uses border-box, so vertical padding is added back into minRows/maxRows pixel math (`getTextareaPaddingVertical * 2`). Native `includeFontPadding={false}` normalizes iOS/Android vertical inset. Native `autoCorrect`/`autoCapitalize` string↔native value normalization; web ↔ native `type` → keyboard/inputMode mapping (memoized). Press-trigger mode: a `readOnly` non-disabled field with `onPress` routes the press to the root frame (a plain View) with host `pointerEvents="none"` — Android `editable=false` demotes the TextInput to `box-none` so it can never be the touch target. Every native handler wrapped in `useCallbackRef` (stable identity, latest closure) so the controlled TextInput keeps the same listener props across keystrokes.

### InputBase

- **Purpose:** Convenience wrapper composing `Input.Wrapper` + `Input` into one flat prop surface (label/description/error alongside the field).
- **Source:** packages/components/src/InputBase/
- **Public API:** `InputBase` (single component, `Input.styleable`).
- **Key props:** Wrapper props flattened — `label`, `description`, `error`, `required`, `withAsterisk`, `labelProps`/`descriptionProps`/`errorProps`, `inputContainer`, `inputWrapperOrder`, `labelElement`, plus a `wrapperProps` escape hatch — merged with the full `InputProps` surface. `size` (@default `"md"`).
- **Sizes:** Inherits Input's `controlMetrics` sizing; forwards `size` to both Wrapper and Input.
- **Variants/colors:** Inherits Input (`variant`, `$red9` error). No own variants.
- **Slots / `styles` keys:** Forwards `styles: SlotStyles<InputWrapperSlots>` to BOTH `Input.Wrapper` and `Input` — each applies only the slots it owns (safe).
- **Platform:** Shared (delegates to Input's `.native` split).
- **Builds on:** Input, Input.Wrapper.
- **Gotchas:** Splits its props: wrapper-facing keys go to `Input.Wrapper`, everything else (`others`) to `Input`. `id`/`size`/`error`/`required`/`styles` passed to BOTH so aria wiring + error styling stay in sync.

### Kbd

- **Purpose:** Monospace keycap mirroring Mantine's `Kbd` — bold mono text on a tinted surface with a thick bottom border (pressed-key look).
- **Source:** packages/components/src/Kbd/
- **Public API:** `Kbd` (single component, `KbdFrame.styleable`).
- **Key props:** `size?: KbdSize` (= `SizeKey`, @default `"sm"`). Otherwise the `Text` surface.
- **Sizes:** `kbdSizeVariant` scales font, padding (so HEIGHT grows), and corner radius together off canonical control metrics. Default `"sm"`.
- **Variants/colors:** Color from theme ramp (`$color2` surface, `$color6` border, `$color12` text) so `theme="..."` recolors. No Mantine `color` prop. No variant-colors.
- **Slots / `styles` keys:** None.
- **Platform:** Shared. Renders semantic `<kbd>` on web via `render="kbd"`.
- **Builds on:** Text; `kbdSizeVariant`.
- **Gotchas:** none noted.

### KeyboardAvoidingView

- **Purpose:** Form primitive that lifts content above the soft keyboard on native; no-op pass-through on web.
- **Source:** packages/components/src/KeyboardAvoidingView/ (`.tsx` = web, `.native.tsx`)
- **Public API:** `KeyboardAvoidingView` (forwardRef).
- **Key props:** `behavior?: "height" | "padding" | "position" | "translate-with-padding"` (native @default `"padding"`), `keyboardVerticalOffset?`, `automaticOffset?` (RNKC parity, ignored), `enabled?`, `contentContainerStyle?`. Plus BoxProps / RN `KeyboardAvoidingView` style props.
- **Sizes:** None. `flex: 1` default (full-height form region).
- **Variants/colors:** None.
- **Slots / `styles` keys:** None.
- **Platform:** `.native` split. **Native:** `styled(RNKeyboardAvoidingView, { flex: 1 })`, renders with `behavior="padding"` default (overridable). **Web:** plain pass-through `Box flex={1}` — browsers reflow for their own on-screen keyboard; native-only props are accepted for a single cross-platform API but STRIPPED so they never leak onto the DOM node.
- **Builds on:** Box (web), RN `KeyboardAvoidingView` (native).
- **Gotchas:** `automaticOffset` was a `react-native-keyboard-controller` prop; RN's built-in has no equivalent, so it's accepted and ignored.

### KeyboardAwareScrollView

- **Purpose:** Scrollable form region that keeps content clear of the soft keyboard on native; plain scrollable Box on web.
- **Source:** packages/components/src/KeyboardAwareScrollView/ (`.tsx` = web, `.native.tsx`)
- **Public API:** `KeyboardAwareScrollView` (forwardRef).
- **Key props:** `bottomOffset?`, `extraKeyboardSpace?` (added to Android bottom padding — the one honored tuning prop), `disableScrollOnKeyboardHide?`, `enabled?`, `mode?`, `ScrollViewComponent?`, `keyboardShouldPersistTaps?` (native @default `"handled"`), `contentContainerStyle?`. Plus ScrollView / BoxProps.
- **Sizes:** None. `flex: 1` default.
- **Variants/colors:** None.
- **Slots / `styles` keys:** None.
- **Platform:** `.native` split. **Native:** `styled(ScrollView, { flex: 1 })` — iOS uses `automaticallyAdjustKeyboardInsets` (auto-insets + scrolls focused field into view); Android has no such inset so keyboard height (via `useKeyboardHeight` from @knitui/hooks) + `extraKeyboardSpace` is added as bottom content padding. **Web:** plain scrollable `Box` (overflow via `style` since `overflowX/Y` aren't Tamagui prop-level keys); `contentContainerStyle` applied to an inner wrapper Box; native-only props stripped from DOM.
- **Builds on:** Box (web), RN `ScrollView` + `useKeyboardHeight` (native).
- **Gotchas:** Unlike react-native-keyboard-controller, does NOT auto-scroll the focused input into view on Android — the keyboard-height padding just lets the user scroll to it. Most RNKC tuning props are accepted for parity but not honored (only `extraKeyboardSpace`).

### List

- **Purpose:** Vertical list mirroring Mantine's `List` + `List.Item`; explicit markers so bullets/numbers show on web AND native.
- **Source:** packages/components/src/List/
- **Public API:** `List` (withStaticProperties) → `List.Item` (itself withStaticProperties → `List.Item.Marker`, `List.Item.Label`), `List.Frame`.
- **Key props:** List — `type?: "ordered" | "unordered"` (@default `"unordered"`; switches `<ol>`/`<ul>` + default marker), `size?: ListSize` (@default `"md"`), `icon?` (marker for every item), `renderMarker?: (order: number) => ReactNode`, `center?` (@default false), `start?` (@default 1), `reversed?` (@default false), `spacing` (gap variant), `withPadding` (nesting indent), `listStyleType?` (web cosmetic). List.Item — `icon?: ReactNode` (per-item marker override; string/number → themed marker text, node → as-is), `styles?`.
- **Sizes:** `size` scales item marker + label font via `fontSizeVariant`. Default `"md"`. No control metrics.
- **Variants/colors:** Frame variants `spacing`/`withPadding`; item `center`. Markers tint from ramp (`$color`); color inherited. No Mantine `color` prop, no variant-colors.
- **Slots / `styles` keys:** On `List.Item`: `marker` (only when marker is text), `label`. Item frame reached via top-level props (no slot). List itself has no `styles`.
- **Platform:** Shared. Renders `<ul>`/`<ol>` (List) and `<li>` (Item) on web via `render`; markers rendered explicitly since Tamagui renders the list as a flex container (browser's own markers never double up).
- **Builds on:** Box, Text; `createStyledContext` (ListContext carries `size`/`center`), `fontSizeVariant`/`gapVariant`, `renderTextChild`, `slotStyles`.
- **Gotchas:** `List` injects each item's default marker via the item's PUBLIC `icon` prop (an item's own `icon` wins; a list-level `icon` replaces all). Ordered numbering computed with `start`/`reversed` and passed to `renderMarker`. `listStyleType` is web-only + cosmetic (markers already explicit), no-op on native — spread as precise object to dodge the excess-property check.
