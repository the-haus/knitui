---
"@knitui/carousel": patch
---

Show a `grabbing` cursor while a mouse drag is actually under way

The transform-mode track is dragged by RNGH's `Gesture.Pan()` (`useDragGesture`,
shared with native), which knows nothing about cursors — so a mouse user got no
feedback at all that the rail was moving with the pointer. A new web-only
`useDragCursor` paints `grabbing` once travel passes the same 5px threshold the drag
itself uses, and restores whatever the carousel's own styling asked for on release.

Deliberately no idle `grab` hint: the cursor is untouched until a drag is genuinely
in progress, so hovering a carousel and plain clicks on a slide look exactly as they
did. The move/release listeners sit on the document rather than the host, because a
drag routinely travels and ends outside the carousel and a `pointerup` we never heard
would leave the cursor stuck on `grabbing` — as would unmounting mid-drag, which the
cleanup now also covers.

`scrollMode="native"` keeps getting its cursor from `useDragScroll` (it drags
`scrollLeft`, not the pan gesture), which is brought in line with the same rule: it
no longer stamps an idle `grab` on the track, and it restores the original cursor on
release instead of resetting to `grab` — previously it overwrote the track's own
cursor for the lifetime of the component.
