---
"@knitui/sheet": patch
---

Sheet: a slow drag settles on the snap nearest where it was released. The fling bias ("a flick advances at least one snap") counted from the snap nearest the RELEASE point, so a drag up from the lowest of three snaps that let go just past the middle one, at any speed over 300 px/s (an unhurried touch drag), was pushed on to the top snap. The bias now counts from the snap the drag started on, only flings (500 px/s and up, was 300) are projected forward at all, and a fling lands at most one snap past the one nearest its release. `settle()` takes an optional `startOffset`; the drag gesture passes it.
