---
"@knitui/carousel": patch
---

Appending items no longer interrupts a drag or settle. Without `loop`, a data-length change that leaves the active item in range moves nothing: an item's offset doesn't depend on the count. Before, the carousel re-seated the offset anyway, which cancelled a settle in flight and snapped the card back. Shrinking the data under the active item still clamps to the last one.
