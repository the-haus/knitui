---
"@knitui/carousel": minor
---

New `invertDrag` prop: the carousel runs the other way round under a drag. A drag down (vertical) or right (horizontal) steps toward the end, and a fling likewise. Use it for a deck whose next card sits behind or above, pulled down like a pile. Only the main-axis drag flips: the `crossAxis` drag, the wheel, the arrow keys and the ref keep their directions. `scrollMode="native"` ignores it.
