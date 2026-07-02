import { clamp } from "./snap";

/**
 * Overlay scrim opacity as a function of the panel offset.
 *
 * The scrim is fully present while the panel is at or above its least-open snap
 * (`fadeStartOffset`) and fades linearly to 0 as the panel travels on toward the
 * closed offset. When the sheet is not dismissible the panel never passes
 * `fadeStartOffset`, so the scrim stays at full `maxOpacity` throughout.
 *
 * Pure; `"worklet"` so it runs UI-thread inside `useDerivedValue`/`useAnimatedStyle`.
 */
export function overlayOpacity(
  offset: number,
  fadeStartOffset: number,
  closedOffset: number,
  maxOpacity = 1,
): number {
  "worklet";
  const span = closedOffset - fadeStartOffset;
  if (!(span > 0)) return offset > closedOffset ? 0 : maxOpacity;
  const t = (closedOffset - offset) / span;
  return clamp(t, 0, 1) * maxOpacity;
}
