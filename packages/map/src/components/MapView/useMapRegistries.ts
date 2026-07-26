import { useCallback, useMemo, useRef } from "react";

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

  /**
   * Bumped on every registry mutation. Lets hot paths (notably the web hover
   * hit-test, which needs "the layer ids bound to an interactive source") cache a
   * derived answer and recompute it only when something actually changed —
   * instead of deriving it from `map.getStyle()`, which deep-clones the entire
   * style, on every pointer move.
   */
  const revision = useRef(0);
  const bump = useCallback((): void => {
    revision.current += 1;
  }, []);

  const registerSource = useCallback<MapContextValue["registerSource"]>(
    (entry) => {
      sources.set(entry);
      bump();
    },
    [sources, bump],
  );

  const unregisterSource = useCallback<MapContextValue["unregisterSource"]>(
    (id) => {
      sources.delete(id);
      bump();
    },
    [sources, bump],
  );

  const registerLayer = useCallback<MapContextValue["registerLayer"]>(
    (entry) => {
      layers.set(entry);
      bump();
    },
    [layers, bump],
  );

  const unregisterLayer = useCallback<MapContextValue["unregisterLayer"]>(
    (id) => {
      layers.delete(id);
      bump();
    },
    [layers, bump],
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
      bump();
    },
    [interactiveSources, bump],
  );

  const unregisterInteractiveSource = useCallback(
    (sourceId: string) => {
      interactiveSources.delete(sourceId);
      bump();
    },
    [interactiveSources, bump],
  );

  /**
   * Memoized as a whole, not just per callback — load-bearing.
   *
   * `MapView` spreads `registrations` into the `MapContextValue` it publishes and
   * memoizes that value on `[ready, registrations, rasterizer]`. A fresh object
   * literal here would make that memo unable to hold, so EVERY MapView render
   * (region events fire up to ~30×/s while the map moves) would publish a new
   * context value and re-render every `ShapeSource` / `*Layer` / `Camera` /
   * `SvgImage` consumer in the tree.
   *
   * Every dependency below is itself stable for the life of the hook: the four
   * `Registry` instances and the `Set` come from `useRef(...).current`, and `bump`
   * is a `useCallback` with an empty dep array — so this object is created once.
   */
  const registrations = useMemo(
    () => ({
      registerSource,
      unregisterSource,
      registerLayer,
      unregisterLayer,
      registerImage,
      unregisterImage,
      registerInteractiveSource,
      unregisterInteractiveSource,
    }),
    [
      registerSource,
      unregisterSource,
      registerLayer,
      unregisterLayer,
      registerImage,
      unregisterImage,
      registerInteractiveSource,
      unregisterInteractiveSource,
    ],
  );

  return {
    sources,
    layers,
    images,
    interactiveSources,
    revision,
    registrations,
  };
}
