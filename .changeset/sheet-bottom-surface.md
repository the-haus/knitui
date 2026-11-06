---
"@knitui/sheet": minor
---

`Sheet` can now be an app's only bottom surface.

**New**

- `snapPoints="fit"` hugs the content up to `maxHeight`, and follows content that changes height while open.
- `Sheet.FlatList` and `renderSheetScrollComponent` give virtualized lists the scroll handoff.
- `title`, `withCloseButton`, `closeButtonProps`, `padded` and `bottomInset` cover the common chrome, wired to the panel's accessible name.
- `maxWidth` centres the panel on tablets and wide windows.
- `closeOnBackPress`: Android back closes a modal sheet, topmost first. Escape now closes only the topmost modal sheet too.

**Fixed**

- An open panel re-settles when its snap points change, with no `snapTo` call.
- The content region ends at the resting snap, and `Sheet.Footer` stays on screen at every snap.
- `moveOnKeyboardChange` moves the whole panel, footer included, tracking the keyboard frame by frame while the scroller shrinks. It works on mobile web through the visual viewport, for a sheet opened over a keyboard that is already up, and for a sheet above a tab bar or inside a `KeyboardAvoidingView`.
- Dragging a `Sheet.ScrollView` moves the panel on iOS even when the list's recognizer wins, in both directions, and two scrollers can share a panel instead of crashing.
- A drag handed from the panel to the list now commits the snap it reached, and a panel returns to `position` when a controlled parent refuses a snap.
- `Sheet.ScrollView` forwards `ScrollView` props on native, including `onScroll`, and a plain scroller no longer reads as a list at offset 0.
- The last open render stays up through the close animation.
- The focus trap ends with the close request, not the close animation.
- With one snap point the handle is drawn, not a focusable button.
- A closed sheet creates no gestures, shared values or listeners.

**Behaviour changes**

- `moveOnKeyboardChange` now defaults to the value of `modal`, so a modal sheet follows the keyboard. Pass `false` to opt out.
- The panel's frame is sized to its tallest snap and no longer has `flex: 1`. Content sits in a new body region, so a child that relied on the frame's full height now gets the resting height.
- `Sheet.Footer` has the panel's background and is positioned by the sheet, so it is no longer part of the content's flow.
- With a safe-area provider mounted, the footer, or the content if there is no footer, keeps the bottom inset clear. Pass `bottomInset={0}` to opt out.
- A persistent sheet (`modal={false}`) no longer locks page scroll on web, and the lock from stacked modal sheets now survives them closing in any order.
- `react-native-safe-area-context` is a new peer dependency on native, where it is imported directly. Expo projects already have it; a bare React Native app has to add it. Web does not need it.
