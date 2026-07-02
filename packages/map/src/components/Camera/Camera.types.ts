import type { LngLat, LngLatBounds, ViewPadding } from "../../types/primitives";

// ── Camera viewport options ────────────────────────────────────────

export interface CameraOptions {
  zoom?: number;
  bearing?: number;
  pitch?: number;
  padding?: ViewPadding;
}

export type CameraEasing = undefined | "linear" | "ease" | "fly";

export interface CameraAnimationOptions {
  duration?: number;
  easing?: CameraEasing;
}

export interface CameraCenterOptions {
  center: LngLat;
}

export interface CameraBoundsOptions {
  bounds: LngLatBounds;
}

// ── Camera stops ───────────────────────────────────────────────────

export type CameraCenterStop = CameraOptions & CameraAnimationOptions & CameraCenterOptions;
export type CameraBoundsStop = CameraOptions & CameraAnimationOptions & CameraBoundsOptions;

export type CameraStop =
  | (CameraOptions & CameraAnimationOptions & { center?: never; bounds?: never })
  | CameraCenterStop
  | CameraBoundsStop;

export type InitialViewState =
  | (CameraOptions & { center?: never; bounds?: never })
  | (CameraOptions & CameraCenterOptions)
  | (CameraOptions & CameraBoundsOptions);

// ── User location tracking ─────────────────────────────────────────

export type TrackUserLocation = "default" | "heading" | "course";

export type TrackUserLocationChangeEvent = {
  trackUserLocation: TrackUserLocation | null;
};

// ── Camera ref ─────────────────────────────────────────────────────

export interface CameraRef {
  jumpTo(options: CameraCenterOptions & CameraOptions): void;
  easeTo(options: CameraCenterOptions & CameraOptions & CameraAnimationOptions): void;
  flyTo(options: CameraCenterOptions & CameraOptions & CameraAnimationOptions): void;
  fitBounds(bounds: LngLatBounds, options?: CameraOptions & CameraAnimationOptions): void;
  zoomTo(zoom: number, options?: CameraOptions & CameraAnimationOptions): void;
  setStop(stop: CameraStop): Promise<void>;
}

// ── Camera props ───────────────────────────────────────────────────

export type CameraProps = Partial<CameraStop> & {
  testID?: string;
  initialViewState?: InitialViewState;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: LngLatBounds;
  trackUserLocation?: TrackUserLocation;
  onTrackUserLocationChange?: (event: TrackUserLocationChangeEvent) => void;
};
