# @knitui/sheet

## 0.3.1

### Patch Changes

- Updated dependencies [89f8c36]
  - @knitui/components@0.3.0
  - @knitui/core@0.3.0
  - @knitui/hooks@0.3.0
  - @knitui/icons@0.3.0

## 0.3.0

### Minor Changes

- **Sheet.Header / Sheet.Footer: fixed slots around the scrollable content.**

  The slot system gains two fixed (non-scrolling) regions that frame a
  `Sheet.ScrollView`:
  - `Sheet.Header` — pinned below the drag handle and above the content. A good
    home for a title, tabs, or a segmented control that must stay put while the
    body scrolls.
  - `Sheet.Footer` — pinned below the content. A good home for an action bar
    (e.g. a "Done" button) that stays visible regardless of scroll position.

  Both are `styled(Box)` parts with `flexShrink: 0`, so a nested
  `Sheet.ScrollView` (`flex: 1`) fills and scrolls the space between them. They
  are opt-in markers (rendered only when present) and are targetable via the
  per-slot `styles` map (`styles={{ header, footer }}`) alongside the existing
  `root` / `overlay` / `handle` slots.

## 0.2.0

### Minor Changes

- f37a436: **Sheet.ScrollView: scroll↔drag handoff on React Native (nested scroll fix).**

  A `Sheet.ScrollView` nested in the panel now cooperates with the sheet's drag gesture instead of fighting it. Previously the sheet's pan claimed every vertical drag, so the inner list wouldn't scroll on native. The two are now coordinated so a single vertical drag either moves the sheet or scrolls the list — never both:
  - At the top snap the list scrolls normally. Drag it back to the top and keep pulling down and the sheet takes over (collapses toward the next snap, then dismisses), with the panel's motion anchored to the finger so there's no jump.
  - From a partially-open snap the drag moves the sheet, and the list stays pinned to the top so it can't scroll mid-collapse.
  - A downward fling on the list no longer collapses the sheet.

  Implementation notes:
  - On native, `Sheet.ScrollView` is a purpose-built `Animated.ScrollView` bound to the sheet's `Gesture.Native` (so the two recognise simultaneously) and reports its scroll offset back to the pan; it uses the platform scroll indicators. On web it stays a `ScrollArea` wrapper (the browser owns nested scrolling), so behaviour there is unchanged.
  - The handoff decision logic lives in a pure, unit-tested engine module (`engine/handoff.ts`); no public API changed.

## 0.1.2

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/components@0.2.0
  - @knitui/hooks@0.2.0
  - @knitui/icons@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [407bef6]
  - @knitui/components@0.1.1
  - @knitui/core@0.1.1
  - @knitui/hooks@0.1.1
  - @knitui/icons@0.1.1
