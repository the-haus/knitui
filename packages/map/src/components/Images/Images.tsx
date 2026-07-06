"use client";

import { memo, useEffect, useRef } from "react";

import type { Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { ImageEntry, ImageSourceWithSdf, ImagesProps } from "./Images.types";

function resolveImageUrl(entry: ImageEntry): string | null {
  if (typeof entry === "string") return entry;
  if (typeof entry === "number") return null; // require()-style asset — not supported on web
  if (typeof entry === "object" && entry !== null) {
    const sdfEntry = entry as ImageSourceWithSdf;
    if (typeof sdfEntry.source === "string") return sdfEntry.source;
  }
  return null;
}

function isSdf(entry: ImageEntry): boolean {
  if (typeof entry === "object" && entry !== null && "sdf" in entry) {
    return (entry as ImageSourceWithSdf).sdf === true;
  }
  return false;
}

/** Bitmap density of an entry (e.g. 2 for a 2× rasterized icon). Default 1. */
function resolveScale(entry: ImageEntry): number {
  if (typeof entry === "object" && entry !== null) {
    const scale = (entry as ImageSourceWithSdf).scale;
    if (typeof scale === "number" && scale > 0) return scale;
  }
  return 1;
}

/** Registration signature — re-register when either the url or the density changes. */
function imageSignature(url: string, scale: number): string {
  return `${scale}@${url}`;
}

/**
 * `map.hasImage` / `removeImage` dereference `map.style`, which maplibre sets to
 * undefined once the map (or its current style) is torn down. Our image call
 * sites run async (`img.onload`) or at cleanup time, so they can fire after that
 * point — probe the style first so an unmount / StrictMode remount / style
 * reload can't throw `Cannot read properties of undefined (reading 'getImage')`.
 */
function styleAlive(map: MLMap): boolean {
  return Boolean((map as unknown as { style?: unknown }).style);
}

export const Images = memo(function Images({ images, onImageMissing }: ImagesProps) {
  const { mapEngine, ready, registerImage, unregisterImage } = useMapContext();
  const map = mapEngine as MLMap | null;
  // Track loaded images as key -> signature (url + density) so we can detect
  // both URL and scale changes.
  const loadedRef = useRef(new Map<string, string>());

  // --- Handle onImageMissing ---
  useEffect(() => {
    if (!ready || !map || !onImageMissing) return;

    const handler = (e: { id: string }): void => {
      onImageMissing({ image: e.id });
    };

    map.on("styleimagemissing", handler);
    return () => {
      map.off("styleimagemissing", handler);
    };
  }, [ready, map, onImageMissing]);

  // --- Add/remove/diff images ---
  useEffect(() => {
    if (!ready || !map) return;

    const nextKeys = new Set(Object.keys(images));

    // Remove images no longer in props, or whose URL/scale changed
    for (const [key, prevSig] of loadedRef.current) {
      const nextEntry = images[key];
      const nextUrl = nextEntry ? resolveImageUrl(nextEntry) : null;
      const nextSig = nextUrl ? imageSignature(nextUrl, resolveScale(nextEntry!)) : null;

      if (!nextKeys.has(key) || nextSig !== prevSig) {
        if (styleAlive(map) && map.hasImage(key)) {
          map.removeImage(key);
        }
        unregisterImage(key);
        loadedRef.current.delete(key);
      }
    }

    // Add new or changed images
    for (const [key, entry] of Object.entries(images)) {
      if (loadedRef.current.has(key)) continue;

      const url = resolveImageUrl(entry);
      if (!url) continue;

      const sdf = isSdf(entry);
      const scale = resolveScale(entry);
      const sig = imageSignature(url, scale);

      registerImage({ id: key, data: url });

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Guard: the map (or its style) may have been torn down between load
        // start and completion — `hasImage` itself throws once the style is gone.
        if (!styleAlive(map)) return;
        if (!map.hasImage(key)) {
          try {
            // `pixelRatio` tells MapLibre the bitmap's density so a 2× icon
            // draws at logical size instead of 2× too big.
            map.addImage(key, img, { sdf, pixelRatio: scale });
            loadedRef.current.set(key, sig);
          } catch {
            // May race with unmount
          }
        }
      };
      img.onerror = () => {
        if (__DEV__) {
          console.warn(`Images: failed to load image "${key}" from ${url}`);
        }
      };
      img.src = url;
    }
  }, [ready, map, images, registerImage, unregisterImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      const alive = styleAlive(map);
      for (const [key] of loadedRef.current) {
        if (alive && map.hasImage(key)) {
          map.removeImage(key);
        }
        unregisterImage(key);
      }
      loadedRef.current.clear();
    };
  }, [map, unregisterImage]);

  return null;
});

declare const __DEV__: boolean;
