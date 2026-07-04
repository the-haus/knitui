## Batch 6

### NumberInput

- **Purpose:** Numeric text field with ▲/▼ stepper controls, keyboard stepping, and clamping.
- **Source:** packages/components/src/NumberInput/
- **Public API:** `NumberInput` (built on `InputBase.styleable`) with static parts `NumberInput.Controls` (stepper column), `.Increment`, `.Decrement` (both the same `StepControl`), `.ControlIcon`. Also exports `NumberInputProps`, `NumberInputValue` (`number | string`), `NumberInputHandlers`, `NumberInputStyles`.
- **Key props:** `value`/`defaultValue`/`onChange` (value is `number` OR an intermediate string like `""`,`"-"`,`"1."`); `min`/`max`/`step` (default 1); `startValue` (step-from-empty, default 0); `clampBehavior: "strict" | "blur" | "none"` (default `"blur"`); `allowNegative`/`allowDecimal` (default true); `decimalScale`; `allowLeadingZeros`/`trimLeadingZeroesOnBlur` (default true); `selectAllOnFocus` (web only); `hideControls`; `withKeyboardEvents` (ArrowUp/Down step, default true); `stepHoldDelay` + `stepHoldInterval` (hold-to-repeat; interval can be `(count)=>ms`); `handlersRef` (populated with `{increment, decrement}`); `onMaxReached`/`onMinReached`. `prefix`/`suffix` accepted for Mantine parity but NOT rendered (needs react-number-format, not a cross-platform dep).
- **Sizes:** `SizeKey` (xxs–xxl), default `md`. Stepper column has its own narrower per-size width table `STEPPER_COLUMN_WIDTH` (16→40px) plus a small per-size triangle glyph ladder (`stepperIconSizeVariant`, 6→15px) keyed off the same size.
- **Variants/colors:** No own variant; accent/theme via Tamagui `theme` prop + palette ramp. Controls use `$color3`/`$color5` hover/press.
- **Slots / `styles` keys:** Extends `InputWrapperSlots` (`wrapper`/`label`/`description`/`error`/`required` forwarded to InputBase) plus own `controls`, `increment`, `decrement`. Chrome slots split off via `pick(styles, INPUT_WRAPPER_SLOTS)`.
- **Platform:** Shared. `selectAllOnFocus` gated on `isWeb`; `inputMode` decimal/numeric.
- **Builds on:** `InputBase` (renders stepper as the `rightSection`), `Box`, `Text`. Value via `useUncontrolled`; numeric helpers `clampOptional`/`roundTo` from internal/number-utils.
- **Gotchas:** Value is intentionally `number | string` to preserve editing states (leading zeros / bare `"-"`). Stepper hidden when `readOnly` or `hideControls`. Hold-to-step only engages when BOTH `stepHoldDelay` and `stepHoldInterval` are set. A caller `rightSection` replaces the stepper entirely (`rightSection ?? controls`). `decimalPlaces` precision math avoids float drift when stepping.

### Overlay

- **Purpose:** Full-cover translucent scrim/dimmer (Mantine `Overlay`) — a neutral wash, not a theme accent.
- **Source:** packages/components/src/Overlay/
- **Public API:** `Overlay` (`OverlayFrame.styleable`), `OverlayProps`.
- **Key props:** `backgroundOpacity` (0–1, default 0.6); `backgroundColor` (literal wash, default `"#000"` — hex parsed to `rgba()` via internal `toRgba`); `blur` (web-only `backdrop-filter`, no-op native); `gradient` (web-only CSS `background-image`; when set, backgroundColor/opacity ignored); `fixed` (switches `absolute`→`fixed`, default false); `zIndex` (default 200); `center` variant (flex-centers children); `radius` variant.
- **Sizes:** none (fills parent via top/left/right/bottom `$0`).
- **Variants/colors:** `center`, `radius`. Deliberately NO palette ramp — it's a neutral dimmer; `backgroundColor`/`color` are Omit-ted from the frame props type and re-typed.
- **Slots / `styles` keys:** none.
- **Platform:** Shared, but `blur`/`gradient` are guarded by `isWeb` and spread via a narrowed `WebOnlyStyle` object (`backdropFilter`/`backgroundImage` aren't in Box's cross-platform style types).
- **Builds on:** `Box`.
- **Gotchas:** `pointerEvents: "auto"` is hardcoded so the scrim stays clickable even inside the pointer-events:none portal host (this is how Popover/Modal use it for outside-press dismiss). `"max-content"`-style CSS keywords not relevant here.

