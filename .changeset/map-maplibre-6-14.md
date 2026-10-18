---
"@knitui/map": minor
---

Require maplibre-gl 6.13 or later and serve only its worker. Since 6.13, `maplibre-gl-worker.mjs` is self-contained and `maplibre-gl-shared.mjs` ships empty, so web apps only need to copy the worker into their static directory. The web `Map` now adds `?v=<maplibre version>` to the URL passed to `setWorkerUrl`, so a browser never runs a worker cached from an older maplibre-gl. The dev setup now uses maplibre-gl 6.14, which brings fixes for GeoJSON clusters and `setData`, plus faster symbol rendering.
