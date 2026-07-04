"use client";

import { forwardRef, memo, useEffect, useImperativeHandle } from "react";

import type { FilterSpecification, Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { VectorSourceProps, VectorSourceRef } from "./VectorSource.types";

export const VectorSource = memo(
  forwardRef<VectorSourceRef, VectorSourceProps>(function VectorSource(
    { id = "vector-source", url, tiles, minzoom, maxzoom, scheme, attribution, onPress, children },
    ref,
  ) {
    const {
      mapEngine,
      ready,
      registerSource,
      unregisterSource,
      registerInteractiveSource,
      unregisterInteractiveSource,
    } = useMapContext();
    const map = mapEngine as MLMap | null;

    // Register this source as interactive when it has an onPress handler
    useEffect(() => {
      if (!onPress) return;
      registerInteractiveSource(id);
      return () => unregisterInteractiveSource(id);
    }, [id, !!onPress, registerInteractiveSource, unregisterInteractiveSource]);

    useEffect(() => {
      if (!ready || !map) return;

      const sourceConfig: Record<string, unknown> = { type: "vector" };
      if (url) sourceConfig.url = url;
      if (tiles) sourceConfig.tiles = tiles;
      if (minzoom !== undefined) sourceConfig.minzoom = minzoom;
      if (maxzoom !== undefined) sourceConfig.maxzoom = maxzoom;
      if (scheme !== undefined) sourceConfig.scheme = scheme;
      if (attribution) sourceConfig.attribution = attribution;

      try {
        if (!map.getSource(id)) {
          map.addSource(id, sourceConfig as Parameters<MLMap["addSource"]>[1]);
        }
      } catch {
        // Map style not yet available (e.g. mid style-swap)
        return;
      }
      registerSource({ id, type: "vector", config: sourceConfig });

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
      scheme,
      attribution,
      registerSource,
      unregisterSource,
    ]);

    // --- Imperative ref ---
    useImperativeHandle(
      ref,
      (): VectorSourceRef => ({
        querySourceFeatures: async (options: {
          sourceLayer: string;
          filter?: FilterSpecification;
        }): Promise<GeoJSON.Feature[]> => {
          if (!map) return [];
          const features = map.querySourceFeatures(id, {
            sourceLayer: options.sourceLayer,
            filter: options.filter as FilterSpecification | undefined,
          } as Parameters<MLMap["querySourceFeatures"]>[1]);
          return features as GeoJSON.Feature[];
        },
      }),
    );

    return <>{children}</>;
  }),
);
