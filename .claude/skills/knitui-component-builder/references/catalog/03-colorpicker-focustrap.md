## Batch 3

### ColorPicker

- **Purpose:** Draggable saturation area + hue/alpha sliders + optional swatch grid for picking a CSS color.
- **Source:** packages/components/src/ColorPicker/
- **Public API:** `ColorPicker` (sugar prop-API component) with static parts: `.Root` (state machine), `.Frame`, `.Saturation`, `.HueSlider`, `.AlphaSlider`, `.Preview`, `.Swatches`, `.Swatch`. Exports `ColorPickerFormat`, `ColorPickerSize`, `HsvaColor`, `ColorFormat` and per-part prop/style types.
- **Key props (Root/sugar):** `value`/`defaultValue`/`onChange`/`onChangeEnd` (color strings); `format?: 'hex'|'hexa'|'rgb'|'rgba'|'hsl'|'hsla'` (@default 'hex'; the `*a` formats render the alpha slider + preview); `swatchesPerRow?: number` (@default 7); `fullWidth?: boolean`; `focusable?: boolean` (@default true, keyboard-focusable thumbs); `saturationLabel`/`hueLabel`/`alphaLabel` (aria); `onColorSwatchClick`; `name` (web hidden input for form submit). Sugar adds `withPicker?: boolean` (@default true; false = swatches only) and `swatches?: string[]`.
- **Sizes:** `size?: ColorPickerSize` (SizeKey), @default 'md'. Outer square side resolves from `squareSizeVariant` (= `controlMetrics[key].height`); saturation canvas + slider width are DERIVED from that side via `WIDTH_MULTIPLIER=6` / `SATURATION_MULTIPLIER=3` (they exceed the 64px `$size` max). Thumb dot has its OWN px scale (`THUMB_SIZE` xxs14…xxl32), not the control scale.
- **Variants/colors:** No `variant`. Accent purely from Tamagui `theme`/palette ramp — no Mantine `color` prop. Gradients use `internal/color` math + `useMove`.
- **Slots / `styles` keys:** `root`, `saturation`, `hueSlider`, `alphaSlider`, `thumb` (both saturation + slider thumbs), `preview`, `swatches`, `swatch`. Slot sugar is lowest precedence (explicit props / `frameProps` / `thumbProps` win). `thumbProps` on Saturation/HueSlider/AlphaSlider is the deprecated alias into the `thumb` slot.
- **Platform:** shared single file, but gradient BACKGROUNDS are web-only CSS `backgroundImage`; on native the areas fall back to solid hue/track color (documented parity gap — no cross-platform gradient primitive). Dragging works on both via `useMove` (pointer web / gesture-responder native). Thumb centering: web uses `transform: translate(-50%,-50%)`, native uses negative `marginLeft/marginTop` = `-getThumbOffset(size)`.
- **Builds on:** Box, ColorSwatch (Preview + Swatch), Text; hooks `useMove`, `useUncontrolled`, `useDidUpdate`, `clampMovePosition`; `internal/color` (parseColor/convertHsvaTo/luminance/round).
- **Gotchas:** Root holds HSVA state separately from the string value; `scrubbingRef` suppresses re-parsing a controlled `value` mid-drag. `geometry` is memoized on `size` to avoid re-providing context every render. Arrow keys nudge by 0.05 (saturation both axes, sliders x only). Alpha slider `round={false}` (continuous 0–1); hue `round` to whole degrees. Native onLayout unused here — geometry is derived, not measured.

### ColorSwatch

- **Purpose:** A colored circle/square chip (pill by default) with a subtle inset ring.
- **Source:** packages/components/src/ColorSwatch/
- **Public API:** `ColorSwatch` with static `.Frame` and `.Overlay`.
- **Key props:** `color: string` (any CSS color, required); `radius?: string|number` (@default 9999 = pill); `withShadow?: boolean` (@default true; renders the inset `Overlay` ring); `children`.
- **Sizes:** `size?: ColorSwatchSize | number | (string & {})` (@default 'md') via `squareSizeVariantFallthrough` (square width+height from the size scale; numbers/CSS strings pass through).
- **Variants/colors:** No `variant`. `withShadow` is a boolean variant adding a `boxShadow` on the frame; the inset ring uses `$dropShadowColor`. No variant-colors.
- **Slots / `styles` keys:** `overlay` only — the frame is reached directly via style props on the component, so only the internally-rendered inset ring needs a slot.
- **Platform:** shared.
- **Builds on:** Box.
- **Gotchas:** `color` is spread as `backgroundColor`; `radius` is split — numeric goes to `borderRadius`, string goes to the `radius` variant. Overlay is `aria-hidden` and `pointerEvents:'none'`, only rendered when `withShadow`.

