"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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

  const capture = useCallback(() => {
    if (source || !svg) return;
    svgRef.current?.toDataURL((base64) => setUri(`data:image/png;base64,${base64}`), {
      width: size.width,
      height: size.height,
    });
  }, [source, svg, size.width, size.height]);

  const images = useMemo<Record<string, ImageEntry>>(() => {
    const entry = source ?? uri ?? undefined;
    if (!entry) return {};
    return { [id]: sdf ? { source: entry as string | number, sdf: true } : entry };
  }, [id, source, uri, sdf]);

  return (
    <>
      {!source && svg ? (
        <View
          collapsable={false}
          pointerEvents="none"
          onLayout={capture}
          style={{ position: "absolute", width: size.width, height: size.height, opacity: 0 }}
        >
          <SvgXml xml={svg} override={{ ref: svgRef, width: size.width, height: size.height }} />
        </View>
      ) : null}
      <Images images={images} />
    </>
  );
}
