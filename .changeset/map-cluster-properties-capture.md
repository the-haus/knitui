---
"@knitui/map": patch
---

- `ShapeSource` now passes `clusterProperties` to the native `GeoJSONSource`, so native clusters aggregate point properties as web clusters do. The style spec's shorthand form, such as `["+", ["get", "count"]]`, is expanded to the explicit reduce form the native SDKs read; on iOS the bare operator previously came through as the string `"+"`. An inline object no longer reaches the native source as a change on every render.
- `SvgImage` no longer stalls on a capture the native side never answers, e.g. when the map's screen is left mid-rasterization on iOS. Each attempt now has a watchdog and is retried. A late answer is still used, and a capture that throws is retried too.
