# @knitui/map

Cross-platform map components with a **unified, RN-first API**, wrapping
[MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) on web and
[`@maplibre/maplibre-react-native`](https://github.com/maplibre/maplibre-react-native)
on native.

This package is a **plain hybrid**: it depends only on `react`, `react-native`,
`react-dom`, the two MapLibre engines and `@types/geojson`. It does **not** use
`react-native-web` or Tamagui — the web implementations (`*.tsx`) are pure DOM +
`maplibre-gl`, and the native implementations (`*.native.tsx`) wrap the RN
engine. Bundlers pick the right file per platform automatically.

## Install

Install `@knitui/map` plus the MapLibre engine for the platform you target —
`@maplibre/maplibre-react-native` on native, `maplibre-gl` on web:

```sh
# Expo / native
npx expo install @knitui/map @maplibre/maplibre-react-native react-native-svg

# web
npm install @knitui/map maplibre-gl @maplibre/maplibre-gl-style-spec @types/geojson
```

There is **no** `react-native-reanimated` peer — the package is a plain hybrid
with no Tamagui or `react-native-web` dependency.

## Usage

```tsx
import { Map, Camera, GeoJSONSource, CircleLayer } from "@knitui/map";

export function CitiesMap() {
  return (
    <Map mapStyle="https://demotiles.maplibre.org/style.json" compass attribution>
      <Camera initialViewState={{ center: [4.9, 52.37], zoom: 6 }} />
      <GeoJSONSource id="cities" data={cities} cluster>
        <CircleLayer
          id="city-circles"
          source="cities"
          style={{
            circleRadius: 8,
            circleColor: "#4264fb",
            circleStrokeColor: "#fff",
            circleStrokeWidth: 2,
          }}
        />
      </GeoJSONSource>
    </Map>
  );
}
```

### Conventions

- **Container** — `<Map mapStyle={...}>` (required `mapStyle`); ornaments via
  `compass` / `attribution` / `logo` / `scaleBar`; events via `onPress`,
  `onRegionDidChange`, etc.
- **Camera** — declarative (`center` / `zoom` / `bearing` / `pitch` /
  `initialViewState`) or imperative through a `CameraRef` (`flyTo`, `fitBounds`,
  `zoomTo`, `easeTo`, `jumpTo`).
- **Sources** — `GeoJSONSource` (clustering), `VectorSource`, `RasterSource`,
  `ImageSource`. Layers nest inside their source and reference it via `source`.
- **Layers** — `CircleLayer`, `LineLayer`, `FillLayer`, `FillExtrusionLayer`,
  `SymbolLayer`, `RasterLayer`, `BackgroundLayer`, `HeatmapLayer`. Each takes a
  typed camelCase `style` prop; data-driven values use MapLibre expressions.
- **Annotations** — `Marker`, `ViewAnnotation`, `Callout`, `LayerAnnotation`.
- **User location** — `UserLocation` (web `GeolocateControl`); `UserLocationPuck`
  and `NativeUserLocation` are native-only (no-op on web).
- **Styles** — nine bundled MapLibre styles are re-exported (`positronStyle`,
  `voyagerStyle`, `darkMatterStyle`, …).

> `VectorSource`, `RasterSource` and `ImageSource` are exported as **types only**
> from the barrel to avoid eager native-component registration. Import the
> runtime component from its subpath, e.g.
> `import { RasterSource } from "@knitui/map/src/components/RasterSource"`.

## Storybook

This package ships its own **plain** Storybook (no RN→RNW alias, no design-system
provider) with 70+ examples that render real maps against keyless public tiles:

```sh
pnpm --filter @knitui/map storybook   # http://localhost:6007
```

## Scripts

| Script      | Description                       |
| ----------- | --------------------------------- |
| `typecheck` | `tsc --noEmit`                    |
| `lint`      | `eslint .`                        |
| `test`      | `vitest run` (helpers + registry) |
| `storybook` | Storybook dev server              |
| `build`     | `bob build`                       |

---

Part of [Knit UI](../../README.md).
