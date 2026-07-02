import type { ReactNode } from "react";

import type { LngLat, PressEventWithFeatures } from "../../types/primitives";

export interface LayerAnnotationProps {
  id?: string;
  lngLat: LngLat;
  animated?: boolean;
  animationDuration?: number;
  animationEasingFunction?: (x: number) => number;
  onPress?: (event: PressEventWithFeatures) => void;
  children?: ReactNode;
  testID?: string;
}
