import type { ReactNode } from "react";

import type { LngLat } from "../../types/primitives";

export interface ImageSourceProps {
  id?: string;
  url: string | number;
  coordinates: [topLeft: LngLat, topRight: LngLat, bottomRight: LngLat, bottomLeft: LngLat];
  children?: ReactNode;
  testID?: string;
}
