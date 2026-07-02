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
 */
import * as React from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useTheme } from "@knitui/core";

import { Box } from "../Box";
import type { GradientResult, GradientValue } from "./gradient-shared";
import { degToSvgCoords, gradientDeg, resolveStops } from "./gradient-shared";

export type { GradientStop, GradientValue } from "./gradient-shared";

export const useGradient = (gradient: GradientValue | undefined): GradientResult => {
  const theme = useTheme();
  // `useId` is colon-bearing; SVG ids must be colon-free to be valid `url(#…)` refs.
  const id = `knitui-grad-${React.useId().replace(/:/g, "")}`;

  if (!gradient) return { frameProps: {}, layer: null };

  const stops = resolveStops(theme, gradient);
  const { x1, y1, x2, y2 } = degToSvgCoords(gradientDeg(gradient));

  const layer = (
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

  return { frameProps: { overflow: "hidden" }, layer };
};
