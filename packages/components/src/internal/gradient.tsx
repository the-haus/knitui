/**
 * `useGradient` — WEB implementation (the default `.tsx`; native overrides it in
 * `gradient.native.tsx`). On web a linear-gradient is a plain CSS
 * `backgroundImage`, so there's no extra DOM: the hook just resolves the
 * `gradient` value to a `linear-gradient(...)` string spread onto the frame.
 *
 * Returns `{ frameProps: {}, layer: null }` when `gradient` is undefined (the
 * component isn't in `variant="gradient"`), so callers can wire it
 * unconditionally. See `gradient-shared.ts` for the value type + math.
 */
import { useTheme } from "@knitui/core";

import type { GradientResult, GradientValue } from "./gradient-shared";
import { gradientToCss } from "./gradient-shared";

export type { GradientStop, GradientValue } from "./gradient-shared";

export const useGradient = (gradient: GradientValue | undefined): GradientResult => {
  const theme = useTheme();
  if (!gradient) return { frameProps: {}, layer: null };
  return { frameProps: { backgroundImage: gradientToCss(theme, gradient) }, layer: null };
};
