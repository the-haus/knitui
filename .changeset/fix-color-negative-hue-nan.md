---
"@knitui/components": patch
---

Fix `NaN` colour channels for an out-of-range hue.

`hsvaToRgbaObject` picks one of six channel tuples by `hue / 60` and never normalised the hue first, so a negative one indexed off the front of those tuples and produced `NaN` for red, green and blue. `ColorPicker` reaches this on every hue change — it passes the hue straight through as a plain number — which made `convertHsvaTo` serialise `rgb(NaN, NaN, NaN)`. Hues now wrap by Euclidean remainder, so `-60` resolves as `300` and `420` as `60`.

Colour _strings_ were never affected: a negative hue fails validation and resolves to black, as before.
