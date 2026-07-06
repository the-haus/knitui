# @knitui/map

## 0.3.1

### Patch Changes

- Fix `SvgImage` icons rendering larger on iOS than on Android/web. react-native-svg's `toDataURL` bakes the device scale (`UIScreen.scale`, e.g. 3×) into the rasterized bitmap on iOS but not on Android/web, so registering the icon with `scale = pixelRatio` left iOS icons `UIScreen.scale`× too big. The rasterizer now derives the registered density from the bitmap's **real** pixel width (read from the PNG header), so an icon renders at its logical `width`/`height` identically on web, iOS, and Android.

## 0.3.0

### Minor Changes

- Fix native `SvgImage`/`Images` crash and correct high-density icon sizing.
  - **Crash fix.** `@maplibre/maplibre-react-native` resolves an object-form image `source` via `Image.resolveAssetSource`, which returns `null` for a bare string (a `data:` URI from the SVG rasterizer, or a remote URL) and then throws `TypeError: Cannot read property 'uri' of null`. The native `Images` adapter now wraps a string `source` into `{ uri }` so it resolves correctly. This is what broke SDF/object icons on Android and iOS.
  - **Correct `pixelRatio` sizing.** The rasterizer upscales the bitmap by `pixelRatio` for crispness, but the extra density was never registered, so raster icons drew `pixelRatio×` too big (previously worked around with `iconSize`). `SvgImage` now registers the bitmap's density as `scale` — passed through to `map.addImage({ pixelRatio })` on web and to the native image source `{ uri, scale }` (iOS `UIImage.scale` / Android `bitmap.setDensity`) — so an icon renders at its logical `width`/`height` regardless of `pixelRatio`.

    **Behavior change:** if you set `pixelRatio` and compensated with a fractional `iconSize` (e.g. `iconSize: 0.5` for `pixelRatio: 2`), drop that compensation and use `iconSize: 1` (or your intended size). SDF icons at the default `pixelRatio` of 1 are unaffected.

## 0.2.0

### Minor Changes

- 4849ceb: **SvgImage: reliable cross-platform SVG marker icons, unified on react-native-svg.**

  SVG resources are now rasterized to a bitmap via `react-native-svg` on **both** web and native (identical output on each platform), then drawn on the GPU as MapLibre `SymbolLayer` icons — one texture backs thousands of markers with no per-marker DOM or native view. This fixes native, where MapLibre can't decode SVG icons and the previous capture (an offscreen surface nested inside the native MapView) often never painted on the New Architecture, so markers never appeared.

  The rasterization surface now mounts in a dedicated `RasterizerHost` that sits **outside** the map view (a sibling, driven by a shared, ref-counted, content-keyed store), so it paints reliably and identical icons are rasterized only once.

  New/changed API:
  - `SvgImage` now also accepts a `uri` — an `.svg`/`data:image/svg+xml` URL is fetched and rasterized; any other URL (`.png`, …) is registered directly. Inline `svg` and pre-rasterized `source` still work, so this is backwards compatible.
  - New `SvgImages` component registers several icons at once — handy with a data-driven `iconImage` expression for many marker types in a single GPU layer.
  - New exports: `useRasterizedSvg`, `resolveSvgSize`, `useSvgMarkup`, `isSvgMarkup`, `isSvgUri`, `resolvePassthrough`, and the `SvgImageEntry`/`SvgImagesProps` types.

  Note: because web now rasterizes through `react-native-svg`, consuming the map on web requires the standard `react-native` → `react-native-web` alias (already present in every Expo / RN-web app, and in this package's Storybook).

## 0.1.1

### Patch Changes

- Map: fix SVG marker pins (`SvgImage`) not appearing on Android/iOS. MapLibre
  native can't decode SVG, so `SvgImage` rasterizes the SVG to a PNG through
  `react-native-svg`'s `Svg.toDataURL`. The capture fired once, synchronously, in
  the offscreen view's `onLayout` — but on the New Architecture the native Svg
  view isn't attached/painted on that first frame, so the call silently no-op'd
  (ref not ready) or returned empty bytes with no retry, and no icon was ever
  registered. Capture now runs in a `requestAnimationFrame` retry loop that waits
  until the ref is attached and `toDataURL` returns real bytes before registering
  the image, and the offscreen host is positioned off-screen instead of
  `opacity: 0` (an alpha-0 source view can snapshot blank on Android). Web is
  unchanged.

  Also fix a web layer-update gap: a `paint`/`layout` key present in a layer's
  initial config (e.g. a `SymbolLayer` `iconRotate`) and then dropped now resets
  to its spec default instead of lingering, because the dropped-key trackers are
  seeded from the config applied at add time.
