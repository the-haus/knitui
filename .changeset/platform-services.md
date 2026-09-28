---
"@knitui/core": minor
"@knitui/hooks": minor
"@knitui/plugins": minor
---

Platform services, so apps never import `react-native` for them.

- `@knitui/core`: `isIos` / `isAndroid` alongside `isWeb`; a structural `PressEvent` type (like `LayoutChangeEvent`).
- `@knitui/hooks`: `getAppState()` / `subscribeAppState()` (the imperative half of `useAppState`, which now runs on them via `useSyncExternalStore`; web also reports `pagehide` as `background`), `getViewportSize()`, `openURL()` / `canOpenURL()` / `openAppSettings()`, `share()` (native `Share` / Web Share API, per-platform URL handling), and `announce()` (VoiceOver/TalkBack on native, a lazily mounted live region on web). Web `openURL` detaches the new tab by hand instead of `noopener`, which makes `window.open` return `null` even on success.
- `@knitui/plugins/next`: `NextTamaguiProvider` takes `config` and `exclude`, for apps that build their config at runtime.
