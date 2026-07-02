import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";
import { IconX } from "@knitui/icons";

import { ActionIcon } from "../ActionIcon";
import { Box } from "../Box";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { type GradientValue, useGradient } from "../internal/gradient";
import { usePressScale } from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import { fontSizePassthroughVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";

const CloseButtonFrame = styled(ActionIcon.Frame, {
  name: "CloseButton",
});

/**
 * Centered `Box` that holds the close glyph and is the `.Icon` static / `icon`
 * styles-slot target. It's a `Box` (not a `Text`) because the default glyph is
 * now an `@knitui/icons` `IconX` (an SVG) — on native an SVG must live inside a
 * `View`, never a `Text`. The `iconSize` variant is kept for back-compat with
 * `styles={{ icon: { iconSize } }}`; the actual icon px now comes from the
 * `ControlIconProvider` / explicit `iconSize` in the render below.
 */
const CloseButtonIcon = styled(Box, {
  name: "CloseButtonIcon",
  alignItems: "center",
  justifyContent: "center",
  variants: {
    iconSize: fontSizePassthroughVariant,
  } as const,
});

type CloseButtonFrameProps = Omit<GetProps<typeof CloseButtonFrame>, "children">;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). CloseButton is nearly a
 * single-element control (one pressable + glyph), so the map is intentionally a
 * single `icon` slot mapping to the `.Icon` glyph — there are no other styled
 * parts to address. (Restyle the pressable itself via plain frame style props.)
 */
export interface CloseButtonStyles {
  /**
   * Props for the close-glyph wrapper (`.Icon`). `color` is routed to the
   * `@knitui/icons` `IconX` (the wrapper is a `Box`), so `styles={{ icon: { color } }}`
   * still recolors the glyph.
   */
  icon?: GetProps<typeof CloseButtonIcon> & { color?: string };
}

const CLOSE_BUTTON_SLOT_KEYS = ["icon"] as const satisfies readonly (keyof CloseButtonStyles)[];

export interface CloseButtonProps extends CloseButtonFrameProps {
  /** `✕` icon font size — a px number or CSS/token string. Falls back to the `size`-derived icon size. */
  iconSize?: GetProps<typeof CloseButtonIcon>["iconSize"];
  /** Node to replace the default close icon. When set, `iconSize` is ignored. */
  icon?: React.ReactNode;
  /** Extra content rendered after the icon (e.g. a `VisuallyHidden` label). */
  children?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<CloseButtonStyles>;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `$colorN` ramp tokens or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

/**
 * Close control — mirrors Mantine's `CloseButton`, built on `ActionIcon` (as
 * Mantine builds it on its own `ActionIcon`). Renders a centered `IconX` glyph
 * from `@knitui/icons`, sized and colored to the control via `ControlIconProvider`;
 * defaults to `variant="subtle"` and an `aria-label` of `"Close"`. Accent comes
 * from the `theme` prop + palette ramp, never a `color` prop.
 */
const CloseButtonComponent = CloseButtonFrame.styleable<CloseButtonProps>(
  function CloseButton(props, ref) {
    const {
      iconSize,
      icon,
      children,
      styles,
      gradient,
      variant = "subtle",
      size = "md",
      ...rest
    } = props;

    // Per-slot style sugar. `iconSize` is the explicit per-part prop and wins
    // over the `icon` slot sugar (the "explicit beats sugar" rule).
    const s = slotStyles<CloseButtonStyles>(styles, CLOSE_BUTTON_SLOT_KEYS, "CloseButton");

    // Gradient fill (only when `variant="gradient"`): web paints a CSS
    // `backgroundImage`; native renders the `layer` (an SVG fill) behind the glyph.
    const grad = useGradient(variant === "gradient" ? gradient : undefined);

    // The frame inherits ActionIcon's base press-dip scale, but not ActionIcon's
    // render-time easing — supply it here so the dip eases (and snaps under reduced
    // motion) consistently with Button/ActionIcon.
    const press = usePressScale();

    // The default glyph auto-matches the control's size/foreground via the icon
    // context; an explicit `iconSize` (px number or size key) overrides the
    // size-derived px. The `IconX` is still wrapped in `CloseButtonIcon` so the
    // `.Icon` part and the `icon`/`iconSize` style slots keep landing on a real
    // styled element.
    const providerSize = iconSize ?? size;

    // `color` from the `icon` slot recolors the glyph (routed to the icon, since
    // the wrapper is now a `Box`); everything else lands on the wrapper.
    const { color: iconColor, ...iconWrapperProps } =
      s.merge("icon", iconSize !== undefined ? { iconSize } : undefined) ?? {};

    return (
      <CloseButtonFrame
        ref={ref}
        variant={variant}
        size={size}
        aria-label="Close"
        {...press}
        {...grad.frameProps}
        {...rest}
      >
        {grad.layer}
        {icon ?? (
          <CloseButtonIcon {...iconWrapperProps}>
            <ControlIconProvider size={providerSize} variant={variant} color={iconColor}>
              <IconX />
            </ControlIconProvider>
          </CloseButtonIcon>
        )}
        {renderTextChild(children, ActionIcon.Text)}
      </CloseButtonFrame>
    );
  },
);

export const CloseButton = withStaticProperties(CloseButtonComponent, {
  Frame: CloseButtonFrame,
  Icon: CloseButtonIcon,
});
