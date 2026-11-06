---
"@knitui/sheet": patch
---

A sheet with no scrim no longer takes touches on the page behind it on Android. The drag gesture sat on the full-cover layer, and React Native Gesture Handler records a detector's handlers for any touch inside its child, `box-none` or not, so a persistent sheet dragged itself from a swipe on the map under it. The gesture now sits on the panel when there is no scrim.
