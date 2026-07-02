# @knitui/graphics

Skia-powered graphics primitives and effects for the Knit UI kit — one Skia
surface, cross-platform, plus a small set of drop-in components for box effects,
drop shadows, and a data-driven audio visualizer.

The package is intentionally small. It re-exports the entire
[`@shopify/react-native-skia`](https://shopify.github.io/react-native-skia/)
surface (`Canvas`, `Group`, `Path`, `Rect`, `Image`, the gradient/blur/mask
shader nodes, `useImage`, `useSVG`, `Skia`, …) and layers a few Knit-shaped
components on top:

- **`GraphicsProvider`** — loads CanvasKit on web, gates rendering until ready.
- **`EffectView`** — a `<View>` that paints a stack of Skia effects onto itself.
- **`ShadowView`** — a `<View>` with a Skia drop shadow that renders identically
  on iOS **and** Android.
- **`AudioVisualizer`** (+ `AudioBars`, `AudioDots`, `AudioLine`, `AudioRadial`,
  `AudioWaveform`) — a data-driven Skia spectrum/level visualizer.

Web stays `react-native-web`-free: the web implementations (`*.web.tsx`) render
against CanvasKit directly, and bundlers pick the right file per platform.

## Install

`@shopify/react-native-skia` is a **peer** (pinned) and must be installed
alongside the kit. `react-native-reanimated` is an optional peer — install it if
you drive Skia from shared values (the `AudioVisualizer` and any worklet-built
`SkPath`).

```sh
# Expo
npx expo install @knitui/graphics @knitui/core @knitui/components \
  @shopify/react-native-skia react-native-reanimated

# bare React Native / web
npm install @knitui/graphics @knitui/core @knitui/components \
  @shopify/react-native-skia react-native-reanimated
```

You also need the kit's own peers (`react-native-gesture-handler`,
`react-native-reanimated`) and the root `<Provider>` — see
[`@knitui/core`](../core/README.md).

## Quickstart

Two providers: the kit's root `<Provider>` (theming), and `<GraphicsProvider>`
(Skia runtime). On web `<GraphicsProvider>` loads CanvasKit and holds back its
children until it's ready; on native it's a synchronous pass-through.

```tsx
import { Provider } from "@knitui/core";
import { GraphicsProvider } from "@knitui/graphics";

export default function App() {
  return (
    <Provider>
      <GraphicsProvider>
        <Scene />
      </GraphicsProvider>
    </Provider>
  );
}
```

### Raw Skia — straight from the re-exported surface

```tsx
import { Canvas, Circle, Fill } from "@knitui/graphics";

function Scene() {
  return (
    <Canvas style={{ width: 256, height: 256 }}>
      <Fill color="#0b1020" />
      <Circle cx={128} cy={128} r={64} color="#22d3ee" />
    </Canvas>
  );
}
```

### `EffectView` — paint effects onto a box

Effects are **data, not JSX**: pass an `effects` array of `{ effect, ...knobs }`
descriptors. Geometry (size + `borderRadius`) is read off the element's own
`style`, or measured via `onLayout` when it isn't pinned.

```tsx
import { EffectView } from "@knitui/graphics";

<EffectView
  style={{ width: 240, height: 140, borderRadius: 16 }}
  effects={[
    { effect: "fill", type: "linear", colors: ["#6366f1", "#22d3ee"] },
    { effect: "dottedGrid", dotSize: 2, gap: 14, color: "#ffffff22" },
    { effect: "border", width: 1, color: "#ffffff33" },
  ]}
/>;
```

Effect kinds: frame paints (`fill`, `border`, `glow`, `shadow`) and texture /
image effects (`dottedGrid`, `checkerboard`, `noise`, `image`, `blurredImage`).
Each is a typed discriminated union keyed on `effect`.

### `ShadowView` — one shadow, both platforms

A drop-in `<View>` that paints an RN `shadow*` spec with Skia, so Android (which
natively honors only `elevation`) matches iOS. Pass the shadow as props or in
`style`; either way it's stripped from the underlying View so iOS doesn't double
up. Set `inner` for an inset shadow.

```tsx
import { ShadowView } from "@knitui/graphics";

<ShadowView
  style={{ width: 200, height: 120, borderRadius: 12, backgroundColor: "#fff" }}
  shadowColor="#000"
  shadowOpacity={0.25}
  shadowRadius={16}
  shadowOffset={{ width: 0, height: 8 }}
/>;
```

### `AudioVisualizer` — data-driven Skia spectrum

An external driver only ever pushes new **target** states (a row of `0..1`
levels) via the imperative ref handle (`ref.push(levels)`) or a `target`
`SharedValue`. The eased transition between states lives inside the component,
paced on `requestAnimationFrame`, off the React render path.

