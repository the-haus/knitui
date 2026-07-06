---
"@knitui/map": minor
---

**SvgImage: reliable cross-platform SVG marker icons, unified on react-native-svg.**

SVG resources are now rasterized to a bitmap via `react-native-svg` on **both** web and native (identical output on each platform), then drawn on the GPU as MapLibre `SymbolLayer` icons — one texture backs thousands of markers with no per-marker DOM or native view. This fixes native, where MapLibre can't decode SVG icons and the previous capture (an offscreen surface nested inside the native MapView) often never painted on the New Architecture, so markers never appeared.

The rasterization surface now mounts in a dedicated `RasterizerHost` that sits **outside** the map view (a sibling, driven by a shared, ref-counted, content-keyed store), so it paints reliably and identical icons are rasterized only once.

New/changed API:

- `SvgImage` now also accepts a `uri` — an `.svg`/`data:image/svg+xml` URL is fetched and rasterized; any other URL (`.png`, …) is registered directly. Inline `svg` and pre-rasterized `source` still work, so this is backwards compatible.
- New `SvgImages` component registers several icons at once — handy with a data-driven `iconImage` expression for many marker types in a single GPU layer.
- New exports: `useRasterizedSvg`, `resolveSvgSize`, `useSvgMarkup`, `isSvgMarkup`, `isSvgUri`, `resolvePassthrough`, and the `SvgImageEntry`/`SvgImagesProps` types.

Note: because web now rasterizes through `react-native-svg`, consuming the map on web requires the standard `react-native` → `react-native-web` alias (already present in every Expo / RN-web app, and in this package's Storybook).
