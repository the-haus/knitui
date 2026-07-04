## Batch 5

Loader, LoadingOverlay, Mark, Marquee, MaskInput, Menu, Modal, MultiSelect, NativeSelect, NavLink, Notification, NumberFormatter

---

### Loader

- **Purpose:** Multi-type loading indicator (`oval` | `dots` | `bars`), mirrors Mantine's `Loader`.
- **Source:** packages/components/src/Loader/
- **Public API:** `Loader` (withStaticProperties) + `Loader.Frame`, `Loader.Ring`, `Loader.Dot`, `Loader.Bar`. Exports types `LoaderProps`, `LoaderSize`, `LoaderType`.
- **Key props:** `type?: "oval" | "dots" | "bars"` (@default `"oval"`); `size?: SizeKey | number` (@default `"md"`); `"aria-label"?: string` (@default `"Loading"`); `role?: "progressbar"`. NO `color` prop — accent is theme ramp `$color9` via the `theme` prop.
- **Sizes:** Yes — `SizeKey` (`xxs`–`xxl`) via `heightVariant`; ring uses `squareSizeVariantFallthrough`; px resolved by `resolveSizePx`. Default `md`. Ring stroke DERIVED at render: `ringBorderWidth = max(2, round(diameter/10))`.
- **Variants/colors:** No variant/variant-colors; accent hardcoded to `$color9` track/`$color5` (theme-driven).
- **Slots / `styles` keys:** No `styles` map. Compound parts only.
- **Platform:** shared. Motion via internal `useLoopingAnimation` + `LoopView` (compositor `@keyframes` on web / reanimated UI-thread loop on native). Reduced motion honored inside the hook (static frame).
- **Builds on:** Box, Text (via parts), internal `use-looping-animation` (`LoopView`, `useLoopingAnimation`), `control-metrics`.
- **Gotchas:** Animated `style` MUST ride on `LoopView` — spreading a reanimated style onto a plain Box is a no-op on web and throws under reanimated 4 ("frozen object"). `oval` uses one `spin` loop; `dots`/`bars` give each of 3 elements its OWN staggered pulse loop (`PULSE_MS = [560,640,720]`) — no lockstep. Hooks declared unconditionally for stable order.

---

### LoadingOverlay

- **Purpose:** Covers its parent with a centered `Loader` over a scrim; mirrors Mantine's `LoadingOverlay`.
- **Source:** packages/components/src/LoadingOverlay/
- **Public API:** `LoadingOverlay` (single component, built via `Overlay.styleable`). Exports `LoadingOverlayProps`, `LoadingOverlayStyles`, `LoadingOverlayLoaderStyle`, `LoadingOverlayOverlayStyle`.
- **Key props:** `visible?: boolean` (@default `false` — renders `null` when false); `styles?: { overlay, loader }`; deprecated `overlayProps`/`loaderProps` aliases; `zIndex` (@default `400`). Loader slot is a cross-platform-safe `Pick<LoaderProps,"aria-label"|"size"|"type">`; overlay slot is `Pick<OverlayProps,"backgroundOpacity"|"backgroundColor"|"blur"|"radius">`.
- **Sizes:** Inherits Loader sizing via the `loader` slot; no own size scale.
- **Variants/colors:** None; default scrim is `#fff` @ `backgroundOpacity=0.75` (matches Mantine light wash).
- **Slots / `styles` keys:** `overlay` (scrim), `loader` (centered spinner). Both low-precedence sugar; deprecated `overlayProps`/`loaderProps` merge OVER their slot ("explicit beats sugar").
- **Platform:** shared. NOTE: Mantine's web-only enter/exit `transitionProps` wrapper is intentionally omitted — visibility is a plain mount/unmount.
- **Builds on:** Overlay, Loader, internal `styles` (`slotStyles`).
- **Gotchas:** none noted.

---

### Mark

