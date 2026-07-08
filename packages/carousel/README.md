# @knitui/carousel

A clean-sheet, cross-platform (React Native + Web) carousel / slider.

> Design plan: [`docs/fresh-carousel-plan.md`](../../docs/fresh-carousel-plan.md).

## Install

```sh
# Expo
npx expo install @knitui/carousel react-native-gesture-handler react-native-reanimated

# bare React Native / web
npm install @knitui/carousel react-native-gesture-handler react-native-reanimated
```

`@knitui/carousel` builds on `@knitui/core` + `@knitui/components`; install those
alongside the kit as usual. `react-native-gesture-handler` and
`react-native-reanimated` are required peers. Like the rest of the kit it ships
TypeScript source — Expo/Metro consume it directly, and Next.js picks it up via
the `withKnitui` wrapper from `@knitui/plugins/next-plugin`.

## Features

- **Scroll engine**: the default transform engine, or `scrollMode="native"` for real
  OS/browser scrolling (momentum, rubber-band, accessible, free scroll). See below.
- **Modes**: normal, parallax, horizontal/vertical stack, and `customAnimation`.
- **Loop** (with seamless auto-fill for 1–2 item lists), `vertical`, paging/snap, overscroll.
- **Gesture + keyboard + wheel** input; `autoPlay` (reduced-motion & tab-visibility aware).
- **Virtualized** — mounts only a window of slides; large lists auto-virtualize.
- **Remote / lazy data** via an async `source` that fetches on scroll (see below).
- **Imperative** `ref` (`next`/`prev`/`scrollTo`/`getCurrentIndex`) + **controlled** `index`.
- **Decoupled pagination**: `<Pagination>` plus data-driven `Pagination.Basic` /
  `Pagination.Custom` (custom dot content + worklet styles), driven by a `progress` shared value.
- **Observable / controllable**: bind an external `scrollOffsetValue`; `onProgressChange`
  accepts a callback **or** a `SharedValue<number>`.
- **Page sizing**: `itemSize` (or the axis aliases `itemWidth` / `itemHeight`) sets the
  snap/animation unit independently of the container size.
- **`fixedDirection`** (`"positive"` / `"negative"`) forces the loop travel direction.
- **Accessible**: region/slide roles, focus, a polite live region; reduced-motion respected.
- **`SwipeDeck`**: a Tinder-style swipe deck with pluggable effects (`tinder` / `stack` /
  `fan` / `swipe`), directional commit (distance or flick velocity), stamps, and an
  imperative `ref`. See below.

### Observing & controlling the scroll

```tsx
import { Carousel, Pagination } from "@knitui/carousel";
import { useSharedValue } from "react-native-reanimated";

const progress = useSharedValue(0);        // 0 → data.length, fractional
const ref = useRef(null);

<Carousel ref={ref} data={data} onProgressChange={progress} renderItem={…} />
<Pagination.Basic
  progress={progress}
  data={data}
  onPress={(i) => ref.current?.scrollTo({ index: i })}
/>;
```

## Native ("normal") scroll

By default the carousel is driven by a custom reanimated engine — one scroll
offset transforms every slide. That powers `loop`, the transition `mode`s
(parallax/fade/cube/…), virtualization and the async `source`. When you just want
a **plain, momentum-scrolling strip of slides**, pass `scrollMode="native"`:

```tsx
<Carousel
  data={photos}
  scrollMode="native" // real platform scroll container
  itemWidth={200} // page/snap unit; omit for full-width pages
  renderItem={({ item }) => <PhotoCard photo={item} />}
  style={{ width: 360, height: 240 }}
/>
```

In native mode the track is an `Animated.ScrollView` on native and an
overflow-scroll surface (with CSS scroll-snap) on web — so scrolling, momentum
and rubber-band overscroll are the OS's own, and **nothing runs per frame on the
JS thread**. The live scroll position is mirrored into the same scroll-offset
shared value the engine uses, so pagination, `progress` / `onProgressChange`, the
active index, controlled `index`, and the imperative `ref`
(`next`/`prev`/`scrollTo`) all keep working.

What changes vs. the transform engine:

|                                                       | transform (default) | `scrollMode="native"` |
| ----------------------------------------------------- | ------------------- | --------------------- |
| `loop`                                                | ✅                  | forced off (warns)    |
| transition `mode` / `customAnimation`                 | ✅                  | ignored (flow layout) |
| virtualization / async `source`                       | ✅ windowed         | mounts every slide    |
| momentum / overscroll physics                         | emulated            | the OS's own          |
| `snapEnabled` / `pagingEnabled` / `overscrollEnabled` | ✅                  | ✅                    |
| `vertical`, `itemSize`/`itemWidth`/`itemHeight`       | ✅                  | ✅                    |

`snapEnabled={false}` gives free (non-paged) scrolling; `pagingEnabled` snaps one
page per swipe. Use the default transform engine for looped, animated, or very
large / remote lists; use native mode for a simple, maximally smooth scroll strip.

## Remote / virtualized data

Pass an async `source` instead of an eager `data` array — only the slides in the
virtualization window are fetched, so a 10k-item remote list costs a handful of
requests and a handful of mounted nodes.

```tsx
import { Carousel, createAsyncSlideSource } from "@knitui/carousel";

const source = createAsyncSlideSource<Photo>({
  length: 10_000, // total item count
  pageSize: 20, // fetch batch size
  fetchRange: (start, count) => api.getPhotos(start, count), // Promise<Photo[]>
});

<Carousel
  source={source}
  windowSize={5} // how many slides to mount/fetch around the active one
  renderItem={({ item }) => <PhotoCard photo={item} />}
  renderPlaceholder={() => <Skeleton />} // shown while a slide's page loads
  style={{ width: 360, height: 240 }}
/>;
```

