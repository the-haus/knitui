import { memo, useMemo } from "react";
import type { NativeSyntheticEvent } from "react-native";

import { Images as MapLibreImages } from "@maplibre/maplibre-react-native";

import type { ImageEntry, ImagesProps } from "./Images.types";

type MapLibreImagesProps = Parameters<typeof MapLibreImages>[0];

/**
 * `@maplibre/maplibre-react-native` resolves an SDF/object entry's `source` via
 * `Image.resolveAssetSource`, which only understands a `require()` number or a
 * `{ uri, scale? }` object — a bare string (a `data:` URI from the SVG
 * rasterizer, or a remote URL) resolves to `null` and it then throws `Cannot read
 * property 'uri' of null`. A top-level string entry is fine (maplibre
 * special-cases it), so we only need to wrap the string `source` of an object
 * entry into `{ uri }`.
 *
 * We also carry `scale` onto that source object: maplibre reads `resolved.scale`
 * and hands it to the native image loader (iOS sets `UIImage.scale`; Android sets
 * `bitmap.setDensity(160 × scale)`), so a bitmap rasterized at `scale×` draws at
 * its logical size rather than `scale×` too big.
 */
function normalizeEntry(
  entry: ImageEntry,
): ImageEntry | { source: { uri: string; scale?: number }; sdf?: boolean } {
  if (entry != null && typeof entry === "object" && typeof entry.source === "string") {
    const source =
      entry.scale != null ? { uri: entry.source, scale: entry.scale } : { uri: entry.source };
    return { source, sdf: entry.sdf };
  }
  return entry;
}

export const Images = memo(function Images(props: ImagesProps) {
  const images = useMemo(() => {
    const result: Record<string, unknown> = {};
    for (const [id, entry] of Object.entries(props.images)) {
      result[id] = normalizeEntry(entry);
    }
    return result as MapLibreImagesProps["images"];
  }, [props.images]);

  return (
    <MapLibreImages
      images={images}
      onImageMissing={
        props.onImageMissing
          ? (e: NativeSyntheticEvent<{ image: string }>) => props.onImageMissing!(e.nativeEvent)
          : undefined
      }
    />
  );
});
