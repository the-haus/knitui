## Batch 7

Kit conventions confirmed by reading source: components are `styled(Box)`/`styled(Text)` parts wrapped with `.styleable()` (or `React.forwardRef`) and assembled with `withStaticProperties`. Per-slot `styles` prop is "Pillar B" sugar (`slotStyles`/`SlotStyles` from `internal/styles`), always LOWEST precedence (spread under explicit props). Accent color always comes from the theme palette ramp (`$color9`, etc.) via the `theme` prop — never a Mantine-style `color` prop. Size scales come from `internal/style-props` (`SizeKey` = `xxs`–`xxl`) and `internal/control-metrics`.

### Radio

- **Purpose:** Single-select radio control with label chrome, plus group/indicator/card variants.
- **Source:** packages/components/src/Radio/ (`Radio.tsx`, `RadioIcon.tsx`)
- **Public API:** `Radio` (+ `Radio.Group`, `Radio.Indicator`, `Radio.Card`). Types: `RadioProps`, `RadioGroupProps`, `RadioIndicatorProps`, `RadioCardProps`, `RadioStyles`, `RadioVariant`, `RadioSize`, `RadioIconComponent`.
- **Key props:** `variant?: "filled" | "outline"`; `checked`/`defaultChecked`/`onChange(checked)`; `value?: string` (matches surrounding `Radio.Group`); `label`/`description`/`error`/`labelPosition` (from InlineControl); `icon?: RadioIconComponent` (default `RadioIcon`, a filled dot); `iconColor`. `Radio.Group`: `value`/`defaultValue`/`onChange(value)`, `readOnly`, `name`, group-level `size`/`disabled`.
- **Sizes:** `SizeKey` via `squareSizeVariant`; default `md`. Child size falls through group `size`.
- **Variants/colors:** `filled` (checked = `$color9` bg + `$color1` dot) / `outline` (checked = transparent bg, `$color9` border+dot); no variant-colors table. Error state wraps circle in `<Theme name="red">`.
- **Slots / `styles` keys:** inherits InlineControl chrome slots (`root`/`label`/`description`/`error`) plus own `circle` (round box), `dot`, `icon` (`icon` is an alias of `dot`; both spread onto the same glyph).
- **Platform:** shared. Glyph is a `Box` (not SVG) so it works web+native with no react-native-svg dep (same as CheckboxIcon).
- **Builds on:** Box, InlineControl, Text, RadioIcon; hooks `useUncontrolled`, `useKeyboardActions`, `useId`.
- **Gotchas:** Two React contexts — `RadioGroupContext` (group value/size/disabled) and `RadioCardContext` (checked, read by `Radio.Indicator` when no explicit `checked`). Toggle is one-way (checked radio can't uncheck itself; group handles switching). `RadioIcon` default `scale={0.5}` and `size="xs"`.

### Rating

- **Purpose:** Star (symbol) rating with hover preview, fractional fill, read-only/clearable modes.
- **Source:** packages/components/src/Rating/
- **Public API:** `Rating` (+ `Rating.Root`, `Rating.Symbol`, `Rating.Glyph`, `Rating.Segment`). Types: `RatingProps`, `RatingStyles`, `RatingSize`.
- **Key props:** `count=5`; `fractions=1` (sub-divisions per symbol, 2 = half-stars); `value`/`defaultValue`/`onChange`; `readOnly`; `allowClear=true` (re-click clears to 0); `highlightSelectedOnly=false`; `emptySymbol`/`fullSymbol` (node or `(value)=>node`); `getSymbolLabel`; `onHover(value)` (`-1` on leave); `name`/`form` (hidden input).
- **Sizes:** `size?: SizeKey | number` default `sm`. Resolved to ONE px via `resolveSizePx(size)` driving BOTH the square symbol frame and glyph `fontSize` (previously used two scales and misaligned — see comment). Row gap is a size variant.
- **Variants/colors:** none; empty glyph `$color6`, full glyph `$color9`.
- **Slots / `styles` keys:** `root`, `symbol` (each symbol frame), `segment` (each interactive sub-segment overlay).
- **Platform:** shared. Fractional fill = width-clipped "full" symbol overlaid on "empty" one (no SVG). Hover uses web pointer events; native selects by pressing a segment.
- **Builds on:** Box, Text, HiddenInput; `useUncontrolled`, `useKeyboardActions`; `createStyledContext` for size. `clamp` from number-utils.
- **Gotchas:** Each symbol splits into `fractions` invisible `Rating.Segment` overlays (role="radio") for hit-testing. `roundValueTo` fixes float drift for fractional steps. Root role is `radiogroup`.

### RollingNumber

- **Purpose:** Animated number whose digits roll (odometer-style) between values.
- **Source:** packages/components/src/RollingNumber/ (`RollingNumber.tsx`, `rolling-number-utils.ts`)
- **Public API:** `RollingNumber` (+ `.Root`, `.DigitViewport`, `.DigitStrip`, `.DigitText`). Types: `RollingNumberProps`, `RollingNumberStyles`, `RollingNumberFontSize`; re-exports `CharSlot`/`DigitParts`/`DigitSlot`/`RenderSlot`.
- **Key props:** `value: number`; `prefix`/`suffix`; `decimalSeparator="."`; `thousandSeparator` (`true`→`,`); `decimalScale`/`fixedDecimalScale`; `animationDuration=DURATIONS.ambient` (600ms); `tabularNumbers=true` (uses `$mono`); `withLiveRegion=false` (`role=status`+`aria-live=polite`, else `role=img`); `fontSize?: RollingNumberFontSize | number` default `"xxl"`.
- **Sizes:** not the control size scale — `fontSize` maps to the fontSize token scale (`xxs`–`xxl`) or a custom px. `resolveFontSize` returns `{token, px}`; `digitHeight = round(px*1.25)`.
- **Variants/colors:** none.
- **Slots / `styles` keys:** `digitViewport`, `digitStrip`, `digitText` (threaded into the private digit columns).
- **Platform:** shared. Each digit is a 0–9 strip translated by `y` in PX (not `em`) so it works on native, animated via the `transition` driver.
- **Builds on:** Box, Text; `useReducedMotion` (reduced motion → duration 0, snaps). Formatting/render-slot logic lives in pure `rolling-number-utils.ts` (`getDigitParts`/`getRenderSlots`/`buildValue`).
- **Gotchas:** `styles` slot sugar spreads UNDER component-owned geometry/transition props. Previous value tracked in a ref updated in an effect to drive the roll. Non-digit chars render statically as `Text`.

### ScrollArea

- **Purpose:** Scrollable viewport with fully-themeable CUSTOM overlay scrollbars (native browser scrollbar hidden), behaving identically web+native. Rich feature set beyond Mantine.
- **Source:** packages/components/src/ScrollArea/ (`ScrollArea.tsx` = web, `ScrollArea.native.tsx`, `ScrollArea.shared.ts`)
- **Public API:** `ScrollArea` (+ `.Autosize`, `.Viewport`, `.Scrollbar`, `.Thumb`, `.Corner`). Ref/`handleRef` is a `ScrollAreaHandle` (`scrollTo`/`scrollToTop`/`scrollToBottom`/`scrollToEnd`/`scrollIntoView`/`getViewport`/`getScrollPosition`). Types in shared: `ScrollAreaHandle`, `ScrollAreaScrollbars`, `ScrollAreaType`, `Edge`/`EdgeState`, `ScrollPosition`, `ScrollTo/IntoViewOptions`, `ScrollAreaStyles`.
- **Key props (`ScrollAreaOwnProps`):** `scrollbars="xy"` (`x`/`y`/`xy`/`false`); `type="hover"` (`hover`/`auto`/`always`/`scroll`/`never`); `scrollbarSize=12`; `idleScrollbarSize=6` (hover-grow); `offsetScrollbars`; `scrollHideDelay=1000`; `shadows`/`shadowSize=32`/`shadowColor`/`renderShadow` (edge fades); reach callbacks `onReachTop/Bottom/Start/End`+`reachThreshold`; `onScrollEnd`+`onScrollPositionChange`; `stickToBottom`+`stickToBottomThreshold=24`; `trackClickBehavior="jump"|"page"`; `keyboardScrolling=true`+`keyStep=40` (web only); `keyboardShouldPersistTaps` (native only); `viewportRef`/`viewportProps`/`scrollbarProps`/`thumbProps`/`cornerProps`.
- **Sizes:** no control size scale; `scrollbarSize`/`idleScrollbarSize` are raw px.
- **Variants/colors:** thumb `$color8` (opacity 0.7→1 on hover/press); rail transparent.
- **Slots / `styles` keys:** `viewport`, `scrollbar`, `thumb`, `corner` (sugar under the discrete `*Props`, layered after).
- **Platform:** `.web` (`ScrollArea.tsx`) + `.native.tsx` split over a shared pure-helper/types module (`ScrollArea.shared.ts`: `getThumbGeometry`, `scrollFromThumbPosition`, `getEdgeState`, `getReachedEdges`, `pageScrollTarget`, `keyToScrollDelta`, `resolveAxes`, constants). Split needed because the scroll engines are fundamentally different per platform.
- **Builds on:** Box, `useMove` (rail drag, attaches pointer listener once — rails stay mounted, toggled via opacity/pointerEvents), `useReducedTransition`/`useReducedMotion`, `useDebouncedCallback`, `useMergedRef`.
- **Gotchas / architecture (IMPORTANT):**
  - **Scroll never re-renders React on either platform.** Live scroll offset is kept OUT of React state.
  - **Web:** native scrollbar hidden via an injected `::-webkit-scrollbar` stylesheet + `scrollbar-width:none` class (Tamagui can't express the pseudo-element). Thumb offset is written straight to the DOM (`el.style.transform`) in a rAF-coalesced `paintScrollbars`; a `useLayoutEffect` re-applies the inline transform after every commit (a render restyles the Tamagui thumb and would clobber it). `readNodeSize` (scrollWidth/clientWidth — layout-forcing) read only on mount/resize via ResizeObserver (guarded — absent in jsdom), never per frame. Size in state, scroll in refs.
  - **Native:** a single gesture-handler `Pan` + reanimated translate engine drives ALL 2D (`xy`) scrolling; offset lives in `scrollX`/`scrollY` shared values; each thumb is an `Animated.View` positioned by a `useAnimatedStyle` worklet (`thumbGeometryW`, a worklet twin of `getThumbGeometry`) reading the shared value on the UI thread — scrolling stays 100% on the UI thread. `withDecay` momentum on release (skipped under reduced motion). Single-axis (`x` or `y`) and `Autosize` instead use a native `Animated.ScrollView` (`nestedScrollEnabled` so it wins over an ancestor ScrollView, then hands off at the edge). Rationale: RN ScrollView pans only one axis (nesting collapses layout on Android) and loses nested drags on Android; the Pan claims the gesture past `PAN_ACTIVATE_THRESHOLD=8`.
  - JS callbacks (`onScroll*`/reach/stick) go through a GATED `runOnJS` (`needsJsScroll`) — when nothing consumes samples, no bridge crossing at all.
  - Edge shadows are opt-in; only then does a `shadowScroll` mirror update per frame. Web paints CSS `linear-gradient`; native degrades to a translucent scrim (opacity 0.12) unless `renderShadow` supplies a real gradient.
  - Keyboard scrolling is web-only (no-op on native). `scrollIntoView` selector-string form is a no-op on native. `shadowColor` is Omit-ed from frame props (collides with the RN shadow style prop). `Autosize` needs `mah`/`maxHeight` to constrain it. TODO(viewport-token-flatten): native raw-spreads `mergedViewportProps` onto RN ScrollView, silently dropping token style props.

### SegmentedControl

- **Purpose:** Single-select mutually-exclusive row/column with a sliding active indicator.
- **Source:** packages/components/src/SegmentedControl/
- **Public API:** `SegmentedControl` (+ `.Root`, `.Control`, `.Label`). Types: `SegmentedControlProps`, `SegmentedControlItem`, `SegmentedControlSlots`, `SegmentedControlOrientation`, `SegmentedControlSize`; `SEGMENTED_CONTROL_SLOTS`.
- **Key props:** `data: (string | {value,label,disabled})[]`; `value`/`defaultValue`/`onChange(value)`; `orientation="horizontal"`; `fullWidth=false`; `disabled`/`readOnly`; `withItemsBorders=true` (thin separators); `name` (hidden input); `transitionDuration=200`/`transitionTimingFunction="ease"` (indicator slide); `autoContrast` (no-op parity).
- **Sizes:** `SizeKey` default `md` (drives padding/radius via `controlVariant`/`controlFontVariant`, `INDICATOR_RADIUS` map).
- **Variants/colors:** track `$color3`; active label `$color12`, inactive `$color11`; indicator = raised `$background` with box-shadow. Also `radius`/`shadow` variants. No variant-colors table.
- **Slots / `styles` keys:** `root`, `control`, `label`.
- **Platform:** shared. Uses `onLayout` to measure each item, storing layouts in a ref keyed by value; active layout drives an absolutely-positioned floating indicator.
- **Builds on:** Box, Text, HiddenInput; `useUncontrolled`, `useReducedTransition`, `createStyledContext` (size+orientation).
- **Gotchas:** Indicator animates LAYOUT props (left/top/width/height via `animateOnlyProps`), NOT transform — deliberate: segments differ in size, so a scaleX slide would distort radius/shadow (see comment). Reduced motion → indicator snaps. Roving tabindex + full Arrow/Home/End/Space/Enter keyboard nav (web). Item separators are conditionally rendered `Box`es (hidden adjacent to the active item).

### Select

- **Purpose:** Single-select dropdown (fixed `Value = string`), built on Combobox + InputBase.
- **Source:** packages/components/src/Select/
- **Public API:** `Select` sugar wrapper + composable `Select.Root` / `.Trigger` / `.Dropdown` / `.Options`, plus re-exports `.Option`/`.Group`/`.Empty`/`.Chevron`/`.ClearButton` (from Combobox). Types: `SelectProps`, `SelectRootProps`, `SelectTriggerProps`, `SelectDropdownProps`, `SelectOptionsProps`, `SelectStyles`, `SelectRef`. (index.ts only re-exports `Select`/`SelectProps`/`SelectRef`.)
- **Key props:** `data: ComboboxData`; `value`/`defaultValue`/`onChange(value, option)`; `searchable=false`+`openOnFocus=true`; `searchValue`/`defaultSearchValue`/`onSearchChange`; `selectFirstOptionOnChange`; `autoSelectOnBlur`; `allowDeselect=true`; `clearable=false`+`clearSectionMode="both"`; `withCheckIcon=true`+`checkIconPosition="left"`; `nothingFoundMessage`; `limit`; `filter?: OptionsFilter`; `renderOption`; `maxDropdownHeight=250`; `withScrollArea=true`; dropdown open control (`dropdownOpened`/`onDropdownOpen/Close`/`onOptionSubmit`); full InputBase field chrome (`label`/`description`/`error`/`leftSection`/etc.).
- **Sizes:** `ComboboxSize` default `md`.
- **Variants/colors:** inherits InputBase `variant`/`radius`; accent from theme ramp.
- **Slots / `styles` keys:** `root` (Combobox), `trigger` (InputBase), `dropdown`, `options`, `option`, `group`, `empty`, `chevron`, `clearButton`. Sugar wrapper forwards only `INPUT_WRAPPER_SLOTS` to the trigger's Input.Wrapper (via `pick`) so it never warns about slots it doesn't own.
- **Platform:** shared (delegates platform behavior to Combobox/InputBase). Keyboard nav (Arrow/Enter/Escape) is web-only — same roving-focus gap as Menu; native selects by press.
- **Builds on:** Combobox (`useCombobox`, `OptionsDropdown`, data helpers `getParsedComboboxData`/`getOptionsLockup`/`flattenComboboxOptions`/`defaultOptionsFilter`/`composeTriggerRightSection`), InputBase, `useUncontrolled`/`useId`.
- **Gotchas:** The `<Select>` prop API is pure sugar over the parts (no behavior the parts lack) — it funnels trigger chrome props through `SelectContext.triggerProps` (`__triggerProps`) so sugar and composable paths converge on ONE trigger. `filter` prop is Omit-ed from InputBase to reclaim the name from the CSS `filter` style prop. Search-text-follows-selection is an intentional effect (controlled value can change externally; blur resets label) — flagged not-a-removable-anti-pattern. Context value is intentionally unstable (handlers close over render state). `clearButtonProps`/`comboboxProps` are deprecated aliases merged OVER the corresponding slot.

### Separator

- **Purpose:** Divider line (Mantine `Divider`) with orientation, dashed/dotted variants, and optional label.
- **Source:** packages/components/src/Separator/
- **Public API:** `Separator` (+ `.Root`, `.Line`, `.Label`). Types: `SeparatorProps`, `SeparatorStyles`, `SeparatorOrientation`, `SeparatorVariant`, `SeparatorSize`, `SeparatorLabelPosition`.
- **Key props:** `orientation="horizontal"`; `variant="solid"` (`solid`/`dashed`/`dotted`); `size="md"` (SizeKey or px number → border width 1–6px); `label?: ReactNode` (horizontal only); `labelPosition="center"` (`left`/`center`/`right`).
- **Sizes:** `SizeKey | number` default `md`, mapped to `borderBottomWidth` (horizontal) / `borderLeftWidth` (vertical).
- **Variants/colors:** `borderStyle` solid/dashed/dotted; line color `$borderColor`, label `$color11`. No variant-colors.
- **Slots / `styles` keys:** `line` (both lines in labeled mode), `label`. Root has no slot (reached via top-level props).
- **Platform:** shared. Carries `role="separator"` + `aria-orientation`.
- **Builds on:** Box, Text, `renderTextChild` (wraps string children in styled Label).
- **Gotchas:** All border sides pinned to `borderWidth: 0` first so applying `borderStyle` doesn't draw a full box at the CSS default `medium` (3px) width. Labeled mode renders two `SeparatorLine`s flanking the label (omitting one for left/right position). Vertical + label is unsupported (falls to plain vertical line).

### SimpleGrid

- **Purpose:** Equal-width column grid (Mantine `SimpleGrid`), cross-platform (no CSS grid on native).
- **Source:** packages/components/src/SimpleGrid/
- **Public API:** `SimpleGrid` (single component, no sub-parts). Types: `SimpleGridProps`, `SimpleGridStyles`, `SimpleGridSpacing`.
- **Key props:** `cols=1`; `spacing="md"` (space key/`$space` token/px number); `verticalSpacing` (falls back to `spacing`); `minColWidth` (when set, `cols` ignored, columns auto-fill); `autoFlow="auto-fill"|"auto-fit"`; `type`/`autoRows` (documented no-ops for Mantine parity).
- **Sizes:** spacing scale keys `xxs`–`xxl` resolved to px via `getTokenValue`; default `md`.
- **Variants/colors:** none.
- **Slots / `styles` keys:** `cell` (per-child wrapper Box).
- **Platform:** shared. No CSS grid on native → each child wrapped in a cell Box laid out with flex-wrap row + negative-margin gap track (border-box technique, same as Grid).
- **Builds on:** Box.
- **Gotchas:** Two modes — `cols` mode sets `width: 100/cols %`; `minColWidth` mode sets `flexBasis`/`minWidth` (+`flexGrow:1` for auto-fit) as a flex approximation of `repeat(auto-fill/fit, minmax())`. Gap = half-padding on each cell cancelled by a negative margin on the frame so outer edges align. Responsive per-breakpoint values intentionally deferred (single values only). `styles.cell` is lower precedence than the computed cell layout.

### Skeleton

- **Purpose:** Loading placeholder block with a soft opacity pulse.
- **Source:** packages/components/src/Skeleton/
- **Public API:** `Skeleton` (single styleable component). Type: `SkeletonProps`.
- **Key props:** `visible=true` (false → renders children normally, transparent pass-through); `circle=false` (equal-sided round block; mirrors `height` onto `width`); `animate=true` (opacity pulse); `radius` (default `sm`); `width`/`height` pass through as Box style props.
- **Sizes:** none (dimensions via `width`/`height`).
- **Variants/colors:** placeholder bg `$color4`; `radius` variant + `circle` (borderRadius 9999).
- **Slots / `styles` keys:** none (no `styles` prop).
- **Platform:** shared, but the loop frame is platform-adaptive: `SkeletonLoopFrame = asLoopHost(SkeletonFrame)` — identity on web (CSS `@keyframes`), a reanimated `Animated.*` host on native (a plain Tamagui frame can't host an animated style).
- **Builds on:** Box; `useLoopingAnimation({kind:"pulse", durationMs:DURATIONS.ambient, minOpacity:0.45})`, `useReducedMotion`, `asLoopHost`.
- **Gotchas:** `width`/`height` intentionally NOT redeclared as variants (avoids the style-prop name-collision bug class). The loop hook runs UNCONDITIONALLY (stable hook order); its `{style}` is only spread when `animate && !reduced`. Children render at opacity 0 (preserve intrinsic size) behind the placeholder. Reduced motion handled inside the hook (returns a static frame).

### Slider

- **Purpose:** Drag a single numeric value in a range (and `RangeSlider` for two).
- **Source:** packages/components/src/Slider/ (exports both `Slider` and `RangeSlider`)
- **Public API:** `Slider` and `RangeSlider`, each `withStaticProperties` the shared `SLIDER_PARTS` (`.Root`, `.TrackContainer`, `.Track`, `.Bar`, `.Thumb`, `.Mark`/`.MarkDot`, `.MarkLabel`, `.LabelAnchor`, `.Label`). Types: `SliderProps`, `RangeSliderProps`, `RangeSliderValue`, `SliderStyles`, `SliderMark`, `SliderSize`, `SliderOrientation`.
- **Key props (shared):** `min=0`/`max=100`/`step=1`; `size`; `radius="xl"`; `marks?: SliderMark[]`+`restrictToMarks`; `inverted`; `orientation="horizontal"`; `labelAlwaysOn`/`showLabelOnHover=true`; `label` (node/`(v)=>node`/`null`); `thumbSize` (px or numeric string); `scale`/`precision`/`domain`/`thumbValueText`. Slider adds `value`/`defaultValue`/`onChange`/`onChangeEnd`, `name` (hidden input), `thumbLabel`/`thumbChildren`, `startPointValue`, `hiddenInputProps`. RangeSlider adds `[start,end]` value, `minRange=10`/`maxRange=Infinity`/`pushOnOverlap=true`.
- **Sizes:** `SliderSize | number` default `md`. Uses LOCAL geometry px maps `SLIDER_TRACK`{3–12} and `SLIDER_THUMB`{12–32} — NOT the `$size` control scale (which is 16–64) — because thumb margins/track centring math needs raw numbers (kept in lockstep with `sliderTrackVariant`/`sliderThumbVariant`).
- **Variants/colors:** track `$color3`, filled bar `$color9`, thumb `$color1` bg + `$color9` border, bubble `$color9`. `radius` variant. No variant-colors table.
- **Slots / `styles` keys:** `root`, `trackContainer`, `track`, `bar`, `thumb`, `mark`, `markLabel`, `labelAnchor`, `label`.
- **Platform:** shared, driven by cross-platform `useMove` (web pointer events + native gesture responder). `sliderAriaRangeProps` degrades to `aria-valuetext`-only on native when bounds aren't all integers.
- **Builds on:** Box, Text, HiddenInput; `useMove`, `useUncontrolled`, `hoverProps`, `clamp`.
- **Gotchas:** Value bubble lives in a wide (`200px`) `SliderLabelAnchor` (not the ~20px thumb box) so multi-digit values don't wrap one char per line (Yoga + RNW wrap to containing block width); centred via `left:50%` + known `marginLeft` (no percentage translateX RN can't express). `stateRef`/`currentRef` mirrors keep move/onChangeEnd callbacks current without re-subscribing. Vertical inverts y (`1 - position.y`). RangeSlider: nearer thumb grabs the drag (`activeThumb` ref); `constrainRange` enforces min/maxRange (push far thumb or revert); `inverted` ignored. `thumbProps` deprecated → merged OVER `thumb` slot. Full keyboard (Arrow/Page/Home/End) web focus props narrowed via `object` cast (`tabIndex`/`onKeyDown` outside Tamagui types).

### Spacer

- **Purpose:** Fixed-size spacer to reserve room between elements (Mantine `Space`).
- **Source:** packages/components/src/Spacer/
- **Public API:** `Spacer` (single component). Type: `SpacerProps`.
- **Key props:** `w`/`h` (token-first width/height); `miw`/`mih` (min width/height, default to `w`/`h` so the space can't collapse). Standard `width`/`height`/`minWidth`/`minHeight` take precedence over the shorthands when provided.
- **Sizes:** none (explicit dims).
- **Variants/colors:** none.
- **Slots / `styles` keys:** none.
- **Platform:** shared.
- **Builds on:** Box.
- **Gotchas:** `aria-hidden` defaults to true. `w`/`h`/`miw`/`mih` are Omit-ed from the frame props and re-applied via resolution logic (min falls back to the main dim).

### Spoiler

- **Purpose:** Collapsible content region that reveals/hides overflow past a max height, with a fade + toggle.
- **Source:** packages/components/src/Spoiler/
- **Public API:** `Spoiler` (+ `.Root`, `.Region`, `.Control`). Types: `SpoilerProps`, `SpoilerStyles`.
- **Key props:** `maxHeight=100` (collapsed px; toggle appears only when content is taller); `showLabel`/`hideLabel` (required toggle content); `controlRef`; `expanded`/`defaultExpanded`/`onExpandedChange`; `transitionDuration=DURATIONS.base` (200ms, `0` disables); `showAriaLabel`/`hideAriaLabel`.
- **Sizes:** none (`maxHeight` is raw px).
- **Variants/colors:** control styled like a hover-underlined Anchor (`$color11`).
- **Slots / `styles` keys:** `root`, `region`, `control`, `fade` (bottom fade overlay).
- **Platform:** shared, but height animation delegates to `CollapseBox` (shared height-transition engine: web CSS, native hand-rolled reanimated clip). Fade differs per platform: web paints a `linear-gradient` to the theme background; native uses `backgroundColor:$background` at opacity 0.85 (no cross-platform gradient).
- **Builds on:** Box, Text, CollapseBox, `renderTextChild`; `useElementSize` (measures natural content height), `useUncontrolled`, `useId`, `useReducedMotion`, `useTheme`.
- **Gotchas:** `spoilerActive` only when `maxHeight < measured height` — toggle/fade hidden otherwise. Measured content wrapper needs `flexShrink:0` or Fabric onLayout reports clipped height 0 inside the reanimated clip (same load-bearing pin as Collapse). a11y (`role=button`/`aria-expanded`/`aria-controls`, region `role=region`) built as typed-spread objects; `tabIndex`/`onKeyDown` (Enter/Space) added on web only. Reduced motion / 0 duration → snaps.
