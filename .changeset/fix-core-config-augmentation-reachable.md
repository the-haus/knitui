---
"@knitui/core": patch
---

Keep the Tamagui module augmentation reachable from the built declarations.

`config/config.ts` carries the `declare module "@tamagui/core"` augmentation that teaches Tamagui this kit's token and shorthand vocabulary (`maw`, the `$token` unions). Nothing else on the barrel imported that module, so once consumers resolve the package by its built `index.d.ts` the augmentation was unreachable and every shorthand silently disappeared. A type-only re-export pulls it back in without eagerly evaluating the config at module load.
