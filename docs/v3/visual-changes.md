# Tamagui v3: accepted visual and DOM changes

Phase 8 verification (`docs/tamagui-v3-migration-plan.md` §12). The v2 baseline (Tamagui 2.7.7, 1,581 stories × light/dark, noise floor 0) was compared against the v3 branch with `visual/compare.mjs`. Every difference listed here was looked at and judged correct (or a v2 bug that v3 fixes). Regressions found during the pass were fixed in source instead; they are listed at the end.

Acceptance rule: every story renders, nothing errors, overlays open in place, interaction states and dark theme work, layout and content are intact, and there are no new serious/critical axe violations or aria losses. Pixel-level shifts that still look right (shade, spacing, anti-aliasing, motion timing) are accepted as one-liners without per-diff investigation.

Conventions references: `conventions.md` §11 (W1–W5, Dates, Media findings).

## Global (affects most stories)

- **Font family is set once at the root.** v3's `TamaguiRoot` span carries `font_body` and its shared rule sets only `font-family`, so plain (non-`Text`) text inside stories now inherits the system stack instead of the browser default `Times`. Computed `font-family` moves from each text node to the root: a style-snapshot diff only, no visual change for kit text.
- **Identity / individual transforms.** v2 emitted `transform: matrix(1,0,0,1,0,0)` on many frames; v3 emits nothing, and it writes non-identity motion as the individual `translate` / `rotate` / `scale` CSS properties (W1). The harness now folds those into one effective matrix and treats identity as `none`, so only real transform changes show up.
- **`flex: 1` basis.** v2 computed `flex-basis: 0%`, v3 `0px`. Same layout; normalised in compare.
- **Story copy.** Story labels that printed token names drop the `$` sigil (`padding $md` → `padding md`, `gap="$xs"` → `gap="xs"`): aria-text diffs in Layout/Box, Flex, Group, Stack, Spacer, List, Alert, Modal.

## Fixed v2 bugs (v3 now renders what the story asks for)

- **Layout/Spacer, Layout/Center, Overlays/Transition, Overlays/FocusTrap, Media/AudioPlaylist (Styles):** theme-name backgrounds and `theme="…"` sub-themes now resolve. v2 painted nothing for several of these (blank Spacer bars, missing Center boxes 2 and 4, FocusTrap not green).
- **Navigation/Burger:** bars are visible. v2 rendered all Burger sizes blank.
- **Overlays/Motion (All Presets):** every preset now settles. v2 captured most tiles still at their enter state. The three `bouncy` presets (`pop`, `pop-up`, `pop-down`) use the unified `BOUNCY_SPRING` (~1s) and may be mid-flight in a frozen capture (`conventions.md` §7 "Motion").
- **Inputs/Combobox (Options Dropdown):** `useCombobox({ defaultOpened: true })` now opens at rest as the story intends.
- **Inputs/FileButton (Custom Trigger), Overlays/Transition (Keep Mounted) in dark:** the browser's grey `buttonface` fill no longer leaks onto kit buttons.
- **Display/RollingNumber (Font Sizes):** `xxs` / `xs` were unreadable (v2 `":number"` function variant); all steps now render, and `xxl` uses the 28px font token (was 32px).
- **Dates/Day (Range):** first/last-in-range cells now show their fill (v2 rendered them nearly invisible).
- **Data Display/Table (Styles), Display/Avatar:** per-slot `styles` (border width/colour) now apply (1px → 2px, accent colour).
- **Navigation/Stepper:** error steps show the red border.
- **Overlays/Popover, Menu, HoverCard, Combobox family, Skeleton, TableOfContents:** the default `sm` radius (4px) now applies. Dialog/Modal panels get their 8px radius, and Modal/Drawer their `boxShadow` (W4: an explicit `undefined` no longer wipes base styles).

## Accepted cosmetic shifts

