---
"@knitui/sheet": minor
---

The web build no longer reaches `react-native-reanimated`, `react-native-gesture-handler` or `react-native-worklets`. On the web the sheet drags with pointer events (8 px vertical activation, release velocity, nearest-visible-snap on `pointercancel`, the trailing click swallowed) and animates with a `requestAnimationFrame` spring that honours `prefers-reduced-motion`; native keeps the RNGH Pan and reanimated unchanged, in `.native` twins. `animationConfig` and `DEFAULT_SPRING` are now typed `SheetSpringConfig` (exported) instead of reanimated's `WithSpringConfig`; the fields the sheet used are the same.
