---
"@knitui/plugins": minor
---

The Tamagui compiler presets now leave `@knitui/media/native/audio` and `@knitui/media/native/video` out of static evaluation, in place of `expo-audio` and `expo-video`. `@knitui/media` 2.0 carries its own native players behind those two subpaths, and they cannot run in Node. Update this package together with `@knitui/media` 2.0.
