---
"@knitui/carousel": patch
---

A change of the data's shape no longer remounts the slides around the active one. The track went back to its default position in an effect, a frame after the new data had rendered around the old centre; a slide whose index moved with the data (a controlled carousel whose list was re-sorted or cut) fell outside the window for that frame and was unmounted and mounted again, reloading its pictures and losing its state. The position now changes in the render that brings the new shape, and a moved `defaultIndex` counts as a new default position.