```tsx
import { AudioVisualizer, type AudioVisualizerHandle } from "@knitui/graphics";

const ref = useRef<AudioVisualizerHandle>(null);
// later, from your audio loop: ref.current?.push(levels)

<AudioVisualizer
  ref={ref}
  variant="mirror"
  gradient={["#22d3ee", "#6366f1", "#ec4899"]}
  glow
  style={{ width: 320, height: 120 }}
/>;
```

Built-in variants: `bars`, `mirror`, `wave`, `line`, `dots`, `radial`
(`visualizerVariantNames`). The `AudioBars` / `AudioDots` / `AudioLine` /
`AudioRadial` / `AudioWaveform` exports are the same engine pinned to one
variant. Register your own shape with `registerVisualizerVariant`. FFT plumbing
(`fftToBands`, `createSpectrumMapper`) and the standalone `useLevelTransition`
easing hook are exported too.

## What's inside

| Export | What it is |
| --- | --- |
| `GraphicsProvider`, `useGraphics`, `useGraphicsReady` | Skia runtime provider + readiness hooks |
| `EffectView` (`ViewProps`, `EffectLayer`, `EffectKind`, …) | Effects-on-a-box `<View>` |
| `ShadowView` (`ShadowProps`, `ShadowViewProps`) | Cross-platform Skia drop shadow `<View>` |
| `AudioVisualizer` + `AudioBars`/`AudioDots`/`AudioLine`/`AudioRadial`/`AudioWaveform` | Data-driven audio visualizer + presets |
| `GradientShader` + gradient fill types (`LinearGradientFill`, `RadialGradientFill`, …) | Reusable Skia gradient shader |
| `fftToBands`, `createSpectrumMapper`, `useLevelTransition`, `registerVisualizerVariant` | Spectrum mapping + level-transition primitives |
| `export * from "@shopify/react-native-skia"` | The whole Skia surface — `Canvas`, `Group`, `Path`, `Image`, shaders, `useImage`, `useSVG`, `Skia`, … |

Same-named Knit exports win over Skia's (e.g. our `ImageSource` type shadows
Skia's). The package also exports canvas geometry types
(`GraphicCanvasProps`, `Fit`, `Point`, `Size`, `RectLike`, `SkiaColor`,
`TileMode`, …) from its barrel.

## Web notes

**Preload CanvasKit before the Skia barrel.** Skia's web runtime captures
`global.CanvasKit` at module-eval time, so CanvasKit must be on the global
*before* anything that re-exports `@shopify/react-native-skia` evaluates.
`<GraphicsProvider>` handles this for its subtree, but if you **lazy-import**
graphics modules, call the runtime loader first:

```tsx
import { loadGraphicsRuntime, isGraphicsRuntimeReady } from "@knitui/graphics/runtime";

await loadGraphicsRuntime(); // resolves once CanvasKit is on the global
const { AudioVisualizer } = await import("@knitui/graphics");
```

`@knitui/graphics/runtime` is a platform-split subpath: on web it boots the
CanvasKit WASM runtime (from the jsDelivr CDN by default — pass a `locateFile`
resolver to override); on native it's a no-op that resolves immediately, since
Skia is linked into the app binary. The loader is idempotent and de-dupes
concurrent callers.

> **~16 live WebGL contexts.** Each mounted Skia `Canvas` on web holds a WebGL
> context, and browsers cap the number of live contexts (~16 in Chrome). Past
> that, the oldest canvases blank out. Mount visualizers one-at-a-time, unmount
> off-screen canvases, or key-remount galleries rather than keeping dozens live.

> **Driving Skia from reanimated.** Keep raw data (levels, points) in shared
> values and build the `SkPath` inside a `useDerivedValue` worklet (with explicit
> `dependencies` on web). Never assign an `SkPath` **into** a `SharedValue` — it
> won't survive the worklet boundary. This is exactly how `AudioVisualizer`
> paints per-frame without re-rendering React.

## Src-ship

Like the rest of the kit, `@knitui/graphics` ships its TypeScript source (its
`main`/`module`/`react-native`/`exports` all point at `./src`). Metro/Expo
resolve it out of the box. For **Next.js**, add it to `transpilePackages` — the
kit's Next plugin does this for you:

```js
// next.config.js
const { withKnitui } = require("@knitui/plugins/next-plugin");
module.exports = withKnitui({ /* your next config */ });
```

## Storybook & scripts

```sh
pnpm --filter @knitui/graphics storybook   # http://localhost:6008
```

| Script | Description |
| --- | --- |
| `typecheck` | `tsc --noEmit` |
| `lint` | `eslint .` |
| `test` | `jest` |
| `storybook` | Storybook dev server (port 6008) |
| `build` | `bob build` |

---

Part of the [Knit UI](../../README.md) monorepo. Requires the root
[`@knitui/core`](../core/README.md) `<Provider>` at your app root.
</content>
