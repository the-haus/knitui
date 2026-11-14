# Media lab

An end-to-end check of `@knitui/media` on a real runtime. Unit tests cannot see
what breaks media in practice (a native module that fails to load, a server that
ignores `Range`, audio focus, a recorder the OS will not start), so the lab plays
real media on iOS, Android and web and asserts on what happens.

Run it after any change to `packages/media`, and always after touching `ios/` or
`android/`.

## What it is

| Piece                              | Where                                                 |
| ---------------------------------- | ----------------------------------------------------- |
| The screen that runs the scenarios | `apps/app/src/app/media-lab.tsx` (route `/media-lab`) |
| The test server                    | `scripts/media-lab/server.mjs`                        |

The server serves a generated tone and a short public clip two ways: `/range/…`
honours `Range` like a CDN, `/norange/…` ignores it, which is the case iOS cannot
seek or measure on its own. The clip is downloaded once into
`scripts/media-lab/.cache/`.

Each scenario prints one line, so a run can be read from the Metro log or the
browser console:

```
[MEDIA-LAB ios] PASS video-norange  duration=52.2 seek=26.0
[MEDIA-LAB ios] SUMMARY pass=13 fail=0 skip=2
```

## Running it

```sh
node scripts/media-lab/server.mjs                      # terminal 1
cd apps/app && EXPO_PUBLIC_MEDIA_LAB=1 npx expo start  # terminal 2
```

With `EXPO_PUBLIC_MEDIA_LAB=1` the app opens on the lab and starts the run by
itself on iOS and Android. On web, open `http://localhost:8081/media-lab` and click
anywhere: a browser only lets sound start from a user gesture.

Native code changes need a rebuild first (`npx expo prebuild`, then
`npx expo run:ios` / `run:android`).

| Variable                                        | Effect                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `EXPO_PUBLIC_MEDIA_LAB=1`                       | Open on the lab and run on launch.                                        |
| `EXPO_PUBLIC_MEDIA_LAB_ONLY=recording,playlist` | Run only these scenarios.                                                 |
| `EXPO_PUBLIC_MEDIA_LAB_HLS=1`                   | Include the HLS scenario (a public stream, so it depends on the network). |
| `EXPO_PUBLIC_MEDIA_LAB_PORT` / `MEDIA_LAB_PORT` | Move the test server off 8799.                                            |

These are inlined when the bundle is built, so restart Metro after changing one.

## Scenarios

`audio-range`, `audio-norange`, `video-range`, `video-norange` (load, duration,
seek), `sampling-audio`, `sampling-video`, `preload-audio`, `preload-video`,
`hub-exclusive` (hand-over both ways, pause-all, mixing), `playback-options`,
`lock-screen`, `hls`, `playlist`, `recording`, `picture-in-picture`.

## Things that will trip you up

- **Sound.** Everything plays at a volume far below hearing, not muted: a muted
  player takes no focus in the media hub. Start an Android emulator with
  `-no-audio` to be sure.
- **Microphone.**
  - iOS simulator: `xcrun simctl privacy booted grant microphone <bundle id>`.
    The Mac itself also asks once whether Simulator may use the microphone; until
    that is answered, `recording` hangs in `prepare()`.
  - Android: `adb shell pm grant <package> android.permission.RECORD_AUDIO`.
  - Web: the browser prompt needs a person, so a scripted browser reports `SKIP`.
- **Picture in Picture.**
  - Android pauses the JavaScript runtime while the activity is in Picture in
    Picture, so that scenario runs last, after the summary. Read the result off
    the device: `adb shell dumpsys activity activities | grep mode=pinned`.
  - The iPhone simulator has no Picture in Picture, and a browser wants a fresh
    user gesture. Both report `SKIP`.
- **Another Metro on 8081.** Run this one on another port (`--port 8082`) and
  point the app at it: on the simulator
  `xcrun simctl spawn booted defaults write <bundle id> RCT_jsLocation localhost:8082`,
  on the emulator set `debug_http_host` to `10.0.2.2:8082` in the app's shared
  preferences. A debug build that cannot reach its Metro falls back to 8081 and
  loads whatever is served there.
- **First bundle.** The first launch after a cache clear can time out with "Could
  not connect to development server" while Metro is still bundling. Launch again.
- **`CI=1`** turns off Metro's file watching and makes `expo prebuild` wipe
  `ios/` and `android/`. Do not set it for a lab run.
