# @knitui/map

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
