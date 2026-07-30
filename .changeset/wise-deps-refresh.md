---
"@knitui/carousel": patch
"@knitui/components": patch
"@knitui/core": patch
"@knitui/dates": patch
"@knitui/emoji": patch
"@knitui/graphics": patch
"@knitui/hooks": patch
"@knitui/icons": patch
"@knitui/map": patch
"@knitui/media": patch
"@knitui/mediaquery": patch
"@knitui/plugins": patch
"@knitui/sheet": patch
---

Dependency refresh, all within the current majors and validated against Expo SDK 57
(`expo install --check` reports the workspace aligned):

- `react-native` 0.86.0 → 0.86.2 (and `@react-native/metro-config` to match; both stay
  pinned as singletons in the root `pnpm.overrides`)
- `react-native-reanimated` 4.5.0 → 4.5.1 and `react-native-worklets` 0.10.0 → 0.10.1 —
  the versions Expo SDK 57 expects
- `expo` 57.0.7 → 57.0.9 and the SDK-managed modules along with it (`expo-router`,
  `expo-constants`, `expo-linking`, `expo-system-ui`, `expo-video`,
  `@expo/metro-runtime`, `expo-build-properties`)
- `babel-preset-expo` 57.0.3 → 57.0.5, Storybook 10.5.3 → 10.5.5,
  `@vitejs/plugin-react` 6.0.3 → 6.0.4, `next` 16.2.10 → 16.2.12,
  `@react-navigation/*` patch bumps

The vendored `expo-modules-core` patch was re-pointed from 57.0.6 to 57.0.8 and still
applies cleanly. `expo-audio` deliberately stays on 57.0.2, where our native sampling
patch is pinned. Peer requirements for consumers are unchanged.
