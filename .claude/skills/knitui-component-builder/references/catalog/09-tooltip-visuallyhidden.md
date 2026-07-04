## Batch 9

Components: Tooltip, Transition, Tree, TreeSelect, Typography, UnstyledButton, VisuallyHidden — plus the 3 non-component helper dirs.

---

### Tooltip

- **Purpose:** Floating label shown on hover/focus/touch of a single target element, positioned via the kit floating engine.
- **Source:** packages/components/src/Tooltip/
- **Public API:** `Tooltip` (withStaticProperties) + `Tooltip.Target`, `Tooltip.Label`, `Tooltip.Dropdown` (alias of `.Label`), `Tooltip.Text`, `Tooltip.Arrow` (= `FloatingArrow`). Also exports `TooltipStyles`, `FloatingArrowStyle`, `TooltipPosition`/`TooltipOffset`/`TooltipArrowPosition`/`TooltipEvents` types.
- **Key props:** `label: ReactNode` (required), `children: ReactElement` (single ref-accepting target), `position?: Placement` (@default "top"), `offset?: FloatingOffset` (@default 5), `openDelay?`/`closeDelay?` (ms, @default closeDelay 0), `opened?`/`defaultOpened?` (controlled/uncontrolled), `withArrow?` (@default false) + `arrowSize`(4)/`arrowOffset`(5)/`arrowRadius`(0)/`arrowPosition`("side"), `inline?` (floating-ui inline middleware, works both platforms, @default false), `multiline?` (@default false; caps `maxWidth:320` when false), `shadow?: keyof shadowVariant`, `withinPortal?` (@default true), `keepMounted?` (@default false), `zIndex?` (@default 300), `events?: Partial<{hover;focus;touch}>` (@default hover only), `refProp?` (@default "ref"), `disabled?`, `onPositionChange?`, `transitionProps?: OverlayTransitionConfig`, `animation?: MotionPresetName`.
- **Sizes:** No control-size scale; label frame is fixed padding (`$xxs`/`$xs`) + `$sm` radius. Text is `$sm`.
- **Variants/colors:** No `variant` prop. Fill is `$color9` / text `$color1` from active theme (Tamagui `theme` prop recolors). `shadow` opt-in from shared `shadowVariant` ladder. Does NOT use variant-colors table.
- **Slots / `styles` keys:** `dropdown` (label frame), `label` (inner Text), `text` (inner Text, layers OVER `label`), `arrow` (appearance-only: background/borderColor/borderWidth/radius — positioning props excluded by type). Resolved via `useOverlayChrome`.
- **Platform:** Shared single file. Label frame `position` = `fixed` on web / `absolute` on native (RN has no `fixed`). Native re-measures on open + `onLayout` since `autoUpdate` is a web-only no-op; web follows scroll while native closes on scroll (`useDismissOnScroll`).
- **Builds on:** Box, Text, Portal, Theme, FloatingArrow, floating engine (`useFloating` + offset/flip/shift/inline/arrow middleware), `useOverlayTransition`, `useOverlayChrome`.
- **Gotchas:** Target must be a single `ReactElement` accepting a ref; the Root auto-wraps a bare child in `Tooltip.Target` so inline-sugar and explicit-Target paths clone byte-identical props (`buildTargetHandlers` is pure/hookless). Web uses onMouseEnter/Leave, native uses onHoverIn/Out. Until first measurement lands, label is forced `opacity:0` (NOT `display:none`, which would 0×0-measure and deadlock the positioner). `arrow` middleware `size` uses the historical DOUBLED convention (`arrowSize*2`). `position` (Placement) is Omit'd from Box's CSS `position` to avoid collision. Adds `aria-describedby` on target while open.

---

### Transition

