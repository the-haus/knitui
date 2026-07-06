import type { SvgToImageOptions } from "../../svg/svgToImage";
import type { ImageEntry } from "../Images";

export interface SvgImageProps extends SvgToImageOptions {
  /** Image id referenced by a `SymbolLayer` via `iconImage`. */
  id: string;
  /** Inline SVG markup. Rasterized to a bitmap on both web and native. */
  svg?: string;
  /**
   * URL of a resource. An `.svg` (or `data:image/svg+xml`) URL is fetched and
   * rasterized; any other URL (`.png`, `.jpg`, …) is registered directly as a
   * raster. Ignored when `svg` or `source` is provided.
   */
  uri?: string;
  /**
   * Pre-rasterized image registered as-is (a `require()` asset or `{ uri }`).
   * Skips rasterization; takes precedence over `svg`/`uri`.
   */
  source?: ImageEntry;
  /** Render as a signed-distance-field icon (recolorable via `iconColor`). */
  sdf?: boolean;
}

/** One entry in an {@link SvgImages} batch — same as {@link SvgImageProps} without `id`. */
export type SvgImageEntry = Omit<SvgImageProps, "id">;

export interface SvgImagesProps {
  /** Map of icon id → resource. Each becomes a named image a `SymbolLayer` can reference. */
  images: Record<string, SvgImageEntry>;
}