- **Purpose:** Highlighted inline text (semantic `<mark>` on web with tinted fill); mirrors Mantine's `Mark`.
- **Source:** packages/components/src/Mark/
- **Public API:** `Mark` (single styled `Text` via `.styleable`). Exports `MarkProps`.
- **Key props:** Full `Text` surface (`size`, `fw`, `truncate`, …). No `color` prop — tint is `$color5` fill / `$color12` text from theme ramp (`theme="yellow"` recolors).
- **Sizes:** Inherits Text's `size`.
- **Variants/colors:** None; theme-ramp tint only.
- **Slots / `styles` keys:** None.
- **Platform:** shared. Renders `render="mark"` (host `<mark>` on web).
- **Builds on:** Text.
- **Gotchas:** none noted.

---

### Marquee

- **Purpose:** Continuously scrolling content (horizontal/vertical); mirrors Mantine's `Marquee`.
- **Source:** packages/components/src/Marquee/
- **Public API:** `Marquee` (withStaticProperties) + `Marquee.Frame`, `Marquee.Content`, `Marquee.Group`, `Marquee.Text`. Exports `MarqueeProps`, `MarqueeStyles`, `MarqueeOrientation`.
- **Key props:** `reverse?: boolean` (@default `false`); `pauseOnHover?: boolean` (@default `false`, WEB ONLY, no-op native); `repeat?: number` (@default `4`); `duration?: number` ms (@default `100000`); `orientation?: "horizontal"|"vertical"` (@default `horizontal`); `gap` (@default `"$md"`); `fadeEdges`/`fadeEdgeColor`/`fadeEdgeSize` — accepted for Mantine parity but currently NO-OP (no cross-platform gradient primitive).
- **Sizes:** No size scale.
- **Variants/colors:** `orientation` variant only (row/column). No variant-colors.
- **Slots / `styles` keys:** `root`, `content`, `group`, `text`.
- **Platform:** shared. Motion via `useLoopingAnimation` (`shimmer` kind) + `LoopView` (compositor `@keyframes` web / reanimated native). `pauseOnHover` toggles CSS `animationPlayState` on web via `hoverProps`; native no-op. Respects reduced motion.
- **Builds on:** Box, Text, internal `use-looping-animation`, `useElementSize` (@knitui/hooks), `renderTextChild`, `useSlotTextWrapper`, `styles`.
- **Gotchas:** One group is measured (`useElementSize`), track slides exactly one group + gap; repeated copies hide snap-back. First group carries the measure ref; copies get `aria-hidden`. Travel is `0` until measured / when `duration<=0`. Text children auto-wrapped via `renderTextChild` into themed `Marquee.Text` (with `text` slot pre-bound).

---

### MaskInput

- **Purpose:** Text field that formats input against a `mask` pattern as you type; mirrors Mantine's `MaskInput`.
- **Source:** packages/components/src/MaskInput/ (masking engine in `mask-utils.ts`)
- **Public API:** `MaskInput` (built on `InputBase.styleable`). Exports `MaskInputProps`. `mask-utils` exports `MaskPattern`, `parseMask`, `processInput`, `buildDisplayValue`, `extractRaw`, `applyMaskToRaw`, `checkComplete`, `DEFAULT_TOKENS`.
- **Key props:** `mask: MaskPattern` (string like `"+1 (999) 000-0000"` or array of literals/RegExps); `tokens?: Record<string,RegExp>` (default map `9 a A * #`); `slotChar?: string|null` (@default `"_"`); `alwaysShowMask?: boolean` (@default `false`); `showMaskOnFocus?: boolean` (@default `true`); `transform?`; `autoClear?: boolean` (@default `false`); `onChangeRaw?(raw, masked)`; `onComplete?(masked, raw)`; controlled `value`/`defaultValue`/`onChange(masked)`; `resetRef?: Ref<() => void>`. `separate`/`modify`/`beforeMaskedStateChange` accepted for parity but NOT implemented (need DOM cursor/selection).
- **Sizes:** Inherits `InputBase` size chrome.
- **Variants/colors:** Inherits `InputBase` (variant/error). Theme-driven accent.
- **Slots / `styles` keys:** Inherits `InputBase` slots (no own map).
- **Platform:** shared — `mask-utils` is a cross-platform port of the PURE half of Mantine's `use-mask`, so masking works web AND native. Fine-grained DOM cursor/selection + undo/redo are web-only and intentionally NOT reproduced (the documented divergence).
- **Builds on:** InputBase; hooks `useUncontrolled`, `useCallbackRef`, `assignRef`.
- **Gotchas:** Backspace on auto-inserted trailing literals re-normalizes to same raw → detected (`rawText.length < prevDisplay.length` && raw unchanged) and last raw char dropped so backspace works. Mid-string edits NOT reconstructable (no cursor info). Placeholder chars stripped before re-processing. Renders `component="input"`, drives via `onChangeText`.

