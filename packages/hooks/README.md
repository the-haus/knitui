# @knitui/hooks

The shared **React + React Native** hook library that powers Knit UI — state
containers, controlled/uncontrolled bridges, timing utilities, and cross-platform
UI/layout primitives. Ported from and inspired by
[`@mantine/hooks`](https://mantine.dev/hooks/), reworked so every hook runs on
web **and** native.

Most of these hooks are consumed internally by `@knitui/components`, but the
package is self-contained and can be installed on its own.

```tsx
import { useDisclosure } from "@knitui/hooks";

function Menu() {
  const [opened, { toggle, close }] = useDisclosure(false);
  // opened -> boolean, toggle/open/close/... -> stable handlers
}
```

## Install

```sh
# Expo
npx expo install @knitui/hooks

# bare React Native / web
npm install @knitui/hooks
```

`react` is a required peer on every platform. `react-native` and
`react-native-reanimated` are peers used by the native code paths — on web they
are never imported, and `react-native-reanimated` is declared optional.

Unlike most kit packages (which source-ship), `@knitui/hooks` builds a real
distributable: `main`/`module`/`types` resolve to `./lib/**` (compiled by
`react-native-builder-bob`), while the `source` and `react-native` fields point
Metro straight at `./src/index.ts`.

## Usage

Every hook is a named export off the package root:

```tsx
import { useCounter, useDebouncedValue, useOs } from "@knitui/hooks";

function Example() {
  const [count, handlers] = useCounter(0, { min: 0, max: 10 });
  const [debounced] = useDebouncedValue(count, 200);
  const os = useOs(); // "ios" | "android" | "macos" | "windows" | ...

  return null;
}
```

## Hooks

### State & data structures

| Hook                | Description                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `useDisclosure`     | Boolean open/close state with `open` / `close` / `toggle` handlers.            |
| `useCounter`        | Numeric counter with `increment` / `decrement` / `set` / `reset`, clamped to optional `min`/`max`. |
| `useUncontrolled`   | Manage a value that may be controlled (prop) or uncontrolled (internal state). |
| `useListState`      | Immutable list state with append/prepend/insert/remove/reorder/apply handlers. |
| `useQueue`          | Bounded queue that keeps `limit` items live and buffers the overflow.          |
| `useSetState`       | Partial `setState` merge for object state (React-class-style `setState`).      |
| `useValidatedState` | Track a value alongside its validation result and the last valid value.        |
| `usePrevious`       | The value from the previous render.                                            |

### Timing & rate limiting

| Hook                                   | Description                                                              |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `useDebouncedValue`                    | A value that updates only after it stops changing for a delay.           |
| `useDebouncedCallback`                 | Debounced version of a callback (fires after the calls settle).          |
| `useThrottledValue`                    | A value that updates at most once per interval.                          |
| `useThrottledCallback`                 | Throttled version of a callback.                                         |
| `useThrottledCallbackWithClearTimeout` | Throttled callback that also exposes a `clearTimeout` for teardown.      |
| `useInterval`                          | Declarative `setInterval` with `start` / `stop` / `toggle` controls.     |
| `useTimeout`                           | Declarative `setTimeout` with `start` / `clear` controls.                |

### Lifecycle & refs

| Hook              | Description                                                             |
| ----------------- | ---------------------------------------------------------------------- |
| `useMounted`      | `true` after the component has mounted (SSR/hydration-safe).           |
| `useIsFirstRender`| `true` only on the initial render.                                     |
| `useDidUpdate`    | Effect that runs on updates but skips the first render.                |
| `useForceUpdate`  | Returns a function that forces a re-render.                            |
| `useId`           | Stable, unique id (respects a passed-in id if provided).              |
| `useCallbackRef`  | A stable callback identity that always calls the latest function.      |
| `useMergedRef`    | Merge several refs into one callback ref (`assignRef` is the low-level helper). |

### UI, layout & gestures

| Hook                | Description                                                                       |
| ------------------- | -------------------------------------------------------------------------------- |
| `useElementSize`    | Measure an element's rendered size (web `ResizeObserver` / native `onLayout`).    |
| `useViewportSize`   | The current viewport/window width and height, kept in sync on resize.            |
| `useMove`           | Track pointer/touch drag over an element and report a normalized `[0, 1]` position (`clampMovePosition` helper). |
| `useRadialMove`     | Track drag over a circular control and report the angle (0–359).                 |
| `usePagination`     | Page-range model for pagination UIs, with `DOTS` gap markers.                     |
| `useFocusTrap`      | Trap keyboard focus within a container (web focus cycling / native accessibility). |
| `useKeyboardActions`| Keyboard/accessibility activation for a non-`<button>` interactive host.          |
| `useDismissOnScroll`| Close an open overlay when the page scrolls (native behavior; no-op on web).       |

### Platform & environment

| Hook                    | Description                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| `useOs`                 | Detect the host OS (`ios` / `android` / `macos` / `windows` / `linux` / …).  |
| `useAppState`           | Coarse foreground/background visibility (`active` / `background`).            |
| `useReducedMotion`      | Whether the user prefers reduced motion.                                     |
| `useKeyboardHeight`     | Reactive on-screen keyboard height (native; always `0` on web).              |
| `getKeyboardHeight`     | Imperative current keyboard height — callable outside React.                 |
| `subscribeKeyboardHeight` | Subscribe to keyboard-height changes; returns an unsubscribe.              |
| `useClipboard`          | Copy text to the clipboard and track the `copied` state.                     |

## Cross-platform behavior

Every export presents one API on both platforms; the implementation is picked at
bundle time via `.native` file resolution (Metro/React Native) versus the default
web module. A few notable splits:

- **`useElementSize`** measures with `ResizeObserver` on web and layout events on
  native; **`useViewportSize`** reads the window/visual viewport per platform.
- **`useMove` / `useRadialMove`** wire `window` pointer listeners on web (so the
  drag keeps tracking off-element) and gesture handling on native — the web
  module never imports `react-native`, keeping it out of the web bundle.
- **`useAppState`** maps the Page Visibility API (web) onto React Native's
  `AppState` (native); **`useOs`** and **`useReducedMotion`** read the equivalent
  platform signal.
- **`useKeyboardHeight` / `getKeyboardHeight` / `subscribeKeyboardHeight`** and
  **`useDismissOnScroll`** are meaningful on native and intentionally no-ops (or
  `0`) on web, so overlays and layout code can call them unconditionally without a
  `Platform.OS` guard.
- **`useFocusTrap`** and **`useKeyboardActions`** translate the same intent to DOM
  focus/keyboard handling on web and accessibility actions on native.

Hooks with no platform surface (`useDisclosure`, `useCounter`, `useDebouncedValue`,
`useUncontrolled`, `useListState`, `useValidatedState`, …) are pure React and run
identically everywhere.

---

Part of the [Knit UI](../../README.md) monorepo.
