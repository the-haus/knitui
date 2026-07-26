---
"@knitui/media": patch
"@knitui/graphics": patch
---

Take the allocations out of the audio sampler and the Skia visualizer's paint

The media store's design was already right — per-field channels, auto-tracked
selectors, one FFT per painted frame — so this is a pass over the two paths that run
at 60 Hz rather than at tick rate: the PCM sample bridge and the visualizer painter.

**The sampler did full peak/RMS work per frame, before the silence gate, and even
when nothing was listening.** The backend posts a ~2048-frame window per display
frame for as long as sampling is on, and `setSamplingEnabled` is driven by mount
effects that can outlive the visualizer that asked for it — so with no
`sampleUpdate` listener at all, every frame still allocated a channel array (`.map`)
plus a result object and walked every frame twice (`peakOf` then `rmsOf`, ≈245k
typed-array reads/second on a stereo source), only for `emitSample` to then drop it
at the silence gate. The handler now returns on `hasListeners("sampleUpdate")` as its
first statement (the same gate `timeUpdate` already had), fuses peak and RMS into ONE
pass over the frames (≈123k reads/second, byte-identical results — the per-channel
clamps land exactly where `peakOf`/`rmsOf` applied them), and refills a reused channel
list + envelope instead of allocating two objects per frame. `AudioSampleData` already
documented its buffers as read-synchronously; that now explicitly covers the channel
list too. `mixChannels` takes an optional result object for the same reason.

**Time labels subscribed to a raw float although `formatTime` floors to seconds.**
`useAudioState(s => s.currentTime)` fails `Object.is` on every tick, so the `<Text>`
re-rendered at tick rate — 4 Hz on video, higher on native audio — and 3 of every 4
renders produced a byte-identical string. The five timecode labels (`TimeCurrent` and
`TimeDisplay` on `<Audio>`, `<Video>` and `<AudioPlaylist>`) now select
`Math.floor(s.currentTime)`. The scrubbers keep the float — they need sub-second
thumb positions.

**`useMediaSelector` allocated a `Proxy` and a sorted key signature per notification
AND per render.** Every store change per subscribed leaf built a fresh tracking
`Proxy` in `runTracked`, a `[...keys].map(String).sort().join()` in `register()`, then
a second `Proxy` + signature during the re-render and a third signature in the
post-commit effect — ≈3 proxies and 3 sorted strings per leaf per tick. Snapshots are
immutable, so the tracking proxy is now cached per snapshot identity in a `WeakMap`
(one proxy serves every leaf that reads that snapshot, and it dies with it) and the
tracked key set is compared by size + membership against the registered list, so the
steady state allocates nothing. This is noise at the current 4 Hz tick and stops being
noise the moment a caller drives position at frame rate.

**The visualizer built 2 Skia host objects per bar, per frame.** `Skia.XYWHRect` +
`Skia.RRectXY` each return a real host object — a JSI `HostObject` holding a C++
`shared_ptr` on native, a `JsiSkRect` wrapping a fresh `Float32Array` on web — so
`variant="mirror"` at the default `count=48` created and discarded 96 of them per
painted frame, ≈5,800/second, on the UI thread. Both bindings also accept a plain
object and copy out of it synchronously (`JsiSkRect::fromValue` / `JsiSkRRect::fromValue`,
and their web twins), so the fill builder now reuses ONE mutable rect/rrect pair for
the whole frame: 96 host objects per frame → 2 plain objects. The resulting `SkRRect`
comes from the identical `SkRRect::MakeRectXY` call, and a zero radius takes `addRect`,
which is what Skia's `addRRect` degenerates to for a radius-less rrect — the drawn
path is unchanged, and a new suite records the exact op sequence (`addRRect`/`addRect`/
`addCircle`/`moveTo`/`lineTo`/`close`) with the values each call received to keep it that
way.

**And it rebuilt the whole shape list as objects every frame to hand it to the
builder in the next statement.** A `useDerivedValue` published `count` fresh
`{kind,x,y,w,h,r}` objects plus a fresh array into a SharedValue per frame (≈2,900
objects/second at the default `count`, plus another array whenever `gain`/`floor`/
`reverse` was set), read once by the two path worklets and thrown away. Each variant
now also exists as a writer into a flat `Float64Array` that the component owns and
reuses forever, and geometry + path building are fused into the two path worklets, so
the intermediate never exists: the steady-state paint allocates nothing but the
`SkPath` itself. `strokeWidth` no longer builds a `count`-length zero array and runs
the whole variant to read one number either. The cost is one extra variant pass per
frame (pure arithmetic into a buffer) in exchange for a SharedValue write, a mapper,
and every allocation on the path. `Float64Array` rather than `Float32Array` so the
coordinates round-trip exactly.

`VisualizerVariant`, `registerVisualizerVariant` and the six exported variants are
UNCHANGED — the object-shaped variants are now thin decoders over their writers (one
implementation of each variant's geometry, so the two forms cannot drift), and a
foreign variant is adapted by a shim that encodes its returned shapes, paying exactly
the allocation it paid before.

**`<AudioMesh>` repainted a full-canvas fragment shader 60 times a second even with
its drift frozen.** It drove its uniforms from Skia's `useClock()`, whose frame
callback runs for as long as the component is mounted; every tick dirtied the uniforms
mapper, so `prefers-reduced-motion` (which pins the drift at `t = 0`) and `speed={0}`
(documented as "freezes the orbit") both kept rebuilding uniforms and repainting
pixel-identical output forever. The clock is now local and stopped whenever the drift
is frozen — no writes, so no mapper run, so no repaint — and a frozen mesh repaints
only when the AUDIO moves it. Its uniforms also go into buffers the component owns
(`buildMeshUniformsInto`): 3 arrays + a `[w, h]` tuple + the record per frame → just
the record, which has to stay fresh or reanimated skips the SharedValue write and
`<Shader>` never sees the frame. `buildMeshUniforms` keeps its exact allocating shape
for other callers, over the same single implementation of the math.

Also, in the same spirit:

- `useVisualizerSource` built a `${count}|${fftScale}|…|${bins}` memo key on EVERY
  pushed FFT row (up to display rate) to prove nothing had changed; the mapper cache
  now lives in the reducer's closure, keyed by the settings, so only the pushed length
  is compared.
- `TypedEmitter.emit` copied its listener `Set` into a fresh array on every emit —
  including per audio frame. The single-listener case (a visualizer on `sampleUpdate`,
  a scrubber on `timeUpdate`) now dispatches without the copy, with identical
  semantics: a listener it removes was already dispatched, and one it ADDS is still not
  delivered to in the same emit (which plain live iteration WOULD do — a `Set` grown
  during iteration yields the new entries; there is a test for exactly that).
- The mic-stream reductions (`frameFromTimeDomain`, native `useAudioStream`) write the
  envelope straight into the frame/level object through a reused one-slot channel
  list: 3 allocations per captured buffer → 1 (the level object stays fresh — it is
  handed to `onLevel` and to React state).

No public API changes in either package.

Deferred: moving `useLevelTransition`'s smoother from the JS thread onto the UI thread,
and/or publishing its eased row as a ping-ponged typed array (today: 60 boxed
48-element arrays per second, each converted element-by-element into a reanimated
serializable on native — a shared `ArrayBuffer` would skip both). The allocation counts
are certain, but it touches the documented Reanimated-4 SharedValue rules, changes the
public `SharedValue<number[]>` level type, and trades a fresh-array-per-frame guarantee
for double buffering, so the win wants on-device measurement first.
