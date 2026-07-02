// ── Core ───────────────────────────────────────────────────────────

export { LayerAnnotation } from "./components/Annotation";
export type { LayerAnnotationProps } from "./components/Annotation";

export * from "./components/BackgroundLayer";
export { Callout } from "./components/Callout";

// ── Sources ────────────────────────────────────────────────────────

export type { CalloutProps } from "./components/Callout";
export { Camera } from "./components/Camera";

export type {
  CameraAnimationOptions,
  CameraBoundsOptions,
  CameraBoundsStop,
  CameraCenterOptions,
  CameraCenterStop,
  CameraEasing,
  CameraOptions,
  CameraProps,
  CameraRef,
  CameraStop,
  InitialViewState,
  TrackUserLocation,
  TrackUserLocationChangeEvent,
} from "./components/Camera";
export * from "./components/CircleLayer";

export * from "./components/FillExtrusionLayer";
export * from "./components/FillLayer";

export * from "./components/HeatmapLayer";
export { Images } from "./components/Images";

// ── Layers (individual — deprecated, prefer unified Layer) ─────────

export type { ImageEntry, ImageSourceWithSdf, ImagesProps } from "./components/Images";
// ImageSource: not exported as a runtime value (same reason as VectorSource).
export type { ImageSourceProps } from "./components/ImageSource";
export type { BaseLayerProps } from "./components/layers/BaseLayer.types";
export * from "./components/LineLayer";
export { Map } from "./components/MapView";
export type {
  AttributionControlOptions,
  LngLat,
  LngLatBounds,
  MapProps,
  MapRef,
  OrnamentViewPosition,
  PixelPoint,
  PixelPointBounds,
  PlatformProps,
  PressEvent,
  PressEventWithFeatures,
  QueryRenderedFeaturesOptions,
  ViewPadding,
  ViewState,
  ViewStateChangeEvent,
} from "./components/MapView";
export { Marker } from "./components/MarkerView";

// ── Images ─────────────────────────────────────────────────────────

export type { MarkerEvent, MarkerProps, MarkerRef, NativeMarkerRef } from "./components/MarkerView";
export { NativeUserLocation } from "./components/NativeUserLocation";

// ── Annotations ────────────────────────────────────────────────────

export type { NativeUserLocationProps } from "./components/NativeUserLocation";
export { ViewAnnotation } from "./components/PointAnnotation";

export type {
  NativeViewAnnotationRef,
  ViewAnnotationEvent,
  ViewAnnotationProps,
  ViewAnnotationRef,
} from "./components/PointAnnotation";
export * from "./components/RasterLayer";

// RasterSource: not exported as a runtime value (same reason as VectorSource).
export type { RasterSourceProps } from "./components/RasterSource";

export { GeoJSONSource } from "./components/ShapeSource";
export type { GeoJSONSourceProps, GeoJSONSourceRef } from "./components/ShapeSource";

// ── SVG icons ──────────────────────────────────────────────────────

export { SvgImage } from "./components/SvgImage";
export type { SvgImageProps } from "./components/SvgImage";
export * from "./components/SymbolLayer";
export { UserLocation } from "./components/UserLocation";

// ── User location ──────────────────────────────────────────────────

export type { UserLocationProps } from "./components/UserLocation";
export type { VectorSourceProps, VectorSourceRef } from "./components/VectorSource";

export * from "./styles";
// VectorSource: not exported as a runtime value to avoid eager native-component
// registration on platforms that don't use it. Import directly from
// "@knitui/map/src/components/VectorSource" if needed.

// ── Styles ─────────────────────────────────────────────────────────

export { svgToImageDataUri } from "./svg";

// ── Layer style types ──────────────────────────────────────────────

export type { SvgToImageOptions } from "./svg";

// ── Primitives ─────────────────────────────────────────────────────

export type {
  BackgroundLayerStyle,
  CircleLayerStyle,
  Expression,
  ExpressionField,
  ExpressionName,
  FillExtrusionLayerStyle,
  FillLayerStyle,
  HeatmapLayerStyle,
  HillshadeLayerStyle,
  LightLayerStyle,
  LineLayerStyle,
  RasterLayerStyle,
  SymbolLayerStyle,
  Transition,
} from "./types/LayerStyles";

// ── Base layer types ───────────────────────────────────────────────

export type { Anchor, PressableSourceProps } from "./types/primitives";