### Combobox

- **Purpose:** The composability TEMPLATE for the kit — a headless dropdown/listbox scaffold (target + portal dropdown + option primitives) that the selection sugars (Select/MultiSelect/Autocomplete/TagsInput) compose.
- **Source:** packages/components/src/Combobox/ (Combobox.tsx = primitive parts; OptionsDropdown.tsx = data-driven body; use-combobox.ts = store; index.ts = final assembly)
- **Public API:** `Combobox` compound assembled in TWO stages. Primitive parts (in Combobox.tsx via `withStaticProperties`): `.Target`, `.Dropdown`, `.Options`, `.Option`, `.Group`, `.Empty`, `.Header`, `.Footer`, `.Chevron`, `.ClearButton`, `.HiddenInput`. The data-driven `.OptionsDropdown` is attached SEPARATELY in index.ts (a second `withStaticProperties`) to avoid a `Combobox <-> OptionsDropdown` require cycle. Also exports `useCombobox` + `ComboboxStore`/`UseComboboxOptions`, `composeTriggerRightSection` helper, render-prop types (`ComboboxRenderOption`/`ComboboxRenderPill`), and re-exports the `internal/combobox-data` data helpers (`getParsedComboboxData`, `filterComboboxData`, `defaultOptionsFilter`, `ComboboxItem`/`ComboboxData`, etc.).
- **Key props (Root):** `store?: ComboboxStore` (from `useCombobox`; a self-managed fallback store is created if omitted — the hook is ALWAYS called for stable order); `onOptionSubmit?: (value: string) => void`; `readOnly?` (dropdown opens but options presentational); `position?: PopoverPosition` (@default 'bottom'); `offset?` (@default 8); `width?: PopoverWidth` (@default 'target'); `withinPortal?` (@default true); `keepMounted?` (@default false); `zIndex?` (@default 300); `radius`, `shadow` (@default 'md'); `closeOnClickOutside`/`closeOnEscape` (@default true, web). `Combobox.Target` takes `refProp?` (@default 'ref') and `targetType?: 'input'|'button'` (@default 'input').
- **Sizes:** `size?: ComboboxSize` (SizeKey), @default 'md'. Shared to all dropdown parts via a `createStyledContext` (`ComboboxStyleContext`) — each part is a `styled(...).styleable` reading `ctx.size`. Option rows are sized to ~match the trigger Input at the same key (`minHeight` tracks control height, horizontal padding mirrors input text inset).
- **Variants/colors:** Options carry `selected`/`active`/`disabled` boolean variants (hover `$color4`, press `$color5`, selected `$color4`, active `$color3`). No accent variant-colors; theme-driven.
- **Slots / composition:** This is the Pillar-B template. Every part is an independently-styleable `styled().styleable` sharing `ComboboxStyleContext`. `OptionsDropdown` exposes passthrough slots: `optionProps` (→ every `Combobox.Option`), `groupProps` (→ every `Combobox.Group`), `emptyProps` (→ `Combobox.Empty`), plus `renderOption` (replaces the built-in check+label) and `renderPill` type (for multi-value sugars). `composeTriggerRightSection` is a PURE helper composing `ClearButton` + `Chevron`/consumer `rightSection` into a trigger `rightSection` (`mode: 'both'|'clear'|'default'|'rightSection'`).
- **Platform:** shared. Active-option highlight + keyboard roving live in the CONSUMERS (web only) — the store tracks only open/close; no cross-platform focus primitive (same gap as Menu). Native quirks handled: `keyboardShouldPersistTaps="handled"` (in OptionsDropdown's ScrollArea) so a tap doesn't dismiss the keyboard→blur→close before the option press lands; web uses `onMouseDown preventDefault` on each Option to keep field focus through the mousedown-before-click blur race.
- **Builds on:** Popover (Root wraps `<Popover>`; Dropdown wraps `Popover.Dropdown padding={0}`; Target wraps `Popover.Target`), Box, Text, CloseButton (ClearButton), ScrollArea.Autosize (OptionsDropdown body), `internal/hidden-input` (HiddenInput web-form parity), `@knitui/icons` IconChevronDown.
- **Gotchas:** `Target` has two anchoring modes: `'input'` anchors the dropdown to the field's VISIBLE frame via `referenceRefProp="rootRef"` (child `ref` still → inner `<input>`) and sets `withPressToggle={false}` (consumer drives open/close on input events); `'button'` anchors to the child's own `ref` and lets Popover press-toggle drive it. Chevron wrapper is a `Box` (not Text) because the icon is an SVG that must live in a View on native; `color`/`size` route to the icon, not the wrapper. ClearButton steps size DOWN one key (`toEmbeddedControlSize`) so it fits inside the field. `OptionsDropdown` is intentionally NOT attached in Combobox.tsx (cycle avoidance) — imported one-way there and re-attached in index.ts. `OptionRow` is `React.memo`'d so keystrokes re-render only the couple of rows whose `active`/`checked` flipped.

### Container

- **Purpose:** Centered, max-width content wrapper.
- **Source:** packages/components/src/Container/
- **Public API:** `Container` (single `styled(Box).styleable`; no compound parts).
- **Key props:** `fluid?: boolean` variant (spans full parent width, wins over `size`'s max-width). `ContainerProps = GetProps<typeof ContainerFrame>` (Box props + variants).
- **Sizes:** `size?: ContainerSize` (SizeKey), @default 'md', via `containerSizeVariant` (caps max-width to a named breakpoint; arbitrary number/CSS value also allowed). Extends Mantine's xs–xl to the full 7-step API.
- **Variants/colors:** `size` + `fluid` only. No color prop — inherited from Box theme.
- **Slots / `styles` keys:** none.
- **Platform:** shared. Centering is cross-platform via `marginHorizontal:'auto'` (Mantine's web-only CSS-grid `strategy` out of scope). Base `paddingHorizontal:'$md'`.
- **Builds on:** Box.
- **Gotchas:** none noted.

### CopyButton

- **Purpose:** Renderless copy-to-clipboard controller (no visual of its own).
- **Source:** packages/components/src/CopyButton/
- **Public API:** `CopyButton` (function component, render-prop only).
- **Key props:** `value: string` (copied on `copy()`); `timeout?: number` (@default 1000, ms the `copied` flag stays true); `children: (payload: { copied: boolean; copy: () => void }) => ReactNode` (required render prop).
- **Sizes:** n/a (no visual).
- **Variants/colors:** n/a.
- **Slots / `styles` keys:** none (renderless — child decides the UI, typically an ActionIcon/Button).
- **Platform:** shared; works web + native via the guarded `useClipboard` hook (`@knitui/hooks`).
- **Builds on:** `useClipboard` hook only.
- **Gotchas:** none noted.

### Dialog

- **Purpose:** Floating corner dialog (small Paper pinned to a viewport corner, no overlay scrim) — Mantine's `Dialog`.
- **Source:** packages/components/src/Dialog/
- **Public API:** `Dialog` with static `.Content` (= DialogFrame) and `.CloseButton` (= CloseButton).
- **Key props:** `opened: boolean` (required); `onClose?`; `withCloseButton?` (@default true, top-inline-end); `closeButtonProps?` (@deprecated alias for `styles.closeButton`, merged OVER it); `position?: AffixPosition` (@default `{ bottom:'$xl', right:'$xl' }` — note this is Affix corner position, NOT CSS position, which is Omit-ed from Box props); `keepMounted?` (@default false; toggles `display:'none'` instead of unmount, so no exit anim); `withinPortal?` (@default true); `zIndex?` (@default 300); `withBorder?` (@default true); `animation?: MotionPresetName | MotionPreset | false` (@default subtle 8px rise-in fade); `duration?` (ms, overrides preset duration).
- **Sizes:** `size?: DialogSize | number | string` (@default 'md') via `panelWidthVariant` (content width; key/px/CSS).
- **Variants/colors:** `radius` (@default 'md'), `shadow` (@default 'md'), `withBorder` variants. No color prop — theme/ramp only.
- **Slots / `styles` keys:** `content`, `closeButton` (Dialog has NO overlay/header/title). `closeButton` sugar is low-precedence; `closeButtonProps` wins.
- **Platform:** shared.
- **Builds on:** Affix (corner pinning + portal), Box (DialogFrame), CloseButton, Text (via `renderTextChild`), `internal/motion` (`useMotionPreset`), `AnimatePresence`.
- **Gotchas:** `AnimatePresence` sits OUTSIDE the Portal (inside Affix) so the presence parent/child relationship survives the teleport re-parent, enabling exit animation; with `keepMounted` the node never leaves so entrance animates but there's no exit.

### Drawer

- **Purpose:** Edge-anchored sliding panel (left/right/top/bottom) with scrim — Mantine's `Drawer`, on the shared `ModalBase` chrome.
- **Source:** packages/components/src/Drawer/
- **Public API:** `Drawer` with static `.Content`, `.Header`, `.Title`, `.Body`. Exports `DrawerContent/Header/Title/BodyProps`.
- **Key props:** `opened`/`onClose` (from `ModalBaseSharedProps`); `position?: 'left'|'right'|'top'|'bottom'` (@default 'left'); `title?`; `withCloseButton?` (@default true); `closeButtonProps?: { 'aria-label'? }` (typed cross-platform-safe subset); `offset?: BoxProps['padding']` (gap to viewport edge, @default '$0'); `animation?: MotionPresetName|MotionPreset|false` (@default subtle edge slide keyed to `position`); `duration?`; drag-to-dismiss: `dragToDismiss?` (@default false), `dragThreshold?` (@default 0.3 of extent), `animationConfig?: WithSpringConfig`. Plus ModalBase shared props (`closeOnEscape`, `closeOnClickOutside`, `lockScroll`, `returnFocus`, `trapFocus`, `withinPortal`, `keepMounted`, `withOverlay`, `overlayProps`, `zIndex`).
- **Sizes:** `size?: DrawerSize | number | string` (@default 'md') → `resolveExtent` uses `panelWidthVariant` magnitude, applied to WIDTH for left/right or HEIGHT for top/bottom (a Drawer md matches a Dialog md).
- **Variants/colors:** `radius`, `shadow` (@default 'xl') on the content frame. No color prop.
- **Slots / `styles` keys:** `overlay`, `content`, `header`, `title`, `body`, `closeButton` — uniform via `ModalChromeStyles` / `resolveModalChromeSlots` (shared modal chrome vocabulary).
- **Platform:** shared file, but pulls native drag machinery unconditionally (`react-native-gesture-handler` `GestureDetector`, `react-native-reanimated` `useSharedValue`). Drag-to-dismiss uses the shared `Modal/drag` primitives (`useDragDismiss`/`DragDismissHost`/`DragDismissOverlay`), the same mechanic as `@knitui/sheet`.
- **Builds on:** ModalBase (`Modal/modal-base`), Box, CloseButton, Text, `internal/motion`, `Modal/drag`; hooks `useElementSize` (measures panel main-axis extent as the dismiss distance — Tamagui onLayout unreliable on web), `useId`.
- **Gotchas:** Content fills the cross axis via `alignSelf:'stretch'` (not `%`, since RN/Yoga resolves percentage sizes unreliably); only the main axis is pinned to `extent`. When dragging, a full-cover gesture catcher stands in for the positioning layer and must re-apply `direction`/`justify`/`flex:1`/`alignSelf:'stretch'` (`dragHostStyle`) or a left/right drawer loses full height; scrim is absolute (padding doesn't inset it), `box-none` lets empty area fall through to the scrim for taps. Drag mode disables ModalBase's static overlay (uses its own offset-driven `DragDismissOverlay`) to avoid double scrims. Drag offset reset to 0 in an EFFECT on (re)open (not during render — reanimated write-during-render guard).

### Fieldset

- **Purpose:** Groups related form controls under an optional legend; semantic `<fieldset>` on web.
- **Source:** packages/components/src/Fieldset/
- **Public API:** `Fieldset` with static `.Frame` and `.Legend`.
- **Key props:** `legend?: ReactNode`; `disabled?: boolean` (dims to opacity 0.6 + `pointerEvents:'none'`, and sets native `<fieldset disabled>` cascade on web).
- **Sizes:** no size scale (fixed symmetric `$lg` padding).
- **Variants/colors:** `variant?: 'default'|'filled'|'unstyled'` (@default 'default': border on `$background`; filled: `$color2` fill; unstyled: strips chrome). Also `radius` (@default 'md'), `shadow`. No color prop.
- **Slots / `styles` keys:** `root` (frame), `legend`.
- **Platform:** shared, but branches on `isWeb`: web renders `render={<fieldset disabled=… />}`, native renders `render="fieldset"` (inert tag).
- **Builds on:** Box (frame), Text (legend); hook `useId` (for `aria-labelledby`).
- **Gotchas:** Legend is rendered as a NORMAL in-flow block, NOT a native `<legend>` — a real `<legend>` inside Tamagui's flex `<fieldset>` hits the browser's "rendered legend" path and collapses to ~1px, clipping text. The semantic `<fieldset>` is kept (for the native `disabled` cascade) and named via `aria-labelledby`. `margin:0` clears the UA `<fieldset>` margin. Internal variant is `disabledState` (the public `disabled` maps onto it; `disabled` is Omit-ed from frame props to avoid clash).

### FileButton

- **Purpose:** Opens the native file picker from a Button trigger (or custom trigger); delivers picked `File`/`File[]` via `onChange`.
- **Source:** packages/components/src/FileButton/ (FileButton.tsx = web, FileButton.native.tsx = native, FileButton.shared.tsx = shared logic, FileButton.types.ts = types)
- **Public API:** `FileButton` (generic `<Multiple, TFile>` call signature). No compound parts. Re-exports the file\* types.
- **Key props:** `onChange: (payload: FileButtonValue<Multiple,TFile>) => void` (required; `File[]` if `multiple`, else `File|null`); `children?: ReactNode | (({ onClick }) => ReactNode)` (node = built-in Button label; function = custom trigger); `multiple?` (@default false); `accept?`; `name?`/`form?` (web only); `resetRef?: React.Ref<() => void>` (imperative clear); `disabled?`; `capture?: boolean|'user'|'environment'`; `inputProps?: FileButtonInputProps` (spread onto hidden web input); `pickFiles?: FileButtonPicker<TFile>` (native-only resolver, e.g. wired to expo-document-picker/expo-image-picker). Trigger props (`variant`/`size`/`leftSection`/`styles`/…) pass through to the Button.
- **Sizes:** inherits from the Button trigger (`size` passes through).
- **Variants/colors:** inherits Button's `variant`/color system through trigger props.
- **Slots / `styles` keys:** none of its own — the trigger `Button` is the kit's slot pilot, so its `styles` (`label`/`left`/`right`/`loader`) flow straight through.
- **Platform:** `.native` split (WHY: RN has no `<input type="file">` host — web clicks a hidden input; native resolves `onClick` against the `pickFiles` resolver). Both builds share `FileButton.shared` (`toSelection` payload normalizer, `renderTrigger`) and `FileButton.types`, so API + `onChange` payload shape are identical.
- **Builds on:** Button (default trigger); `assignRef` (re-exported from `@knitui/hooks`), `useMergedRef` (web).
- **Gotchas:** Web `reset()` clears `input.value=''` so the same file can be re-picked; native `reset()` is a no-op (selection delivered eagerly). Native warns to console if `pickFiles` is missing. `ref` forwards to the hidden `<input>` (web only). Internal `FileButtonInternalProps` widens `onChange` payload to `unknown` so one impl covers both generic cases cast-free.

### FileInput

- **Purpose:** An Input-styled control that opens the file picker and displays picked file name(s).
- **Source:** packages/components/src/FileInput/
- **Public API:** `FileInput` (single forwardRef component, ref → InputBase). No compound parts.
- **Key props:** `onChange?: (payload: FileInputValue) => void` (payload fixed to `File|File[]|null` union — pragmatic divergence from Mantine's generic `Multiple`); `value`/`defaultValue` (controlled/uncontrolled); `multiple?` (@default false); `accept?`; `name?`/`form?`; `valueComponent?: React.FC<{ value }>` (@default a truncating comma-joined file-name Text); `clearable?` (@default false); `clearButtonProps?` (@deprecated alias for `styles.clearButton`); `clearSectionMode?: 'clear'|'default'|'rightSection'|'both'` (@default 'both'); `readOnly?`; `capture?`; `fileInputProps?: FileButtonInputProps` (→ hidden input); `placeholder?`; `resetRef?`.
- **Sizes:** `size?: InputSize` (@default 'md'), passed to InputBase. Clear button size derived one key DOWN via `toEmbeddedControlSize` (field md → button sm) so it fits inside the field.
- **Variants/colors:** inherits Input/InputBase variants; theme/ramp accent, no color prop.
- **Slots / `styles` keys:** inherits Input.Wrapper chrome slots (`wrapper`/`label`/`description`/`error`/`required` via `INPUT_WRAPPER_SLOTS`, forwarded through InputBase) PLUS own: `clearButton`, `value` (default value Text), `placeholder`. `clearButton` sugar is lowest precedence; `clearButtonProps` wins.
- **Platform:** shared, but the hidden `<input type="file">` is web-only (via FileButton); the styled trigger is cross-platform (native picking needs FileButton's `pickFiles`, not surfaced here).
- **Builds on:** FileButton (function-child trigger), InputBase (`component="button"` host-tag override, `multiline`, `pointer`), Input.Placeholder, CloseButton (clear), Text; hooks `useUncontrolled`, `useMergedRef`; `internal/embedded-control-size`, `internal/styles` (`pick`/`slotStyles`).
- **Gotchas:** Uses InputBase's private `__clearSection`/`__clearable`/`__clearSectionMode` channel for the clear button. A ref (`wasPresent`) resets the underlying hidden `<input>` only when a present value transitions to empty (so the same file can be re-selected), avoiding a reset on mount. `_clearable` = `clearable && valuePresent && !readOnly && !disabled`.

### Flex

- **Purpose:** Flexbox layout primitive with Mantine's named flex props.
- **Source:** packages/components/src/Flex/
- **Public API:** `Flex` (single `styled(Box).styleable`; no parts).
- **Key props:** `align?`, `justify?`, `wrap?` (variants → `alignVariant`/`justifyVariant`/`wrapVariant`); `direction?: FlexDirection` (Mantine's `direction`, mapped to `flexDirection` in the wrapper). `gap`/`rowGap`/`columnGap` pass through as inherited Box props.
- **Sizes:** none.
- **Variants/colors:** the three flex variants only; no color prop.
- **Slots / `styles` keys:** none.
- **Platform:** shared. Base `flexDirection:'row'` (so `direction` unset stays row cross-platform, not native's default column).
- **Builds on:** Box.
- **Gotchas:** `direction` can't be a same-named variant — Tamagui reserves the `direction` prop for CSS writing-direction — so it's handled in the styleable wrapper and only mapped onto `flexDirection` when actually provided (passing `flexDirection={undefined}` would clobber the base `row` back to native's `column`). A raw `flexDirection` in rest still wins.

### FocusTrap

- **Purpose:** Keeps keyboard focus inside its single child while active; renders no DOM of its own.
- **Source:** packages/components/src/FocusTrap/
- **Public API:** `FocusTrap` with static `.InitialFocus`.
- **Key props:** `children: ReactElement` (single child that accepts a ref); `active?: boolean` (@default true); `refProp?: string` (@default 'ref'); `innerRef?: React.Ref<TamaguiElement>` (merged with the trap ref). `FocusTrap.InitialFocus` is a hidden focusable marker (`data-autofocus`, `tabIndex:-1`) rendered as first child to set the initial focus target.
- **Sizes:** n/a.
- **Variants/colors:** n/a (purely behavioural).
- **Slots / `styles` keys:** none.
- **Platform:** shared, but behaviour is web-only: on web focus moves into the region (`[data-autofocus]` → first focusable → the element) and Tab cycles; on native it's a no-op (no DOM focus model — see `useFocusTrap`), child renders unchanged.
- **Builds on:** VisuallyHidden (InitialFocus); hooks `useFocusTrap`, `useMergedRef`.
- **Gotchas:** Clones the child and attaches the trap ref via `refProp`; reads the child's existing ref (under `refProp` or the `ref` slot) first and merges it so cloning doesn't clobber it.
