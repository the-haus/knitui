# Animating Skia with Reanimated (web + native)

How we drive `@knitui/graphics` (Skia) elements from `react-native-reanimated` v4 in
this repo, and the one non-obvious rule that, if you break it, makes everything
render perfectly on native and **nothing render on web**.

Stack this was written against: `@shopify/react-native-skia` 2.6.2,
`react-native-reanimated` 4.3.1, `react-native-worklets` 0.8.3. Web runs on
CanvasKit (WASM); native runs on the Skia + Reanimated UI thread.

Reference implementations in-repo:

- `packages/audio/src/surface/AudioSpectrogram.tsx` — a `<Vertices>` heatmap whose
  per-vertex magnitudes ride a shared-value **texcoord** array; a Skia
  `<LinearGradient>` colormap shader does the colorizing on the GPU/CanvasKit.
- `packages/audio/src/surface/AudioVisualizer.tsx` — `<Path>` bars/waveform: a
  `sampleUpdate` handler writes a target levels array; a `requestAnimationFrame`
  loop eases toward it and repaints on the display clock (Rule 4), with gradient
  (`<LinearGradient>`/`<SweepGradient>`) and glow (`<BlurMask>`) painted by Skia.
- `packages/graphics/src/components/AudioWave/AudioWave.tsx` — the minimal
  reference: a pure rAF loop advancing a `phase` shared value feeds a path worklet.

---

## TL;DR

1. **Put plain DATA in shared values; build Skia HOST OBJECTS in a `useDerivedValue`.**
   Numbers, arrays of numbers, and points are safe to hold in a `useSharedValue` and
   pass straight to a Skia prop (`<Circle r={sv}>`, `<Vertices textures={sv}>`). But
   do **not** assign a Skia _host object_ — an `SkPath`, `SkImage`, shader — into a
   shared value: an SV stores a data value, a host object doesn't round-trip through
   it, and the canvas updates slowly / wrongly (this repo shipped exactly that bug —
   `fillPath.value = Skia.Path.Make()…` — and the wave was visibly janky on web). To
   animate a path, keep the _inputs_ (levels, phase) in an SV and build the `SkPath`
   inside a `useDerivedValue`; Skia collects that derived value and re-records when
   the inputs change. This is what `AudioWave` and `usePathInterpolation` do.
2. **On web, give every `useDerivedValue` an explicit `dependencies` array.**
   Storybook's Vite build doesn't run the reanimated/worklets Babel plugin, so the
   auto-closure is missing and the derived value silently never updates. List the
   upstream shared values (watched) and the plain props (restart the mapper). Mirror
   `ready` into a `readyValue` SV so the first paint fires when CanvasKit loads.
3. **Drive the inputs from a JS-thread write on web.** A `sv.value = …` from an event
   handler or a `requestAnimationFrame` loop reliably drives the mapper. (Native also
   tolerates UI-thread drivers — `withTiming`/`useFrameCallback` — per the Skia docs;
   the Vite-without-plugin web build is the fragile case, so prefer JS-thread writes
   there.) For bursty data (audio), pace paints on an rAF loop, not the data clock.
4. **Keep static geometry static.** Vertex grids, bar baselines, triangle indices —
   plain arrays from an `onLayout`-measured size via `useMemo`, not per frame.
5. **Gate on CanvasKit.** Never call `Skia.*` on web before the runtime is loaded:
   `useGraphicsReady()` + a `globalThis.CanvasKit` check, inert placeholder until ready.

---

## The rule: plain data in shared values; build paths in a derived value

### What works — plain data in an SV, straight to a Skia prop

```tsx
const colors = useSharedValue<number[]>(initialColors); // a DATA array — fine
colors.value = nextColors; // JS-thread write → repaint
return <Vertices vertices={staticVertices} colors={colors} indices={staticIndices} />;
```

### What works — animate a path by building it in a derived value

