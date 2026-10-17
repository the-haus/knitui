---
"@knitui/media": minor
---

The web build no longer loads `expo-audio`, `expo-video` or any expo runtime. On the web, audio and video now run on the kit's own backends — an `HTMLAudioElement` player and `MediaRecorder` recorder (`audio/web`), a `<video>` player and view (`video/web`), with the browser MediaSession for now-playing — behind the same controllers, events and public API. Native is unchanged: the expo backends moved verbatim into `.native` files (`session/audio-engine`, `audio-mode`, `permissions`, `preload`, `video-engine`, `surface/VideoSurface`, `hooks/useAudioRecorderController`). `expo-audio` / `expo-video` are only needed by native consumers.
