"use client";

import { memo, useEffect } from "react";

import type { Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { RasterSourceProps } from "./RasterSource.types";

export const RasterSource = memo(function RasterSource({
  id = "raster-source",
  url,
  tiles,
  minzoom,
  maxzoom,
  tileSize,
  scheme,
  attribution,
  children,
}: RasterSourceProps) {
  const { mapEngine, ready, registerSource, unregisterSource } = useMapContext();
  const map = mapEngine as MLMap | null;

  useEffect(() => {
    if (!ready || !map) return;

    const sourceConfig: Record<string, unknown> = { type: "raster" };
    if (url) sourceConfig.url = url;
    if (tiles) sourceConfig.tiles = tiles;
    if (minzoom !== undefined) sourceConfig.minzoom = minzoom;
    if (maxzoom !== undefined) sourceConfig.maxzoom = maxzoom;
    if (tileSize !== undefined) sourceConfig.tileSize = tileSize;
    if (scheme !== undefined) sourceConfig.scheme = scheme;
    if (attribution) sourceConfig.attribution = attribution;

    if (!map.getSource(id)) {
      map.addSource(id, sourceConfig as Parameters<MLMap["addSource"]>[1]);
    }
    registerSource({ id, type: "raster", config: sourceConfig });

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
    };
  }, [
    ready,
    map,
    id,
    url,
    tiles,
    minzoom,
    maxzoom,
    tileSize,
    scheme,
    attribution,
    registerSource,
    unregisterSource,
  ]);

  return <>{children}</>;
});
