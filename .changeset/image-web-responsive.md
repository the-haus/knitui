---
"@knitui/components": minor
---

Image (web): the `<img>` takes `srcSet`, `sizes`, `decoding` and `fetchPriority` (which wins over `priority`), and writes the source's intrinsic `width` / `height` (`src={{ uri, width, height }}`, or numeric `width` / `height` props) as attributes, so the browser picks the variant for the layout width and pixel ratio and knows the aspect ratio before a byte arrives. They land on the `<img>` itself, never its wrapper, and are in the server HTML, ahead of `src`, for the preload scanner. A URL or `data:` `placeholder` is now painted as a CSS background on a layer under the photo instead of a second `<img>`, so a decoded ThumbHash shows in the server HTML before any script runs; it still goes once the photo loads. Native drops the four web attributes before expo-image sees them.
