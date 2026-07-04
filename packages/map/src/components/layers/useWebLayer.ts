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
  // Paint/layout keys applied last render, so keys dropped between renders can be
  // reset to their default rather than lingering on the layer.
  const prevPaintKeys = useRef<string[]>([]);
  const prevLayoutKeys = useRef<string[]>([]);

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

  // Freshest add-config + ordering, in a ref so a re-add (source recreated, or
  // style replay) uses CURRENT props, never the values captured at mount.
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
  const configRef = useRef<{
    config: Record<string, unknown>;
    afterId?: string;
    beforeId?: string;
    layerIndex?: number;
  }>({ config: layerConfig, afterId, beforeId, layerIndex });
  configRef.current = { config: layerConfig, afterId, beforeId, layerIndex };

  // --- Add/remove layer (+ self-heal when the source is (re)created) ---
  useEffect(() => {
    if (!ready || !map) return;

    const registerCurrent = (): void => {
      const { config, afterId: a, beforeId: b, layerIndex: li } = configRef.current;
      registerLayer({
        id,
        type: layerType,
        sourceId: source,
        config,
        aboveLayerID: a,
        belowLayerID: b,
        layerIndex: li,
      });
    };

    // Seed the dropped-key trackers from the paint/layout baked into the config
    // we just added. Without this, a key present in the initial add-config (the
    // layer is added with `paint`/`layout` inline) is invisible to the update
    // effect's reset loop — so dropping it later would never revert it to the
    // spec default. Runs at add time because the update effect bails while
    // `addedRef` is still false (the layer is added via the sourcedata self-heal
    // after the source appears, i.e. after the update effect already ran).
    const seedTrackedKeys = (): void => {
      const cfg = configRef.current.config;
      prevPaintKeys.current = cfg.paint ? Object.keys(cfg.paint as object) : [];
      prevLayoutKeys.current = cfg.layout ? Object.keys(cfg.layout as object) : [];
    };

    const addLayer = (): boolean => {
      try {
        if (map.getLayer(id)) {
          // Already present (e.g. left by a style replay / duplicate id) — mark
          // added so the paint/filter/zoom update effects don't short-circuit.
          addedRef.current = true;
          seedTrackedKeys();
          return true;
        }

        // If the layer has a source, wait for it to exist
        if (source && !map.getSource(source)) return false;

        const { config, afterId: a, beforeId: b, layerIndex: li } = configRef.current;
        const resolvedBeforeId = resolveBeforeId(map, b, a, li);
        map.addLayer(config as Parameters<MLMap["addLayer"]>[0], resolvedBeforeId);
        addedRef.current = true;
        seedTrackedKeys();
        registerCurrent();
        return true;
      } catch {
        return false;
      }
    };

    addLayer();

    // Self-heal: the source component removes dependent layers when a structural
    // prop (e.g. `cluster`) changes and recreates the source, and a `setStyle`
    // reload wipes layers too. Re-add this layer whenever its source (re)appears
    // and the layer is missing. Scoped to this layer's source and gated on a
    // `getLayer` miss, so on the hot `sourcedata` path it's just a string compare.
    const handleSourceData = (e: { sourceId?: string }): void => {
      if (source && e.sourceId !== source) return;
      if (map.getLayer(id)) return;
      addLayer();
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
  }, [ready, map, id, source, resolvedSourceLayer, layerType, registerLayer, unregisterLayer]);

  // --- Keep the registry entry current so a style replay re-adds this layer
  //     with its up-to-date paint/layout/filter/zoom, not the mount-time config.
  useEffect(() => {
    if (!ready || !map || !addedRef.current) return;
    const { config, afterId: a, beforeId: b, layerIndex: li } = configRef.current;
    registerLayer({
      id,
      type: layerType,
      sourceId: source,
      config,
      aboveLayerID: a,
      belowLayerID: b,
      layerIndex: li,
    });
  }, [
    ready,
    map,
    id,
    source,
    layerType,
    paint,
    layout,
    style,
    filter,
    minzoom,
    maxzoom,
    afterId,
    beforeId,
    layerIndex,
    registerLayer,
  ]);

  // --- Update paint/layout properties incrementally ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current || !map.getLayer(id)) return;

    // Normalize the (deprecated) camelCase `style` prop into spec-shaped
    // paint/layout, merged with any explicit paint/layout.
    const { paint: resolvedPaint, layout: resolvedLayout } = resolvePaintLayout(
      style,
      paint,
      layout,
    );

    // Reset paint keys that were set previously but are gone now (undefined =
    // revert to the spec default), then apply the current ones.
    for (const prevKey of prevPaintKeys.current) {
      if (!resolvedPaint || !(prevKey in resolvedPaint)) {
        try {
          map.setPaintProperty(id, prevKey, undefined);
        } catch {
          // Property not recognized for this layer type
        }
      }
    }
    if (resolvedPaint) {
      for (const [prop, value] of Object.entries(resolvedPaint)) {
        try {
          map.setPaintProperty(id, prop, value);
        } catch {
          // Property not recognized for this layer type
        }
      }
    }
    prevPaintKeys.current = resolvedPaint ? Object.keys(resolvedPaint) : [];

    for (const prevKey of prevLayoutKeys.current) {
      if (!resolvedLayout || !(prevKey in resolvedLayout)) {
        try {
          map.setLayoutProperty(id, prevKey, undefined);
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
    prevLayoutKeys.current = resolvedLayout ? Object.keys(resolvedLayout) : [];
  }, [ready, map, id, paint, layout, style]);

  // --- Update filter incrementally ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current || !map.getLayer(id)) return;
    // Guard + try/catch: after a `setStyle` reload the layer can be gone while
    // `addedRef` is still true (cleanup doesn't run on style swap), and
    // `setFilter` throws "no layer with ID" — mirror the paint effect's safety.
    try {
      map.setFilter(id, (filter ?? null) as Parameters<MLMap["setFilter"]>[1]);
    } catch {
      // Layer not present in the current style
    }
  }, [ready, map, id, filter]);

  // --- Update zoom range incrementally ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current || !map.getLayer(id)) return;
    try {
      map.setLayerZoomRange(id, minzoom ?? 0, maxzoom ?? 24);
    } catch {
      // Layer not present in the current style
    }
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
