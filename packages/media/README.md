# @knitui/media

Hybrid, cross-platform **audio + video** for Knit UI. Each domain drives a real
browser backend on the web (`HTMLAudioElement` / `<video>` + Web Audio /
MediaSession / Fullscreen / PiP) and `expo-audio` / `expo-video` on native, both
behind one isolated controller contract per surface.

## Install

```sh
# Expo
npx expo install @knitui/media react-native-reanimated

# bare React Native / web
npm install @knitui/media react-native-reanimated
```

`@knitui/media` builds on `@knitui/core` + `@knitui/components`; install those
alongside the kit as usual. `react-native-reanimated` is a required peer.

## Mount the provider once

The root entry exports the one cross-domain piece — `<MediaProvider>`. It owns
the single shared `<audio>` / `<video>` element and is **required** for any
player to render: each surface teleports into the active player, so without the
provider there is nothing to mount the real element into. Mount it once near your
app root, inside the Knit UI `<Provider>`:

```tsx
import { Provider } from "@knitui/core";
import { MediaProvider } from "@knitui/media";

export default function App({ children }) {
  return (
    <Provider>
      <MediaProvider>{children}</MediaProvider>
    </Provider>
  );
}
```

`useMediaState()` reads the reactive cross-domain state (what's playing, etc.).

## Audio & video are separate entry points

The two domains share several engine helper names with different meanings, so
there is no flat barrel — import each domain from its own subpath:

```ts
// audio: <Audio> player, playlist, recorder, live meter, Skia visualizer …
import { Audio, AudioPlaylist, useAudioController } from "@knitui/media/audio";

// video: <Video> player + chrome (fullscreen, PiP, captions) …
import { Video, useVideoController } from "@knitui/media/video";
```

A third subpath, `@knitui/media/dsp`, exposes the pure-TS DSP surface (FFT /
spectrum analyzer + the `useAudioSpectrum` hook) for building custom
visualizations off the audio sample stream.

Truly-shared, dependency-free primitives (`TypedEmitter`, `formatTime`) live in
[`@knitui/core`](../core).

## Src-ship & Next.js

Like the rest of the kit, `@knitui/media` **ships its TypeScript source** (see
[`docs/ci-cd-plan.md` §3](../../docs/ci-cd-plan.md)). Expo/Metro consumes it out
of the box; **Next.js** must transpile the `@knitui/*` scope — the `withKnitui`
wrapper from `@knitui/plugins/next-plugin` does this for you.

## Development

- `pnpm --filter @knitui/media test` — Jest (jsdom) suites for both domains
- `pnpm --filter @knitui/media typecheck` / `lint`
- `pnpm --filter @knitui/media storybook` — combined Storybook on port **6010**

---

Part of [Knit UI](../../README.md).
</content>
