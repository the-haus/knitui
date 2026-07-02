"use client";

import { useMemo } from "react";

import { svgToImageDataUri } from "../../svg/svgToImage";
import { Images } from "../Images";
import type { ImageEntry } from "../Images";
import type { SvgImageProps } from "./SvgImage.types";

/**
 * Registers an SVG as a named MapLibre image so a `SymbolLayer` can draw it as a
 * fixed-size icon (`iconImage` + `iconSize`) that does not scale with zoom.
 *
 * On web the SVG is rasterized from a data URI by the browser. On native, supply
 * a raster `source` (PNG) — MapLibre native cannot decode SVG icons.
 */
export function SvgImage({ id, svg, source, width, height, pixelRatio, sdf }: SvgImageProps) {
  const uri = useMemo(
    () => (svg ? svgToImageDataUri(svg, { width, height, pixelRatio }) : undefined),
    [svg, width, height, pixelRatio],
  );

  const images = useMemo<Record<string, ImageEntry>>(() => {
    const entry = source ?? uri;
    if (!entry) return {};
    return { [id]: sdf ? { source: entry as string | number, sdf: true } : entry };
  }, [id, source, uri, sdf]);

  return <Images images={images} />;
}