---

### Menu

- **Purpose:** Dropdown menu (click/hover/click-hover triggers); mirrors Mantine's `Menu`, built on `Popover`.
- **Source:** packages/components/src/Menu/
- **Public API:** `Menu` (withStaticProperties over `MenuRoot`) + `Menu.Target`, `Menu.Dropdown`, `Menu.Item`, `Menu.Label`, `Menu.Divider`. Exports `MenuProps`, `MenuStyles`, `MenuDropdownProps`, `MenuItemProps`, `MenuLabelProps`, `MenuDividerProps`, `MenuTrigger`, `MenuArrowPosition`.
- **Key props (Root):** `trigger?: "click"|"hover"|"click-hover"` (@default `"click"`); `openDelay?` (@default `0`) / `closeDelay?` (@default `100`) for hover; `closeOnItemClick?` (@default `true`); `closeOnEscape?`/`closeOnClickOutside?` (@default `true`, web); `menuItemTabIndex?: -1|0` (@default `-1`); `position?: PopoverPosition` (@default `"bottom-start"`); `offset?` (@default `8`); `width?: PopoverWidth` (@default `"max-content"`); `withinPortal?` (@default `true`); `keepMounted?` (@default `false`); `zIndex?` (@default `300`); `shadow?` (@default `"md"`); `withArrow?`/`arrowSize`(7)/`arrowOffset`(5)/`arrowRadius`(0)/`arrowPosition`("side"); `theme?` (wraps subtree in `<Theme>`). **Item:** `leftSection`/`rightSection`, `disabled`, `closeMenuOnClick`, `onPress`.
- **Sizes:** No size scale; radius from `RadiusTokens`.
- **Variants/colors:** No variant-colors; item hover `$color4`/press `$color5`, theme-driven.
- **Slots / `styles` keys:** `dropdown`, `item`, `itemLabel`, `itemSection`, `label`, `divider`. Resolved via `useOverlayChrome` (canonical `dropdown` + Menu extras) and distributed through `MenuContext.slots`. Slot sugar layers UNDER explicit inline props.
- **Platform:** shared, but hover triggers are web-only (`hoverProps` — no-op native; there press-toggle from `Popover.Target` drives it). `closeOnEscape`/`closeOnClickOutside` web-only. Keyboard/roving-focus is the documented web-only gap.
- **Builds on:** Popover (Target/Dropdown), Box, Text, `ControlIconProvider`, internal `overlay-chrome`, `renderTextChild`, `style-props` (`focusRingStyle`, `hoverProps`, `webCursor`).
- **Gotchas:** MenuContext throws if compound parts used outside `<Menu>`. Single hover timer (open/close mutually exclusive); item press calls `ctx.clearTimer()` before close to avoid a stale timer firing a second close. `Popover.Dropdown` gets `padding={0}` — visible padding lives on inner `MenuDropdownFrame` (which carries the `dropdown` slot). Items auto-size `@knitui/icons` in sections via `ControlIconProvider size="sm" variant="subtle" color="$color12"`. Item label wrapped via `renderTextChild` with `itemLabel` slot pre-bound.

---

### Modal