```tsx
const levels = useSharedValue<number[]>(zeros); // DATA in the SV
levels.value = nextLevels; // JS-thread write (e.g. an rAF loop)

// Build the SkPath INSIDE the derived value — never assign an SkPath to an SV.
// Explicit deps are required on web (no worklets Babel plugin under Vite).
const path = useDerivedValue(() => {
  "worklet";
  return buildPath(levels.value, width, height);
}, [levels, width, height]);

return <Path path={path} style="fill" />;
```

### What looks right but is janky / blank on web

```tsx
// ❌ A Skia HOST OBJECT assigned into a shared value, repainted from a loop:
const fillPath = useSharedValue<SkPath | string>("");
fillPath.value = Skia.Path.Make(); /* …build… */ // host object in an SV → janky on web
return <Path path={fillPath} />;

// ❌ A derived value with NO dependencies array — silently never updates under Vite:
const colors = useDerivedValue(() => mags.value.map(toColor)); // missing deps
```

The first is the trap this repo fell into: putting an `SkPath` in a shared value
_seems_ to follow "drive Skia from shared values," but the value an SV carries is
data, not a live Skia handle — build the path in the derived value instead. The
second is blank because, without `dependencies`, the Vite build never wires the
worklet's closure, so it never recomputes.

### Why (so you can recognise the failure mode)

On web, Skia's reconciler (`sksg/Container.web.js`) walks the element tree on each
React commit, collects every Reanimated shared value it finds in props, and starts
**one** mapper over that set:

```
startMapper(() => { drawOnscreen(...) }, [allSharedValuesFoundInProps])
```

When one of those values changes, the mapper re-records the picture and pushes it
to the canvas. A `useDerivedValue` is itself a shared value, so it _is_ collected and
watched — that's exactly why building the path in a derived value works (`AudioWave`,
`usePathInterpolation`): write the inputs → the derived value's own mapper recomputes
the path → its value changes → Skia's mapper re-records. The two failure modes are
narrower than "derived doesn't work":

- **Missing `dependencies` on web.** Under Vite (no worklets Babel plugin) the
  derived worklet has no auto-closure, so it subscribes to nothing and never
  recomputes. Always pass explicit `dependencies`.
- **A host object in a shared value.** The recorded draw command reads the SV's
  value; for `<Path path={sv}>` that value must be a live `SkPath`. An SV carries a
  data value, so assigning an `SkPath` host object to it doesn't give Skia a stable
  live handle to replay each frame — repaints stall or render stale. Keep the SV
  holding data and produce the `SkPath` in the derived value's worklet, which Skia
  replays directly.

Practical consequence: **shared values carry data; derived values carry the Skia
objects built from that data.** Drive the data SV from a JS-thread write, build the
path/uniform in a `useDerivedValue` (with explicit deps on web), hand _that_ to the
element.

---

## Pattern A — event-driven data (audio, sensors, sockets)

Data arrives on the JS thread. Compute and publish there.

```tsx
const width = useMeasuredWidth(); // from onLayout, see Pattern C
const vertices = React.useMemo(
  // static geometry, recomputed on resize
  () => buildVertexGrid(width, height, cols, rows),
  [width, height, cols, rows],
);
const colors = useSharedValue<number[]>(fillColors(cols * rows, floor));

React.useEffect(() => {
  const off = controller.on("sampleUpdate", (sample) => {
    const next = computeColors(sample); // plain JS — cheap
    colors.value = next; // publish → repaint
  });
  return off;
}, [controller, colors]);

return (
  <Canvas style={{ width: "100%", height }}>
    <Vertices vertices={vertices} colors={colors} indices={indices} />
  </Canvas>
);
```

Throttle high-rate sources (assign at ~30 fps, dropping intermediate frames) so you
don't rebuild the picture faster than the screen refreshes.

## Pattern B — clock-driven animation (loops, transitions)

