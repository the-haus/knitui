---
"@knitui/map": patch
---

`SvgImage` on native: each offscreen raster surface is memoised. The host re-renders on every store change (each icon acquired or resolved), and every pending surface re-drew its `<SvgXml>` each time. With hundreds of icons that was quadratic, about 1.5 s of JS per second for the first seconds of a map on Android.
