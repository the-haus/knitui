---
"@knitui/media": patch
---

Video (web): `@knitui/media` installs the `globalThis.expo` polyfill itself before it loads `expo-video`. expo-video's web build reads `globalThis.expo.SharedObject` at import time without importing expo-modules-core, so it relied on something else having loaded it first: the `expo` entry in an Expo app, or (until `@knitui/components` 0.14 rendered its own web `<img>`) expo-image. A web app with neither (a Next app, a test) crashed with "Cannot read properties of undefined (reading 'SharedObject')". `expo-modules-core` is now a peer dependency (every Expo app already has it through `expo`).
