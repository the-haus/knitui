/**
 * Turn an SVG into a data URI usable as a MapLibre symbol icon. As an icon, the
 * SVG renders at a constant screen size (via `icon-size`) regardless of map zoom.
 *
 * On web the browser rasterizes the SVG when the URI is loaded as an image, so
 * this works out of the box. Native MapLibre does not decode SVG icons — pass a
 * pre-rasterized PNG `source` to {@link "../components/SvgImage"} there.
 */

import { parseXml } from "./xml";

export interface SvgToImageOptions {
  /** Target width in CSS pixels. Defaults to the SVG's intrinsic width. */
  width?: number;
  /** Target height in CSS pixels. Defaults to the SVG's intrinsic height. */
  height?: number;
  /** Multiplier for the rasterized bitmap resolution (crispness). Default `1`. */
  pixelRatio?: number;
}

function parseViewBoxSize(value: string | undefined): { w: number; h: number } | null {
  if (!value) return null;
  const parts = value
    .split(/[\s,]+/)
    .filter((s) => s.length > 0)
    .map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  return { w: parts[2], h: parts[3] };
}

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

/**
 * Rewrite the root `<svg>` tag to a fixed pixel size, preserving a viewBox and
 * — critically — guaranteeing the SVG/xlink namespaces. Without `xmlns` a
 * browser silently refuses to decode the SVG when it is loaded as an `<img>`
 * (`onload` never fires), so the map icon would never appear.
 */
function setSvgSize(svg: string, w: number, h: number, viewBox: string | undefined): string {
  return svg.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
    let cleaned = attrs.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    if (!/\bxmlns\s*=/i.test(cleaned)) cleaned += ` xmlns="${SVG_NS}"`;
    if (/xlink:/i.test(svg) && !/\bxmlns:xlink\s*=/i.test(cleaned)) {
      cleaned += ` xmlns:xlink="${XLINK_NS}"`;
    }
    if (!/viewbox\s*=/i.test(cleaned) && viewBox) cleaned += ` viewBox="${viewBox}"`;
    return `<svg${cleaned} width="${w}" height="${h}">`;
  });
}

interface ResolvedSize {
  /** Final bitmap width in pixels (intrinsic × pixelRatio). */
  width: number;
  /** Final bitmap height in pixels (intrinsic × pixelRatio). */
  height: number;
  /** A viewBox guaranteeing the content scales (derived if absent). */
  viewBox?: string;
}

/**
 * Resolve the target pixel size for rasterizing an SVG, from explicit options
 * or the SVG's intrinsic `viewBox`/`width`/`height`. Shared by the web (data
 * URI) and native (react-native-svg) icon paths.
 */
export function resolveSvgSize(svg: string, options: SvgToImageOptions = {}): ResolvedSize {
  const root = parseXml(svg);
  const vb = parseViewBoxSize(root?.attrs.viewBox);

  const intrinsicW = vb ? vb.w : parseFloat(root?.attrs.width ?? "");
  const intrinsicH = vb ? vb.h : parseFloat(root?.attrs.height ?? "");
  const width = options.width ?? (Number.isFinite(intrinsicW) ? intrinsicW : 100);
  const height = options.height ?? (Number.isFinite(intrinsicH) ? intrinsicH : 100);

  const ratio = options.pixelRatio ?? 1;
  const viewBox =
    root?.attrs.viewBox ??
    (Number.isFinite(intrinsicW) && Number.isFinite(intrinsicH)
      ? `0 0 ${intrinsicW} ${intrinsicH}`
      : undefined);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    viewBox,
  };
}

/**
 * Convert SVG markup to a `data:image/svg+xml` URI sized in pixels. The result
 * plugs directly into the `Images` registry / a `SymbolLayer` `iconImage`.
 *
 * This is the web path (the browser rasterizes the data URI). Native MapLibre
 * cannot decode SVG icons; the native `SvgImage` rasterizes via react-native-svg
 * instead.
 */
export function svgToImageDataUri(svg: string, options: SvgToImageOptions = {}): string {
  const { width, height, viewBox } = resolveSvgSize(svg, options);
  const sized = setSvgSize(svg, width, height, viewBox);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
}
