---
"@knitui/sheet": patch
---

Sheet: the handle no longer cycles the detent after a drag. On the web a mouse drag that starts on the handle ends with a `click` on it, so the sheet stepped once more after it settled (dragging from half down to peek landed on full). A press in the same pointer cycle as a drag is now ignored; a later tap and keyboard / assistive-tech activation of the handle still cycle.
