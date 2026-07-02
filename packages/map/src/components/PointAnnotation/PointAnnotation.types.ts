import type { ReactElement } from "react";

import type { Anchor, LngLat, PixelPoint, PressEvent } from "../../types/primitives";

export type ViewAnnotationEvent = PressEvent & { id: string };

export type NativeViewAnnotationRef = unknown;

export interface ViewAnnotationRef {
  refresh(): void;
  getAnimatableRef(): NativeViewAnnotationRef | null;
}

export interface ViewAnnotationProps {
  id?: string;
  title?: string;
  snippet?: string;
  selected?: boolean;
  draggable?: boolean;
  lngLat: LngLat;
  anchor?: Anchor;
  offset?: PixelPoint;
  onPress?: (event: ViewAnnotationEvent) => void;
  onSelect?: (event: ViewAnnotationEvent) => void;
  onDeselect?: (event: ViewAnnotationEvent) => void;
  onDragStart?: (event: ViewAnnotationEvent) => void;
  onDragEnd?: (event: ViewAnnotationEvent) => void;
  onDrag?: (event: ViewAnnotationEvent) => void;
  style?: unknown;
  children: ReactElement | [ReactElement, ReactElement];
  testID?: string;
}