No external data, just time. Use `useFrameCallback` to advance shared values on the
UI thread (this is what `tmp/react-native-animated-glow-main` does), or
`withTiming`/`withRepeat` for declarative tweens. Either drives the Skia mapper
correctly because you're assigning to real shared values.

```tsx
const progress = useSharedValue(0);
useFrameCallback((f) => {
  progress.value = (progress.value + f.timeSincePreviousFrame / 1000) % 1;
});
// progress is a real SV → safe to pass to a Skia prop (or to a uniforms object).
```

For a runtime shader, build the `uniforms` as a single value and pass it to
`<Shader uniforms={uniforms} />`. If `uniforms` must be derived from several shared
values, prefer assigning a plain object into one shared value from a frame callback
over binding a `useDerivedValue` straight to the prop.

## Pattern C — measuring size without `onSize`

Skia's `<Canvas onSize={sv}>` does populate a shared value on web, but you usually
want the size as a plain number to lay out **static** geometry off the React render
path. Measure the wrapper instead:

```tsx
const [width, setWidth] = React.useState(0);
const onLayout = React.useCallback(
  (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width),
  [],
);
return (
  <Box width="100%" onLayout={onLayout}>
    <Canvas style={{ width: "100%", height }}>{/* … */}</Canvas>
  </Box>
);
```

Height is almost always a fixed prop; only width needs measuring for a
`width: "100%"` canvas.

## Always gate on the runtime (web)

```tsx
function canvasKitReady() {
  if (!isWeb) return true; // native is always ready
  return typeof (globalThis as { CanvasKit?: unknown }).CanvasKit !== "undefined";
}
const ready = useGraphicsReady() && canvasKitReady();
if (!ready) return <Box width="100%" height={height} role="img" aria-label={label} />;
```

Calling any `Skia.*` factory before CanvasKit is on the global throws
`Cannot read properties of undefined (reading 'PictureRecorder')`. Wrap the app in
`<GraphicsProvider>` and make sure `LoadSkiaWeb` has run (the Storybook previews do
this with a top-level `await LoadSkiaWeb()` before importing the barrel).

---

## Performance — how to hit a steady frame rate

Animations live on a budget: **16.6 ms/frame at 60 fps, 33.3 ms at 30 fps.** Blow
it and you drop frames. The job is to do as little as possible per frame, on the
right thread, without allocating. This section is the playbook; the rules are
ordered by how much they typically buy you.

### The cost model (know what you're paying for)

Every animated frame pays in up to three places:

1. **JS-thread compute** — reducing your data to draw inputs (the FFT, building a
   path, mapping magnitudes). This blocks _everything else JS does_ (touch, React).
2. **The mapper re-record** — when any shared value in a Skia prop changes, Skia
   re-records the **entire** picture for that `<Canvas>` and pushes it to the GPU.
   On **web** this is one reanimated mapper over _all_ shared values found in the
   tree (`Container.web.js` → `startMapper(drawOnscreen, [...allSVs])`); on
   **native** it's the Skia/RN renderer on its own thread. Either way the cost
   scales with **tree size + per-node prop work**, not with how many SVs changed.
3. **The GPU draw** — fill rate, overdraw, blur/mask passes, large meshes.

Three consequences drive everything below: keep JS compute small and off the React
thread (Rules 1–4), keep the picture cheap to re-record (Rules 5–7), and keep the
GPU work bounded (Rule 8).

### Rule 1 — Paint off the React render path

Per-frame `setState` is the classic killer: every frame triggers a React render +
reconciliation. Drive the visual entirely through shared values handed straight to
Skia element props; React renders only on real prop/size changes. If you find
yourself calling `setX` at frame rate, you're on the wrong path — move the value
into a `useSharedValue`. (The `useAudioSamples` hook is the _deliberately_
React-rendered, 30 fps-throttled exception for "build your own cheap meter"; the
`<AudioVisualizer>`/`<AudioSpectrogram>` surfaces are the off-render-path version.)

