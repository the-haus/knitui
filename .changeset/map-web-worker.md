---
"@knitui/map": patch
---

Fix web maps that paint only their background and never load a tile.

maplibre-gl v6 locates its tile worker through `import.meta.url`, and inside a bundler (webpack/Next, Vite, Metro web) that never points at a real file. In 0.5.0 the map mounted, drew its background colour and silently loaded nothing.

Web apps now need to serve maplibre's worker and point the map at it once at startup. Copy `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` from `node_modules/maplibre-gl/dist/` into your static directory, then:

```ts
import { setWorkerUrl } from "@knitui/map/worker";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
```

`@knitui/map/worker` only stores the URL and doesn't import maplibre, so calling it from your app root doesn't add the map engine to every page. Native is unaffected. In development, `Map` now warns when it can't find a worker URL instead of failing silently. See https://knitui.dev/docs/map#web-worker.
