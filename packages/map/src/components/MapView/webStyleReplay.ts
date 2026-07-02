/**
 * Web style replay — re-applies runtime images, sources, and layers
 * after a style reload (setStyle). Order: images → sources → layers,
 * matching the dependency chain.
 *
 * Internal to the web implementation. Not exported publicly.
 */
import type { Map as MLMap } from "maplibre-gl";

import type { ImageEntry, LayerEntry, Registry, SourceEntry } from "./MapView.registry";

export function replayStyleState(
  map: MLMap,
  images: Registry<ImageEntry>,
  sources: Registry<SourceEntry>,
  layers: Registry<LayerEntry>,
): void {
  // 1. Replay images first — layers may reference them (icon-image, etc.)
  for (const entry of images.values()) {
    if (!map.hasImage(entry.id)) {
      try {
        map.addImage(entry.id, entry.data as Parameters<MLMap["addImage"]>[1]);
      } catch {
        // Image may already exist or be invalid — skip silently
      }
    }
  }

  // 2. Replay sources — layers depend on sources
  for (const entry of sources.values()) {
    if (!map.getSource(entry.id)) {
      try {
        map.addSource(entry.id, entry.config as Parameters<MLMap["addSource"]>[1]);
      } catch {
        // Source may already exist or be invalid — skip silently
      }
    }
  }

  // 3. Replay layers in registration order
  for (const entry of layers.values()) {
    if (!map.getLayer(entry.id)) {
      try {
        const beforeId = resolveBeforeId(map, entry);
        map.addLayer(entry.config as Parameters<MLMap["addLayer"]>[0], beforeId);
      } catch {
        // Layer may already exist or be invalid — skip silently
      }
    }
  }
}

/**
 * Resolve the `beforeId` parameter for `map.addLayer()` based on
 * the layer entry's ordering hints.
 */
function resolveBeforeId(map: MLMap, entry: LayerEntry): string | undefined {
  // belowLayerID means "insert below this layer" → pass it as beforeId
  if (entry.belowLayerID) {
    return entry.belowLayerID;
  }

  // aboveLayerID means "insert above this layer" → find the next layer after it
  if (entry.aboveLayerID) {
    const style = map.getStyle();
    const layerIds = style.layers.map((l) => l.id);
    const idx = layerIds.indexOf(entry.aboveLayerID);
    if (idx >= 0 && idx + 1 < layerIds.length) {
      return layerIds[idx + 1];
    }
    return undefined; // above the last layer → append at top
  }

  // layerIndex — insert at a specific position in the current layer stack
  if (entry.layerIndex !== undefined) {
    const style = map.getStyle();
    const layerIds = style.layers.map((l) => l.id);
    if (entry.layerIndex < layerIds.length) {
      return layerIds[entry.layerIndex];
    }
    return undefined; // index beyond current count → append at top
  }

  return undefined; // no ordering hint → append at top
}
