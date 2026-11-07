---
"@knitui/sheet": patch
---

A modal sheet opened from a scrolled list now reaches the keyboard. The sheet read that list's scroll offset as a gap below its layer, so the panel stopped short of the keyboard and a composer in it sat behind the keyboard.