- **Purpose:** Single-child mount/unmount enter-exit animation engine (Mantine `Transition` port); the shared animation substrate all floating overlays ride via `useOverlayTransition`.
- **Source:** packages/components/src/Transition/
- **Public API:** `Transition` component (render-prop) + `useOverlayTransition` hook + `OverlayTransitionConfig`/`OverlayTransitionResult`/`UseOverlayTransitionOptions` types + `MantineTransition`/`TransitionName`/`TransitionStyle`/`TransitionStyles` types. Internal: `useTransition` (lifecycle state machine), `getTransitionStyles`, `transitions` preset table.
- **Key props (Transition):** `mounted: boolean` (required), `children: (styles: TransitionStyle) => ReactElement` (render-prop), `transition?: MantineTransition` (preset name or custom `{in;out;common?;transitionProperty}`, @default "fade"), `duration?` (@default 250), `exitDuration?` (@default duration), `timingFunction?` (@default "ease"), `keepMounted?` (renders `display:"none"` when hidden), `enterDelay?`/`exitDelay?`, lifecycle callbacks `onEnter`/`onEntered`/`onExit`/`onExited`.
- **useOverlayTransition:** `{ mounted, keepMounted?, transition?, animation?: MotionPresetName, duration? (@default DURATIONS.fast=150), exitDuration?, timingFunction? (@default "ease-in-out") }` → `{ rendered, hidden, style, animation }`. Precedence: explicit `transition` > `animation` preset (mapped via `toOverlayTransition`: pop-up/pop-down→pop, zoom→scale) > default "fade". Reads `useMotionConfig` (global `disabled` collapses to instant, `durationScale` retimes).
- **Sizes:** n/a.
- **Variants/colors:** ~20 named presets: fade/fade-up/down/left/right, scale/scale-x/scale-y, skew-up/down, rotate-left/right, slide-up/down/left/right, pop + pop-top/bottom-left/right (each preset = `{in, out, common?, transitionProperty}` of CSS opacity/transform strings).
- **Slots / `styles` keys:** none (render-prop / spread-props engine).
- **Platform:** `.web` + `.native` split. `use-transition.ts` (timer-driven lifecycle state machine `pre-entering→entering→entered` / `pre-exiting→exiting→exited`, no react-dom flushSync so cross-platform) is SHARED verbatim; only style application differs. Web applies CSS transition via `style`. Native (`Transition.native.tsx` + `use-overlay-transition.native.ts`) injects Tamagui `transition` prop + `animateOnly` array onto the child (opacity animates; string `transform` degrades to no-op — documented divergence) using `resolveTransition`. `transitions.ts` vs `transitions.native.ts` also split.
- **Builds on:** `@knitui/hooks` `useReducedMotion`/`useDidUpdate`; `@knitui/core` `DURATIONS`; `internal/motion` (`MotionPresetName`, `useMotionConfig`); `internal/style-props` `resolveTransition`.
- **Gotchas:** Respects reduced motion — duration collapses to 0 → instant style-free show/hide (`transitionDuration===0` fast-path in both engines). `useOverlayTransition` exists because the `Transition` component CANNOT wrap the overlays directly: their animated frame lives INSIDE a Portal/Theme subtree, and on native the render-prop clone would target the Portal not the frame — so the hook returns props to spread instead. `useTransition` paints the "out" snapshot first then flips to target after a 10ms frame timer so CSS has a starting frame. `pre-entering`/`pre-exiting` states map to "out" style. Overlays merge order is slot < consumer < transition (engine style wins last).

---

### Tree

