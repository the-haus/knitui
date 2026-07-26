---
"@knitui/map": minor
---

Stop the map doing per-render and per-frame work, and move the bundled styles off the barrel

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
