---
"@knitui/media": major
---

`@knitui/media` now ships its own native module. The audio and video players that used to come from `expo-audio` and `expo-video` are part of this package, in one module for iOS and Android, and the JavaScript API is the same on web and React Native.

**Migrating**

- Remove `expo-audio` and `expo-video` from your dependencies, and install `expo-asset` if you don't have it.
- Replace the `expo-audio` and `expo-video` entries in your `app.json` `plugins` with one `["@knitui/media", { ... }]` entry. Its options are `microphonePermission`, `recordAudioAndroid`, `backgroundPlayback`, `backgroundRecording` and `pictureInPicture`.
- Rebuild the native app. Components, hooks and controllers are unchanged.

**What you get**

- The native fixes this kit depended on are now in the package itself. They used to live in a patch that only applied inside this repository, so apps on the published package never had them: a duration and working seek for iOS audio on servers without `Accept-Ranges`, Android waveform sampling without the `RECORD_AUDIO` permission, HLS behind a URL without `.m3u8`, and status updates that keep flowing through a stall.
- iOS video gets the same byte-range handling as audio. A file on a server that ignores `Range` used to fail or play with no duration and no seeking. The player now detects that case and serves the file through the shared loader, and leaves every other source on the native path.
- Android video retries a source as HLS when the URL did not reveal it, as audio already did.
- Sampling is pull-based and shared by audio and video. A visualizer reads the newest decoded audio straight into a `Float32Array` once per drawn frame, where the players used to push a 2048-element array through the bridge at 60 Hz. The sampler does nothing while no `sampleUpdate` listener is attached.
- Video can be sampled. `VideoController` has `setSamplingEnabled` and the `sampleUpdate` event, `capabilities.canSample` says whether the platform supports it, and `useAudioSpectrum` accepts a video controller. It is also exported from `@knitui/media/video`.
- One control point. `useMediaHub()` (and `getSharedMediaHub()` outside React) returns a hub over both engines: `focus`, `active`, `togglePlay()`, `pauseAll()` and `preload()`. `useMediaState()` now includes `focus`.
- Preloading for video, to match audio. `preload`, `clearPreloadedSource`, `clearAllPreloadedSources` and `getPreloadedSources` are exported from `@knitui/media/video`, `preloadMedia(source)` from the root picks the right one, and `<Audio>` and `<Video>` take a `preload` prop. On iOS and Android a preloaded video is read back from the on-disk cache.
- Video playback options: `maxResolution`, `keepAwake`, `backgroundPlayback`, `buffer` and `audioMixingMode`, as `<Video>` props and through `controller.setPlaybackOptions()`, with a capability for each. On web `keepAwake` holds a Screen Wake Lock.
- Fixed: on iOS, playing an audio source after preloading it threw a native exception.
- Fixed: on iOS, a recorder now records without the app first calling `setAudioMode({ allowsRecording: true })`. It used to fail with "Recording not allowed on iOS". An audio mode you set yourself still decides.
- `crossOrigin` on a video source. It was audio-only; a CORS video on web can now be sampled, including one loaded with `controller.replace()`.
- HLS in browsers that cannot play it themselves (Chrome, Firefox, Edge) goes through `hls.js`, loaded on demand the first time such a source plays. The source's `headers` are sent with the playlist and every segment.

**Changed**

- Audio and video no longer play over each other by default. Audible playback starting in one pauses the other; a muted video takes nothing over. Pass `exclusive={false}` to `<MediaProvider>` for the old behaviour.
- `sampleUpdate` carries one mono channel. `channels` used to hold one array per channel on some platforms.
- `sampleUpdate`'s `timestamp` is the playback position in seconds on every platform.
- The native modules are named `KnitAudio` and `KnitVideo`, in the `dev.knitui.media` Android package, so an app that also installs `expo-audio` or `expo-video` for another library builds without a clash.
