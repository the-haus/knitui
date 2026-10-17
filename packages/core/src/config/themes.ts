import { themes as generatedThemes } from "./themes.generated";

/**
 * The kit's stock theme suite — 2 schemes × (base, accent, 9 accent colours) = 22
 * themes, PRECOMPUTED at build time.
 *
 * The values are produced by `themes.source.ts` (Tamagui's v5 `createThemes`
 * builder) and frozen into `themes.generated.ts` by
 * `scripts/generate-themes.mjs`, so neither the builder code nor its work ever
 * runs on the runtime path (app start, SSR, or the compiler's config load).
 * Edit `themes.source.ts`, then run `pnpm --filter @knitui/core generate:themes`;
 * `themes.generated.test.ts` fails while the frozen file is stale.
 *
 * The frozen values are byte-identical to the v2 `@tamagui/theme-builder` output
 * (verified during the v3 migration), so the v3 cutover is visually neutral here.
 *
 * Theme key names are the kit's camelCase / numbered names, written bare in v3
 * style values (`bg="background"`, `c="color11"`).
 */
export const themes = generatedThemes;

export type AppThemes = typeof themes;
