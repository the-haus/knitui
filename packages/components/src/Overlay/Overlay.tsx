import * as React from "react";

import { type GetProps, isWeb, styled } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { radiusVariant } from "../internal/style-props";

/**
 * Full-cover scrim — mirrors Mantine's `Overlay`. An absolutely- (or `fixed`-)
 * positioned `Box` that fills its parent with a translucent wash. The scrim
 * background is a literal wash (`#000` by default), NOT a theme accent — Overlay
 * is a neutral dimmer, so the palette ramp deliberately does not apply here.
 * `blur` and `gradient` are web-only CSS effects and are spread through narrowed
 * objects so the strict style typing stays intact.
 */
const OverlayFrame = styled(Box, {
  name: "Overlay",
  position: "absolute",
  top: "$0",
  left: "$0",
  right: "$0",
  bottom: "$0",
  // The scrim catches clicks on the empty area (outside-press to dismiss). When
  // teleported, the portal host is `pointer-events: none`, so the scrim must
  // explicitly re-enable events to stay clickable.
  pointerEvents: "auto",

  variants: {
    /** Flex-center the overlay's children (e.g. a centered loader/message). */
    center: {
      true: { alignItems: "center", justifyContent: "center" },
    },
    radius: radiusVariant,
  } as const,
});

type OverlayFrameProps = Omit<GetProps<typeof OverlayFrame>, "backgroundColor" | "color">;

/** Parse `#rgb`/`#rrggbb` into an `rgba()` string; pass other values through. */
function toRgba(color: BoxProps["backgroundColor"], opacity: number): BoxProps["backgroundColor"] {
  if (typeof color !== "string") return color;

  const hex = color.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  let r = 0;
  let g = 0;
  let b = 0;
  if (short) {
    r = parseInt(short[1] + short[1], 16);
    g = parseInt(short[2] + short[2], 16);
    b = parseInt(short[3] + short[3], 16);
  } else if (long) {
    r = parseInt(long[1], 16);
    g = parseInt(long[2], 16);
    b = parseInt(long[3], 16);
  } else {
    // Non-hex (named/rgb/token/var) — let the caller's value pass straight through.
    return color;
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})` as BoxProps["backgroundColor"];
}

export interface OverlayProps extends OverlayFrameProps {
  /** Scrim `background-color` opacity 0–1, ignored when `gradient` is set. @default 0.6 */
  backgroundOpacity?: number;
  /** Scrim base background (a literal wash color, not a theme accent). @default "#000" */
  backgroundColor?: BoxProps["backgroundColor"];
  /** Web-only background blur in px (`backdrop-filter`); no-op on native. @default 0 */
  blur?: number | string;
  /** Web-only CSS gradient; when set, `backgroundColor`/`backgroundOpacity` are ignored. */
  gradient?: string;
  /** Switch from `absolute` (parent-relative) to `fixed` (viewport-relative). @default false */
  fixed?: boolean;
}

/** Web-only style props absent from Box's cross-platform style types. */
type WebOnlyStyle = { backdropFilter?: string; backgroundImage?: string };

export const Overlay = OverlayFrame.styleable<OverlayProps>(function Overlay(props, ref) {
  const {
    backgroundOpacity = 0.6,
    backgroundColor: scrimBackgroundColor = "#000",
    blur,
    gradient,
    // `zIndex` is the inherited Box style prop (numeric/token); default to a
    // modal-level stack order. @default 200
    zIndex = 200,
    fixed = false,
    children,
    ...rest
  } = props;

  // `toRgba` yields a plain CSS color string; narrow to the exact Box style-prop
  // type (a branded color token | CSS value) rather than widening to `any`.
  const backgroundColor: BoxProps["backgroundColor"] = gradient
    ? undefined
    : toRgba(scrimBackgroundColor, backgroundOpacity);

  // `backdropFilter`/`backgroundImage` are web CSS props not in Box's style-prop
  // types; spread a precise object so the excess-property
  // check doesn't fire — never widen to `any`.
  const webOnly: WebOnlyStyle = {};
  if (isWeb && blur)
    webOnly.backdropFilter = `blur(${typeof blur === "number" ? `${blur}px` : blur})`;
  if (isWeb && gradient) webOnly.backgroundImage = gradient;

  return (
    <OverlayFrame
      ref={ref}
      position={fixed ? "fixed" : "absolute"}
      backgroundColor={backgroundColor}
      zIndex={zIndex}
      {...webOnly}
      {...rest}
    >
      {children}
    </OverlayFrame>
  );
});
