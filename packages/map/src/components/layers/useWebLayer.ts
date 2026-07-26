/**
 * Shared hook for managing a maplibre-gl layer on web.
 * Handles add, update, and remove lifecycle via map context.
 */
import { useEffect, useMemo, useRef } from "react";

import type { Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { BaseLayerProps } from "./BaseLayer.types";
import { type PaintLayout, resolvePaintLayout } from "./resolvePaintLayout";
import { styleValueEquals, useStableStyleValue } from "./styleIdentity";

/** Props accepted by useWebLayer — style is typed as `object` to accept any layer style interface. */
interface WebLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: object;
}

/** Sentinel for "no filter has been pushed to this layer yet". */
const FILTER_NOT_APPLIED = Symbol("filter-not-applied");

let _layerIdCounter = 0;

export function useWebLayer(layerType: string, props: WebLayerProps) {
  const { mapEngine, ready, registerLayer, unregisterLayer } = useMapContext();
  const map = mapEngine as MLMap | null;
  const addedRef = useRef(false);
  const generatedIdRef = useRef<string | null>(null);
  // The paint/layout actually pushed to the layer, so we can (a) reset keys that
  // were dropped between renders and (b) skip keys whose value didn't change.
  const appliedRef = useRef<PaintLayout>({});
  // The filter last pushed to the layer (`FILTER_NOT_APPLIED` until the layer is
  // added). See the filter effect for why "absent" must not become `null`.
  const appliedFilterRef = useRef<unknown>(FILTER_NOT_APPLIED);

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
  } = props;

  // The public API is a camelCase `style` object (plus spec-shaped
  // `paint`/`layout`/`filter`) and every call site writes it inline, so these all
  // have a fresh identity on every render. Stabilize them structurally first —
  // otherwise every effect below is keyed on "changed" and fires every render.
  const filter = useStableStyleValue(props.filter);
  const paint = useStableStyleValue(props.paint);
  const layout = useStableStyleValue(props.layout);
  const style = useStableStyleValue(props.style);

  // Resolve id — generate a stable one if not provided
  if (!rawId && !generatedIdRef.current) {
    generatedIdRef.current = `_layer_${layerType}_${++_layerIdCounter}`;
  }
  const id = rawId ?? generatedIdRef.current!;

  // Resolve source-layer from either prop name
  const resolvedSourceLayer = sourceLayer ?? sourceLayerAlt;

  // Spec-shaped paint/layout, resolved once per real style change rather than on
  // every render (it copies both buckets and regexes every `style` key).
  const resolved = useMemo(() => resolvePaintLayout(style, paint, layout), [style, paint, layout]);

  // Freshest add-config + ordering, in a ref so a re-add (source recreated, or
  // style replay) uses CURRENT props, never the values captured at mount.
  const layerConfig = useMemo(
    () =>
      buildLayerConfig(
        layerType,
        id,
        source,
        resolvedSourceLayer,
        minzoom,
        maxzoom,
        filter,
        resolved,
      ),
    [layerType, id, source, resolvedSourceLayer, minzoom, maxzoom, filter, resolved],
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

    // Seed the applied-state trackers from the paint/layout/filter baked into the
    // config we just added. Without this, a key present in the initial add-config
    // (the layer is added with `paint`/`layout` inline) is invisible to the update
    // effect's reset loop — so dropping it later would never revert it to the
    // spec default — and the update effects would redundantly re-push every value
    // the layer was just created with. Runs at add time because the update effects
    // bail while `addedRef` is still false (the layer is added via the sourcedata
    // self-heal after the source appears, i.e. after they already ran).
    const seedAppliedState = (): void => {
      const cfg = configRef.current.config;
      appliedRef.current = {
        paint: cfg.paint as Record<string, unknown> | undefined,
        layout: cfg.layout as Record<string, unknown> | undefined,
      };
      appliedFilterRef.current = cfg.filter;
    };

    const addLayer = (): boolean => {
      try {
        if (map.getLayer(id)) {
          // Already present (e.g. left by a style replay / duplicate id) — mark
          // added so the paint/filter/zoom update effects don't short-circuit.
          addedRef.current = true;
          seedAppliedState();
          return true;
        }

        // If the layer has a source, wait for it to exist
        if (source && !map.getSource(source)) return false;

        const { config, afterId: a, beforeId: b, layerIndex: li } = configRef.current;
        const resolvedBeforeId = resolveBeforeId(map, b, a, li);
        map.addLayer(config as Parameters<MLMap["addLayer"]>[0], resolvedBeforeId);
        addedRef.current = true;
        seedAppliedState();
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
    layerConfig,
    afterId,
    beforeId,
    layerIndex,
    registerLayer,
  ]);

  // --- Update paint/layout properties incrementally ---
  // Diffed HERE, before calling into maplibre. maplibre does guard
  // `setPaintProperty`/`setLayoutProperty` with `deepEqual`, but only after
  // `_checkLoaded()`, `getLayer()` and `layer.getPaintProperty(name)` — and that
  // last one is `clone(this._values[name].value.value)`. So letting maplibre do
  // the diffing costs a deep CLONE plus a deep COMPARE of the whole expression
  // tree per property; a `["step", ["get","point_count"], …]` or a 200-branch
  // `["match", …]` `icon-image` paid that on every render.
  useEffect(() => {
    if (!ready || !map || !addedRef.current || !map.getLayer(id)) return;

    const { paint: resolvedPaint, layout: resolvedLayout } = resolved;
    const { paint: appliedPaint, layout: appliedLayout } = appliedRef.current;

    // Reset paint keys that were set previously but are gone now (undefined =
    // revert to the spec default), then apply the ones that actually changed.
    if (appliedPaint) {
      for (const prevKey of Object.keys(appliedPaint)) {
        if (!resolvedPaint || !(prevKey in resolvedPaint)) {
          try {
            map.setPaintProperty(id, prevKey, undefined);
          } catch {
            // Property not recognized for this layer type
          }
        }
      }
    }
    if (resolvedPaint) {
      for (const [prop, value] of Object.entries(resolvedPaint)) {
        if (appliedPaint && prop in appliedPaint && styleValueEquals(appliedPaint[prop], value)) {
          continue;
        }
        try {
          map.setPaintProperty(id, prop, value);
        } catch {
          // Property not recognized for this layer type
        }
      }
    }

    if (appliedLayout) {
      for (const prevKey of Object.keys(appliedLayout)) {
        if (!resolvedLayout || !(prevKey in resolvedLayout)) {
          try {
            map.setLayoutProperty(id, prevKey, undefined);
          } catch {
            // Property not recognized for this layer type
          }
        }
      }
    }
    if (resolvedLayout) {
      for (const [prop, value] of Object.entries(resolvedLayout)) {
        if (
          appliedLayout &&
          prop in appliedLayout &&
          styleValueEquals(appliedLayout[prop], value)
        ) {
          continue;
        }
        try {
          map.setLayoutProperty(id, prop, value);
        } catch {
          // Property not recognized for this layer type
        }
      }
    }

    appliedRef.current = { paint: resolvedPaint, layout: resolvedLayout };
  }, [ready, map, id, resolved]);

  // --- Update filter incrementally ---
  useEffect(() => {
    if (!ready || !map || !addedRef.current || !map.getLayer(id)) return;

    const applied = appliedFilterRef.current;

    // A filterless layer must never call setFilter. maplibre's guard is
    // `deepEqual(layer.filter, filter)`; `layer.filter` is `undefined`, and
    // `deepEqual` bottoms out at `a === b`, so passing `null` compares FALSE and
    // takes the `filter == null` branch: `layer.setFilter(undefined)` +
    // `_updateLayer(layer)`, which sets `_updatedSources[source] = 'reload'` and
    // calls `tileManager.pause()`. That re-requests and re-tessellates the whole
    // source's tiles immediately after the layer is added — 3× over for the
    // 3-layer clustered pattern, showing up as a slow first paint plus a flash of
    // missing markers.
    if (applied === FILTER_NOT_APPLIED ? filter == null : styleValueEquals(applied, filter)) {
      appliedFilterRef.current = filter;
      return;
    }

    // Guard + try/catch: after a `setStyle` reload the layer can be gone while
    // `addedRef` is still true (cleanup doesn't run on style swap), and
    // `setFilter` throws "no layer with ID" — mirror the paint effect's safety.
    try {
      // `undefined`, never `null`, when clearing — see above.
      map.setFilter(id, filter as Parameters<MLMap["setFilter"]>[1]);
      appliedFilterRef.current = filter;
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
  id: string | undefined,
  source: string | undefined,
  sourceLayer: string | undefined,
  minzoom: number | undefined,
  maxzoom: number | undefined,
  filter: unknown,
  resolved: PaintLayout,
): Record<string, unknown> {
  const layerConfig: Record<string, unknown> = { id, type: layerType };

  if (source) layerConfig.source = source;
  if (sourceLayer) layerConfig["source-layer"] = sourceLayer;
  if (minzoom !== undefined) layerConfig.minzoom = minzoom;
  if (maxzoom !== undefined) layerConfig.maxzoom = maxzoom;
  if (filter) layerConfig.filter = filter;

  if (resolved.paint) layerConfig.paint = resolved.paint;
  if (resolved.layout) layerConfig.layout = resolved.layout;

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
