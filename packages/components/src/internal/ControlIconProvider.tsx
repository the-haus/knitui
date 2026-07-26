import type * as React from "react";

// Deep import on purpose: the `@knitui/icons` root barrel re-exports all ~6.1k
// icon modules, and Metro does not tree-shake — importing it here would pull
// every glyph into every component that renders a control icon. See the
// `no-restricted-imports` guardrail in eslint.config.base.mjs.
import { IconProvider } from "@knitui/icons/context";

import { controlIconSize } from "./control-icon-size";
import type { SizeKey } from "./control-metrics";
import { useIconColor } from "./use-icon-color";
import { VARIANT_FOREGROUND_EMPHASIS } from "./variant-colors";

type ForegroundVariant = keyof typeof VARIANT_FOREGROUND_EMPHASIS;

export interface ControlIconProviderProps {
  /**
   * Control size key (or explicit icon px). Drives the icon size from the ladder.
   * Accepts an arbitrary string too, since Tamagui's `size` prop is broad — a
   * non-token value falls back to the `md` icon size in `controlIconSize`.
   */
  size?: SizeKey | number | (string & {});
  /**
   * Control variant — selects the emphasis-foreground token an icon should take,
   * so the icon matches the label color exactly (e.g. white on a `filled` button).
   * Ignored when `color` is given.
   */
  variant?: ForegroundVariant;
  /**
   * Explicit color token/value for the icon (e.g. an Alert's accent), overriding
   * the variant-derived foreground.
   */
  color?: string;
  /** Outline icon stroke width, if a surface wants to override the icon default. */
  stroke?: number | string;
  children?: React.ReactNode;
}

/**
 * Publishes the resolved icon `size`/`color`/`stroke` for a control's sections,
 * so any `@knitui/icons` icon dropped into `leftSection`/`icon`/etc. automatically
 * matches the control without the caller sizing or coloring it. This is the
 * cross-platform stand-in for the web's `color`/`em` cascade (see
 * `@knitui/icons`' `IconProvider`). Icon props always win over these defaults.
 */
export function ControlIconProvider({
  size = "md",
  variant = "filled",
  color,
  stroke,
  children,
}: ControlIconProviderProps) {
  const token = color ?? VARIANT_FOREGROUND_EMPHASIS[variant]?.color ?? "$color12";
  // Theme-free on web, theme-subscribing on native — see `use-icon-color.ts`.
  const resolvedColor = useIconColor(token);

  // Passed inline on purpose: `IconProvider` already memoises its context value
  // on the PRIMITIVE `size`/`color`/`stroke` fields rather than on `value`'s
  // identity, so a `useMemo` here would buy nothing and cost a deps array plus a
  // retained object per control section.
  return (
    <IconProvider value={{ size: controlIconSize(size), color: resolvedColor, stroke }}>
      {children}
    </IconProvider>
  );
}
