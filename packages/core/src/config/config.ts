import { createTamagui } from "@tamagui/core";

import { animations } from "./animations";
import { fonts } from "./fonts";
import { media } from "./media";
import { shorthands } from "./shorthands";
import { themes } from "./themes";
import { tokens } from "./tokens";

/**
 * The single design-system config. Per the Tamagui "Design Systems" guide this
 * is the named `config` export the compiler is pointed at (see the example app's
 * babel plugin `config` option).
 */
export const config = createTamagui({
  animations: animations as NonNullable<Parameters<typeof createTamagui>[0]["animations"]>,
  fonts,
  tokens,
  themes,
  shorthands,
  media,
  defaultFont: "body",
  settings: {
    allowedStyleValues: "somewhat-strict-web",
    autocompleteSpecificTokens: "except-special",
  },
});

export type AppConfig = typeof config;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
