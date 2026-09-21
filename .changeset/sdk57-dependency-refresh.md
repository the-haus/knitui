---
"@knitui/core": minor
"@knitui/components": minor
"@knitui/map": minor
"@knitui/media": patch
"@knitui/plugins": minor
---

Refresh dependencies to the latest Expo SDK 57 releases.

- **core / components / plugins:** Tamagui 2.4.6 → 2.7.7 (pinned exactly, so the babel plugin and runtime always match) and `react-native-teleport` 1.1.7 → 1.2.2. The teleport Android `prepareToRecycleView` fix is now upstream, so the local patch is gone. `expo-image` → ~57.0.5.
- **map:** now targets `maplibre-gl` v6 on web (peer `^6`, was `^5`) and `@maplibre/maplibre-react-native` ^11.4.0 on native. Both use `@maplibre/maplibre-gl-style-spec` 26. maplibre v6 is ESM-only and has no default export; the map package now imports it as a namespace. If your web app imports `maplibre-gl` itself, update it to v6. The canvas-leave handlers now listen to `mouseout`: v6 only fires `mouseleave` for layer-scoped listeners, so the long-press/cursor reset on leaving the map never ran.
- **media:** `expo-audio` → ~57.0.5, `expo-video` → ~57.0.4.