### Pagination

- **Purpose:** Page navigation control — numbered page buttons plus edge/step controls, with optional flush "grouped" layout.
- **Source:** packages/components/src/Pagination/
- **Public API:** Composite `Pagination` (renders a full nav) with statics: `.Root` (context provider, no auto-layout), `.Items`, `.Control`, `.Dots`, `.First`, `.Last`, `.Next`, `.Previous`. Exports `PaginationProps`, `PaginationRootProps`, `PaginationControlProps`, `PaginationDotsProps`, `PaginationStyles`, `PaginationSize`, `PaginationControlType` (`"first"|"previous"|"last"|"next"`).
- **Key props (Root):** `total` (required); `value`/`defaultValue`/`onChange` (1-based page); `siblings` (default 1); `boundaries` (default 1); `size`; `radius`; `grouped` (flush attached row, default false); `disabled`; per-action callbacks `onNextPage`/`onPreviousPage`/`onFirstPage`/`onLastPage`; `getItemProps(page)` / `getControlProps(control)` dynamic overrides; icon overrides `nextIcon`/`previousIcon`/`firstIcon`/`lastIcon`/`dotsIcon` (defaults `›`/`‹`/`‹‹`/`››`/`…`). **Composite adds:** `withControls` (prev/next, default true), `withEdges` (first/last, default false), `withPages` (default true), `hideWithOnePage` (default false).
- **Sizes:** `SizeKey`, default `md`. Per-size variant sets square `width/height/minWidth` + `borderRadius` + `paddingHorizontal`; `:number`/`:string` fallthrough via `squareSizeVariantFallthrough`. Root's size variant also scales the inter-control `gap`.
- **Variants/colors:** Control frame variants `size`, `radius`, `active` (`$color9` fill + `$color1` text), `disabled`. `grouped` root variant sets `gap:0`.
- **Slots / `styles` keys:** `root` (nav frame), `item` (numbered page controls), `control` (edge/step controls), `dots`. Precedence: slot sugar < `getItemProps`/`getControlProps` < grouped-edge `extra`.
- **Platform:** Shared. Controls are plain `Box role="button"` (not focusable alone) so `useKeyboardActions` adds focusability + Space/Enter activation on web / a11y actions on native.
- **Builds on:** `Box`, `Text`; `usePagination` + `DOTS` + `useKeyboardActions` from `@knitui/hooks`. Range/state shared to parts via `PaginationStateContext`; `size` via a Tamagui styled context.
- **Gotchas:** Compound parts throw if rendered outside `Pagination.Root`. Grouped layout can't edge-style the fragment-rendered `Pagination.Items`, so `PaginationGroupedRow` rebuilds the flat control list from state and applies `edgeStyleFor` (squares inner corners, `marginLeft:-1` collapses shared border — same trick as Button.Group). Grouped dots become a normal-bordered cell so the outer border stays continuous.

### Paper

- **Purpose:** Generic content surface with optional elevation, radius, and border (Mantine `Paper`).
- **Source:** packages/components/src/Paper/
- **Public API:** `Paper` (`PaperFrame.styleable`), `PaperProps` (= `GetProps<typeof PaperFrame>`).
- **Key props:** `shadow` (xs→xl via `shadowVariant`), `radius` (default `md`), `withBorder` (1px `$borderColor`). No shadow/border by default.
- **Sizes:** none.
- **Variants/colors:** `shadow`, `radius`, `withBorder`. Background `$background`; no palette ramp.
- **Slots / `styles` keys:** none.
- **Platform:** Shared.
- **Builds on:** `Box`.
- **Gotchas:** none noted.

### Paragraph

- **Purpose:** Body paragraph — `Text` rendered as a semantic `<p>` (Mantine `Text component="p"`).
- **Source:** packages/components/src/Paragraph/
- **Public API:** `Paragraph` (`ParagraphFrame.styleable`), `ParagraphProps`.
- **Key props:** inherits all `Text` props (nothing added).
- **Sizes:** inherits Text.
- **Variants/colors:** inherits Text.
- **Slots / `styles` keys:** none.
- **Platform:** Shared. Forces `render="p"` (the Tamagui v2 host-element prop) to emit a `<p>` on web.
- **Builds on:** `Text`.
- **Gotchas:** none noted — thin wrapper.

