---
"@knitui/components": patch
"@knitui/carousel": patch
"@knitui/graphics": patch
"@knitui/icons": patch
"@knitui/dates": patch
"@knitui/media": patch
"@knitui/sheet": patch
"@knitui/core": patch
"@knitui/map": patch
---

Point every `types` entry at the built declarations (`lib/typescript/*.d.ts`) instead of at the shipped TypeScript source.

These packages ship their source and resolve it at runtime (`source`, `react-native` and `default` all still point into `src`), but `types` pointed there too — so a consumer's `tsc` typechecked the kit's raw source as part of their own build. That is slow, and it surfaces errors that depend on the consumer's own compiler settings, since `skipLibCheck` does not apply to `.ts` source files. Resolving `types` to real `.d.ts` files makes declaration handling both faster and inert.

`@knitui/icons` also adds `lib/typescript` to `files`; its declarations were previously built but never published, so the new `types` path would not have existed in the tarball.

`@knitui/emoji` deliberately keeps `types` on its source: its per-emoji modules ship as pre-generated `.js`/`.d.ts` pairs inside `src`, which `tsc` does not re-emit, so its built barrel cannot resolve them.
