/**
 * `useGradient` — WEB implementation (the default `.tsx`; native overrides it in
 * `gradient.native.tsx`). On web a linear-gradient is a plain CSS
 * `backgroundImage`, so there's no extra DOM: the hook just resolves the
 * `gradient` value to a `linear-gradient(...)` string spread onto the frame.
 *
 * Returns the shared frozen {@link EMPTY_GRADIENT} when `gradient` is undefined
 * (the component isn't in `variant="gradient"`), so callers can wire it
 * unconditionally. See `gradient-shared.ts` for the value type + math.
 *
 * Deliberately hook-FREE. It used to call `useTheme()` before the bail-out, so
 * every Button / ActionIcon / Badge / Avatar / CloseButton / ThemeIcon / Pill /
 * Alert paid a full `useThemeWithState` (useId + useRef + useReducer + a
 * dep-less `useEffect` firing after every render, plus theme-subscriber
 * bookkeeping) for a feature that is off unless `variant="gradient"`. On web the
 * theme was never needed: token → `var(--token)` is a pure string transform
 * (see `theme-color-web.ts`).
 */
import type { GradientResult, GradientValue } from "./gradient-shared";
import { gradientToCss } from "./gradient-shared";

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

export const useGradient = (gradient: GradientValue | undefined): GradientResult => {
  if (!gradient) return EMPTY_GRADIENT;
  return { frameProps: { backgroundImage: gradientToCss(gradient) }, layer: null };
};
