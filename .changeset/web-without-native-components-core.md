---
"@knitui/core": minor
"@knitui/components": minor
---

The web build of `@knitui/core` and `@knitui/components` no longer reaches any native-only package (react-native-reanimated, react-native-gesture-handler, react-native-worklets, react-native-teleport, expo-image). Native behaviour is unchanged.

- **Portals:** new `@knitui/core/portal` (`Portal`, `PortalHost`, `PortalProvider`, `usePortal`): react-native-teleport on native, the kit's own react-dom port of its web path on web. `<Provider>` and `@knitui/components`' `Portal` / `OverlayHost` use it, so `useOverlayHost` / `useTopmostOverlayHost` behave as before. `react-dom` is an optional peer of `@knitui/core` (web only).
- **Modal / Drawer `dragToDismiss`:** on web the drag runs on pointer events with the same activation threshold, dismiss decision (`shouldDismiss`), velocity carry-over and `animationConfig` spring (Reanimated's `withSpring` parameters, simulated without Reanimated). A drag release no longer also fires the scrim's tap-to-dismiss. Native still uses RNGH + Reanimated.
- **Image:** on web, a wrapper view and a real `<img>` with expo-image's web behaviour (`contentFit`, `contentPosition`, lazy loading, `priority`, `blurRadius`, URL `placeholder`, cross-fade `transition`, load / error / display events, `Image.prefetch`). Not on web: BlurHash / ThumbHash placeholders, `tintColor`, non-fade transition effects, and the cache-management statics (no-ops). Native is still expo-image.
