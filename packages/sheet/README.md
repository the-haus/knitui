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
`react-native-reanimated` are required peers. On native,
`react-native-safe-area-context` is required too (Expo projects already have it): with
a `SafeAreaProvider` mounted, the sheet keeps its content clear of the home indicator
and the status bar, and without one it simply uses no inset. Like the rest of the kit it ships
TypeScript source — Expo/Metro consume it directly, and Next.js picks it up via
the `withKnitui` wrapper from `@knitui/plugins/next-plugin`.

## Features

- **Lightweight drag** — one RNGH `Gesture.Pan` shared by web and native.
- **Snap points or content-fit** — `snapPoints` as % of the screen, where the handle
  cycles between them, or `snapPoints="fit"` to hug the content.
- **Re-settles by itself** — rotation, new snap points, and fit content changing
  height all move an open panel.
- **Ends at its resting snap** — the content region stops at the snap, and
  `Sheet.Footer` stays on screen at every one.
- **Follows the keyboard** — the panel rides above it frame by frame, footer
  included, and the scroller shrinks to fit.
- **Scroll↔drag handoff** — `Sheet.ScrollView` and `Sheet.FlatList` hand one finger
  between the list and the panel.
- **Persistent sheets** — with `modal={false}` and `withOverlay={false}`, the page
  behind the panel keeps every touch.
- **Animations, themes, sizes** — spring motion (`animationConfig`), full Tamagui
  theming, a `size` rounding scale, and per-slot `styles`.
- **Drag-to-dismiss**, **tap-to-dismiss**, **Escape-to-close**, modal teleport,
  Android back, focus trap / return-focus, web body-scroll-lock, and reduced motion.
- **Cheap while closed** — a closed sheet holds no gestures, shared values or
  listeners, so a list can mount one per row.

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

### Sizing to the content

```tsx
<Sheet opened={opened} onClose={close} snapPoints="fit" maxHeight="80%" title="Filters" padded>
  <Sheet.ScrollView>{/* hugged while short, scrolls past maxHeight */}</Sheet.ScrollView>
  <Sheet.Footer>
    <Button onPress={apply}>Apply</Button>
  </Sheet.Footer>
</Sheet>
```

The panel measures the handle, header, content and footer, and follows content that
changes height while open. Long content has to sit in a `Sheet.ScrollView` or
`Sheet.FlatList`; anything else is clipped at `maxHeight`.

### Scrolling

`Sheet.ScrollView` takes the kit's `ScrollArea` props on web and `ScrollView` props on
native. `Sheet.FlatList` does the same for a `FlatList`. For another virtualized list,
pass `renderScrollComponent={renderSheetScrollComponent}`.

Each scroller has its own gesture, so a panel can hold several. Use these for anything
that scrolls inside a sheet, on every platform. A plain React
Native `ScrollView` knows nothing about the sheet: on iOS it scrolls without moving the
panel, and on Android the panel's drag takes the touch, so it doesn't scroll at all.

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
| `snapPoints`                                        | `[80, 10]`      | % of screen, most-visible → least-visible, or `"fit"`.  |
| `maxHeight`                                         | below top inset | Cap for a `"fit"` panel: px, or `"NN%"` of the screen.  |
| `maxWidth`                                          | —               | Cap the width and centre the panel.                     |
| `dismissOnOverlayPress`                             | `true`          | Tap the scrim to close.                                 |
| `dismissOnSnapToBottom`                             | `false`         | Fling past the lowest snap to close.                    |
| `disableDrag`                                       | `false`         | Disable all drag handling.                              |
| `modal`                                             | `true`          | Teleport to the app root vs. render inline.             |
| `animationConfig`                                   | —               | reanimated `withSpring` config override.                |
| `moveOnKeyboardChange`                              | same as `modal` | Ride above the soft keyboard (native).                  |
| `closeOnBackPress`                                  | `true`          | Android back closes a modal sheet, topmost first.       |
| `title`                                             | —               | Header title; also names the panel.                     |
| `withCloseButton` / `closeButtonProps`              | with `title`    | Header close button, and its accessible name.           |
| `padded`                                            | `false`         | Pad the content region.                                 |
| `bottomInset`                                       | safe area       | Space kept clear under the content or footer.           |
| `size`                                              | `"lg"`          | Top-corner rounding scale.                              |
| `styles`                                            | —               | Per-slot overrides. See `SheetStyles`.                  |

An imperative `ref` exposes `{ open(), close(), snapTo(index) }`.

## Scroll↔drag handoff

While the sheet isn't fully expanded, a drag on the list moves the panel. Once it is
expanded the list scrolls, and pulling down at the top of the list takes the panel with
it, all in one gesture.

Two mechanisms carry this on native. Each scroller's native gesture runs simultaneously
with the sheet's Pan, and the pure rules in `engine/handoff.ts` decide who owns each
frame. On iOS that relation can be lost, and then a fast pull is a race the list wins:
it rubber-bands while the Pan never activates. So `Sheet.ScrollView` also reads the
list's own scroll events. On a list the Pan hasn't claimed, overscroll at the top pulls
the panel down, recovering the finger's travel from UIKit's damped offset
(`overscrollPull`), a drag up on a partly open sheet raises the panel, and the release
settles it.

---

Part of [Knit UI](../../README.md).
