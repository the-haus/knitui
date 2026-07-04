# @knitui/components

The main component kit for Knit UI — 100+ cross-platform (React Native + Web)
components built on [`@knitui/core`](../core), all sized, themed, and composable
out of one design system.

Every component renders identically on iOS, Android, and the web from a single
import. They share the kit's token scales, variant/size ladders, and per-slot
styling contract, so a `Button`, a field, and an overlay all speak the same
`size`, `variant`, and `styles` language.

## Relationship to `@knitui/core`

`@knitui/components` is the "what you render" layer. `@knitui/core` is the "how it
looks" layer underneath it — the Tamagui config, theming, `<Provider>`, and the
`styled()` / token / motion escape hatch. You import components from here and the
styling primitives (`styled`, `useMedia`, token helpers, `Gesture`, …) plus
`<Provider>` from `@knitui/core`.

## Install

You never add a `@tamagui/*` package yourself — the kit depends on them
internally and re-exports everything you need. Install the kit plus its native
peers:

```sh
# Expo
npx expo install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated \
  react-native-svg react-native-teleport react-native-worklets

# bare React Native / web
npm install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated \
  react-native-svg react-native-teleport react-native-worklets
```

> `react-native-gesture-handler` and `react-native-reanimated` are the load-bearing
> native peers on every platform; `react-native-svg`, `react-native-teleport`, and
> `react-native-worklets` back the icon, portal, and worklet layers. On web,
> `react-native-web` is the only extra peer.

## Quickstart

Wrap your app once. `<Provider>` (from `@knitui/core`) sets up theming **and**
mounts the `GestureHandlerRootView` for you — then drop components anywhere below:

```tsx
import { Provider } from "@knitui/core";
import { Button, Card, Group, Text, TextInput } from "@knitui/components";

export default function App() {
  return (
    <Provider defaultColorScheme="system">
      <Card padding="lg">
        <Text>Sign in</Text>
        <TextInput label="Email" placeholder="you@example.com" />
        <Group>
          <Button variant="light">Cancel</Button>
          <Button>Continue</Button>
        </Group>
      </Card>
    </Provider>
  );
}
```

## What's inside

Every name below is a real export from `@knitui/components`. Compound components
expose their parts as static members (e.g. `Card.Section`, `Combobox.Dropdown`,
`Menu.Item`, `Tabs.Panel`).

**Layout & primitives** — `Box`, `Flex`, `Stack`, `Group`, `Grid`, `SimpleGrid`,
`Container`, `Center`, `Spacer` (alias `Space`), `AspectRatio`, `Paper`,
`Separator` (alias `Divider`).

**Typography** — `Text`, `Title`, `Paragraph`, `Typography`, `Anchor`,
`Blockquote`, `Code`, `Highlight`, `Mark`, `Kbd`, `List`.

**Buttons & actions** — `Button`, `ActionIcon`, `UnstyledButton`, `CloseButton`,
`CopyButton`, `FileButton`, `Burger`.

**Text inputs & fields** — `Input`, `InputBase`, `TextInput`, `Textarea`,
`PasswordInput`, `NumberInput`, `MaskInput`, `PinInput`, `ColorInput`,
`FileInput`, `Fieldset`, `PillsInput`.

**Selection & combobox** — `Combobox` (+ `useCombobox`), `Select`, `MultiSelect`,
`Autocomplete`, `TagsInput`, `NativeSelect`, `TreeSelect`.

**Form controls** — `Checkbox`, `Radio`, `Switch`, `Chip`, `SegmentedControl`,
`Slider` (+ `RangeSlider`), `AngleSlider`, `Rating`.

**Color** — `ColorPicker`, `ColorSwatch`, `ThemeIcon`.

**Overlays & popups** — `Modal`, `Drawer`, `Dialog`, `Popover`, `HoverCard`,
`Tooltip`, `Menu`, `Overlay`, `LoadingOverlay`, `Affix`, `Portal`, `FocusTrap`.

**Feedback & status** — `Alert`, `Notification`, `Badge`, `Indicator`, `Loader`,
`Progress`, `Skeleton`, `RollingNumber`, `NumberFormatter`.

