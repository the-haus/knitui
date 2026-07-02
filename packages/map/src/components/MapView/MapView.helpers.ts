import type { Feature, FeatureCollection, GeoJsonProperties, Position } from "geojson";

import type { LngLat, PressEvent, ViewState, ViewStateChangeEvent } from "../../types/primitives";
import { isPosition } from "../../utils";
import type { MapProps } from "./MapView.types";

// ── Press event builder ────────────────────────────────────────────

export function pressEvent(lngLat: LngLat, point: [number, number]): PressEvent {
  return { lngLat, point };
}

// ── ViewState event builder ────────────────────────────────────────

export function viewStateChangeEvent(
  viewState: ViewState,
  animated: boolean,
  userInteraction: boolean,
): ViewStateChangeEvent {
  return { ...viewState, animated, userInteraction };
}

// ── Legacy GeoJSON helpers (used by native adapter) ────────────────

export function pointFeature(coordinates: Position, properties?: GeoJsonProperties): Feature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [coordinates[0], coordinates[1]] },
    properties: properties ?? null,
  };
}

export function featureCollection(features: Feature[] = []): FeatureCollection {
  return { type: "FeatureCollection", features };
}

// ── Attribution check ──────────────────────────────────────────────

export function isAttributionEnabled(value: MapProps["attribution"]): boolean {
  return value !== false;
}

// ── Bounds parser (native event normalization) ─────────────────────

export function toVisibleBounds(value: unknown): [[number, number], [number, number]] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const northEast = value[0];
  const southWest = value[1];
  if (!isPosition(northEast) || !isPosition(southWest)) return null;
  return [
    [northEast[0], northEast[1]],
    [southWest[0], southWest[1]],
  ];
}
