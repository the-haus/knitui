---
"@knitui/components": minor
---

Add `VirtualList` and reanimated-native scroll offsets

- **`VirtualList`** — a new windowed list for large datasets. Renders only the
  visible slice (plus overscan) over `ScrollArea`, supports variable row heights
  via per-type average sizing, and exposes an imperative handle
  (`scrollToIndex` / `scrollToOffset`). One cross-platform component file over a
  platform-free measurement engine.
- **`ScrollArea`** — new `scrollValueX` / `scrollValueY` props mirror the live
  scroll offset into caller-owned reanimated shared values on the UI thread, so
  parallax and collapsing-header animations run with no JS-thread round-trip.
  Native only; the web ScrollArea ignores them.
- **`UnstyledButton`** — now carries the same reduced-motion-aware press-scale
  affordance as `Button` / `ActionIcon` / `Chip`, so custom controls built on it
  no longer read as dead on press. Descendant `pressStyle` merges with it.
- **`Image`** — fix a crash when passing `transition` on web. expo-image's
  numeric `transition` collided with Tamagui v2's reserved animation prop, which
  marked the image animated and made the web driver call `getComputedStyle` on a
  non-DOM host. The value is now forwarded to the backend under an internal
  alias.
