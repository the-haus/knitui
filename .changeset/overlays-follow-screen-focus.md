---
"@knitui/core": minor
"@knitui/components": minor
"@knitui/sheet": patch
"@knitui/media": patch
---

Overlays no longer draw over the screen in front of a backgrounded stack screen.

- `@knitui/core`: `<Provider>` takes an optional `useScreenFocus` hook, such as React Navigation's or Expo Router's focus state wrapped so it returns `true` outside a navigator. `useScreenFocused()` reads the current value. Without the prop, every screen counts as focused and nothing changes.
- `@knitui/components`: Popover, Menu, Tooltip, Combobox, Modal, Drawer and Affix render through the new `OverlayPortal`. While their screen is unfocused they stay inside that screen instead of teleporting into the shared host, and they come back, still open, when it is focused again. `OverlayPortal` is exported for custom overlays.
- `@knitui/sheet`: a modal `Sheet` follows its screen's focus the same way.
- `@knitui/media`: when the active player's screen is frozen in a navigation stack, the shared video surface now stays out of sight instead of drawing at the top of the app.

See "Overlays in a navigation stack" on the Portal docs page for the Expo Router hook.