- **Purpose:** Centered/top-aligned dialog with scrim, portal, focus trap, scroll-lock, optional drag-to-dismiss; mirrors Mantine's `Modal`.
- **Source:** packages/components/src/Modal/ (`Modal.tsx`, `modal-base.tsx`, `modal-base-inner.tsx` / `.native.tsx`, `drag/`)
- **Public API:** `Modal` (withStaticProperties) + `Modal.Content`, `Modal.Header`, `Modal.Title`, `Modal.Body`, `Modal.CloseButton`. Exports `ModalProps`, `ModalStyles`, `ModalSize`, `ModalContentProps`, `ModalHeaderProps`, `ModalTitleProps`, `ModalBodyProps`. `modal-base.tsx` exports the SHARED scaffold `ModalBase`, `ModalBaseSharedProps`, `ModalChromeStyles`, `resolveModalChromeSlots`, `MODAL_CHROME_SLOTS` (reused by Drawer).
- **Key props:** `opened: boolean` + `onClose: () => void` (controlled). Content: `title`, `withCloseButton?` (@default `true`), `closeButtonProps`, `padding?` (@default `"$md"`), `withHeaderDivider?` (@default `false`), `size?: ModalSize|number|string` (@default `"md"`), `centered?` (@default `false`), `fullScreen?` (@default `false`), `radius?` (@default `"md"`), `shadow?` (@default `"xl"`), `yOffset`/`xOffset` (@default `"$xl"` — cross-platform token, NOT Mantine's web-only `5dvh`), `animation?: MotionPresetName|MotionPreset|false` (@default subtle 8px drop-in fade), `duration?`. Drag: `dragToDismiss?` (@default `false`), `dragThreshold?` (@default `0.3`), `animationConfig?: WithSpringConfig`. Base/shared: `closeOnEscape`/`closeOnClickOutside`/`lockScroll`/`returnFocus`/`trapFocus` (@default `true`, web), `withinPortal?` (@default `true`), `keepMounted?` (@default `false`), `withOverlay?` (@default `true`), `overlayProps`, `zIndex?` (@default `200`), `overlayAnimation?` (@default `"fade"`).
- **Sizes:** Yes — `SizeKey` via `modalSizeVariant` (content `maxWidth` cap); `fullScreen` overrides `maxWidth` at instance level.
- **Variants/colors:** Content `radius`/`shadow`/`size`/`fullScreen` variants; no variant-colors (theme `$background`).
- **Slots / `styles` keys:** `overlay`, `content`, `header`, `title`, `body`, `closeButton` (shared `ModalChromeStyles`). `overlay`/`closeButton` are low-precedence sugar under `overlayProps`/`closeButtonProps`.
- **Platform:** SPLIT. Positioning layer `ModalBaseInner` is platform-split: `.tsx` = plain `styled(View)` inset-0 Box (web — soft keyboard doesn't reflow); `.native.tsx` = `styled(KeyboardAvoidingView)` with baked-in `behavior="padding"` so the panel lifts above the keyboard. `trapFocus`/Escape/scroll-lock/return-focus are web-only (no-op native). Drag primitives platform-split (see below). Native uses `ScrollArea.Autosize` w/ measured concrete `maxHeight`; web (+ native fullScreen) uses `flexGrow` scroll path.
- **Builds on:** Box, Text, CloseButton, Overlay, Portal, ScrollArea (`ScrollArea.Autosize`), `AnimatePresence`/`Theme`/`useThemeName` (@knitui/core), `useFocusTrap`, `useElementSize`, `useViewportSize`, `useId`, internal `motion` (`useMotionPreset`), `drag/` primitives, `renderTextChild`.
- **Drag sub-system (`Modal/drag/`):** `useDragDismiss` (RNGH `Gesture` + reanimated shared value), `DragDismissHost` (translate host — `.tsx` native / `.web.tsx`), `DragDismissOverlay` (offset-driven scrim — split), pure math in `engine.ts` (`shouldDismiss`, `dragOverlayOpacity`). Shared with Drawer (Modal = axis `y`, sign `-1` drags UP; Drawer per-edge). When dragging, ModalBase's static overlay is disabled (`withOverlay=false`) and a drag layer renders its own offset-driven scrim + a full-cover `GestureDetector` catcher (so the modal drags from backdrop too; `box-none` lets margin taps fall through to scrim).
- **Gotchas:** `maxHeight:"100%"` resolves only because the positioning layer is inset-0 (definite-height parent). On native the hugging panel has NO definite height → a `flexGrow` body collapses to 0 (Yoga), so native non-fullScreen measures an inert inset-0 probe box + header height and feeds a concrete `maxHeight` to `ScrollArea.Autosize` (mirrors Collapse fix). `fullScreen` fills via flex (`flex:1`+`alignSelf:"stretch"`), not `height:"100%"` (unreliable on RN). Return-focus captures `document.activeElement` DURING render on the opening edge (focus trap moves focus before any effect). Volatile props read through refs so effects depend only on `opened`. `AnimatePresence` sits OUTSIDE the Portal (presence protocol survives teleport). Drag offset reset to 0 in an effect on (re)open (writing shared value mid-render trips reanimated guard). Escape ignored if `defaultPrevented` (nested dropdowns).

---

### MultiSelect

- **Purpose:** Multi-value select (fixed `Value = string`) with removable pills; mirrors Mantine's `MultiSelect`, built on `Combobox` + `PillsInput`.
- **Source:** packages/components/src/MultiSelect/ (single large file)
- **Public API:** `MultiSelect` (sugar wrapper, withStaticProperties) + `MultiSelect.Root`, `.Trigger`, `.Pills`, `.Pill`, `.Dropdown`, `.Options`, and re-exports `.Option`/`.Group`/`.Empty`/`.Chevron`/`.ClearButton` (from Combobox). Exports `MultiSelectProps`, `MultiSelectRootProps`, `MultiSelectTriggerProps`, `MultiSelectDropdownProps`, `MultiSelectOptionsProps`, `MultiSelectPillProps`, `MultiSelectPillsProps`, `MultiSelectStyles`, `MultiSelectRef`.
- **Key props:** `data?: ComboboxData`; controlled `value?: string[]`/`defaultValue`/`onChange`; `onRemove`/`onClear`/`onMaxValues`; `searchValue`/`defaultSearchValue`/`onSearchChange`; `maxValues?` (@default `Infinity`); `searchable?` (@default `false`); `selectFirstOptionOnChange?` (@default `false`); `clearSearchOnChange?` (@default `true`); `filter?: OptionsFilter`; `renderOption`/`renderPill`; `nothingFoundMessage`; `withCheckIcon?` (@default `true`); `checkIconPosition?` (@default `"left"`); `hidePickedOptions?` (@default `false`); `clearable?` (@default `false`); `clearSectionMode?: "clear"|"default"|"rightSection"|"both"` (@default `"both"`); `size?: ComboboxSize` (@default `"md"`); `limit?`; `maxDropdownHeight?` (@default `250`); `withScrollArea?` (@default `true`); `hiddenInputName`/`form`/`hiddenInputValuesDivider` (@default `","`); `comboboxProps`. NOTE: `filter` is Omit-ed from inherited props so Mantine's options-filter fn can take that name (CSS `filter` would collide).
- **Sizes:** Yes — `ComboboxSize`, default `md`. Embedded pills derive a step-DOWN size via `toEmbeddedControlSize` (field md → pills sm).
- **Variants/colors:** Inherits Input/Combobox chrome; theme-driven, no variant-colors.
- **Slots / `styles` keys:** `root`, `trigger`, `pills`, `pill`, `dropdown`, `options`, `option`, `group`, `empty`, `chevron`, `clearButton`. Sugar path forwards ONLY `INPUT_WRAPPER_SLOTS` to the trigger's `PillsInput` (via `pick`) so Input.Wrapper doesn't warn about slots it doesn't own. Deprecated `comboboxProps`→`root`, `clearButtonProps`→`clearButton` merge OVER their slot.
- **Platform:** shared. Keyboard nav (Arrow/Enter/Backspace/Escape) is WEB-ONLY (documented roving-focus gap, same as Menu/Select); on native options select by press, pills remove via their button.
- **Builds on:** Combobox (Target/Dropdown/OptionsDropdown/Options/ClearButton/Chevron/HiddenInput + `useCombobox`), PillsInput (+ `.Field`), Pill (+ `Pill.Group`), internal `embedded-control-size`, `styles` (`slotStyles`/`pick`), Input `shared` (`INPUT_WRAPPER_SLOTS`).
- **Gotchas:** Sugar `<MultiSelect>` funnels chrome props + ref to `MultiSelect.Trigger` via Root context (`__triggerProps`) so sugar and composable paths converge on the same trigger. Backspace with empty search removes the LAST pill. `selectFirstOptionOnChange` uses a ref (`selectFirstPending`) to avoid racing the filter memo. Context value intentionally NOT stable (handlers close over render state). Clear+chevron coexistence via `composeTriggerRightSection` (not PillsInput's private channel). `MultiSelectContext` throws outside `<MultiSelect.Root>`.

---

### NativeSelect

- **Purpose:** Labeled native `<select>` field; mirrors Mantine's `NativeSelect`, keeping shared input label/description/error chrome.
- **Source:** packages/components/src/NativeSelect/ (`.tsx` web, `.native.tsx` fallback)
- **Public API:** `NativeSelect` (single forwardRef). Exports `NativeSelectProps`.
- **Key props:** `data?: ComboboxData` (bare strings, `{value,label,disabled}`, or `{group,items}`); `children?` (raw `<option>`/`<optgroup>` nodes — override `data`, web only); `size?` (@default `"md"`); `error`, `variant?` (@default `"default"`), `radius`, `leftSection`/`rightSection`, `disabled`/`readOnly`/`required`, wrapper props (`label`/`description`/`withAsterisk`/…). `onChange`/`onFocus`/`onBlur` typed for `HTMLSelectElement` (NOT the inherited text-input handlers).
- **Sizes:** Yes — `InputSize` via `inputHostSizeVariant`, default `md`.
- **Variants/colors:** Input chrome `variant` (`default`/`unstyled`), theme-driven.
- **Slots / `styles` keys:** Reuses `INPUT_CHROME_SLOTS` (via `pick`) + `InputWrapper` slots (`styles` forwarded to both wrapper and control).
- **Platform:** SPLIT. `.tsx` renders a REAL `<select>`/`<option>`/`<optgroup>` host tree (`styled(Text, { render: "select" })` + `appearance:none` on web). `.native.tsx` renders a read-only input-shaped field showing the selected label (via `getDisplayValue` over flattened options) — those host tags are invalid in RN, so there's no platform-neutral select primitive.
- **Builds on:** Combobox (`Combobox.Chevron` default right section), Input `shared` (`InputChrome`, `InputWrapper`, `InputWrapperContext`, `registerInputFocusable`), InputBase (native path), Text, internal `combobox-data`, `styles` (`pick`).
- **Gotchas:** Web registers both a Tamagui focusable (`registerFocusable`) and an input focusable so wrapper label clicks focus the select. Native forces `readOnly` (`?? true`) and displays label only — no dropdown. `pointer` + default chevron right section on both.

---

### NavLink

- **Purpose:** Navigation link row with optional nested children + disclosure chevron; mirrors Mantine's `NavLink`.
- **Source:** packages/components/src/NavLink/
- **Public API:** `NavLink` (withStaticProperties) + `NavLink.Root`, `.Body`, `.Label`, `.Description`, `.Section`, `.Chevron`, `.Children`. Exports `NavLinkProps`, `NavLinkStyles`, `NavLinkVariant`.
- **Key props:** `label?`/`description?`/`leftSection?`/`rightSection?: ReactNode`; `active?` (@default `false`); `variant?: "filled"|"light"|"subtle"` (@default `"light"`); `noWrap?` (@default `false`); `children?` (nested NavLinks); controlled `opened?`/`defaultOpened?` (@default `false`)/`onChange(opened)`; `disableRightSectionRotation?` (@default `false`); `keepMounted?` (@default `true`); `childrenOffset?` (@default `"$lg"`); `disabled?` (@default `false`).
- **Sizes:** No size scale (fixed `$sm`/`$xs` typography and paddings).
- **Variants/colors:** `variant` (filled/light/subtle) + `active`/`disabled` variants. Active inline styles: filled→`$color9` bg + `$color1` label; light→`$color4`; subtle→transparent. Theme-driven, no variant-colors.
- **Slots / `styles` keys:** `wrapper`, `root`, `body`, `label`, `description`, `leftSection`, `rightSection`, `chevron`, `children`. (`leftSection`/`rightSection` both target the shared `.Section` part.)
- **Platform:** shared. `useKeyboardActions` makes the plain-Box row focusable + Space/Enter-activatable on web (maps to accessibility actions on native).
- **Builds on:** Box, Text, `useKeyboardActions`/`useUncontrolled` (@knitui/hooks), internal `motion` (`useReducedTransition`), `style-props` (`focusRingStyle`, `webCursor`), `styles`.
- **Gotchas:** `NavLinkRoot` is a plain Box (`role="link"`) the browser won't tab to, so its `focusRingStyle` needs `useKeyboardActions` to add `tabIndex`/activation (focus-ring pairing contract). Pressing toggles open state only when `hasChildren`. Chevron is the literal `▼` char rotated `180deg` when open. Nested children kept mounted (`keepMounted` @default true) toggling `display` when closed. `aria-expanded` set only when children exist.

---

### Notification

- **Purpose:** Self-contained notification tile (accent line / icon badge / title+message / close); mirrors Mantine's `Notification`.
- **Source:** packages/components/src/Notification/
- **Public API:** `Notification` (withStaticProperties) + `.Body`, `.Frame`, `.Icon`, `.IconText`, `.Content`, `.Title`, `.Message`. Exports `NotificationProps`, `NotificationStyles` + part prop types.
- **Key props:** `title?`/`children?` (message body); `icon?: ReactNode` (shown in themed circular badge, replaces accent line); `loading?` (@default `false`, shows a `Loader`, takes precedence over icon); `withCloseButton?` (@default `true`); `onClose?`; `closeButtonProps?: { "aria-label"? }`; `loaderProps?: Pick<LoaderProps,"size"|"type">`; `radius?` (@default `"md"`); `withBorder?`.
- **Sizes:** No size scale; icon badge is `$xl` square; loader `size="xs"`.
- **Variants/colors:** `radius` + `withBorder` + internal `hasIcon` variants. Accent `$color9` line/badge, theme-driven; no variant-colors, no `color` prop.
- **Slots / `styles` keys:** `icon`, `body`, `title`, `message`, `content`, `loader`, `closeButton`. `loader`/`closeButton` deliberately reach into sub-components (no matching `.X` static). Deprecated `loaderProps`/`closeButtonProps` merge OVER their slots.
- **Platform:** shared.
- **Builds on:** Box, Text, CloseButton, Loader, `ControlIconProvider`, `renderTextChild`, `style-props` (`radiusVariant`, `shadowVariant`), `styles`, `useId`.
- **Gotchas:** Left `$color9` accent line shows ONLY when there is no icon badge (`hasIcon=false`). Pure-text body → single themed `Message`; ANY element child → `Content` Box (so rich content isn't trapped in `<Text>`; text runs stay themed via `renderTextChild`). Non-text `icon` wrapped in `ControlIconProvider color="$color1" size="sm"` (contrast on the `$color9` badge). `role="alert"` with wired `aria-labelledby`/`aria-describedby`.

---

### NumberFormatter

- **Purpose:** Pure display component formatting a number (thousands separators, decimal rounding, prefix/suffix); mirrors Mantine's `NumberFormatter`.
- **Source:** packages/components/src/NumberFormatter/
- **Public API:** `NumberFormatter` (single styled `Text` via `.styleable`). Exports `NumberFormatterProps`.
- **Key props:** `value?: number|string`; `allowNegative?` (@default `true`); `decimalScale?` (@default `Infinity`); `decimalSeparator?` (@default `"."`); `fixedDecimalScale?` (@default `false`); `prefix?`/`suffix?`; `thousandsGroupStyle?: "thousand"|"lakh"|"wan"|"none"` (@default `"none"`); `thousandSeparator?: string|boolean` (`true`→`","`).
- **Sizes:** Inherits Text's `size`.
- **Variants/colors:** None (Text surface).
- **Slots / `styles` keys:** None.
- **Platform:** shared. Self-contained (no `react-number-format` dependency, unlike Mantine).
- **Builds on:** Text.
- **Gotchas:** Non-finite parsed value renders raw `String(value)`. Renders `null` for empty/undefined/null value. Grouping: `lakh` = 2-digit groups after first 3; `wan` = 4-digit; else 3-digit (`groupDigits` regex). When `thousandSeparator` set but `thousandsGroupStyle="none"`, style falls back to `"thousand"`.