Eager `data` still works unchanged; lists longer than ~11 items auto-virtualize
(bounded mounted window) unless you set `windowSize` explicitly.

## Swipe deck (`SwipeDeck`)

A Tinder-style swipe deck: the top card free-drags in 2-D and commits a
like / nope / super-like past a directional threshold — by distance **or** flick
velocity — flying off while the next card rises to the top.

```tsx
import { SwipeDeck } from "@knitui/carousel";
import { useRef } from "react";

const ref = useRef(null);

<SwipeDeck
  ref={ref}
  data={profiles}
  effect="tinder" // "tinder" | "stack" | "fan" | "swipe" | custom worklet
  directions={["left", "right", "up"]}
  stampLabels={{ right: "LIKE", left: "NOPE", up: "SUPER" }}
  onSwipe={(item, index, dir) => log(dir, item)}
  onEmpty={() => log("out of cards")}
  renderCard={(profile) => <ProfileCard profile={profile} />}
  renderEmpty={() => <NoMoreCards />}
  style={{ width: 320, height: 440 }}
/>;

// Imperative swipes (e.g. from Like / Nope buttons):
ref.current?.swipeRight();
```

- **Effects** are the extensibility seam — each is a card-transform worklet
  `(DeckCardState) => ViewStyle`, selected by the `effect` prop (a built-in
  name or your own worklet). `DeckCardState` carries the card's animated stack
  `depth`, live 2-D `drag`, and measured `size`; tune the built-ins via
  `effectConfig` (`stackInterval` / `scaleInterval` / `tiltDeg` / `fanDeg` / …).
- **Stamps** — the LIKE / NOPE overlays — come from `stampLabels` (built-in
  bordered labels) or `renderStamp(direction)` (full control); their opacity is
  driven by the drag toward that direction.
- **Commit tuning**: `threshold` (fraction of card size, default `0.25`) and
  `velocityThreshold` (px/s, default `800`); `directions` gates which way a
  card can leave.
- **Imperative `ref`**: `swipe(dir)` / `swipeLeft` / `swipeRight` / `swipeUp` /
  `getActiveIndex`. Callbacks: `onSwipe` (+ per-direction), `onActiveIndexChange`,
  `onEmpty`.
- **Styling**: set the deck's size via `style`; theme the parts via the `styles`
  per-slot map (`root` / `card` / `stamp`) or the exposed `SwipeDeck.Frame` /
  `SwipeDeck.Card` / `SwipeDeck.Stamp` styled parts.

## Architecture

The hard part — the motion math — is a **platform-free, reanimated-free, DOM-free**
engine of pure functions over a single signed scroll offset (`src/engine`). It is
directly unit-tested without a renderer. The reanimated/worklet driver and the
React views consume it; the only platform split is the input layer (gesture-handler
on native, pointer/wheel/keyboard on web).

```
src/
  engine/        # pure functions: offset↔index, itemProgress (loop core), settle, window
  motion/        # reanimated worklet wrappers (shared RN + web)
  input/         # platform-split gesture/pointer input
  layouts/       # (progress,index) => ViewStyle worklets
  view/          # <Carousel>, Track, Item, virtualization
  pagination/    # decoupled indicators (consume a `progress` SV)
  deck/          # <SwipeDeck> — 2-D drag/commit + pluggable card effects
```

### The loop, redesigned

Looping is **virtual**: a single shortest-path-on-a-ring function
(`engine/itemProgress`) places every mounted item at most `count / 2` pages from
center, so items wrap automatically — with **no data duplication** and no
multi-point interpolation seams. One formula, correct for every item count.

## Scripts

```
pnpm test         # jest — engine + view + pagination + deck (192 tests)
pnpm typecheck
pnpm lint
pnpm storybook    # port 6008
pnpm build        # react-native-builder-bob
```

## Web rendering — imperative painter

Reanimated's web _reactivity_ (`useAnimatedStyle` re-running on shared-value changes) does not run under
this repo's Vite tooling — Vite doesn't apply the worklets Babel plugin. So the web build does **not**
animate slides through `useAnimatedStyle`. Instead it uses an **imperative rAF painter**
(`view/painter.web.ts` + `Item.web.tsx`): one `requestAnimationFrame` loop reads the live `offset`
shared value (which Reanimated's runtime _does_ tick for `withTiming`/`withSpring`/`withDecay`) and
writes each slide's transform/opacity/zIndex to the DOM directly. This mirrors the pattern ScrollArea
uses for its web thumbs. Native keeps the standard `useAnimatedStyle` path (`Item.tsx`). The only
platform split in the view layer is `Item` + `painter`.

## Testing & environments

| Layer                                                                                                       | Environment                                          | Status           |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------- |
| Engine math (offset / loop ring / settle / window)                                                          | jest (pure TS)                                       | ✅ deterministic |
| Controller, virtualization, async source, autoplay, controlled index, deck commit/effects, edge cases, a11y | jest + react-native-web (jsdom) — 192 tests          | ✅ verified      |
| Real animation, drag, layout modes, swipe-deck gestures, keyboard/wheel, async loading, large-data perf     | Storybook (`:6008`) in a real browser via Playwright | ✅ verified      |

The jsdom painter is inert (no frame loop), so animated transforms are verified in a real browser, not
jest; jest covers the logic. Native animation runs through Reanimated on-device as usual.
Browser-verified perf: a 5 000-item list mounts **11** DOM cells and stays at 11 after heavy paging
(window recycling); a 10 000-item async source fetches only the first page(s) up front.

---

Part of [Knit UI](../../README.md).
