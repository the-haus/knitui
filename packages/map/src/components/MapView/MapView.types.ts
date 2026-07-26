import type { ReactNode } from "react";

import type { LightSpecification, StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

import type {
  LngLat,
  LngLatBounds,
  OrnamentViewPosition,
  PixelPoint,
  PixelPointBounds,
  PressEvent,
  PressEventWithFeatures,
  QueryRenderedFeaturesOptions,
  ViewPadding,
  ViewState,
  ViewStateChangeEvent,
} from "../../types/primitives";

// Re-exports for consumer convenience
export type {
  LngLat,
  LngLatBounds,
  OrnamentViewPosition,
  PixelPoint,
  PixelPointBounds,
  PressEvent,
  PressEventWithFeatures,
  QueryRenderedFeaturesOptions,
  ViewPadding,
  ViewState,
  ViewStateChangeEvent,
};

// ── Web-only attribution fine-tuning ───────────────────────────────

export type AttributionControlOptions = {
  compact?: boolean;
  customAttribution?: string | string[];
};

// ── Platform escape hatch ──────────────────────────────────────────

export interface PlatformProps {
  web?: Record<string, unknown>;
  native?: Record<string, unknown>;
}

// ── MapRef ─────────────────────────────────────────────────────────

export interface MapRef {
  getCenter(): Promise<LngLat>;
  getZoom(): Promise<number>;
  getBearing(): Promise<number>;
  getPitch(): Promise<number>;
  getBounds(): Promise<LngLatBounds>;
  getViewState(): Promise<ViewState>;
  project(lngLat: LngLat): Promise<PixelPoint>;
  unproject(point: PixelPoint): Promise<LngLat>;

  queryRenderedFeatures(
    pixelPoint: PixelPoint,
    options?: QueryRenderedFeaturesOptions,
  ): Promise<GeoJSON.Feature[]>;
  queryRenderedFeatures(
    pixelPointBounds: PixelPointBounds,
    options?: QueryRenderedFeaturesOptions,
  ): Promise<GeoJSON.Feature[]>;
  queryRenderedFeatures(options?: QueryRenderedFeaturesOptions): Promise<GeoJSON.Feature[]>;

  createStaticMapImage(options: { output: "base64" | "file" }): Promise<string>;
  setSourceVisibility(visible: boolean, source: string, sourceLayer?: string): Promise<void>;
  showAttribution(): Promise<void>;
}

// ── MapProps ────────────────────────────────────────────────────────

export interface MapProps {
  style?: unknown;
  className?: string;
  children?: ReactNode;
  testID?: string;

  /** MapLibre style URL or JSON. Required. */
  mapStyle: string | StyleSpecification;

  /** Light properties for extruded geometries. */
  light?: LightSpecification;

  /** Distance from view edges to logical viewport. */
  contentInset?: ViewPadding;

  /** iOS: adaptive FPS. Android: max FPS. */
  preferredFramesPerSecond?: number;

  // Gestures
  dragPan?: boolean;
  touchZoom?: boolean;
  doubleTapZoom?: boolean;
  doubleTapHoldZoom?: boolean;
  touchRotate?: boolean;
  touchPitch?: boolean;

  // UI controls
  tintColor?: string;
  attribution?: boolean | AttributionControlOptions;
  attributionPosition?: OrnamentViewPosition;
  logo?: boolean;
  logoPosition?: OrnamentViewPosition;
  compass?: boolean;
  compassPosition?: OrnamentViewPosition;
  compassHiddenFacingNorth?: boolean;
  scaleBar?: boolean;
  scaleBarPosition?: OrnamentViewPosition;

  /** Android rendering mode. */
  androidView?: "surface" | "texture";

  // Press events
  onPress?: (event: PressEvent | PressEventWithFeatures) => void;
  onLongPress?: (event: PressEvent) => void;

  // Region events

  /** Fires once per gesture, when the viewport starts changing. */
  onRegionWillChange?: (event: ViewStateChangeEvent) => void;

  /**
   * Fires continuously while the viewport changes, throttled to ~32 ms (≈30×/s).
   *
   * **Do not `setState` from this handler unthrottled.** Every state update
   * re-renders the whole map subtree, and a re-render is the amplifier for the
   * expensive work in the children: `GeoJSONSource` re-serializes its
   * FeatureCollection on native, and layers re-resolve their paint/layout. Those
   * paths are memoized on their inputs, so a re-render is cheap only as long as
   * the props you hand them keep their value — pass stable `data`/`style`/`filter`
   * objects (`useMemo`) if you re-render during a gesture at all. Prefer keeping
   * live viewport values in a ref, or debouncing to `onRegionDidChange`.
   */
  onRegionIsChanging?: (event: ViewStateChangeEvent) => void;

  /** Fires once, after the viewport settles. The right place for `setState`. */
  onRegionDidChange?: (event: ViewStateChangeEvent) => void;

  // Loading events
  onWillStartLoadingMap?: () => void;
  onDidFinishLoadingMap?: () => void;
  onDidFailLoadingMap?: () => void;

  // Rendering events
  onWillStartRenderingFrame?: () => void;
  onDidFinishRenderingFrame?: () => void;
  onDidFinishRenderingFrameFully?: () => void;
  onWillStartRenderingMap?: () => void;
  onDidFinishRenderingMap?: () => void;
  onDidFinishRenderingMapFully?: () => void;

  // Style events
  onDidFinishLoadingStyle?: () => void;

  // Platform escape hatch (web/native specific raw props)
  platformProps?: PlatformProps;
}
