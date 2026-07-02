/**
 * Cross-platform primitive types matching maplibre-react-native v11 beta.
 * These are the canonical geometry/event types for the @knitui/map package.
 */

import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";

/** Geographic coordinates as [longitude, latitude]. */
export type LngLat = [longitude: number, latitude: number];

/**
 * Bounds in geographic coordinates.
 * Uses order of south-west and north-east corners in flat style per GeoJSON RFC.
 */
export type LngLatBounds = [west: number, south: number, east: number, north: number];

/** Pixel coordinates as [x, y]. */
export type PixelPoint = [x: number, y: number];

/**
 * Bounds in pixel coordinates.
 * Uses common order of top-left and bottom-right corners.
 */
export type PixelPointBounds = [
  topLeft: [left: number, top: number],
  bottomRight: [right: number, bottom: number],
];

/** Pixel insets used for view padding. */
export type ViewPadding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

/**
 * Position anchor for markers and annotations.
 * Follows MapLibre GL JS PositionAnchor format.
 */
export type Anchor =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Converts an Anchor string to native {x, y} format. */
export function anchorToNative(anchor: Anchor): { x: number; y: number } {
  switch (anchor) {
    case "center":
      return { x: 0.5, y: 0.5 };
    case "top":
      return { x: 0.5, y: 0 };
    case "bottom":
      return { x: 0.5, y: 1 };
    case "left":
      return { x: 0, y: 0.5 };
    case "right":
      return { x: 1, y: 0.5 };
    case "top-left":
      return { x: 0, y: 0 };
    case "top-right":
      return { x: 1, y: 0 };
    case "bottom-left":
      return { x: 0, y: 1 };
    case "bottom-right":
      return { x: 1, y: 1 };
  }
}

/** Event data for map press interactions. */
export interface PressEvent {
  /** Geographic coordinates of the touch/click event. */
  lngLat: LngLat;
  /** Pixel point of the event within the viewport. */
  point: PixelPoint;
}

/** Press event data enriched with GeoJSON features at the pressed location. */
export interface PressEventWithFeatures extends PressEvent {
  features: GeoJSON.Feature[];
}

/** Current viewport state of the map. */
export type ViewState = {
  center: LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
  bounds: LngLatBounds;
};

/** Event emitted when the map viewport changes (pan, zoom, rotate, pitch). */
export type ViewStateChangeEvent = ViewState & {
  animated: boolean;
  userInteraction: boolean;
};

/**
 * Screen position for map ornaments (logo, compass, scale bar).
 * Exactly one of top/bottom and one of left/right must be provided.
 */
export type OrnamentViewPosition =
  | { top: number; left: number }
  | { top: number; right: number }
  | { bottom: number; right: number }
  | { bottom: number; left: number };

/** Options for querying rendered features. */
export type QueryRenderedFeaturesOptions = {
  /** Filter expression to filter the queried features. */
  filter?: FilterSpecification;
  /** IDs of layers to query features from. */
  layers?: string[];
};

/** Props shared by source components that support press interactions. */
export interface PressableSourceProps {
  /** Called when a child Layer within the hitbox has highest z-index. */
  onPress?: (event: PressEventWithFeatures) => void;
  /** Overrides the default touch hitbox for the source layers. */
  hitbox?: ViewPadding;
}
