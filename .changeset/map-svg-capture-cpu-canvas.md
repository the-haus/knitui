---
"@knitui/map": patch
---

SvgImage (web): icons rasterize into a CPU-backed canvas. The capture used react-native-svg's `toDataURL`, whose canvas Chrome backs with the GPU, so reading each tiny bitmap back stalled the main thread (in headless Chrome the five icons of a cold map took 1.9 s; now under 0.1 s). The kit now does the same serialization itself with `willReadFrequently`, and a capture with no `<svg>` or a failed decode reports empty so it is retried instead of hanging on its slot.
