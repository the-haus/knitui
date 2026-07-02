import * as React from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";

import { EffectView, type ViewProps as EffectViewProps } from "../EffectView";
import { resolveShadow } from "./shadow";
import type { ShadowProps } from "./types";

export type ShadowViewProps = Omit<EffectViewProps, "effects"> & ShadowProps;

/**
 * Pull RN's `shadow*` props back out of `style` so they don't also drive a native
 * (iOS) shadow on the underlying View — the Skia layer is the single source of
 * truth. Returns the extracted shadow inputs and the remaining view style. The
 * box geometry (size + `borderRadius`) stays in `rest` for EffectView to read.
 */
/** A finite plain number, or undefined — RN style numerics can be Animated nodes. */
function numeric(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function splitShadowStyle(style: StyleProp<ViewStyle>): { shadow: ShadowProps; rest: ViewStyle } {
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const { shadowColor, shadowOffset, shadowRadius, shadowOpacity, ...rest } = flat;
  const offsetW = numeric(shadowOffset?.width);
  const offsetH = numeric(shadowOffset?.height);
  return {
    shadow: {
      shadowColor: typeof shadowColor === "string" ? shadowColor : undefined,
      shadowOffset:
        offsetW != null || offsetH != null
          ? { width: offsetW ?? 0, height: offsetH ?? 0 }
          : undefined,
      shadowRadius: numeric(shadowRadius),
      shadowOpacity: numeric(shadowOpacity),
    },
    rest,
  };
}

/**
 * A drop-in React Native `<View>` that paints a Skia drop shadow behind itself,
 * so RN's `shadow*` inputs render consistently — **including on Android**, which
 * ignores them natively (it only honors `elevation`). Pass the shadow as props
 * or in `style`; either way it drives the Skia shadow and is stripped from the
 * underlying View so iOS doesn't double up. Geometry (size + corner radius) is
 * read off `style`, measured via `onLayout` when the size isn't pinned.
 *
 * The default (native) implementation; the web build resolves the
 * {@link import("./ShadowView.web").ShadowView} override, which uses a CSS
 * `box-shadow` instead.
 */
export function ShadowView({
  shadowColor,
  shadowOffset,
  shadowRadius,
  shadowOpacity,
  inner,
  style,
  ...rest
}: ShadowViewProps) {
  const { shadow: fromStyle, rest: viewStyle } = splitShadowStyle(style);

  const shadow = resolveShadow({
    shadowColor: shadowColor ?? fromStyle.shadowColor,
    shadowOffset: shadowOffset ?? fromStyle.shadowOffset,
    shadowRadius: shadowRadius ?? fromStyle.shadowRadius,
    shadowOpacity: shadowOpacity ?? fromStyle.shadowOpacity,
    inner,
  });

  return (
    <EffectView
      style={viewStyle}
      effects={shadow ? [{ effect: "shadow", ...shadow }] : []}
      {...rest}
    />
  );
}
