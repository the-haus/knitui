"use client";

import { useMemo } from "react";

import { resolvePassthrough, useSvgMarkup } from "../../svg/resource";
import { Images } from "../Images";
import type { ImageEntry } from "../Images";
import { useRasterizedSvg } from "./rasterizer.shared";
import type { SvgImageEntry, SvgImageProps, SvgImagesProps } from "./SvgImage.types";

/**
 * Registers an SVG (or raster) resource as a named MapLibre image so a
 * `SymbolLayer` can draw it as a **fixed-size icon** (`iconImage` + `iconSize`)
 * that stays the same screen size at every zoom — the usual pin/marker behaviour.
 *
 * SVG resources are rasterized to a bitmap via `react-native-svg` on **both**
 * platforms (identical output web and native); the marker itself is then drawn on
 * the GPU by MapLibre, so one icon backs thousands of markers with no per-marker
 * DOM or native view. Raster resources (`source`, or a non-SVG `uri`) are
 * registered directly.
 */
export function SvgImage({ id, svg, uri, source, width, height, pixelRatio, sdf }: SvgImageProps) {
  // Raster passthrough short-circuits rasterization entirely.
  const passthrough = resolvePassthrough(source, uri);
  // Otherwise resolve markup (inline or fetched) and rasterize it once.
  const markup = useSvgMarkup(passthrough ? undefined : svg, passthrough ? undefined : uri);
  const raster = useRasterizedSvg(markup, { width, height, pixelRatio });

  const entry = passthrough ?? raster;

  // Our rasterizer emits a bitmap upscaled by `pixelRatio`; register that density
  // (`scale`) so the icon draws at its logical size on every platform instead of
  // `pixelRatio×` too big. Passthrough rasters are registered as-is (scale 1).
  const scale = !passthrough && raster != null ? (pixelRatio ?? 1) : 1;

  const images = useMemo<Record<string, ImageEntry>>(() => {
    if (!entry) return {};
    if (!sdf && scale === 1) return { [id]: entry };
    return {
      [id]: {
        source: entry as string | number,
        ...(sdf ? { sdf: true } : {}),
        ...(scale !== 1 ? { scale } : {}),
      },
    };
  }, [id, entry, sdf, scale]);

  return <Images images={images} />;
}

/**
 * Register several SVG/raster icons at once — a convenience over rendering many
 * `<SvgImage>` elements. Handy when a `SymbolLayer` selects between icons with a
 * data-driven `iconImage` expression (e.g. `["match", ["get", "category"], …]`).
 */
export function SvgImages({ images }: SvgImagesProps) {
  return (
    <>
      {Object.entries(images).map(([id, entry]: [string, SvgImageEntry]) => (
        <SvgImage key={id} id={id} {...entry} />
      ))}
    </>
  );
}
