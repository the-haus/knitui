---
"@knitui/media": minor
---

Expose the media store for custom chrome, and harden the audio recorder

- **Selector hooks** — `useMediaSelector`, `shallowEqual` and the `MediaStore`
  contract are now public from both `@knitui/media/audio` and
  `@knitui/media/video`, alongside per-surface `useAudioState`,
  `useVideoState`, `useRecorderState` and `usePlaylistState` (plus
  `AudioContext`). Custom chrome can now subscribe to exactly the fields it
  renders instead of re-rendering on every controller tick.
- **`setAudioMode`** — fix a hard webpack/Next build failure. The web backend
  does not export `requestNotificationPermissionsAsync`, and a named import of
  a missing binding is an "Attempted import error" even behind a runtime guard.
  The module now takes a namespace import so the lookup defers to runtime.
- **`AudioRecorder`** — a denied mic prompt or a faulted `stop()` no longer
  strands the recorder mid-`recording` or surfaces as an unhandled rejection;
  both land in the terminal `error` state and recover on retry.
- **`shouldCorrectPitch`** — seed the initial state from the browser default on
  web rather than from expo's `player.shouldCorrectPitch`, which reads `false`
  until the first `setPlaybackRate` and so misreported correction as off.
- **`useAudioStream`** — document that `channels` is native-only; the web
  backend always down-mixes to mono and reports `1` regardless of the request.
