---
"@knitui/components": minor
---

Image (web): the kit renders its own `<img>` on the web instead of expo-image's web build, so an image shows as soon as the browser can. expo-image added its `<img>` from an effect (a blank frame on every mount, an empty box in server-rendered HTML) and started each mount's fade at `opacity: 0`, cached or not; a virtualized list, a revisited page or a hydrating one remounts images all the time, so they blinked. The `<img>` is now in the first render and in the SSR markup, never held hidden, lazy-loaded by default (`loading`, `priority` → `fetchpriority`), with `contentFit` / `contentPosition`, `blurRadius`, URL `placeholder`s and expo-image's load / error / display payloads as before. `Image.prefetch` warms the browser cache. Native is unchanged (expo-image, `Image.native.tsx`).

**Behaviour change (web):** `transition` no longer fades on the web; it stays a native fade. BlurHash / ThumbHash placeholders and `tintColor` do not render on the web, and the cache-management statics (`clearMemoryCache`, `clearDiskCache`, `getCachePathAsync`, `generateBlurhashAsync`, `loadAsync`) are no-ops there.
