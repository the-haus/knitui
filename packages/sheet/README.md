# @knitui/sheet

A cross-platform (React Native + Web) **bottom sheet** — a panel that slides up
from the bottom of the screen for mobile-friendly dialogs and action menus.
Native-first, with full web parity.

## Install

```sh
# Expo
npx expo install @knitui/sheet react-native-gesture-handler react-native-reanimated

# bare React Native / web
npm install @knitui/sheet react-native-gesture-handler react-native-reanimated
```

`@knitui/sheet` builds on `@knitui/core` + `@knitui/components`; install those
alongside the kit as usual. `react-native-gesture-handler` and
`react-native-reanimated` are required peers. Like the rest of the kit it ships
TypeScript source — Expo/Metro consume it directly, and Next.js picks it up via
the `withKnitui` wrapper from `@knitui/plugins/next-plugin`.

## Features

- **Lightweight drag** — one RNGH `Gesture.Pan` shared by web and native.
- **Multiple snap points + a handle** — `snapPoints` as % of the screen; the
  handle cycles between them.
- **Auto-adjusts to screen size** — snap offsets are derived from the measured
  viewport height.
- **Animations, themes, sizes** — spring motion (`animationConfig`), full Tamagui
  theming, a `size` rounding scale, and per-slot `styles`.
- **Drag-to-dismiss**, **tap-to-dismiss**, **Escape-to-close**, modal teleport,
  focus trap / return-focus, web body-scroll-lock, and native keyboard avoidance.

## Anatomy

```tsx
import { Sheet } from "@knitui/sheet";

function Example() {
  const [opened, setOpened] = React.useState(false);
  return (
    <>
      <Button onPress={() => setOpened(true)}>Open</Button>
      <Sheet opened={opened} onClose={() => setOpened(false)} snapPoints={[80, 40]}>
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame>{/* …content, or <Sheet.ScrollView/> */}</Sheet.Frame>
      </Sheet>
    </>
  );
}
```

`Sheet.Overlay`, `Sheet.Handle`, and `Sheet.Frame` are optional composition
markers. Plain children (with no `Sheet.Frame`) fold into the panel, and a
default handle + scrim are rendered unless you opt out (`withHandle={false}` /
`withOverlay={false}`) or override them with the markers.

## Architecture

Three layers, mirroring `@knitui/carousel`:

1. **Engine** (`src/engine`) — platform-free, reanimated-free, DOM-free pure
   functions over the panel's signed `offset` (px). Snap geometry, velocity-aware
   `settle`, overlay-opacity. Directly unit-tested.
2. **Motion + gesture** (`src/motion`, `src/input`) — the `offset` SharedValue, a
   re-targetable spring (`animateOffset`), and the RNGH drag that runs `settle` on
   the UI thread.
3. **Surface + chrome** (`src/view`, `src/chrome`, `Sheet.tsx`) — styled parts,
   the slot system, per-slot `styles`, and the open/close lifecycle that reuses
   the kit's `Portal`, focus-trap, Escape, and scroll-lock.

### Web rendering

Reanimated's `useAnimatedStyle` does not re-run under this repo's web tooling, so
on web the panel transform and the scrim opacity are painted **imperatively** to
the DOM node whenever `offset` changes (`view/animated.web.tsx` subscribing via
`useSharedValueListener`). Native uses the declarative `useAnimatedStyle` path
(`view/animated.tsx`).

## API

See `src/types.ts` for the full `SheetProps`. Key props:

| Prop                                                | Default         | Notes                                                   |
| --------------------------------------------------- | --------------- | ------------------------------------------------------- |
| `opened` / `defaultOpened` / `onClose`              | — / `false` / — | Controlled / uncontrolled open state (kit house style). |
| `position` / `defaultPosition` / `onPositionChange` | — / `0` / —     | Current snap index.                                     |
| `snapPoints`                                        | `[80, 10]`      | % of screen, most-visible → least-visible.              |
| `dismissOnOverlayPress`                             | `true`          | Tap the scrim to close.                                 |
| `dismissOnSnapToBottom`                             | `false`         | Fling past the lowest snap to close.                    |
| `disableDrag`                                       | `false`         | Disable all drag handling.                              |
| `modal`                                             | `true`          | Teleport to the app root vs. render inline.             |
| `animationConfig`                                   | —               | reanimated `withSpring` config override.                |
| `moveOnKeyboardChange`                              | `false`         | Lift above the soft keyboard (native).                  |
| `size`                                              | `"lg"`          | Top-corner rounding scale.                              |
| `styles`                                            | —               | Per-slot overrides: `root` / `overlay` / `handle`.      |

An imperative `ref` exposes `{ open(), close(), snapTo(index) }`.

## Status / follow-ups

The deep scroll↔drag handoff for `Sheet.ScrollView` (drag the sheet when the
content is scrolled to the top, scroll otherwise) is the subject of a follow-up —
see `docs/sheet-package-plan.md` milestone 7. The current `Sheet.ScrollView` is a
working, independently-scrolling content area.

---

Part of [Knit UI](../../README.md).
