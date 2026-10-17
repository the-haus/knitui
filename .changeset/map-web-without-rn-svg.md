---
"@knitui/map": minor
---

The web build no longer loads `react-native-svg`: the SVG pin rasterizer's web host (`RasterizerHost`) renders icon markup as plain DOM SVG and draws it to a canvas, keeping the same capture contract and retry behaviour. Markup without `xmlns` is put in the SVG namespace before parsing. Native is unchanged (`RasterizerHost.native.tsx`).
