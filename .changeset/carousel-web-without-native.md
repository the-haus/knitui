---
"@knitui/carousel": minor
---

The web build no longer reaches `react-native-reanimated`, `react-native-gesture-handler` or `react-native-worklets`. On the web the carousel and the `SwipeDeck` drag with DOM pointer events (6 px activation along the carousel's axis — a cross-axis move is left to the page — release velocity, the trailing click swallowed) and animate with a small `requestAnimationFrame` runtime (`motion/webMotion`: shared values with listeners, timing / spring / decay with Reanimated 4's defaults, Reanimated's `interpolate`, honouring `prefers-reduced-motion`). Native is unchanged: shared files reach Reanimated / Worklets through an internal `motion/runtime` re-export, and every native-only file keeps the original implementation beside its new `.web` twin. Public props and types are unchanged; on the web `gestureConfig` has no effect, and `scrollOffsetValue` / `progress` / `onProgressChange` accept any object with a `.value` (a Reanimated shared value still works).
