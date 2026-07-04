# Component catalog — index

Per-component reference for all 103 shipped components, extracted from real source. Each entry: purpose, source path, public API + sub-components, key props, size/variant/color support, per-slot `styles` keys, platform split, what it composes, and gotchas.

**How to use:** find your component (or the closest analog to the one you're building) below, open the batch file, read its entry. When building a new component, read 2–3 analogs first — the kit is highly consistent and you should copy the nearest pattern.

## Batch files

| File                           | Components                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-accordion-blockquote.md`   | Accordion, ActionIcon, Affix, Alert, Anchor, AngleSlider, AspectRatio, Autocomplete, Avatar, BackgroundImage, Badge, Blockquote                          |
| `02-box-colorinput.md`         | Box, Breadcrumbs, Burger, **Button** (pilot), Card, Center, Checkbox, Chip, CloseButton, Code, Collapse, ColorInput                                      |
| `03-colorpicker-focustrap.md`  | ColorPicker, ColorSwatch, **Combobox** (composability template), Container, CopyButton, Dialog, Drawer, Fieldset, FileButton, FileInput, Flex, FocusTrap |
| `04-grid-list.md`              | Grid, Group, Highlight, HoverCard, Image, Indicator, **Input**, **InputBase**, Kbd, KeyboardAvoidingView, KeyboardAwareScrollView, List                  |
| `05-loader-numberformatter.md` | Loader, LoadingOverlay, Mark, Marquee, MaskInput, **Menu**, **Modal**, MultiSelect, NativeSelect, NavLink, Notification, NumberFormatter                 |
| `06-numberinput-progress.md`   | NumberInput, Overlay, Pagination, Paper, Paragraph, PasswordInput, Pill, PillsInput, PinInput, **Popover**, **Portal**, Progress                         |
| `07-radio-spoiler.md`          | Radio, Rating, RollingNumber, **ScrollArea**, SegmentedControl, Select, Separator, SimpleGrid, Skeleton, Slider, Spacer, Spoiler                         |
| `08-stack-title.md`            | Stack, Stepper, Switch, Table, TableOfContents, Tabs, TagsInput, **Text**, TextInput, Textarea, ThemeIcon, **Title**                                     |
| `09-tooltip-visuallyhidden.md` | Tooltip, **Transition**, Tree, TreeSelect, Typography, **UnstyledButton**, VisuallyHidden + `internal/` / `floating/` / `control-system.ts` notes        |

## Reference exemplars (read these when building X)

- **Simple interactive control** → Button (`02`). The canonical example of every system wired together.
- **Static surface / badge** → Badge, Alert (`01`), Chip, Pill (`06`) — `surfaceColorVariant`, `paddingHorizontalPill`.
- **Compound with data-driven parts** → Combobox (`03`), Menu (`05`) — `withStaticProperties`, cross-part context, cycle-breaking `index.ts` attach.
- **Form field** → Input / InputBase (`04`) — native `styled(TextInput)`, `$red9` error token, 8-key wrapper slots.
- **Overlay** → Popover (`06`), Modal (`05`), Tooltip (`09`) — floating engine, teleport Portal, `useOverlayTransition`.
- **Native-heavy motion** → ScrollArea (`07`), Transition (`09`) — `.web`/`.native` split, reanimated worklets vs rAF painter.
- **Typography** → Text, Title (`08`) — `render="h{order}"`, color divergence, truncate splits.
- **Layout primitive** → Box, Stack, Grid, Group, Flex (`02`/`04`/`08`) — thin `styled(Box)` + context.
- **Base to compose on** → UnstyledButton (`09`) exposes `UnstyledButtonFrame`.

## Platform-split components (have a real `.native.tsx`)

FileButton, Input, NativeSelect, Popover, Modal (`modal-base-inner`), ScrollArea, Transition — plus `Modal/drag/*` (`.web.tsx`/`.native.tsx`). Everything else is a single shared file (some with inline `isWeb` branches: Affix, BackgroundImage, ColorPicker, Drawer, Text/Title truncate).

## Components that use the shared systems

- **variant-colors table:** Button, ActionIcon, Alert, Avatar, Badge, Pill, ThemeIcon, CloseButton, Chip (interactive → `controlColorVariant`; static → `surfaceColorVariant`). Many others (Stepper, Switch, Table, Tabs) drive color from the raw palette ramp + `theme` prop instead — that's allowed for non-standard chrome.
- **controlMetrics size scale:** Button, Input/InputBase, TextInput, Textarea, NumberInput, PasswordInput, Combobox/Select/MultiSelect/TreeSelect, SegmentedControl, ActionIcon, Avatar, Badge, Chip, Pill, Loader, Progress, Rating, Radio, Checkbox, Switch, ThemeIcon, and more. Slider deliberately uses local px geometry off the scale.
