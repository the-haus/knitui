import * as Colors from "@tamagui/colors";
import { createThemes } from "@tamagui/config-v5/builder";

import { withFocusRingColor } from "./focus-ring";
import { OVER_MEDIA } from "./over-media";

/**
 * The SOURCE of the kit's stock theme suite — build-time only.
 *
 * Nothing on the runtime path imports this module. `scripts/generate-themes.mjs`
 * runs it once and freezes the result into `themes.generated.ts`, which is what
 * `themes.ts` (and therefore `config.ts`) ships. That removes the theme-builder
 * work (and the builder code itself) from every app start and from every compiler
 * pass. After editing this file run `pnpm --filter @knitui/core generate:themes`;
 * `themes.generated.test.ts` fails while the frozen file is stale.
 *
 * `createThemes` (Tamagui's v5 builder, from `@tamagui/config-v5/builder` since v3
 * dropped `@tamagui/theme-builder`) does the heavy lifting:
 *  - interpolates each palette into the full semantic key set (`background` /
 *    `color` / `borderColor` + hover/press/focus, `color1`…`color12`, the
 *    transparent variants, `placeholderColor`, `outlineColor`, …);
 *  - produces the light/dark base themes;
 *  - produces one child theme per accent colour, so `<Theme name="blue">` nests
 *    into `light_blue` / `dark_blue`.
 *
 * Theme KEY NAMES are the kit's own camelCase / numbered names (`color11`,
 * `backgroundHover`, `dropShadowColor`, `mediaScrim`). They are written bare in
 * v3 (`bg="background"`), never renamed to the v6 kebab-case. Every theme also
 * gets `focusRingColor` (its own `color8`), see `focus-ring.ts`.
 *
 * PERF / `componentThemes: false`
 * ------------------------------
 * `createThemes` otherwise defaults `componentThemes` to the deprecated
 * `defaultComponentThemes` map, which CROSS-MULTIPLIES with every scheme × palette
 * (2 × 11 × 20 = 440 themes, ~37.7k keys). With it off: 22 themes. The kit routes
 * colour explicitly through `components/src/internal/variant-colors.ts`, and v3
 * no longer resolves `light_Button`-style component themes anyway. Keep this in
 * sync with the matching `componentThemes: false` in `theme/create-theme.ts`.
 */
const palette = (light: Record<string, string>, dark: Record<string, string>) => ({
  light: Object.values(light),
  dark: Object.values(dark),
});

export const buildDefaultThemes = () =>
  withFocusRingColor(
    createThemes({
      componentThemes: false,

      base: {
        // Neutral grayscale ramp: background (1) → foreground (12).
        palette: {
          light: Object.values(Colors.gray),
          dark: Object.values(Colors.grayDark),
        },
        // Non-interpolated extras available on every theme. `blue` powers the
        // default selection highlight (`blue5`); `red` gives every theme a stable
        // error palette (`red9`) so input error borders stay red under any accent.
        extra: {
          light: {
            ...Colors.blue,
            ...Colors.red,
            // NB: do NOT name these `shadowColor` — that collides with RN's reserved
            // legacy shadow style prop (alpha gets mangled inside `boxShadow` on iOS).
            dropShadowColor: "rgba(0,0,0,0.1)",
            dropShadowColorHover: "rgba(0,0,0,0.2)",
            ...OVER_MEDIA,
          },
          dark: {
            ...Colors.blueDark,
            ...Colors.redDark,
            dropShadowColor: "rgba(0,0,0,0.4)",
            dropShadowColorHover: "rgba(0,0,0,0.6)",
            ...OVER_MEDIA,
          },
        },
      },

      // Accent theme (the app's primary), available as `<Theme name="accent">`.
      accent: {
        palette: palette(Colors.blue, Colors.blueDark),
      },

      // One sub-theme per palette colour → light_<name> / dark_<name>.
      childrenThemes: {
        blue: { palette: palette(Colors.blue, Colors.blueDark) },
        red: { palette: palette(Colors.red, Colors.redDark) },
        green: { palette: palette(Colors.green, Colors.greenDark) },
        orange: { palette: palette(Colors.orange, Colors.orangeDark) },
        pink: { palette: palette(Colors.pink, Colors.pinkDark) },
        purple: { palette: palette(Colors.purple, Colors.purpleDark) },
        teal: { palette: palette(Colors.teal, Colors.tealDark) },
        yellow: { palette: palette(Colors.yellow, Colors.yellowDark) },
        gray: { palette: palette(Colors.gray, Colors.grayDark) },
      },
    }),
  );
