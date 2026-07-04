"use client";

import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";

import type { Feature } from "geojson";
import type { FilterSpecification, GeoJSONSource, Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { GeoJSONSourceProps, GeoJSONSourceRef } from "./ShapeSource.types";

export const ShapeSource = memo(
  forwardRef<GeoJSONSourceRef, GeoJSONSourceProps>(function ShapeSource(
    {
      id = "geojson-source",
      data,
      cluster,
      clusterRadius,
      clusterMinPoints,
      clusterMaxZoom,
      clusterProperties,
      maxzoom,
      buffer,
      tolerance,
      lineMetrics,
      onPress,
      children,
    },
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
    const addedRef = useRef(false);
    // Latest source config, kept current so a style replay (setStyle) re-adds the
    // source with the up-to-date `data` rather than the value it had at mount.
    const configRef = useRef<Record<string, unknown>>({});
    const propsRef = useRef({ onPress });
    propsRef.current = { onPress };

    // Register this source as interactive when it has an onPress handler
    useEffect(() => {
      if (!onPress) return;
      registerInteractiveSource(id);
      return () => unregisterInteractiveSource(id);
    }, [id, !!onPress, registerInteractiveSource, unregisterInteractiveSource]);

    // --- Add/remove source ---
    useEffect(() => {
      if (!ready || !map) return;

      const sourceConfig: Record<string, unknown> = {
        type: "geojson",
        data: data ?? { type: "FeatureCollection", features: [] },
      };

      if (cluster !== undefined) sourceConfig.cluster = cluster;
      if (clusterRadius !== undefined) sourceConfig.clusterRadius = clusterRadius;
      if (clusterMinPoints !== undefined) sourceConfig.clusterMinPoints = clusterMinPoints;
      if (clusterMaxZoom !== undefined) sourceConfig.clusterMaxZoom = clusterMaxZoom;
      if (clusterProperties !== undefined) sourceConfig.clusterProperties = clusterProperties;
      if (maxzoom !== undefined) sourceConfig.maxzoom = maxzoom;
      if (buffer !== undefined) sourceConfig.buffer = buffer;
      if (tolerance !== undefined) sourceConfig.tolerance = tolerance;
      if (lineMetrics !== undefined) sourceConfig.lineMetrics = lineMetrics;

      try {
        if (!map.getSource(id)) {
          map.addSource(id, sourceConfig as Parameters<MLMap["addSource"]>[1]);
        }
        // Mark added whether we created it or it already existed, so the data
        // update effect below isn't permanently short-circuited.
        addedRef.current = true;
      } catch {
        // Map style not yet available
        return;
      }

      configRef.current = sourceConfig;
      registerSource({ id, type: "geojson", config: sourceConfig });

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
          // Map already destroyed or style not available
        }
        addedRef.current = false;
      };
    }, [
      ready,
      map,
      id,
      cluster,
      clusterRadius,
      clusterMinPoints,
      clusterMaxZoom,
      clusterProperties,
      maxzoom,
      buffer,
      tolerance,
      lineMetrics,
      registerSource,
      unregisterSource,
    ]);

    // --- Update data when it changes ---

    useEffect(() => {
      if (!ready || !map || !addedRef.current) return;
      const source = map.getSource(id) as GeoJSONSource | undefined;
      if (!source) return;

      if (data) {
        source.setData(data);
        // Keep the registry entry current so a later style replay uses this data.
        configRef.current = { ...configRef.current, data };
        registerSource({ id, type: "geojson", config: configRef.current });
      }
    }, [ready, map, id, data, registerSource]);

    // --- onPress: click handler for features in this source ---

    useEffect(() => {
      if (!ready || !map) return;

      const handleClick = (e: {
        lngLat: { lng: number; lat: number };
        point: { x: number; y: number };
      }): void => {
        const handler = propsRef.current.onPress;
        if (!handler) return;

        const layerIds = (map.getStyle().layers ?? [])
          .filter((l): l is typeof l & { source: string } => "source" in l && l.source === id)
          .map((l) => l.id);

        if (layerIds.length === 0) return;

        const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
          layers: layerIds,
        }) as Feature[];

        if (features.length === 0) return;

        handler({
          features,
          lngLat: [e.lngLat.lng, e.lngLat.lat],
          point: [e.point.x, e.point.y],
        });
      };

      map.on("click", handleClick);

      return () => {
        map.off("click", handleClick);
      };
    }, [ready, map, id]);

    // --- Imperative ref ---

    useImperativeHandle(
      ref,
      (): GeoJSONSourceRef => ({
        getData: async (filter?: FilterSpecification): Promise<GeoJSON.FeatureCollection> => {
          if (!map) return { type: "FeatureCollection", features: [] };
          const features = map.querySourceFeatures(id, {
            filter: filter as FilterSpecification | undefined,
          } as Parameters<MLMap["querySourceFeatures"]>[1]);
          return { type: "FeatureCollection", features: features as Feature[] };
        },

        getClusterExpansionZoom: async (clusterId: number): Promise<number> => {
          const source = map?.getSource(id) as GeoJSONSource | undefined;
          if (!source) return 0;
          try {
            return await source.getClusterExpansionZoom(clusterId);
          } catch {
            return 0;
          }
        },

        getClusterLeaves: async (
          clusterId: number,
          limit: number,
          offset: number,
        ): Promise<GeoJSON.Feature[]> => {
          const source = map?.getSource(id) as GeoJSONSource | undefined;
          if (!source) return [];
          try {
            const leaves = await source.getClusterLeaves(clusterId, limit, offset);
            return leaves as Feature[];
          } catch {
            return [];
          }
        },

        getClusterChildren: async (clusterId: number): Promise<GeoJSON.Feature[]> => {
          const source = map?.getSource(id) as GeoJSONSource | undefined;
          if (!source) return [];
          try {
            const children = await source.getClusterChildren(clusterId);
            return children as Feature[];
          } catch {
            return [];
          }
        },
      }),
    );

    return <>{children}</>;
  }),
);