### Rule 2 — Compute cheap, then assign exactly once

Do the per-frame math where it's cheapest — the JS event handler for data-driven
sources, or a `useFrameCallback` worklet for clock-driven ones — and publish the
**result** with a single `sv.value = …`. That one assignment is what notifies
Skia's mapper. Don't bind a `useDerivedValue` to a Skia prop (it silently fails to
repaint on web — see the rule at the top of this doc). Derived values are fine for
_computing_; the thing you hand to the element must be a direct shared value.

### Rule 3 — Reassign a fresh reference, but don't allocate: double-buffer

Skia repaints only when the shared value receives a **different reference**.
Mutating one array/object in place and reassigning the same reference can be
skipped by change detection. Allocating a brand-new array/`SkPath` every frame
fixes detection but feeds the GC (and, for Skia objects on web, the WASM heap).

Get both — fresh reference **and** zero steady-state allocation — by
**double-buffering**: keep two buffers, write the one that is _not_ currently on
screen, assign it, and flip.

```tsx
const bufRef = React.useRef([makeBuffer(), makeBuffer()]);
const flip = React.useRef(0);
// per frame:
const i = flip.current;
flip.current = i ^ 1;
sv.value = writeInto(bufRef.current[i], data); // mutate off-screen buffer, then assign
```

Both audio surfaces ping-pong this way: `AudioVisualizer` over two `SkPath`s
(`rewind()` keeps each path's allocated capacity, then rebuild), `AudioSpectrogram`
over two texcoord arrays. Allocate the buffers lazily on the first ready frame —
`Skia.Path.Make()` before CanvasKit is loaded throws on web.

### Rule 4 — Drive paints from the DISPLAY clock, not the data clock

The single biggest smoothness lever for a data-driven visualizer. Live data
(audio frames over a `MessagePort`, sensor events) arrives at an _irregular_
cadence — postMessage delivery bunches and stalls when the main thread is busy.
If you repaint **once per data frame**, that jitter becomes visible jank even at a
healthy average fps. Instead, split it:

- **Data handler (data rate):** reduce the frame to a small **target** array and
  store it (`targetRef.current = levels`). Do _not_ paint here.
- **`requestAnimationFrame` loop (display rate):** every frame, ease the current
  bars toward the latest target, rebuild the path, assign the SVs. Regular cadence,
  capped at refresh, immune to delivery jitter — this is exactly why
  `@knitui/graphics`' `AudioWave` (a pure rAF loop) looks buttery, and what the audio
  `AudioVisualizer` now does (`sampleUpdate` writes a target; an rAF loop paints).

```tsx
// data handler — cheap, no paint:
target.current = reduce(sample);
lastSample.current = now();
startLoop();
// rAF loop — display-paced:
const tick = () => {
  if (now() - lastSample.current > IDLE_MS) target.current.fill(0); // audio stopped → decay out
  const eased = smoother(target.current); // ease toward the live target
  sv.value = buildInto(buffer(), eased); // repaint (double-buffered)
  if (atRest(target.current) && atRest(eased)) {
    running.current = false;
    return;
  } // idle → suspend
  raf(tick);
};
```

Bonus: the loop **self-suspends** when everything is at rest (silent target + settled
bars) and the next data frame restarts it — so an idle/paused visualizer costs zero,
without a manual throttle. This is the right kind of rate control: paced by the
display, gated by activity.

**Throttle traps to avoid** (what made the wave _slow_ before this rewrite):

- **Don't stack throttles, and never gate at (or below) the source rate.** A 30 fps
  gate on a 30 fps producer aliases on timing jitter → ~15 fps, choppy. The rAF loop
  above is the _only_ cadence control the renderer needs; an extra `FRAME_MS` gate on
  top just drops frames the user wanted.
- **Per-frame path rebuilds are cheap** (the audio bench: 0.15–0.69 ms/frame) — don't
  throttle to "save" work that isn't expensive. A slowly-scrolling heatmap (the
  spectrogram) is the one case a single ~30 fps gate against the 60 fps producer is
  appropriate, because its column cadence _is_ the animation.

