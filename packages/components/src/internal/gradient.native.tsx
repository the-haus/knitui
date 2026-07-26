/**
 * `useGradient` — NATIVE implementation (overrides the web `gradient.tsx`).
 * React Native can't apply a CSS gradient to a View, so the gradient is painted
 * by an absolutely-positioned `react-native-svg` layer rendered as the frame's
 * first child (behind in-flow content). The frame additionally gets
 * `overflow: "hidden"` so RN clips the square SVG layer to the frame's rounded
 * corners — no need to thread the resolved `borderRadius` down to the layer.
 *
 * Stop colors are resolved to concrete values via `resolveStops` because
 * `react-native-svg` can't paint `$colorN` tokens. See `gradient-shared.ts`.
 *
 * The theme read + `useId` live INSIDE {@link GradientLayer}, which only mounts
 * when a gradient actually exists. In the hook they ran on every render of every
 * Button / ActionIcon / Badge / Avatar / CloseButton / ThemeIcon / Pill / Alert
 * — a full `useThemeWithState` (useId + useRef + useReducer + a dep-less
 * `useEffect` after every render) plus a regex `replace`, for a feature that is
 * off unless `variant="gradient"`. `frameProps` is a static constant, so nothing
 * the hook returns needs the theme.
 */
import * as React from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useTheme } from "@knitui/core";

import { Box } from "../Box";
import type { GradientResult, GradientValue } from "./gradient-shared";
import { degToSvgCoords, gradientDeg, resolveStops } from "./gradient-shared";

export type { GradientStop, GradientValue } from "./gradient-shared";

/**
 * The no-gradient result, shared and frozen so the (overwhelmingly common)
 * off-path allocates nothing and keeps a stable `frameProps` identity across
 * renders — a fresh `{}` per render would defeat downstream prop memoisation.
 */
const EMPTY_GRADIENT: GradientResult = Object.freeze({
  frameProps: Object.freeze({}),
  layer: null,
});

/** Frame props when a gradient IS painted — static, so it can be a constant. */
const GRADIENT_FRAME_PROPS = Object.freeze({ overflow: "hidden" as const });

/** The SVG fill layer. Mounted only when a `gradient` exists, so the theme
 * subscription + `useId` are paid only by components that actually paint one. */
function GradientLayer({ gradient }: { gradient: GradientValue }) {
  const theme = useTheme();
  // `useId` is colon-bearing; SVG ids must be colon-free to be valid `url(#…)` refs.
  const id = `knitui-grad-${React.useId().replace(/:/g, "")}`;

  const stops = resolveStops(theme, gradient);
  const { x1, y1, x2, y2 } = degToSvgCoords(gradientDeg(gradient));

  return (
    <Box position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
            {stops.map((stop, i) => (
              <Stop key={i} offset={`${stop.offset}%`} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Box>
  );
}

export const useGradient = (gradient: GradientValue | undefined): GradientResult => {
  if (!gradient) return EMPTY_GRADIENT;
  return { frameProps: GRADIENT_FRAME_PROPS, layer: <GradientLayer gradient={gradient} /> };
};
