/**
 * Shared hook for managing a maplibre-gl layer on web.
 * Handles add, update, and remove lifecycle via map context.
 */
import { useEffect, useRef } from "react";

import type { Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { BaseLayerProps } from "./BaseLayer.types";
import { resolvePaintLayout } from "./resolvePaintLayout";

/** Props accepted by useWebLayer — style is typed as `object` to accept any layer style interface. */
interface WebLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: object;
}

let _layerIdCounter = 0;

export function useWebLayer(layerType: string, props: WebLayerProps) {
  const { mapEngine, ready, registerLayer, unregisterLayer } = useMapContext();
  const map = mapEngine as MLMap | null;
  const addedRef = useRef(false);
  const generatedIdRef = useRef<string | null>(null);

  const {
    id: rawId,
    source,
    sourceLayer,
    "source-layer": sourceLayerAlt,
    afterId,
    beforeId,
    layerIndex,
    minzoom,
    maxzoom,
    filter,
    paint,
    layout,
    style,
  } = props;

  // Resolve id — generate a stable one if not provided
  if (!rawId && !generatedIdRef.current) {
    generatedIdRef.current = `_layer_${layerType}_${++_layerIdCounter}`;
  }
  const id = rawId ?? generatedIdRef.current!;

  // Resolve source-layer from either prop name
  const resolvedSourceLayer = sourceLayer ?? sourceLayerAlt;

  // --- Add/remove layer ---
  useEffect(() => {
    if (!ready || !map) return;

    const layerConfig = buildLayerConfig(
      layerType,
      id,
      source,
      resolvedSourceLayer,
      minzoom,
      maxzoom,
      filter,
      paint,
      layout,
      style,
    );

    const addLayer = (): boolean => {
      try {
        if (map.getLayer(id)) return true;

        // If the layer has a source, wait for it to exist
        if (source && !map.getSource(source)) return false;

        const resolvedBeforeId = resolveBeforeId(map, beforeId, afterId, layerIndex);
        map.addLayer(layerConfig as Parameters<MLMap["addLayer"]>[0], resolvedBeforeId);
        addedRef.current = true;
        return true;
      } catch {
        return false;
      }
    };

    // Try immediately
    if (addLayer()) {
      registerLayer({
        id,
        type: layerType,
        sourceId: source,
        config: layerConfig,
        aboveLayerID: afterId,
        belowLayerID: beforeId,
        layerIndex,
      });
      return () => {
        unregisterLayer(id);
        try {
          if (map.getLayer(id)) map.removeLayer(id);
        } catch {
          // Map style already destroyed
        }
        addedRef.current = false;
      };
    }

    // Source not ready yet — listen for sourcedata events and retry
    const handleSourceData = (): void => {
      if (addLayer()) {
        map.off("sourcedata", handleSourceData);
        registerLayer({
          id,
          type: layerType,
          sourceId: source,
          config: layerConfig,
          aboveLayerID: afterId,
          belowLayerID: beforeId,
          layerIndex,
        });
      }
    };
    map.on("sourcedata", handleSourceData);

    return () => {
      map.off("sourcedata", handleSourceData);
      unregisterLayer(id);
      try {
        if (map.getLayer(id)) map.removeLayer(id);
      } catch {
        // Map style already destroyed
      }
      addedRef.current = false;
    };
  }, [ready, map, id, source, resolvedSourceLayer]);

  // --- Update paint/layout properties incrementally ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current) return;

    // Normalize the (deprecated) camelCase `style` prop into spec-shaped
    // paint/layout, merged with any explicit paint/layout.
    const { paint: resolvedPaint, layout: resolvedLayout } = resolvePaintLayout(
      style,
      paint,
      layout,
    );

    if (resolvedPaint) {
      for (const [prop, value] of Object.entries(resolvedPaint)) {
        try {
          map.setPaintProperty(id, prop, value);
        } catch {
          // Property not recognized for this layer type
        }
      }
    }

    if (resolvedLayout) {
      for (const [prop, value] of Object.entries(resolvedLayout)) {
        try {
          map.setLayoutProperty(id, prop, value);
        } catch {
          // Property not recognized for this layer type
        }
      }
    }
  }, [ready, map, id, paint, layout, style]);

  // --- Update filter incrementally ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current) return;
    map.setFilter(id, (filter ?? null) as Parameters<MLMap["setFilter"]>[1]);
  }, [ready, map, id, filter]);

  // --- Update zoom range incrementally ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current) return;
    map.setLayerZoomRange(id, minzoom ?? 0, maxzoom ?? 24);
  }, [ready, map, id, minzoom, maxzoom]);
}

// ── Helpers ─────────────────────────────────────────────────────────

function buildLayerConfig(
  layerType: string,
  id?: string,
  source?: string,
  sourceLayer?: string,
  minzoom?: number,
  maxzoom?: number,
  filter?: unknown,
  paint?: Record<string, unknown>,
  layout?: Record<string, unknown>,
  style?: object,
): Record<string, unknown> {
  const layerConfig: Record<string, unknown> = { id, type: layerType };

  if (source) layerConfig.source = source;
  if (sourceLayer) layerConfig["source-layer"] = sourceLayer;
  if (minzoom !== undefined) layerConfig.minzoom = minzoom;
  if (maxzoom !== undefined) layerConfig.maxzoom = maxzoom;
  if (filter) layerConfig.filter = filter;

  // Normalize the (deprecated) camelCase `style` prop into spec-shaped
  // paint/layout, merged with any explicit paint/layout.
  const { paint: resolvedPaint, layout: resolvedLayout } = resolvePaintLayout(style, paint, layout);
  if (resolvedPaint) layerConfig.paint = resolvedPaint;
  if (resolvedLayout) layerConfig.layout = resolvedLayout;

  return layerConfig;
}

function resolveBeforeId(
  map: MLMap,
  beforeId?: string,
  afterId?: string,
  layerIndex?: number,
): string | undefined {
  if (beforeId) return beforeId;

  const layers = map.getStyle()?.layers;
  if (!layers) return undefined;

  if (afterId) {
    const idx = layers.findIndex((l) => l.id === afterId);
    if (idx >= 0 && idx + 1 < layers.length) {
      return layers[idx + 1].id;
    }
    return undefined;
  }

  if (layerIndex !== undefined) {
    if (layerIndex < layers.length) {
      return layers[layerIndex].id;
    }
    return undefined;
  }

  return undefined;
}