- **Purpose:** Hierarchical, expandable/selectable tree view (Mantine `Tree` port) with a `useTree` state controller supporting expand/select/cascading-check.
- **Source:** packages/components/src/Tree/
- **Public API:** `Tree` (withStaticProperties) + `Tree.Root`, `Tree.Node` (recursive, memoized), `Tree.Row`, `Tree.Chevron`, `Tree.Label`, `Tree.Subtree`. Also `useTree` hook, `getTreeExpandedState`, data helpers (`filterTreeData`/`findTreeNode`/`getAllChildrenNodes`/`getAllNodeValues`/`getChildrenNodesValues`), and `TreeController`/`TreeNodeData`/`RenderTreeNodePayload`/`RenderNode`/`TreeStyles` + part-prop types.
- **Key props (Tree sugar):** `data: TreeNodeData[]` (required), `levelOffset?` (@default "$lg"), `expandOnClick?` (@default true), `selectOnClick?` (@default false), `tree?: TreeController` (external controller), `renderNode?: RenderNode` (wholesale row escape hatch), `withLines?` (@default false), `styles?`. Mantine-parity accepted-but-deferred: `expandOnSpace`/`checkOnSpace`/`clearSelectionOnOutsideClick` (web-only keyboard/DOM behaviors). `Tree.Root` takes the same behavior props but `children` instead of `data`.
- **useTree input:** controlled/uncontrolled `expandedState`/`selectedState`/`checkedState` (+ initial* + on*Change), `multiple?` (@default false), `checkStrictly?` (@default false, disables cascading checks), `onNodeExpand`/`onNodeCollapse`. Controller exposes toggle/expand/collapse/select/deselect/check/uncheck + `getCheckedNodes`/`isNodeChecked`/`isNodeIndeterminate` + `initialize`.
- **Sizes:** No control-size scale; rows use `$xs` padding/gap, label `$sm`, chevron `$xxs`.
- **Variants/colors:** No `variant`. Selected row `$color4` bg, selected label `$color11`/weight 600, hover `$color3`, press `$color4`, lines `$color5`. Theme-prop driven, not variant-colors. `focusRingStyle` on rows.
- **Slots / `styles` keys:** `root`, `node`, `row`, `chevron`, `label`, `subtree` (via `slotStyles`).
- **Platform:** Shared single file.
- **Builds on:** Box, Text, Collapse (subtree expand/collapse animation, reduced-motion aware), `@knitui/hooks` `useKeyboardActions`/`useUncontrolled`, `internal/style-props` (`focusRingStyle`/`webCursor`).
- **Gotchas:** Rows get `useKeyboardActions` `elementProps` (tabIndex+onKeyDown web / a11y actions native) so a `role="treeitem"` div becomes focusable and its focus ring fires — spread into `elementProps` so custom `renderNode` inherits focusability. `useTree.initialize` bails via shallow-equality guards to avoid an infinite loop when a parent owns the controller with an inline `data` array. Context is intentionally NON-stable (handlers close over render state). Root renders `render="ul"`, nodes `render="li"`, subtrees `render="ul" role="group"`. DEFERRED: drag-drop, DOM arrow-key nav, async onLoadChildren, React-19 Activity keepMounted.

---

### TreeSelect