### PasswordInput

- **Purpose:** Masked text field with a show/hide visibility toggle button (Mantine `PasswordInput`).
- **Source:** packages/components/src/PasswordInput/
- **Public API:** `PasswordInput` (`InputBase.styleable`) with static `.VisibilityToggle` (an `ActionIcon`). Exports `PasswordInputProps`, `PasswordInputStyles`, `PasswordToggleIconProps`.
- **Key props:** `visible`/`defaultVisible`/`onVisibilityChange` (controlled/uncontrolled reveal, default hidden); `withVisibilityToggle` (default true); `visibilityToggleIcon: React.FC<{reveal:boolean}>` (default glyph component `🙈`/`👁`); `visibilityToggleButtonProps` (**deprecated** alias, merged OVER the `visibilityToggle` slot).
- **Sizes:** inherits `InputBase` `InputSize`, default `md`; toggle mapped to `ActionIconSize` via `toToggleSize` (falls back to `sm`).
- **Variants/colors:** inherits InputBase; toggle is `variant="subtle"`.
- **Slots / `styles` keys:** `InputWrapperSlots` (forwarded to InputBase via `pick`) + `visibilityToggle` (ActionIcon props).
- **Platform:** Shared. Toggling `type` to `"password"` engages native `secureTextEntry` via the Input host, so masking works cross-platform.
- **Builds on:** `InputBase`, `ActionIcon`, `Text`. Reveal state via `useUncontrolled`.
- **Gotchas:** A caller-supplied `rightSection` takes precedence over the toggle (`rightSection ?? toggleButton`). Toggle hidden when `disabled`. Toggle gets `tabIndex={-1}` + `aria-pressed` (kept out of tab order like Mantine). `autoComplete` defaults to `"off"`.

### Pill

- **Purpose:** Small rounded label chip, optionally with a remove button; groupable (Mantine `Pill`).
- **Source:** packages/components/src/Pill/
- **Public API:** `Pill` (`PillFrame.styleable`) with statics `.Group`, `.Label`, `.Frame`, `.RemoveButton` (a `CloseButton`). Exports `PillProps`, `PillGroupProps`, `PillStyles`, `PillSize`, `PillVariant`, `PillGroupContext`/`PillGroupContextValue`.
- **Key props:** `variant`; `size`; `withRemoveButton` (default false); `onRemove`; `removeButtonProps` (merged OVER the `removeButton` slot); `disabled` (also inherited from Group); `gradient: GradientValue` (for `variant="gradient"`). **Group:** `size`, `gap` (default `$xs`), `disabled` — provided via `PillGroupContext`.
- **Sizes:** `SizeKey`, default `sm` (or inherited from enclosing `Pill.Group`/PillsInput). Uses `controlGapVariant`/`controlFontVariant`. Remove button size/icon mapped per pill size via `REMOVE_BUTTON_SIZE`/`REMOVE_ICON_SIZE` (step-down tables).
- **Variants/colors:** `variant: "default" (`$color4`) | "contrast" (`$color9`solid accent,`$color1`text) | "gradient" (transparent base, painted by`useGradient`, white label + white remove glyph)`. Accent via `theme` prop, never a Mantine `color` prop. Also `radius`, `disabled` variants.
- **Slots / `styles` keys:** `label` (PillLabel), `removeButton` (CloseButton). Text children wrapped in `Pill.Label` via `renderTextChild` so `styles.label` binds.
- **Platform:** Shared (gradient: web CSS backgroundImage / native SVG layer via `useGradient`).
- **Builds on:** `Box`, `Text`, `CloseButton`. Group inheritance uses both a Tamagui styled `PillContext` (size/variant) and a React `PillGroupContext` (size/disabled).
- **Gotchas:** Two contexts coexist. Remove-button precedence: gradient white-icon default < `removeButton` slot < deprecated `removeButtonProps` < forced aria-label/press handler. `alignSelf: flex-start` so a pill hugs its content.

### PillsInput

