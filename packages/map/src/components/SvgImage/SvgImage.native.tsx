"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { resolveSvgSize } from "../../svg/svgToImage";
import { Images } from "../Images";
import type { ImageEntry } from "../Images";
import type { SvgImageProps } from "./SvgImage.types";

/** Minimal shape of a react-native-svg `Svg` instance we rasterize through. */
interface CapturableSvg {
  toDataURL: (callback: (base64: string) => void, options?: object) => void;
}

/**
 * How many frames to keep retrying `toDataURL` for. The offscreen `Svg` is only
 * mounted once maplibre's native MapView is ready and laid out, and on the New
 * Architecture the native view isn't guaranteed to be painted on the first
 * frame — so a single capture races the draw and comes back empty. ~20 frames
 * (a few hundred ms) is plenty for the view to exist and paint.
 */
const MAX_CAPTURE_ATTEMPTS = 20;

/**
 * Native `SvgImage`: MapLibre native can't decode SVG icons, so the SVG is
 * rasterized to a PNG via react-native-svg (`Svg.toDataURL`) and that PNG data
 * URI is registered with the `Images` registry. A pre-rasterized `source` (PNG)
 * skips rasterization entirely.
 *
 * The SVG is rendered into a hidden, off-flow `View` purely so it can be
 * snapshotted; `collapsable={false}` keeps Android from pruning it.
 */
export function SvgImage({ id, svg, source, width, height, pixelRatio, sdf }: SvgImageProps) {
  const svgRef = useRef<CapturableSvg | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  const size = useMemo(
    () => (svg ? resolveSvgSize(svg, { width, height, pixelRatio }) : { width: 0, height: 0 }),
    [svg, width, height, pixelRatio],
  );

  // Rasterize the SVG to a PNG data URI. `toDataURL` reads the mounted native
  // view, which may not be attached (ref still null) or painted (empty bytes)
  // on the first frame — so retry across frames until we actually get data
  // back, instead of capturing once and silently keeping a blank icon.
  useEffect(() => {
    if (source || !svg || size.width <= 0 || size.height <= 0) return;

    let cancelled = false;
    let attempts = 0;
    let raf = 0;

    const attempt = (): void => {
      if (cancelled) return;

      const node = svgRef.current;
      if (!node) {
        if (attempts++ < MAX_CAPTURE_ATTEMPTS) raf = requestAnimationFrame(attempt);
        return;
      }

      node.toDataURL(
        (base64) => {
          if (cancelled) return;
          if (base64) {
            setUri(`data:image/png;base64,${base64}`);
          } else if (attempts++ < MAX_CAPTURE_ATTEMPTS) {
            raf = requestAnimationFrame(attempt);
          }
        },
        { width: size.width, height: size.height },
      );
    };

    raf = requestAnimationFrame(attempt);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [source, svg, size.width, size.height]);

  const images = useMemo<Record<string, ImageEntry>>(() => {
    const entry = source ?? uri ?? undefined;
    if (!entry) return {};
    return { [id]: sdf ? { source: entry as string | number, sdf: true } : entry };
  }, [id, source, uri, sdf]);

  return (
    <>
      {!source && svg ? (
        // Positioned fully off-screen (rather than opacity:0 — an alpha-0 source
        // view can snapshot blank on Android) so react-native-svg has a real,
        // painted surface to rasterize from.
        <View
          collapsable={false}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -(size.width + 10000),
            top: 0,
            width: size.width,
            height: size.height,
          }}
        >
          <SvgXml xml={svg} override={{ ref: svgRef, width: size.width, height: size.height }} />
        </View>
      ) : null}
      <Images images={images} />
    </>
  );
}