- **Purpose:** Single-value select whose dropdown is a `Tree` (Mantine `TreeSelect` port, `Value = string`); built on Combobox + InputBase.
- **Source:** packages/components/src/TreeSelect/
- **Public API:** `TreeSelect` (withStaticProperties) + `TreeSelect.Root`, `.Trigger`, `.Dropdown`, `.Tree`, `.Node`, `.NodeChevron`, `.NodeLabel`, `.Empty`/`.Chevron`/`.ClearButton` (re-exports of `Combobox.*`). Plus `TreeSelectRef`/`TreeSelectStyles`/`TreeSelectSize` + part-prop types.
- **Key props:** `data: TreeNodeData[]` (required), `value?`/`defaultValue?: string|null`, `onChange?(value, node)`, `clearable?` (@default false) + `clearButtonProps`/`clearSectionMode` (@default 'both'), `searchable?` (@default false) + `searchValue`/`defaultSearchValue`/`onSearchChange`, `allowDeselect?` (@default true), `nothingFoundMessage?`, `expandOnClick?` (@default true), `tree?: TreeController`, `size?: ComboboxSize` (@default "md"), `dropdownOpened?`/`defaultDropdownOpened?` + open/close callbacks, `maxDropdownHeight?` (@default 250), `withScrollArea?` (@default true), `disabled`/`readOnly`, `comboboxProps?`, `styles?`.
- **Sizes:** Uses `ComboboxSize` (= control size scale); @default "md" — flows to InputBase trigger, chevron, clear button.
- **Variants/colors:** No `variant`; node rows use `$color3`/`$color4` hover/press/selected, `$color11` selected label. Theme-prop driven.
- **Slots / `styles` keys:** `root`, `trigger`, `dropdown`, `tree`, `node`, `nodeChevron`, `nodeLabel`, `empty`, `chevron`, `clearButton`. Sugar wrapper `pick`s only INPUT_WRAPPER_SLOTS to funnel to the trigger's Input.Wrapper so it doesn't dev-warn about slots it doesn't own.
- **Platform:** Shared single file (inherits platform behavior from Combobox/Tree/floating).
- **Builds on:** Combobox (+ useCombobox store, Combobox.Target/Dropdown/Empty/Chevron/ClearButton, `composeTriggerRightSection`), InputBase, Tree (+ useTree, filterTreeData/findTreeNode), ScrollArea.Autosize, Box, Text.
- **Gotchas:** Leaf press selects + closes; branch press selects + toggles expansion, keeping dropdown open. Sugar path funnels trigger chrome/ref through Root context via internal `__triggerProps` so composable (`<TreeSelect.Trigger>`) and sugar paths converge on one trigger; precedence explicit > funneled > `trigger` slot. Search resets to selected label on dropdown close via an INTENTIONAL effect (state-mirrored, mirrors Select). Context intentionally non-stable. Deprecated `comboboxProps`/`clearButtonProps` merge OVER their slots ("explicit beats sugar"). DEFERRED: multi-value/checkbox selection + pills, web-only keyboard nav.

---

### Typography

- **Purpose:** Content-column wrapper establishing consistent vertical rhythm for stacked block children (Mantine `TypographyStylesProvider` port).
- **Source:** packages/components/src/Typography/
- **Public API:** `Typography` + `TypographyProps`.
- **Key props:** All `Box` props (extends `GetProps<TypographyFrame>`). No bespoke props.
- **Sizes:** none.
- **Variants/colors:** none; text color inherited from active theme.
- **Slots / `styles` keys:** none.
- **Platform:** Shared; renders `render="div"`. Frame is `flexDirection:"column"` + `gap:"$md"`.
- **Builds on:** Box.
- **Gotchas:** Documented divergence — Mantine styles raw descendant DOM via CSS module; cross-platform can't inject descendant CSS, so this is ONLY a spacing column. Compose the kit's own Title/Paragraph/List/Anchor/Blockquote/Code inside it (they carry their own styling). Per-element descendant resets are NOT reproduced.

---

### UnstyledButton

