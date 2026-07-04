"use client";

import { memo, useEffect, useRef } from "react";

import type { ImageSource as MLImageSource, Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { ImageSourceProps } from "./ImageSource.types";

export const ImageSource = memo(function ImageSource({
  id = "image-source",
  url,
  coordinates,
  children,
}: ImageSourceProps) {
  const { mapEngine, ready, registerSource, unregisterSource } = useMapContext();
  const map = mapEngine as MLMap | null;
  const addedRef = useRef(false);

  // Resolve URL — on web, only string URLs are supported (not require() numbers)
  const resolvedUrl = typeof url === "string" ? url : undefined;

  // --- Create/remove source ---
  useEffect(() => {
    if (!ready || !map) return;

    const sourceConfig: Record<string, unknown> = { type: "image" };
    if (resolvedUrl) sourceConfig.url = resolvedUrl;
    if (coordinates) sourceConfig.coordinates = coordinates;

    try {
      if (!map.getSource(id)) {
        map.addSource(id, sourceConfig as Parameters<MLMap["addSource"]>[1]);
      }
      // Mark added whether we created it or it already existed, so the
      // updateImage/setCoordinates effect below isn't permanently short-circuited.
      addedRef.current = true;
    } catch {
      // Map style not yet available
      return;
    }
    registerSource({ id, type: "image", config: sourceConfig });

    return () => {
      unregisterSource(id);
      try {
        if (map.getSource(id)) {
          for (const layer of map.getStyle()?.layers ?? []) {
            if ("source" in layer && layer.source === id) {
              map.removeLayer(layer.id);
            }
          }
          map.removeSource(id);
        }
      } catch {
        // Map already destroyed or style not available (e.g. MapView unmounted first)
      }
      addedRef.current = false;
    };
  }, [ready, map, id, registerSource, unregisterSource]);

  // --- Update image URL and coordinates when they change ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current) return;
    const source = map.getSource(id) as MLImageSource | undefined;
    if (!source) return;

    if (resolvedUrl && coordinates) {
      source.updateImage({
        url: resolvedUrl,
        coordinates: coordinates as [
          [number, number],
          [number, number],
          [number, number],
          [number, number],
        ],
      });
    } else if (coordinates) {
      source.setCoordinates(
        coordinates as [[number, number], [number, number], [number, number], [number, number]],
      );
    }
  }, [ready, map, id, resolvedUrl, coordinates]);

  return <>{children}</>;
});