- **Purpose:** Multiline `Input`-styled shell hosting a `Pill.Group` + an editable field (Mantine `PillsInput`); base for tag/multiselect UIs.
- **Source:** packages/components/src/PillsInput/
- **Public API:** `PillsInput` (forwardRef) with static `.Field`. Exports `PillsInputProps`, `PillsInputFieldProps`, `PillsInputContext`/`PillsInputContextValue`.
- **Key props (shell):** full InputWrapper chrome (`label`/`description`/`error`/`required`/`withAsterisk`/…), `size`, `variant`, `radius`, `disabled`, `pointer`, left/right sections, `loading`/`loadingPosition`, `rootRef` (extra ref to the bordered frame, merged with `ref` — lets it act as a `Combobox.Target`). **Field:** `type: "auto"|"visible"|"hidden"` (hidden collapses to a 1px focusable sliver for non-searchable selects, default `"visible"`), `pointer`.
- **Sizes:** `InputSize`, default `md`. Hosted pills step DOWN from field size via `toEmbeddedControlSize(size)` (a `md` field → `sm` pills), provided through `PillGroupContext`.
- **Variants/colors:** `InputVariant` (default), accent via `theme` prop.
- **Slots / `styles` keys:** inherits `InputWrapper` `styles` (passed straight through to `InputWrapper`).
- **Platform:** Shared.
- **Builds on:** `InputWrapper` + `InputChrome` (from Input/shared) for the bordered multiline frame, `Input` (the inner `variant="unstyled"` field), `Pill` via `PillGroupContext`. Field focus/blur reported up through `PillsInputContext.setFocused` so the shell border lights up (`$borderColorFocus`).
- **Gotchas:** The field is a SEPARATE child from the shell, so the shell can't read its focus directly — hence the `setFocused` callback in context. Pressing anywhere in the shell (`onRootPress`) focuses the field. Wrapper is `flexWrap:"wrap"`, `alignItems:"flex-start"`, `padding:$xs`.

### PinInput

- **Purpose:** Row of single-character inputs for codes / OTP entry (Mantine `PinInput`).
- **Source:** packages/components/src/PinInput/
- **Public API:** `PinInput` (`PinInputRow.styleable`) with statics `.Row` and `.Field` (the per-char `Input`). Exports `PinInputProps`, `PinInputStyles`, `PinInputType` (`"alphanumeric"|"number"|RegExp`), `PinInputSize`, `PinInputHostType`, `PinInputMode`.
- **Key props:** `value`/`defaultValue`/`onChange` (string); `onComplete` (fires once all fields filled); `length` (default 4); `type` (default `"alphanumeric"` — controls accepted chars via `REGEX` or a custom RegExp); `mask` (renders `type="password"`, default false); `inputType`/`inputMode` (host overrides, inferred if unset); `placeholder` (default `"○"`); `size`; `radius`; `gap` (default `$xs`); `disabled`; `error`; `readOnly`; `autoFocus` (first field); `manageFocus` (auto-advance, default true); `oneTimeCode` (`autocomplete="one-time-code"`, default true); `ariaLabel`; `getInputProps(index)` per-field escape hatch.
- **Sizes:** `InputSize`, default `md`. Each field's width/height derived from `squareSizeVariant[key]` via `toFieldSize` (custom size passed through).
- **Variants/colors:** inherits `Input`; accent via `theme` prop.
- **Slots / `styles` keys:** `field` (spread onto EVERY per-char `Input`). Precedence: `field` slot < per-index `getInputProps` (more explicit wins).
- **Platform:** Shared. Cross-platform focus advance via a `Focusable` (`{focus?}`) ref array.
- **Builds on:** `Input`; `useUncontrolled` over a `string[]`, `useCallbackRef` for stable-identity handlers, `useId`, `useMergedRef`.
- **Gotchas:** RN (esp. Android) doesn't reliably fire onKeyPress for Backspace, so `onChangeText === ""` is the dependable "go back" signal (moves focus to previous field). A >2-char paste into one field distributes across all fields. The LAST field re-asserts its char on continued typing (nowhere to advance), so only Backspace clears it. Web-form `name`/`form` hidden-input parity and multi-field paste distribution are deferred.

### Popover

