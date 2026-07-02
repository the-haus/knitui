import type { SkiaColor } from "../../types";

/**
 * React Native's drop-shadow style inputs, accepted as plain props. The shape is
 * identical on every platform; only the renderer differs — a Skia shadow on
 * native (so Android, which ignores RN's `shadow*` style props, gets one too) and
 * a CSS `box-shadow` on web.
 */
export type ShadowProps = {
  /**
   * Shadow color. Any alpha in the color is honored; `shadowOpacity` further
   * scales it. With no color there is no shadow. Opacity scaling only applies to
   * `#rgb[a]` / `#rrggbb[aa]` and `rgb()/rgba()` colors — named colors and theme
   * tokens are used as-is.
   */
  shadowColor?: SkiaColor;
  /** Offset in px. Defaults to `{ width: 0, height: 0 }`. */
  shadowOffset?: { width: number; height: number };
  /** Blur radius in px. Defaults to `0` (a hard-edged shadow). */
  shadowRadius?: number;
  /** 0–1 multiplier applied to the shadow color's alpha. `0` paints no shadow. */
  shadowOpacity?: number;
  /** Render the shadow inset (inner) rather than as an outer drop shadow. */
  inner?: boolean;
};