**Navigation** — `Tabs`, `Stepper`, `Breadcrumbs`, `Pagination`, `NavLink`,
`TableOfContents`.

**Data display** — `Table`, `Card`, `Accordion`, `Tree` (+ `useTree`), `Pill`,
`Avatar`, `Image` (+ `createImage`), `BackgroundImage`.

**Disclosure & motion** — `Collapse`, `Spoiler`, `Marquee`, `Transition`, plus the
motion presets (`motionPresets`, `useMotionPreset`, `usePressScale`,
`MotionConfig`).

**Scrolling & utilities** — `ScrollArea`, `VisuallyHidden`, `KeyboardAvoidingView`,
`KeyboardAwareScrollView`.

**Positioning engine** — a portable, cross-platform floating layer
(`useFloating`, `computePosition`, `flip`, `shift`, `offset`, `arrow`, `size`, …)
that powers every overlay and is exported for building your own.

## Composability

The kit is composable-first — every component exposes the same three levers.

### `size` and `variant`

Controls share one sizing ladder and color-variant system. Each component exports
its own literal types, so options autocomplete and typecheck:

```tsx
import { Button, type ButtonSize, type ButtonVariant } from "@knitui/components";

<Button size="lg" variant="light" />;
```

### Per-slot `styles`

Multi-part components take a typed `styles` map keyed by named slots. Each slot
targets the props of the styled part it decorates — the part's own props always
win over the map:

```tsx
import { Card } from "@knitui/components";

<Card
  styles={{
    root: { borderColor: "$borderColor" },
    header: { gap: "$md" },
  }}
/>;
```

The slot keys for a component are captured by its exported `…Styles` type (e.g.
`CardStyles`, `MenuStyles`, `TooltipStyles`), and enforced at runtime by
`slotStyles` so an unknown slot key throws rather than being silently ignored.
The slot machinery itself (`createSlot`, `defineSlots`) lives in `@knitui/core`.

### Theming & customization

Brand the whole kit with `createTheme` / `extendTheme` from `@knitui/core` and
feed the result to `<Provider config={…}>` — see the
[`@knitui/core` README](../core/README.md#custom-branding--createtheme).

> A per-component defaults/theming layer (`components` in `createTheme`,
> `defineComponentDefaults`) is planned but **not yet implemented**. For now,
> recolor with the theme system (`theme="teal"` / `<Theme name="teal">`) and set
> default props by wrapping your own thin component.

### Control-system contract

Sibling packages (e.g. `@knitui/media`) that ship their own sized/colored controls
import the kit's single source of truth for size, icon-sizing, and color ladders
from the stable `@knitui/components/control-system` subpath:

```tsx
import { controlMetrics, SIZE_KEYS, VARIANT_KEYS } from "@knitui/components/control-system";
```

## Src-ship & consuming in Next.js

This package **src-ships**: its `exports` resolve to the TypeScript source under
`./src`, not a compiled `lib`. Metro (Expo / bare React Native) resolves the
`source` field and compiles it as part of your app, so **native works with no
extra config**.

Bundlers that don't transpile `node_modules` by default (notably Next.js) must be
told to compile the `@knitui/*` scope. The Next.js plugin does this for you —
wrap your config once and every kit package is transpiled:

```js
// next.config.mjs
import { withKnitui } from "@knitui/plugins/next-plugin";
export default withKnitui({ reactStrictMode: true });
```

See [`@knitui/plugins`](../plugins) for the metro, next, vite, and webpack setups.

## Storybook & development

Every component ships stories (including a per-component **Styles** story that
exercises the `styles` slots). Run the Storybook locally:

```sh
pnpm --filter @knitui/components storybook   # http://localhost:6006
```

Other package scripts:

```sh
pnpm --filter @knitui/components typecheck
pnpm --filter @knitui/components lint
pnpm --filter @knitui/components test
```

## See also

- [Repo root README](../../README.md) — the full monorepo and how the packages fit together.
- [`@knitui/core`](../core) — theming, `<Provider>`, `createTheme`, and the styling/motion engine.
- [`@knitui/plugins`](../plugins) — build-tool integrations (babel, metro, next, vite, webpack).
- [`@knitui/icons`](../icons) — the icon kit wired into every control.
