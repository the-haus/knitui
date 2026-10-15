---
"@knitui/components": patch
---

Image (web): an image the browser already had is shown. A cached image fires `load` as soon as its `<img>` is created, which in a concurrent render can land before the commit; React drops the event and expo-image's fade held the image at `opacity: 0` for good. After mount (and on each new source) a committed `<img>` that is `complete` with a `naturalWidth` and never reported `load` now gets it re-dispatched, so the fade runs and `onLoad` fires once.
