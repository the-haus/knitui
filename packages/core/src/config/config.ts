import { createTamagui } from "@tamagui/core";

import { animations } from "./animations";
import { FOCUS_RING_VARIABLES } from "./focus-ring";
import { fonts } from "./fonts";
import { media } from "./media";
import { KNIT_SETTINGS } from "./settings";
import { shorthands } from "./shorthands";
import { themes } from "./themes";
import { tokens } from "./tokens";

/**
 * The single design-system config. This is the named `config` export the
 * compiler is pointed at (`tamagui.build.ts` / `@knitui/plugins`:
 * `config: "@knitui/core/config"`).
 *
 * Its themes are PRECOMPUTED (`themes.generated.ts`), so evaluating this module
 * runs no theme builder.
 */
export const config = createTamagui({
  animations,
  fonts,
  tokens,
  themes,
  shorthands,
  media,
  // Non-token design configuration, readable as bare names in style values and
  // overridable per subtree with `<ThemeUpdate>`. See `focus-ring.ts`.
  variables: FOCUS_RING_VARIABLES,
  settings: KNIT_SETTINGS,
});

export type AppConfig = typeof config;

// v3 still reads the custom config through this interface (`@tamagui/web`'s
// `TamaguiCustomConfig`, re-exported by `@tamagui/core`), so this augmentation
// is what teaches every style prop the kit's tokens, theme keys and shorthands.
declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
