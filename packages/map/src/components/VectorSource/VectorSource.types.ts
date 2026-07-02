import type { ReactNode } from "react";

import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";

import type { PressableSourceProps } from "../../types/primitives";

export interface VectorSourceProps extends PressableSourceProps {
  id?: string;
  url?: string;
  tiles?: string[];
  minzoom?: number;
  maxzoom?: number;
  scheme?: "xyz" | "tms";
  attribution?: string;
  children?: ReactNode;
  testID?: string;
}

export interface VectorSourceRef {
  querySourceFeatures(options: {
    sourceLayer: string;
    filter?: FilterSpecification;
  }): Promise<GeoJSON.Feature[]>;
}
