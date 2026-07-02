import { useCallback, useRef } from "react";

import type { MapContextValue } from "./MapView.context";
import { type ImageEntry, type LayerEntry, Registry, type SourceEntry } from "./MapView.registry";

/**
 * Internal hook that creates and manages source/layer/image registries
 * and the interactive source set. Returns stable registration callbacks
 * suitable for the MapContextValue.
 */
export function useMapRegistries() {
  const sources = useRef(new Registry<SourceEntry>()).current;
  const layers = useRef(new Registry<LayerEntry>()).current;
  const images = useRef(new Registry<ImageEntry>()).current;
  const interactiveSources = useRef(new Set<string>()).current;

  const registerSource = useCallback<MapContextValue["registerSource"]>(
    (entry) => sources.set(entry),
    [sources],
  );

  const unregisterSource = useCallback<MapContextValue["unregisterSource"]>(
    (id) => {
      sources.delete(id);
    },
    [sources],
  );

  const registerLayer = useCallback<MapContextValue["registerLayer"]>(
    (entry) => layers.set(entry),
    [layers],
  );

  const unregisterLayer = useCallback<MapContextValue["unregisterLayer"]>(
    (id) => {
      layers.delete(id);
    },
    [layers],
  );

  const registerImage = useCallback<MapContextValue["registerImage"]>(
    (entry) => images.set(entry),
    [images],
  );

  const unregisterImage = useCallback<MapContextValue["unregisterImage"]>(
    (id) => {
      images.delete(id);
    },
    [images],
  );

  const registerInteractiveSource = useCallback(
    (sourceId: string) => {
      interactiveSources.add(sourceId);
    },
    [interactiveSources],
  );

  const unregisterInteractiveSource = useCallback(
    (sourceId: string) => {
      interactiveSources.delete(sourceId);
    },
    [interactiveSources],
  );

  return {
    sources,
    layers,
    images,
    interactiveSources,
    registrations: {
      registerSource,
      unregisterSource,
      registerLayer,
      unregisterLayer,
      registerImage,
      unregisterImage,
      registerInteractiveSource,
      unregisterInteractiveSource,
    },
  };
}
