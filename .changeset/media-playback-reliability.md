---
"@knitui/media": patch
"@knitui/components": patch
---

Make media playback hold up on real networks.

- Fix an Android crash whenever a pressable control with an SVG icon left its
  `disabled` or `loading` state. Media hit it every time buffering ended.
- `playing` now means playback was asked for, so Pause stays available and pressable
  through a stall. Audio and video chrome stay enabled while buffering, and video always
  shows its buffering overlay.
- `play()` after the end restarts, `play()` after an error retries, and `retry()` picks
  up where it stopped. `replay()` no longer leaves iOS stopped at 0:00.
- Errors no longer vanish on Android, so a dead URL shows an error instead of loading
  forever. A stream that dies mid-track is an error rather than a finished track, and on
  web a stream that stops responding fails after 30 seconds.
- Web audio reports buffering, web video no longer sticks at `loading` or leaves
  unhandled `play()` rejections, and a finished playlist starts over.
- The audio control row fits narrow screens.

The repo's `expo-audio` patch also gains native fixes. On iOS, remote audio no longer
downloads the whole file before it starts, stalls reach JS, servers without range support
play from one sequential download, and live, chunked and extension-less HLS sources play.
On Android, extension-less HLS plays. These apply only to apps that carry the patch.