### Rule 4b — Gate on _silence_ at the source — never on "steady"

To stop spinning the chain when there's nothing to show, drop frames at the
**producer** — but gate on **silence**, not on a peak/rms _dead-band_. A dead-band is
a trap for audio: peak and rms are aggregates over a large, _overlapping_ analysis
window (≈2048 samples), so they barely move frame-to-frame during sustained playback
**even though the waveform shape the visualizer draws keeps changing**. Dead-banding
them starves the visualizers of frames they needed → choppy, "slow" playback (a real
regression this repo hit). Gate only true silence instead: pass every frame whose
peak/rms is above a small floor; suppress only sustained sub-floor silence, after a
short tail so a downstream smoother can decay to rest. Idle → ~0 Hz, active → every
frame, for **all** consumers, with no second gate in the renderer.

### Rule 5 — Build static work once, never per frame

Anything that only changes on **resize** (or never) belongs in `useMemo`, not the
frame loop: vertex grids, triangle index lists, colormap gradients/LUTs, baseline
geometry. Measure width from an `onLayout` wrapper (a plain number) and recompute
geometry only when it changes — don't thread it through a shared value or rebuild
it each tick. Height is usually a fixed prop and needs no measuring.

### Rule 6 — Color and gradient _through Skia_, not per-vertex in JS

Pushing color math onto the GPU is one of the biggest wins for meshes. On **web**,
`JsiSkVerticesFactory` flattens a per-vertex `colors` array with
`colors.reduce((a, c) => concat(a, c))`, reallocating every step — ≈ `2·N²` float
copies per repaint (~6 ms at 3 k vertices, ~16 ms at 6 k, ~27 ms at 8 k).

Instead, build the colormap/gradient **once** as a Skia shader
(`<LinearGradient>` / `<SweepGradient>` / `<RadialGradient>`) and feed each vertex
a **texture coordinate** (`textures` prop) that selects where to sample it. The
spectrogram sets texcoord `x = magnitude` over a horizontal `0 → 1` gradient, so
the GPU does the colorizing and the only per-frame JS is writing one float per
vertex. Texcoords flatten as a cheap points array, sidestepping the `O(n²)` path
entirely.

```tsx
<Vertices vertices={staticGrid} textures={texcoords /* SV: x = value */} indices={staticIndices}>
  <LinearGradient
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    colors={rampColors}
    positions={rampStops}
  />
</Vertices>
```

Gradients, glows, and blurs are likewise shader/filter nodes — `AudioVisualizer`
fills bars with a `<LinearGradient>`/`<SweepGradient>` and wraps them in a
`<BlurMask>`, all painted by Skia rather than computed in JS. If you genuinely need
per-vertex colors, prefer packed `0xAARRGGBB` integers over CSS strings
(`Skia.Color` accepts them via `processColor`; the TS type says `string[]`, a
localised cast is fine) and keep the mesh modest on web.

### Rule 7 — Keep the picture small and its identity stable

The re-record cost scales with the element tree, so:

- **Fewer nodes.** Merge what you can — one `<Path>` with many sub-paths beats N
  `<Path>`s; one `<Vertices>` mesh beats a grid of rects. For many similar sprites
  use `<Atlas>` (`drawAtlas`) to batch them into a single draw.
