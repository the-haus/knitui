export * from "./composition";
export * from "./config";
// TYPE-ONLY, and load-bearing. `config/config.ts` carries the
// `declare module "@tamagui/core"` augmentation that teaches Tamagui this kit's
// token/shorthand vocabulary (`maw`, `c`, the token unions). Nothing else on
// the barrel imports that module, so without this line the augmentation is
// unreachable from `index.d.ts` and every consumer resolving the package by its
// BUILT declarations silently loses the shorthands.
//
// Must stay `export type` — a value re-export would eagerly evaluate the Tamagui
// config at module load, which is the `Card` SSR module-eval crash.
export type { AppConfig } from "./config/config";
export * from "./essentials";
export * from "./provider";
// Config-driven token detection / resolution (v3 has no `$` sigil to sniff).
export * from "./resolve-token";
export * from "./style-types";
// The kit's `styled` (Tamagui's, incl. `styled.dynamic`) and the memoized
// behaviour-HOC factory `styleable()`. `./essentials` deliberately does not
// re-export the raw Tamagui `styled`, so this is the only one on the surface.
export * from "./styled";
