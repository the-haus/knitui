---
"@knitui/media": patch
---

Fixes for players that share one engine.

- Web: a video without CORS headers played without sound when an earlier video on the same player had been sampled for a visualizer. The player now renders a new `<video>` element for such a source.
- iOS: playing a preloaded audio source that has to be streamed directly (a live or chunked stream) failed. It now plays, as it does without preloading.
- A video's `buffer` and `audioMixingMode` no longer carry over to the next video that set none. `buffer: null` in `setPlaybackOptions` goes back to the player's own buffering.
- With exclusive playback on, unmuting a video that started muted (or raising its volume from zero) now pauses the audio, as starting it with sound does.