- **Purpose:** Accessible pressable base with reset-only styling; the building block many controls (e.g. Burger) extend via `styled(UnstyledButtonFrame, …)`.
- **Source:** packages/components/src/UnstyledButton/
- **Public API:** `UnstyledButton` (withStaticProperties) + `UnstyledButton.Frame`. Also exports `UnstyledButtonFrame` (the raw `styled()` frame) and `UnstyledButtonProps`.
- **Key props:** `disabled?: boolean` (only bespoke prop; Omit'd from frame type then re-added) + all Box props + `children`.
- **Sizes:** none (no size scale — it's a bare reset).
- **Variants/colors:** No color variants. One `disabled` variant (opacity 0.6, not-allowed cursor, `pointerEvents:none`). Base is transparent bg, `borderWidth:0`, `userSelect:none`, `role="button"`, pointer cursor, `focusRingStyle`.
- **Slots / `styles` keys:** none.
- **Platform:** Shared; renders semantic `<button type="button">` on web (`render="button"` + local `{type:"button"}` since `type` is outside Tamagui's style types). Forwards ref.
- **Builds on:** Box, Text (via `renderTextChild` — wraps string children in Text), `internal/style-props` (`focusRingStyle`/`webCursor`).
- **Gotchas:** `UnstyledButtonFrame` is EXPORTED specifically so other components can `styled()` on top of it — that's how the kit composes controls, mirroring Mantine. Sets `aria-disabled` when disabled. `type:"button"` injected via a narrow local object (spread avoids excess-prop check).

---

### VisuallyHidden

- **Purpose:** Screen-reader-only content (visually hidden but in the accessibility tree). Mantine `VisuallyHidden` port.
- **Source:** packages/components/src/VisuallyHidden/
- **Public API:** `VisuallyHidden` + `VisuallyHiddenProps`.
- **Key props:** All `Text` props (extends `GetProps<VisuallyHiddenFrame>`). No bespoke props.
- **Sizes:** none.
- **Variants/colors:** none (purely structural; styling irrelevant).
- **Slots / `styles` keys:** none.
- **Platform:** Shared; renders `<span>` on web. Frame = `position:absolute`, 1×1px, `padding:0`, `margin:-1`, `borderWidth:0`, `overflow:hidden` (standard sr-only clip; metrics collapse to ~0 on native with no layout impact while staying VoiceOver/TalkBack readable).
- **Builds on:** Text.
- **Gotchas:** none noted.

---

## Internal / shared dirs

### internal/

Non-exported shared helpers backing the components. Highlights: **`variant-colors.ts`** — THE canonical variant-color table (color twin of control-metrics); three read-only ladders `VARIANT_FILL` / `VARIANT_INTERACTION` (hover/press/focus) / `VARIANT_FOREGROUND` (emphasis + muted), keyed by the 9 `VARIANT_KEYS` (filled/light/outline/subtle/default/white/transparent/dot/gradient), all palette-ramp tokens so `theme="red"` recolors with no per-component logic. **`control-metrics.ts`** — the canonical sizing table (`controlMetrics`) across `xxs→xxl` keys (height/font/padX/gap/radius as token keys) + `SIZE_KEYS`/`DEFAULT_SIZE`/`resolveSizePx`. Plus `style-props.ts` (archetype variants, `focusRingStyle`, `webCursor`, `radiusVariant`/`shadowVariant`, `resolveTransition`), `motion.ts` (motion-token SoT + presets), `styles.ts`/`slotStyles`/`pick` (Pillar-B per-slot styling), `overlay-chrome.ts` (`useOverlayChrome`), `floating-arrow.tsx`/`floating-offset.ts`, `render-text-child.tsx`, gradient/collapse-box/looping-animation helpers.

### floating/

Self-contained cross-platform positioning engine that REPLACED `@floating-ui/*`. `computePosition` in `core.ts` computes positions in window coords and subtracts the floating element's container origin so it works inside Portals (teleported content) on web AND native. Middleware in `middleware.ts` (offset/flip/shift/limitShift/arrow fully implemented; size/hide/inline lean for API stability). `useFloating` hook + `.web`/`.native` platform splits (`platform.ts`/`platform.native.ts` — `autoUpdate` is real on web, a no-op on native). Consumed by Tooltip/Popover/HoverCard/Menu/etc.

### control-system.ts

A behaviour-free BARREL (public API) re-exporting the canonical `internal/` primitives so sibling packages (notably `@knitui/media`) size/color/icon-wire controls against the one source of truth: Size (`SizeKey`/`SIZE_KEYS`/`DEFAULT_SIZE`/`controlMetrics`/`resolveSizePx`), Embed (`toEmbeddedControlSize`), Icon (`CONTROL_ICON_SIZE`/`controlIconSize`/`ControlIconProvider`), Color (the `VARIANT_*` ladders + `VARIANT_KEYS`/`VariantKey`). Shape pinned by `control-system.test.ts`.
