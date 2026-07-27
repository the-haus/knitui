# @knitui/map

## 0.4.1

### Patch Changes

- caa2d7e: Point every `types` entry at the built declarations (`lib/typescript/*.d.ts`) instead of at the shipped TypeScript source.

  These packages ship their source and resolve it at runtime (`source`, `react-native` and `default` all still point into `src`), but `types` pointed there too — so a consumer's `tsc` typechecked the kit's raw source as part of their own build. That is slow, and it surfaces errors that depend on the consumer's own compiler settings, since `skipLibCheck` does not apply to `.ts` source files. Resolving `types` to real `.d.ts` files makes declaration handling both faster and inert.

  `@knitui/icons` also adds `lib/typescript` to `files`; its declarations were previously built but never published, so the new `types` path would not have existed in the tarball.

  `@knitui/emoji` deliberately keeps `types` on its source: its per-emoji modules ship as pre-generated `.js`/`.d.ts` pairs inside `src`, which `tsc` does not re-emit, so its built barrel cannot resolve them.

## 0.4.0

### Minor Changes

- 5f44d20: Stop the map doing per-render and per-frame work, and move the bundled styles off the barrel

  A pass over every hot path in `@knitui/map`, cross-checked against the `maplibre-gl`
  5.24 and `maplibre-react-native` 11.3 sources — most of the cost landed _inside_ those
  two, on props this package handed them.

  **`GeoJSONSource` re-serialized its whole FeatureCollection on every ancestor render
  (native).** Upstream's `GeoJSONSource` stringifies in its render body
  (`data={typeof data === "string" ? data : JSON.stringify(data)}`). It is `memo`'d, but
  that memo could never hold through our wrapper: `onPress` was an inline arrow and
  `children` is the consumer's inline JSX. So _any_ ancestor re-render — including a
  `setState` from `onRegionIsChanging`, which fires up to 30×/s — re-stringified every
  feature (~1–3 MB for a 4000-point collection) on the JS thread, shipped a new string
  prop through Fabric, and made the native side re-parse, re-index and re-cluster it.
  `data` did not have to have changed. The wrapper now serializes once per `data`
  identity and hands upstream a `string`, so its ternary short-circuits to the same
  identity and Fabric diffs the prop to nothing; `onPress` is stable over a props ref.

  **Every filterless layer forced a source reload at mount (web).** `useWebLayer` called
  `map.setFilter(id, filter ?? null)`. maplibre's guard is `deepEqual(layer.filter, filter)`,
  `layer.filter` is `undefined`, and `deepEqual` bottoms out at `a === b` — so `null`
  compared FALSE and took the clearing branch: `layer.setFilter(undefined)` +
  `_updateLayer(layer)`, which sets `_updatedSources[source] = 'reload'` and calls
  `tileManager.pause()`. Every layer without a `filter` prop therefore re-requested and
  re-tessellated its source's tiles immediately after being added — three times over for
  the standard three-layer clustered pattern, showing up as a slow first paint plus a
  flash of missing markers. The call is now skipped entirely when the filter is and was
  absent, and clears with `undefined` rather than `null`.

  **Paint/layout were re-applied property-by-property, undiffed, on every render (web).**
  The effect's deps were object identities and the public API is an inline camelCase
  `style` object, so it fired every render and looped `setPaintProperty` /
  `setLayoutProperty` over every key. maplibre does guard with `deepEqual`, but only
  after `_checkLoaded()`, `getLayer()` and `layer.getPaintProperty(name)` — and that last
  one is `clone(this._values[name].value.value)`. So each property cost a deep **clone**
  plus a deep **compare** of its whole expression tree, every render, across all nine web
  layer types; a `["step", ["get","point_count"], …]` or a 200-branch `["match", …]`
  `icon-image` paid it in full. `useWebLayer` now diffs before calling into maplibre and
  memoizes `resolvePaintLayout` / the add-config. The dropped-key reset loop is unchanged.

  **Fresh paint/layout objects defeated the native `Layer`'s memo.** Each of the eight
  native layer components allocated new `paint`/`layout` per render, and upstream's guard
  is `useMemo(…, [props])` where `props` is a fresh rest-spread — so it never hits no
  matter what we pass. Every render therefore ran `mergeStyleProps` → `transformStyle`
  (a `processColor` per colour, a `new BridgeValue(...).toJSON()` walk over every
  expression array) and produced a new `reactStyle` prop that the native layer re-applied
  wholesale. A new shared `useNativeLayerProps` hook memoizes the resolved paint/layout
  _and_ the whole props object on the real inputs. Upstream's memo stays useless, but the
  native prop identity stops changing, so Fabric diffs the layer to nothing.

  **`map.getStyle()` — a deep clone of the entire style — ran on every mousemove (web).**
  The hover cursor hit-test derived its layer list from `getStyle()`, i.e.
  `Style.serialize()` → `_serializeByIds(this._order, returnClone=true)` → a `clone()` of
  every serialized layer plus `mapObject(tileManagers, s => s.serialize())`. On a
  Positron/Voyager basemap (~130 layers, each with paint and layout expressions) that is
  thousands of allocations per pointer move — and it only ran when an interactive source
  existed, i.e. exactly for the 4000-point `onPress` consumer. The layer registry already
  knows each layer's `sourceId`, so the list is now derived from it and cached, invalidated
  by a registry revision counter and a `styledata` epoch. The hit-test itself is coalesced
  to one per animation frame and skipped while `map.isMoving()`.

  **A full view-state event object plus timer churn on every raw `move` event (web).**
  `makeViewStateChangeEvent` ran _before_ the 32 ms throttle check, so every `move` (60+/s)
  did a `getBounds()` (four corner unprojections + a `LngLatBounds` alloc), a
  `getCenter()`, `getZoom`/`getBearing`/`getPitch` and two object allocations — even for
  consumers with no region handlers at all. Each move also did a `clearTimeout` plus a
  fresh 500 ms `setTimeout`. Now: early-out when no region handler is registered, the
  event is built lazily _after_ the throttle gate, and the trailing debounce is only armed
  when `onRegionDidChange` exists. The native side (where the event comes from native, so
  only the timer churn applied) got the same treatment. `onRegionIsChanging` is documented
  as the thing not to `setState` from unthrottled, since that is the amplifier for
  everything above.

  **The rasterizer leaked offscreen surfaces and threw away resolved bitmaps.** `resolve()`
  stored the data URI but never took the slot out of the render snapshot, so
  `RasterizerHost` kept every `<SvgXml>` surface mounted for the map's whole lifetime — on
  native those are real view trees with `collapsable={false}` that Android walks on every
  layout pass. Conversely `release()` deleted the slot _including_ its resolved bitmap, so
  unmounting and remounting an icon (a filter toggle) re-rasterized from scratch and drove
  a `removeImage`/`addImage` round trip — and removing an image a symbol layer references
  forces MapLibre to redo symbol placement. Surfaces now unmount once their key resolves
  (never before, so `runCapture`'s retry loop still has something to snapshot), and
  resolved URIs are kept in a 64-entry LRU keyed by the existing content key, so a remount
  is free.

  **Up to 30 rAF-spaced native view snapshots per icon during the map's first frames.**
  `runCapture` retried `toDataURL` once per animation frame for up to 30 frames, with the
  attempt counter shared between the "ref not attached" and "empty bytes" cases. With ~30
  category icons that is up to 900 native view snapshots in the ~500 ms right after mount —
  exactly when MapLibre is loading its first tiles and doing initial symbol placement.
  Captures are now capped at 3 in flight (the rest drain from a queue) and back off
  geometrically (1, 2, 4, 8, 8 … frames), which cuts snapshots per icon from 30 to 12
  while making the retry _window_ longer (~80 frames vs 30).

  Also: `Camera` was `JSON.stringify`-ing its camera stop in the render body on every
  render (now a hand-rolled scalar/tuple compare), `MapView` was stringifying
  `attribution` every render (now memoized), and the `setStyle` effect's
  `JSON.stringify(mapStyle)` — safe only because it was keyed on `mapStyle` identity, and a
  ~485 KB serialization per render for anyone passing an inline or derived style — is now a
  structural compare that allocates nothing.

  ## Breaking: the bundled styles moved to a subpath

  The nine bundled MapLibre styles are no longer re-exported from the root barrel:

  ```diff
  - import { positronStyle } from "@knitui/map";
  + import { positronStyle } from "@knitui/map/styles";
  + // or, for exactly one style:
  + import { positronStyle } from "@knitui/map/styles/positronStyle";
  ```

  They total 496,951 bytes / 20,858 lines of nested object literals. Following every
  runtime (non type-only) relative import out of the barrel: it reached **65 modules /
  623.9 KB**, of which the styles were 77.9%. It now reaches **55 modules / 139.2 KB** — a
  4.5× smaller graph. That mattered because the package src-ships and Metro does not
  tree-shake, and because a re-export is `export *`, the CJS interop Babel/Metro generate
  `require()`s the module at barrel eval — so every app that rendered `<Map>` with its own
  style URL constructed ~500 KB of literals before its first frame. Nothing else about the
  styles changed: same names, same values, same `@knitui/map/styles` index.

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