- **Purpose:** Core anchored-overlay primitive — positions a dropdown against a target via the vendored floating engine, teleports it into a portal, animates enter/exit; the base for Menu/Select/Combobox/Tooltip/HoverCard families.
- **Source:** packages/components/src/Popover/ (`Popover.shared.tsx` = engine + API + presentation; `Popover.tsx` = web dropdown; `Popover.native.tsx` = native dropdown)
- **Public API:** `Popover` = `withStaticProperties(PopoverRoot, { Target, Dropdown })`. Exports many types: `PopoverProps`, `PopoverPosition` (= floating `Placement`), `PopoverWidth` (`"target"|"max-content"|number`), `PopoverOffset`/`PopoverAxesOffsets`/`PopoverAxisOffset`, `PopoverArrowPosition`/`PopoverArrowOffset`/`PopoverArrowStyle`, `PopoverDropdownProps`, `PopoverDropdownStyle`, `PopoverStyles`, `PopoverTargetProps`.
- **Key props (Root):** `opened`/`defaultOpened`/`onChange`/`onOpen`/`onClose`; `position` (default `"bottom-start"`); `onPositionChange` (fires with RESOLVED placement after flip/shift); `offset` (space token/number main-axis gutter OR `{mainAxis,crossAxis,alignmentAxis}`, default `$xs`); `width` (default `"max-content"`); `withinPortal` (default true); `keepMounted` (default false, adds `display:none`); `zIndex` (default 300); `strategy` (default `"fixed"`); `radius`; `shadow` (default `md`); `disabled`; `closeOnClickOutside`/`closeOnEscape` (default true); `trapFocus` (web, default false); `returnFocus` (web, default false); `withOverlay` (scrim, default false); `overlayProps` (**deprecated** alias, merged OVER `overlay` slot); `onDismiss` (outside-press/Escape only, distinct from onClose); `withRoles` (ARIA dialog wiring, **default false** — Mantine defaults true, but Menu/Select/Combobox pass false and set own roles); `transitionProps` (`OverlayTransitionConfig`: transition/duration/exitDuration/timingFunction); `animation` (`MotionPresetName` sugar over `transitionProps.transition`); `withArrow`/`arrowSize` (default 7)/`arrowOffset` (default `$xxs`)/`arrowRadius` (default 0)/`arrowPosition` (default `"side"`). **Target:** `refProp` (default `"ref"`), `withPressToggle` (default true — set false when consumer drives open/close, e.g. focus-driven combobox), `referenceRefProp` (attach the positioning/measuring ref to a SEPARATE prop like `rootRef` so `width:"target"` measures an outer wrapper, not the inner input). **Dropdown:** `hidden` (hide without unmount).
- **Sizes:** none per se; `shadow` scale + `radius` tokens.
- **Variants/colors:** dropdown frame variants `hidden`, `shadow`; `$background` fill + `$borderColor` border, `$sm` default radius. Theme re-applied inside the portal.
- **Slots / `styles` keys:** `overlay` (Overlay scrim, layers UNDER deprecated `overlayProps`), `dropdown` (frame props), `arrow` (appearance-only subset: `background`/`borderColor`/`borderWidth`/`radius` — positioning props stay internal). Resolved via shared `useOverlayChrome`.
- **Platform:** `.web`/`.native` split for the Dropdown only; presentation (`PopoverDropdownView`) is shared. WHY: dismissal has no cross-platform mechanism — web uses `document` pointerdown/keydown listeners with a purely-visual scrim; native uses a full-cover `Overlay` scrim to catch the outside-tap (+ `useDismissOnScroll`, `onLayout` re-measure since floating `autoUpdate` is a no-op on native, + a `onStartShouldSetResponder` claim so taps on the dropdown don't fall through to the scrim on Android, + `dismissKeyboard` on scrim press so focus-driven triggers reopen).
- **Builds on:** vendored `floating` engine (`useFloating` + `offset`/`flip`/`shift`/`limitShift`/`arrow` middleware, plus a custom `referenceWidthMiddleware` for `width:"target"`), `Portal` (teleport, `hostName="root"`), `Overlay` (scrim), `FloatingArrow`, `Box`, `Theme` (re-applied in portal), `useOverlayTransition` (shared Transition engine owning lazy mount/unmount + reduced-motion), `useFocusTrap`, `useUncontrolled`, `useId`.
- **Gotchas:** Compound parts throw outside `<Popover>`. `width:"max-content"` is web-only (native leaves width unset — Yoga rejects the keyword). `position:"fixed"` is web-only; the frame's default is overridden per platform (`fixed` web / `absolute` native). Dropdown hidden (opacity 0) until `isPositioned` to avoid a flash at top-left origin. Transition style wins on opacity/transform; `top`/`left` stay instant (never animated). Scrim + frame are kept as direct siblings under `<Theme>` because native `zIndex` is strictly sibling-relative (frame = `zIndex`, scrim = `zIndex-1`). `returnFocus`/`instanceof HTMLElement` fully gated on `isWeb` (evaluating `HTMLElement` throws under Hermes). Dropdown re-enables `pointerEvents:"auto"` (the portal host is pointer-events:none).

### Portal

- **Purpose:** Cross-platform teleport system — real native view re-parenting so overlays escape clipping/stacking ancestors.
- **Source:** packages/components/src/Portal/ (thin re-export of `react-native-teleport` + local prop types)
- **Public API:** re-exports `Portal`, `PortalHost`, `PortalProvider`, `usePortal` from `react-native-teleport`; exports local types `PortalProps`, `PortalHostProps`, `PortalProviderProps`.
- **Key props (Portal):** `hostName` (name of the `PortalHost` to teleport into; OMIT to render inline in place — teleporting is opt-in; common overlay pattern `hostName={open ? "root" : undefined}` or just `"root"`); `name` (portal id, default generated); `style`. **PortalHost:** `name` (required, referenced by `hostName`), `style` (set explicit dimensions). `usePortal(hostName)` → `{ isHostAvailable, removePortal }`.
- **Sizes:** n/a.
- **Variants/colors:** n/a.
- **Slots / `styles` keys:** n/a.
- **Platform:** Cross-platform via `react-native-teleport` — real Fabric portals on iOS/Android, `createPortal` + DOM `moveBefore` on web. No local platform split.
- **Builds on:** `react-native-teleport`. `@knitui/core`'s `<Provider>` already mounts one `<PortalProvider>` and adds a full-screen host named `"root"` (the target Popover/Menu/Tooltip/Modal/Drawer teleport into).
- **Gotchas:** The root host is `pointer-events: none` (full-screen, non-blocking) so teleported content must re-enable events on itself (see Overlay's `pointerEvents:"auto"` and Popover's dropdown). Omitting `hostName` is the no-teleport inline fallback. Apps rarely mount `PortalProvider` directly since core's Provider does it.

### Progress

- **Purpose:** Progress bar track holding one or more filled sections, with optional striped/animated sheen (Mantine `Progress`).
- **Source:** packages/components/src/Progress/
- **Public API:** `Progress` (simple single-section form) = `withStaticProperties(ProgressComponent, { Root, Section, Label, Frame })`. Exports `ProgressProps`, `ProgressRootProps`, `ProgressSectionProps`, `ProgressLabelProps`, `ProgressStyles`, `ProgressSize`.
- **Key props:** **Simple form:** `value` (0–100, required), `striped`, `animated` (implies striped), `label` (rendered inside the fill), `size`, `orientation`, `aria-label` (default "Progress"). **Section:** `value`, `striped`, `animated`, `withAria` (attaches `role="progressbar"` + `aria-value*`), `aria-label`. **Root:** `size` (`SizeKey` or px number, default `md`), `orientation`.
- **Sizes:** `SizeKey` xxs–xxl OR px number, default `md`. Track thickness via `progressThicknessVariant`; label font via `fontSizeVariant`. Vertical translates size → `width` (skips the height variant).
- **Variants/colors:** Root variants `orientation` (horizontal `width:100%` / vertical `flexDirection:column`), `size`, `radius` (default `xl`). Track `$color4`, section fill `$color9`, label `$color1` — accent via `theme` prop + palette ramp, never a Mantine `color` prop.
- **Slots / `styles` keys:** (simple form only) `root`, `section`, `label`. The compound form styles parts inline.
- **Platform:** Shared, but the animated stripe sheen uses `LoopView` (a `Box` on web / `Animated.View` on native) driven by `useLoopingAnimation({kind:"shimmer"})` — compositor `@keyframes` on web / reanimated UI-thread loop on native. WHY: the only native worklet target must be the reanimated Animated host.
- **Builds on:** `Box`, `Text`; `renderTextChild` for text labels; `useLoopingAnimation`/`LoopView` (internal); `clamp`; `DURATIONS.deliberate` for stripe timing; a Tamagui `ProgressContext` sharing `size`+`orientation` to sections/labels.
- **Gotchas:** Stripes are 8 duplicated skewed bars translating by exactly one `STRIPE_PERIOD` (20px) for a seamless loop — replaces an old `setInterval` mod-20 tick that had a backward "reverse-glide". When not `animated`, the hook's `distance` is 0 → a still frame (also how reduced-motion is handled). Vertical orientation needs an explicit `height`. The looping style must ride the host `style` array (`[STRIPE_ROW_STYLE, loop.style]`), never spread as Tamagui props.
