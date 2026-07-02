import type { SvgToImageOptions } from "../../svg/svgToImage";
import type { ImageEntry } from "../Images";

export interface SvgImageProps extends SvgToImageOptions {
  /** Image id referenced by a `SymbolLayer` via `iconImage`. */
  id: string;
  /** Inline SVG markup. Rasterized to a data URI (web). */
  svg?: string;
  /**
   * Pre-rasterized fallback image (a `require()` asset or `{ uri }`). Required
   * for native MapLibre, which cannot decode SVG icons; takes precedence over
   * `svg` when provided.
   */
  source?: ImageEntry;
  /** Render as a signed-distance-field icon (recolorable via `iconColor`). */
  sdf?: boolean;
}