- **Stable identity.** Don't remount Skia nodes every render — keep keys/structure
  fixed and animate via shared values. A fresh element instance forces re-record
  and can re-create paints. (Build child paint fragments fresh per render only when
  they're cheap and static, as `AudioVisualizer.paintMods()` does.)
- **Cache the static parts.** Wrap unchanging complex content in an `SkPicture`
  (`createPicture` → `<Picture picture={…} />`) and replay it; only the animated
  layer re-records.
- **Don't over-share shared values.** On web, every SV anywhere in the canvas tree
  joins the one draw mapper. Prefer a handful of SVs (or one packed `uniforms`
  object for a shader) over dozens of tiny ones.

### Rule 8 — Bound the GPU work

- **Overdraw**: avoid stacking many large semi-transparent layers; clip to what's
  visible. A `width:"100%"` canvas should be exactly as tall as needed.
- **Blur/mask passes are expensive** — a `<BlurMask>`/image filter is a separate
  pass. Use a modest radius, and don't animate the radius if you can animate
  cheaper props instead.
- **Mesh size**: total `<Vertices>` (`bins × columns`) drives both the web flatten
  and GPU cost — the spectrogram defaults to a deliberate 64×96 ≈ 6 k. Scale down
  on web before you scale up.

### Rule 9 — Skia object hygiene

`SkPath`, `SkPaint`, `SkImage`, shaders are native/WASM-backed. Don't create them
in `render()` (that runs on every React pass) — create in `useMemo`/refs/worklets.
Reuse paths via `rewind()` (keeps capacity) rather than re-`Make()`. For
long-lived objects you own, `dispose()` them on unmount to free WASM memory
promptly instead of waiting on the FinalizationRegistry. Never call a `Skia.*`
factory on web before CanvasKit is loaded (gate on `useGraphicsReady()` +
`globalThis.CanvasKit`); for a center/point use a plain `{ x, y }` rather than
`vec()` so you don't touch the runtime early.

### Rule 10 — Clock-driven shaders and uniforms

For time-based animation use `useFrameCallback` to advance a real shared value on
the UI thread, then drive a runtime shader. Compile the `SkRuntimeEffect` **once**
(`useMemo`) — never rebuild the SkSL string per frame. If the shader needs several
inputs, assign a single plain `uniforms` object into **one** shared value from the
frame callback and pass that to `<Shader uniforms={uniforms} />`, rather than
binding a `useDerivedValue` (web won't repaint) or spreading many SVs.

### Rule 11 — Respect reduced motion

`useReducedMotion()` should disable or snap animations (both surfaces force
`smoothing → 0`). It's an accessibility requirement, and a free perf win when the
user has asked for less motion.

### Measuring

Don't guess — measure on the **slowest** target (a low-end Android device, and a
browser, not just the sim). Watch the native FPS/jank counters (`adb shell dumpsys
gfxinfo`), React DevTools' commit count (it should _not_ climb during a steady
animation — if it does, you violated Rule 1), and the per-frame JS time of your
reduction step. Optimize the thing the profiler points at, then re-measure.

## Checklist when "it renders on device but not on web"

1. Is any Skia prop bound to a `useDerivedValue`? Replace with a direct
   `useSharedValue` you assign to. ← this is the usual culprit.
2. Is CanvasKit loaded before the first `Skia.*` call?
3. Is the geometry degenerate (zero width before `onLayout`, empty array)?
4. Is a large `<Vertices>` mesh passing a per-vertex `colors` array (the web
   `O(n²)` flatten)? Switch to a gradient shader + `textures` (Rule 6).

## Checklist when "it's janky / drops frames"

1. Any `setState` at frame rate? Move it into a shared value (Rule 1).
2. Allocating a new array / `SkPath` / object every frame? Double-buffer (Rule 3).
3. Data arriving faster than 30–60 fps? Throttle before the heavy work (Rule 4).
4. Rebuilding static geometry (grids, indices, LUTs) each tick? `useMemo` it (Rule 5).
5. Computing colors per vertex in JS? Move it to a gradient shader (Rule 6).
6. Re-recording a huge or remounting tree? Shrink it, stabilize identity, cache
   static parts in an `SkPicture` (Rule 7).
7. Heavy blur/overdraw/oversized mesh? Bound the GPU work (Rule 8).
8. Creating Skia objects in `render()`? Move them out; reuse + dispose (Rule 9).
