---
"@knitui/components": minor
"@knitui/sheet": patch
"@knitui/carousel": patch
---

Scoped overlay hosts + a carousel `scrollsToTop` pass-through (for native modal screens and the iOS status-bar tap):

- New `OverlayHost` (`name`, `children`): mounts a scoped `PortalHost` over its subtree, and every kit overlay inside it — `Popover` (and so `Menu`/`Combobox`/date-picker dropdowns), `Tooltip`, `Modal`/`Drawer`, `Affix`, and a modal `@knitui/sheet` `Sheet` — teleports there instead of `"root"`. Wrap an iOS `formSheet` / `fullScreenModal` screen in it so its overlays stop drawing behind the modal. Outside an `OverlayHost` nothing changes.
- `useOverlayHost()` returns the host overlays should use at that point in the tree (`"root"` by default); `useTopmostOverlayHost()` returns the top-most mounted scoped host app-wide, for global layers (toasts) that live outside every scope. `ROOT_OVERLAY_HOST` names the default.
- Native floating positioning measures a scoped host's window origin, so a dropdown inside a `formSheet` lands on its trigger.
- `Carousel` takes `scrollsToTop` (iOS, `scrollMode="native"`): pass `false` on a rail so the page's own scroller keeps the status-bar tap.
