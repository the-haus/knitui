import { type GetProps, styled, View } from "@knitui/core";

import { shadowVariant } from "../internal/style-props";

/**
 * `Box` — the single base primitive the component kit composes from. A thin
 * `styled()` over the Tamagui `View` exposed by `@knitui/core`, inheriting all
 * Tamagui features (token style props, theming, hover/press, animations, and
 * cross-platform output).
 *
 * It carries the full Mantine-style prop API via the config-level shorthands —
 * `m`/`my`/`mx`/`mt`/`ms`/`mis`/`p`/`px`/`bdrs`/`bg`/`c`/`ff`/`fz`/`fw`/`lts`/
 * `ta`/`lh`/`fs`/`tt`/`td`/`w`/`miw`/`maw`/`h`/`mih`/`mah`/`pos` — plus the props
 * Tamagui exposes natively (`opacity`/`top`/`left`/`right`/`bottom`/`inset`/
 * `display`/`flex`). Every component is `styled(Box, { ... })` and inherits this.
 *
 * `shadow` is the one named VARIANT carried here rather than per-component: the
 * Mantine-style elevation prop (`shadow="md"`, the shared `shadowVariant` ladder
 * xxs→xxl, theme-aware `$dropShadowColor`). Because every kit component is
 * `styled(Box, …)`, declaring it once means they ALL accept `shadow` — it stays
 * opt-in (no shadow unless set). A component may still re-declare `shadow` (e.g.
 * `Drawer` pins `defaultVariants: { shadow: "xl" }`); a local redefinition wins.
 */
export const Box = styled(View, {
  name: "Box",
  variants: {
    shadow: shadowVariant,
  } as const,
});

export type BoxProps = GetProps<typeof Box>;
