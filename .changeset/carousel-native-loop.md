---
"@knitui/carousel": minor
---

feat(carousel): support `loop` in `scrollMode="native"`

Native scroll mode now honours `loop` instead of forcing it off (and no longer
warns when `loop` is requested). Looping is realised by cloning the data ring
`LOOP_COPIES` times in the scroll content and silently recentring the scroll
position into the middle copy on settle — the jump is exactly one ring of
pixel-identical clones, so it's invisible, and mod-invariant to the engine's
progress/index math. Programmatic `next`/`prev`/`scrollTo` travel to the
nearest ring copy (shortest visual path). Works on web and native, horizontal
and vertical; `loop={false}` keeps the finite start-aligned behaviour.