- **Inputs/PillsInput, MultiSelect, TagsInput (Sizes / Matrix):** large sizes are slightly shorter (v2 added extra vertical space from the fixed 26px line box). Chips and placeholder text sizes follow the size ladder (`font-size` 14px on chips).
- **Inputs/NativeSelect:** no browser focus outline. v2 leaked the UA `outline: auto` because its reset did not apply; v3 matches the rest of the input family (see "Unresolved").
- **Display/Pill, Inputs/Chip, Navigation/Pagination, Navigation/ScrollArea:** small `font-size` changes from the variant ladder now applying (`fontSizeVariant` / `controlFontVariant`).
- **Overlays/Tooltip:** arrow and background use `color4`-based tokens (W2 finding).
- **Navigation/NavLink:** the truncating label's computed box changes (`display: block` → `flow-root`, overflow moves to the label element, `white-space` inherits `pre-wrap`). No pixel diff is flagged at story widths, and the colour ladder follows W5.
- **Overlays/Dialog, Modal, Drawer, Menu (Hover Trigger):** shadow/position anti-aliasing below 3%.
- **Carousel (Autoplay), SwipeDeck, Media/Video:** timing-dependent frames (autoplay index, current time `0:10` vs `0:09`).
- **MediaQuery/Playground:** row spacing follows the restored Text line height.
- **Layout/Group, Flex, Box, Paper, Typography/\***, **Inputs/\*** (≤ 0.2%): anti-aliasing and sub-pixel text placement.
- **Graphics/\*:** no comparison (all 33 stories errored on v2 with `Err0`). They now render with 0 errors in both schemes.

## DOM / accessibility improvements (aria diffs)

- **Overlays/Menu:** the trigger carries `aria-haspopup="menu"` and `aria-expanded`, and the menu is labelled by its trigger (`menu "Options"`).
- **Data Display/Tree, TreeSelect:** tree items expose `aria-level`.
- **Data Display/TreeSelect, Inputs/TagsInput:** the field is a `combobox` with `aria-expanded` (was a plain `textbox`).
- **Inputs/Checkbox, Radio (disabled):** `aria-disabled="true"` on the control.
- **Typography/Paragraph (Inherit):** the story no longer nests a `<p>` in a `<p>` (the child renders as a `<span>`).
- **Media/Video, Media/Audio:** the playback-speed button is now a real menu button, so its name includes the visible rate (`Playback speed 1×`, WCAG 2.5.3). This was fixed during VR (see below).

## Regressions found and fixed during verification

| Component                                  | Cause                                                                                                                                                                                                                                                                | Fix                                                                                                                               | Test                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Text (every kit text, ~2,700 story×scheme) | v2's shared `font_*` CSS rule gave every font-classed element the font's `$true` (md, 26px) line height. v3's rule only sets `font-family` and fonts have no `true` key, so text fell back to `line-height: normal` and rows collapsed (26px → 15–33px).             | `Text` base sets `lineHeight: "md"` on web (static `isWeb` spread so later bare values still win; native never had it).           | `Text.test.tsx` "defaults to the md line height on the web…"                     |
| Menu `trigger="hover"`                     | Hover-in opens the menu; the trigger's press then TOGGLED it closed, so "hover then click" shut the menu under the cursor (Hover Trigger story captured closed).                                                                                                     | For hover / click-hover triggers a press only opens (Mantine `click-hover` semantics); Escape, outside press and hover-out close. | `Menu.test.tsx` two hover-trigger press tests                                    |
| TableOfContents                            | A derived base's clause-only `backgroundColor: "hover:… press:…"` replaced the parent `UnstyledButtonFrame`'s whole program, dropping the resting `transparent`; every inactive `<button>` showed the UA grey fill (light and dark, new axe color-contrast in dark). | `backgroundColor: "transparent hover:color3 press:color4"`.                                                                       | `TableOfContents.test.tsx` "keeps inactive controls transparent at rest"         |
| Media/Video, Audio playback-speed button   | Now a menu button (`aria-haspopup`), so axe `label-content-name-mismatch` (serious): visible text "1×" was not in its name "Playback speed".                                                                                                                         | `aria-label={\`Playback speed ${rate}×\`}`.                                                                                       | `Video.v3.test.tsx` "names the playback-speed menu button with its visible rate" |

## Unresolved (pre-existing, not v3 regressions)

- **Input family focus border is invisible in the neutral theme.** `borderColorFocus` equals `borderColor` (`hsla(0,0%,91%)` light / `16%` dark) in the generated neutral themes, so a focused TextInput / NativeSelect / Textarea shows no visible change in v2 or v3 (only accent themes differ). Needs a theme-source decision (e.g. `color8`).
- **Harness console gate vs production Storybooks.** The leak gate (`isV3Leak` in `harness.spec.ts` / `compare.mjs`) is wired up, but Storybook builds in production mode strip React's and Tamagui's dev warnings. Leak coverage in practice comes from the jest v3 guard plus the per-package `stories.test.tsx` smoke tests (components, dates, media, sheet, carousel), which render every story under the guard.
