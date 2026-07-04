## Batch 8

### Stack

- **Purpose:** Vertical flex stack (Mantine `Stack` parity) — column layout with gap/align/justify.
- **Source:** packages/components/src/Stack/
- **Public API:** `Stack` (single `styled(Box)`, no sub-components); `StackProps`.
- **Key props:** `gap` (Tamagui space token, e.g. `"$md"`); `align` (alignItems values via `alignVariant`); `justify` (justifyContent values via `justifyVariant`). All Box style props inherited.
- **Sizes:** No size scale — pure layout primitive.
- **Variants/colors:** `align` / `justify` variants only; no variant-colors.
- **Slots / `styles` keys:** none (not a slotted component).
- **Platform:** shared.
- **Builds on:** `Box`; `alignVariant`/`justifyVariant` from `internal/style-props`.
- **Gotchas:** `flexDirection: "column"` and `gap: "$md"` are baked defaults; `defaultVariants` align=`stretch`, justify=`flex-start`. For a horizontal stack use `Group`, not this.

### Stepper

- **Purpose:** Numbered-bubble step flow with active-step content panel; `"timeline"` variant folds in the former Timeline look (filled-dot bullets, inline per-step content, dashed/dotted connectors) in both orientations.
- **Source:** packages/components/src/Stepper/
- **Public API:** `Stepper` root + `Stepper.Step` (with parts `.Bubble`, `.BubbleText`, `.Body`, `.Label`, `.Description`, `.Content`), `Stepper.Completed`, `Stepper.Steps`, `Stepper.Connector`.
- **Key props (root):** `active: number` (required), `onStepClick?: (index) => void`, `variant?: "stepper" | "timeline"`, `orientation?: "horizontal" | "vertical"`, `iconPosition?: "left" | "right"`, `allowNextStepsSelect?: boolean` (default true), `reverseActive?: boolean`, `iconSize?` (size key or px), `contentPadding?` (default `"$md"`), `wrap?: boolean` (default true), `keepMounted?: boolean` (toggles `display` to preserve step state — kit's stand-in for React-19 `Activity`), `icon`/`completedIcon`/`progressIcon` (node or `({step}) => node` render fn). Per-step: `label`/`description`/`icon`/… accept `StepFragmentComponent` render fns, `withIcon`, `loading`, `lineVariant?: "solid"|"dashed"|"dotted"`, `allowStepSelect`.
- **Sizes:** `SizeKey` (xxs–xxl), default `md`. Bubble via `squareSizeVariant`, text via `controlFontVariant`; connector thickness scales off size via local `CONNECTOR_THICKNESS` ladder (2px up to 4px).
- **Variants/colors:** `variant` stepper/timeline; state colors are hardcoded palette ramp (`$color9` active/complete, `$color5`/`$color2` inactive) — does NOT use variant-colors.
- **Slots / `styles` keys:** `steps`, `step`, `bubble`, `bubbleText`, `label`, `description`, `content`, `connector`. Distributed to each cloned step via a parallel `StepperStylesContext` (styled context can't carry the arbitrary slot map).
- **Platform:** shared.
- **Builds on:** `Box`, `Text`, `Loader`, `ControlIconProvider`, `IconCheck` (@knitui/icons); `renderStepFragment`/`useSlotTextWrapper`.
- **Gotchas:** Steps are read via `React.Children` + `cloneElement` (index/state/press injected) — only direct `Stepper.Step`/`Stepper.Completed` children are recognized. Dashed/dotted connectors are drawn as a zero-thickness box with a styled border (a filled box can't be dashed). `Stepper.Completed` renders nothing itself; the root reads its `children`. Timeline variant has no content panel (content renders inline). `reverseActive` mirrors indices so the last step completes first.

### Switch

- **Purpose:** Toggle switch — sliding thumb in a pill track, with optional on/off in-track labels and a group.
- **Source:** packages/components/src/Switch/
- **Public API:** `Switch` + `Switch.Group`; parts `Switch.Track`, `Switch.Thumb`, `Switch.Indicator`, `Switch.TrackLabel`.
- **Key props:** `checked`/`defaultChecked`, `onChange(checked: boolean)` (boolean payload, not DOM event), `onCheckedChange` (deprecated alias), `offLabel`/`onLabel` (in-track labels), `thumbIcon`, `withThumbIndicator` (default true), `value` (for Group), `label`/`description`/`error`/`labelPosition` (via InlineControl). Group: `value`/`defaultValue: string[]`, `onChange(string[])`, `maxSelectedValues`, `readOnly`.
- **Sizes:** `SizeKey`, default `md`. Track height = canonical `controlMetrics[size].height` (so a `md` Switch lines up with a `md` Checkbox/Radio); track `minWidth` + thumb size from local px ladders; `TRACK_PAD = 6` (matches `$xxs`) is the thumb inset.
- **Variants/colors:** `on` variant swaps fill `$color5`→`$color9`; `radius` default `xl`; disabled variant. Uses palette ramp, not variant-colors.
- **Slots / `styles` keys:** own — `track`, `thumb`, `thumbIndicator`, `trackLabel`; PLUS inherited InlineControl chrome slots `label`/`description`/`error`/`root` (extends `InlineControlSlots`, forwarded via `pick`).
- **Platform:** shared. Thumb is absolutely positioned and slides via `transform` transition (not an un-animatable `justifyContent` flip); track width measured via `onLayout` (can grow past `minWidth` when a track label is present), seeded with `minWidth` for first paint. Reduced-motion via `useReducedTransition`.
- **Builds on:** `Box`, `Text`, `InlineControl`; hooks `useId`/`useKeyboardActions`/`useUncontrolled`.
- **Gotchas:** slide distance = `trackWidth − thumbWidth − 2×TRACK_PAD`. Group `name` is web-form metadata only (no native form input). Role is `switch` with `aria-checked`.

### Table

- **Purpose:** Data table — Mantine `Table` parity with striping, hover, borders, spacing; renders from a `data` object OR compound children.
- **Source:** packages/components/src/Table/
- **Public API:** `Table` root + `Table.Thead`, `Table.Tbody`, `Table.Tfoot`, `Table.Tr`, `Table.Th`, `Table.Td`, `Table.Caption`.
- **Key props:** `data?: TableData` ({ head, body, foot, caption }, ignored when `children` set), `striped?: boolean | "odd" | "even"` (`true`→`"odd"`), `highlightOnHover?`, `withTableBorder?`, `withColumnBorders?`, `withRowBorders?` (default true), `horizontalSpacing`/`verticalSpacing?: TableSpacing` (token/CSS/number, default `"xs"`), `captionSide?: "top" | "bottom"`.
- **Sizes:** No size scale; cell padding driven by `horizontalSpacing`/`verticalSpacing` (`toSpace` maps `"md"`→`"$md"`, number/CSS pass through). `shadow` variant via `shadowVariant`.
- **Variants/colors:** border/stripe styling from palette ramp (`$color2` stripe, `$color3` hover, `$borderColor`); no variant-colors.
- **Slots / `styles` keys:** `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`. `styles` is lowest-precedence sugar (data-path parts win).
- **Platform:** shared (flexbox-based rows/cells, not real HTML `<table>` layout — cells are `flex:1 minWidth:0`). Roles `table`/`rowgroup`/`row`/`columnheader`/`cell` applied for a11y.
- **Builds on:** `Box`, `Text` (cells are `styled(Text)`).
- **Gotchas:** Compound parts must live inside `<Table>` (context throws otherwise). `Table.Tbody` injects `__index` for striping; `Table.Tr` injects `__first` on first cell so column borders only appear BETWEEN columns. Cells are flex — no colspan/rowspan.

### TableOfContents

- **Purpose:** Nav list of headings with active-item highlight and depth-based indentation. Cross-platform takes headings as `data` (Mantine derives via DOM scroll-spy).
- **Source:** packages/components/src/TableOfContents/
- **Public API:** `TableOfContents` root + `TableOfContents.Control`, `TableOfContents.Text`, `TableOfContents.Frame`.
- **Key props:** `data?: TableOfContentsItem[]` ({ value, depth 1–6, id? }), `initialData?` (alias), `active?`/`defaultActive?` (index, default -1), `onChange?(index)`, `variant?: "filled" | "light" | "none"` (default light), `size?: TableOfContentsSize | number` (default md), `radius?`, `depthOffset?: SpaceTokens | number` (default `"$lg"` per depth level), `minDepthToOffset?` (default 1), `getControlProps?(({active,data}) => partial)` (dynamic per-item override, layers OVER `control` slot), `autoContrast?` (no-op parity).
- **Sizes:** `SizeKey | number`; default `md`. Per-size vertical padding + right-padding ladder on the control frame; font/lineHeight via `fontSizeVariant`; numeric size resolves padding ~0.45× / font ~1.0×.
- **Variants/colors:** active fill — `filled`→`$color9` bg + `$color1` text; `light`→`$color4` bg; `none`→transparent. Palette ramp, not variant-colors.
- **Slots / `styles` keys:** `root`, `control`, `text`. `text` slot rides to the label via `textProps`.
- **Platform:** shared. Frame renders `render="nav"`, control `render="button"`.
- **Builds on:** `Box`, `Text`, `UnstyledButtonFrame`; `useUncontrolled`; `getTokenValue` for space resolution. Data path composes the public `TableOfContents.Control` (Pillar D) rather than re-implementing internals.
- **Gotchas:** `paddingLeft = basePadding + depthOffset × max(0, depth − minDepthToOffset)`. Precedence: `styles.control` < `getControlProps` < explicit; `children` overrides `item.value`.

### Tabs

- **Purpose:** Tabbed interface with list + panels, three visual variants, roving keyboard focus.
- **Source:** packages/components/src/Tabs/
- **Public API:** `Tabs` root + `Tabs.List`, `Tabs.Tab`, `Tabs.Section`, `Tabs.Panel`.
- **Key props (root):** `value`/`defaultValue`/`onChange` (`string | null`), `variant?: "default" | "outline" | "pills"`, `orientation?: "horizontal" | "vertical"`, `placement?: "left" | "right"` (vertical list side), `inverted?` (list after panels), `keepMounted?` (default true — inactive panels hidden not unmounted), `allowTabDeactivation?`, `activateTabWithKeyboard?` (default true, web-only), `loop?` (default true, arrow wrap). Tab: `value` (required), `leftSection`/`rightSection`, `disabled`. Panel: `value`, `keepMounted`. List: `grow?`, `justify?`.
- **Sizes:** `SizeKey`, default `md`. Tab trigger height + paddingHorizontal from shared `controlVariant`, gap from `controlMetrics[size].gap` (so an `xl` Tabs row matches an `xl` Button); label font via `controlFontVariant`.
- **Variants/colors:** `default`/`outline` = bottom-border underline (`$color9` active); `pills` = filled `$color2` list, active `$background` chip with shadow. Palette ramp, not variant-colors.
- **Slots / `styles` keys:** `list`, `tab`, `label`, `section`, `panel`. Distributed via `TabsSlotStylesContext` (parts are consumer-rendered, not cloned). Slot sugar sits UNDER explicit inline props ("explicit beats sugar").
- **Platform:** shared, but keyboard nav (Arrow/Home/End roving + arrow-activate + loop) is web-only — handlers query the DOM (`querySelectorAll('[role="tab"]')`, `document.activeElement`); native Views never fire keydown.
- **Builds on:** `Box`, `Text`; `useId`/`useUncontrolled`; `renderTextChild`. Roles `tablist`/`tab`/`tabpanel` with `aria-selected`/`aria-controls`/`aria-labelledby`.
- **Gotchas:** `inverted` flips the underline/separator to the top edge (default/outline). Roving tabindex: only the active (or first enabled) tab is a tab-stop. Panel value must match a Tab value.

### TagsInput

- **Purpose:** Free-text tags input — type tags (commit on Enter / split char / blur) or pick from suggestions; tags render as removable pills. Mantine `TagsInput` parity.
- **Source:** packages/components/src/TagsInput/
- **Public API:** `TagsInput` sugar wrapper + composable parts: `.Root`, `.Trigger`, `.Pills`, `.Pill`, `.Dropdown`, `.Options`, `.Option` (=Combobox.Option), `.Group`, `.Empty`, `.ClearButton`, `.HiddenInput`.
- **Key props:** `data?: ComboboxData`, `value`/`defaultValue`/`onChange` (`string[]`), `searchValue`/`onSearchChange`, `maxTags` (default Infinity), `allowDuplicates` (default false) + `onDuplicate`/`isDuplicate`, `splitChars` (default `[","]`), `acceptValueOnBlur` (default true), `selectFirstOptionOnChange`, `clearSearchOnChange` (default true), `filter?: OptionsFilter`, `renderOption`/`renderPill`, `clearable` (default false), `clearSectionMode?: "clear"|"default"|"rightSection"|"both"` (default both), `limit`, `maxDropdownHeight` (default 250), `withScrollArea` (default true), `hiddenInputName`/`form`/`hiddenInputValuesDivider`.
- **Sizes:** `ComboboxSize`, default `md`; embedded pills use a step-down size via `toEmbeddedControlSize` (field md → pills sm).
- **Variants/colors:** inherits Combobox/PillsInput/Input variant chrome; accent from Tamagui `theme` + ramp, never a `color` prop.
- **Slots / `styles` keys:** `root`, `trigger`, `pills`, `pill`, `dropdown`, `options`, `option`, `group`, `empty`, `clearButton`. Sugar wrapper `pick`s only the InputWrapper chrome slots to forward to the trigger so Input.Wrapper doesn't dev-warn about slots it doesn't own.
- **Platform:** shared, but keyboard nav and split-on-paste are web-only (documented roving-focus gap shared with Menu/Select). Native: tags add via return key, remove via pill button; multi-value paste lands as one tag.
- **Builds on:** `Combobox` (+ `useCombobox`), `PillsInput`, `Pill`/`Pill.Group`, `Input` types. Sugar wrapper renders the composable parts and funnels trigger chrome/ref via Root context.
- **Gotchas:** batch commits use `commitTags` (a per-tag `addTag` loop would read stale render-time value, so only the last tag survives). Backspace on empty search removes the last tag. HiddenInput reads LIVE committed tags from context (single source of truth). Context value intentionally NOT memo-stable (handlers close over render state).

### Text

- **Purpose:** Text typography primitive — the one non-Box base (text needs a text host element). Mantine `Text` API parity.
- **Source:** packages/components/src/Text/
- **Public API:** `Text` (single `styled(TamaguiText)`); `TextProps`.
- **Key props:** `size` (font-size token pairing size+lineHeight via `fontSizeVariant`), `lineClamp` (`:number` → `numberOfLines`), `truncate` (`true`/`"end"`/`"start"` single-line ellipsis), `inline` (tight line-height / `verticalAlign: middle`), `inherit` (inherit parent font — web CSS `inherit` narrowed per style prop), `span` (`render: "span"`). Defaults `fontFamily: "$body"`, `color: "$color"`, `fontSize: "$md"`.
- **Sizes:** `size` via `fontSizeVariant` (token scale).
- **Variants/colors:** color is the kit's deliberate divergence — use the `c` style prop / `theme`, NOT a Mantine `color` prop. No variant-colors.
- **Slots / `styles` keys:** none.
- **Platform:** shared, with a `truncate="start"` platform split inside the variant: web uses an RTL `direction`+`unicode-bidi`+`text-overflow` trick; native uses `ellipsizeMode="head"` + `numberOfLines={1}`.
- **Builds on:** Tamagui `Text` (`TamaguiText`).
- **Gotchas:** `inherit` string values (`"inherit"`) are web-only CSS keywords cast to the style-prop type; harmless on native. `truncate="start"` requires `display:block` on web.

### TextInput

- **Purpose:** Labeled single-line text field. Mirrors Mantine `TextInput` — a thin pass-through to `InputBase` (`Input.Wrapper` + `Input`).
- **Source:** packages/components/src/TextInput/
- **Public API:** `TextInput` (styleable pass-through); `TextInputProps = InputBaseProps`, `TextInputRef`.
- **Key props:** all `InputBase` props — `label`/`description`/`error`/`required`, `leftSection`/`rightSection`, `size`/`variant`/`radius`, `loading`, `value`/`onChange`/`onChangeText`/`placeholder`.
- **Sizes:** `InputBase` size scale (controlMetrics-driven), default `md`.
- **Variants/colors:** inherits InputBase variant chrome; accent from Tamagui `theme` + ramp, never a `color` prop.
- **Slots / `styles` keys:** inherits InputBase / Input.Wrapper slots (label/description/error/input/wrapper/section etc. — see Input reference).
- **Platform:** shared — underlying `Input` host renders `<input>` on web, RN `TextInput` on native (`.native` split in Input, not here).
- **Builds on:** `InputBase`.
- **Gotchas:** none noted — it adds no behavior over `InputBase`.

### Textarea

- **Purpose:** Multiline text field — `InputBase` with `multiline` forced on, plus optional `autosize` between `minRows`/`maxRows` and a web `resize` control.
- **Source:** packages/components/src/Textarea/
- **Public API:** `Textarea` (styleable over `InputBase`); `TextareaProps`, `TextareaRef`, `TextareaResize`.
- **Key props:** `multiline?: never` (intentionally owned/forced on), `autosize?` (default false — grows minRows→maxRows on BOTH platforms), `minRows?` (default **2** — initial height), `maxRows?`, `resize?: "none"|"both"|"horizontal"|"vertical"` (default `"none"`, web-only).
- **Sizes:** inherits InputBase size scale, default `md`. Textarea host has its OWN vertical-inset ladder (see below).
- **Variants/colors:** inherits InputBase chrome; no variant-colors.
- **Slots / `styles` keys:** inherits InputBase / Input.Wrapper slots.
- **Platform:** shared component, but the autosize/resize mechanics split by platform inside `Input`: web autosize = `scrollHeight` via `useAutosize`; native autosize = `onContentSizeChange` clamped; `resize` handle is web-only (this component sets `ta.style.resize` in an effect via a tracked DOM node, no-op on native).
- **Builds on:** `InputBase`; `useMergedRef`; `isWeb`.
- **Gotchas — padding/rows math (the key detail):** A textarea does NOT reuse the single-line host's centering gap. Its vertical inset is a deliberate `$space`-token ladder `TEXTAREA_INSET_TOKEN` (Input/shared.tsx): xxs/xs=`$xs`, sm/md/lg=`$sm`, xl/xxl=`$md` — peaking at `$sm` (12px) for default `md`. This single source feeds (a) the web `textareaHostSizeVariant` (`paddingVertical` token + an EXPLICIT per-size `lineHeight` via `getLineHeight`, which is load-bearing because rendered height = `rows × lineHeight + padding`), and (b) the native host, where `getTextareaPaddingVertical` resolves the token to a px number. Native min/max height ADDS 2× the inset: `chrome = getTextareaPaddingVertical(size) * 2; minH = lineHeight*minRows + chrome; maxH = lineHeight*maxRows + chrome` (Input.native.tsx) — so `minRows`/`maxRows` count FULL text lines and padding doesn't eat into them (without it a 2-row field shows ~1 line). Native uses minHeight/maxHeight ONLY (never explicit height); `numberOfLines`/`rows` is NOT used for sizing on Android (it would call `setLines()` and clip). Line heights match web via `getNativeLineHeight` = `round(fontSize × ratio)`.

### ThemeIcon

- **Purpose:** Non-interactive icon chip — a themed square that holds a glyph. Models ActionIcon's frame but with no button role/cursor/hover/press.
- **Source:** packages/components/src/ThemeIcon/
- **Public API:** `ThemeIcon` + `ThemeIcon.Frame`; `ThemeIconProps`, `ThemeIconSize`, `ThemeIconVariant`.
- **Key props:** `children` (a bare @knitui/icons icon auto-sizes/colors to the chip), `variant?`, `size?`, `radius?`, `shadow?`, `gradient?: GradientValue` (used only when `variant="gradient"`).
- **Sizes:** `SizeKey`, default `md`; square metrics via `squareSizeRoundedVariant`.
- **Variants/colors:** `filled`|`light`|`outline`|`subtle`|`transparent`|`white`|`default`|`gradient` (default `filled`). USES variant-colors — static fill from the shared `surfaceColorVariant` ladder via `pickVariants` (no hover/press, mirrors Badge's static surface). Accent from `theme` prop, never a `color` prop.
- **Slots / `styles` keys:** none (exposes `.Frame` only).
- **Platform:** shared; gradient fill splits inside `useGradient` (web CSS `backgroundImage` / native SVG `layer`).
- **Builds on:** `Box`, `ControlIconProvider` (publishes size+variant so bare icons auto-match), `useGradient`.
- **Gotchas:** not pressable — for a pressable icon use `ActionIcon`. `gradient` is ignored unless `variant="gradient"`.

### Title

- **Purpose:** Heading primitive — Mantine `Title` parity. `order` (1–6) drives the semantic `h1`–`h6` element and its default size.
- **Source:** packages/components/src/Title/
- **Public API:** `Title` (styleable over `styled(Text)`); `TitleProps`, `TitleOrder`, `TitleSize`.
- **Key props:** `order?: 1..6` (default 1 — sets both `render="h{order}"` and default fontSize), `size?: TitleSize` (`"h1"`–`"h6"`, any seven-step font-size token, or arbitrary CSS value — overrides order size), `textWrap`; `lineClamp`/`truncate`/`inline` inherited from `Text`.
- **Sizes:** order 1→`$xxl`, 2→`$xl`, 3→`$lg`, 4→`$md`, 5→`$sm`, 6→`$xs`; `size` h1–h6 map to the same scale, plus `fontSizePassthroughVariant` for token/CSS passthrough. Defaults `fontFamily: "$heading"`, `fontWeight: "700"`.
- **Variants/colors:** `order`/`size`/`textWrap` variants; color via `c`/`theme` (inherited Text divergence), no variant-colors.
- **Slots / `styles` keys:** none.
- **Platform:** shared.
- **Builds on:** `Text`; `fontSizePassthroughVariant`/`textWrapVariant`.
- **Gotchas:** `order` defaults to 1 for both element AND size when unset; the styleable wrapper injects `render={h${order}}` so the semantic tag always follows `order` even when `size` overrides the visual size.
