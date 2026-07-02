import type { ReactElement } from "react";

import type { Anchor, LngLat, PixelPoint, PressEvent } from "../../types/primitives";

export type MarkerEvent = PressEvent & { id: string };

export interface MarkerRef {
  getAnimatableRef(): unknown | null;
}

export type NativeMarkerRef = unknown;

export interface MarkerProps {
  id?: string;
  lngLat: LngLat;
  anchor?: Anchor;
  offset?: PixelPoint;
  selected?: boolean;
  onPress?: (event: MarkerEvent) => void;
  children: ReactElement;
  testID?: string;
  style?: unknown;
}
