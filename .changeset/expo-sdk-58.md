---
"@knitui/core": minor
"@knitui/hooks": minor
"@knitui/mediaquery": minor
"@knitui/components": minor
"@knitui/icons": minor
"@knitui/emoji": minor
"@knitui/graphics": minor
"@knitui/dates": minor
"@knitui/media": minor
"@knitui/carousel": minor
"@knitui/sheet": minor
"@knitui/map": patch
"@knitui/plugins": patch
---

Knit UI now targets Expo SDK 58: React Native 0.88, React 19.3, Reanimated 4.7, Worklets 0.13, React Native Gesture Handler 3.3 and Skia 2.14. Apps must be on SDK 58. Apps still on SDK 57 should pin `@knitui/*` to `~1.0.0` until they upgrade Expo. See the "Upgrading to Knit UI 1.1" guide.

**Peer and dependency changes**

- `@knitui/icons` and `@knitui/emoji` peer on `react@19.3.0` and `react-native-svg@15.16.0`.
- `@knitui/graphics` peers on `@shopify/react-native-skia@2.14.0`.
- `@knitui/components` depends on `expo-image ~58.0.15`.
- `@knitui/media` depends on `expo-audio ~58.0.9` and `expo-video ~58.0.11`. The Android playback-sampling and iOS duration patches were ported to expo-audio 58.0.9.

**React Native 0.88 fix in `@knitui/media`**

`Audio`, `Video`, `AudioPlaylist` and `AudioRecorder` crashed on native with "undefined is not a function". They detected their web DOM element by checking for an `addEventListener` key, and React Native 0.88 elements now carry that key (set to `undefined`). They now check the platform instead.

**Skia 2.14 fix in `@knitui/graphics`**

`AudioMesh` crashed native apps with "Incorrect uniform size for: u_points. Expected 12 got 4". React Native Skia 2.14's native recorder reads only the first 4 values of a typed-array uniform. The mesh now passes its uniforms as plain arrays, still reused across frames.

**Web fixes**

- `@knitui/media` no longer crashes web apps without the `expo` entry (such as Next) with "Cannot read properties of undefined (reading 'SharedObject')". expo-audio 58's web player, recorder and playlist need `globalThis.expo` when they load, as expo-video's already did. The kit now installs it before both. On SDK 58, `expo-modules-core` resolves to a build entry that its `sideEffects` list leaves out, so production bundlers dropped the old bare import.
- `@knitui/plugins/next-plugin` also maps `@react-native/assets-registry/registry` to react-native-web's asset registry. Its 0.88 source mixes ESM and CommonJS, which broke `react-native-svg` on web with "ES Modules may not assign module.exports".

**Known iOS issue on SDK 58:** React Native 0.88 builds React from a precompiled framework, and both `react-native-teleport@1.2.2` (used by Portal) and `@maplibre/maplibre-react-native@11.5.0` fail to compile because of it. They import `"RCTFabricComponentsPlugins.h"` instead of `<React/RCTFabricComponentsPlugins.h>`. Until upstream fixes land, apply the same one-line include change with a pnpm or patch-package patch, or set `ios.buildReactNativeFromSource` to `true`.

The precompiled framework also leaves out React Native's `SampleTurboModule`, which `react-native@0.88.0` still lists as a module to set up on the main queue at startup. Debug builds then show an "Unable to find module for SampleTurboModule" red box on every launch (release builds only log it). Remove the `SampleTurboModule` entry from `codegenConfig.libraries[0].ios.modules` in `react-native/package.json` with a patch and re-run `pod install`, or build React Native from source.

**Gesture Handler 3**

Every kit gesture now uses the Gesture Handler 3 hook API (`usePanGesture`, `useNativeGesture`) instead of the deprecated `Gesture.*` builder. This covers Modal and Drawer drag-to-dismiss, the ScrollArea 2D pan, Sheet drag, Carousel drag and SwipeCard.

Reanimated 4.7 ignores hook dependency arrays on native and logs a warning when one is passed. The kit now passes them on the web only, so apps no longer see "Dependencies should only be used on the web" from kit components.

Breaking change in `@knitui/carousel`: `gestureConfig` is now a config object (the new `CarouselGestureConfig` type) instead of a builder callback. Migrate like this:

```tsx
// before
<Carousel gestureConfig={(g) => g.activeOffsetX([-10, 10]).simultaneousWithExternalGesture(other)} />
// after
<Carousel gestureConfig={{ activeOffsetX: [-10, 10], simultaneousWith: other }} />
```

**React Native 0.88 types**

The kit's native ref types now use RN's instance types (`ScrollViewInstance`, `ViewInstance`). `EffectView`'s `ref` and `KeyboardAwareScrollView`'s forwarded ref are typed with these instance types. The `Input` `verticalAlign` prop still works: React Native 0.88 dropped it, so the kit now maps it onto `textAlignVertical`.
