import type { ReactNode } from "react";

import type {
  FilterSpecification,
  GeoJSONSourceSpecification,
} from "@maplibre/maplibre-gl-style-spec";

import type { PressableSourceProps } from "../../types/primitives";

export interface GeoJSONSourceProps extends PressableSourceProps {
  id?: string;
  data: string | GeoJSON.GeoJSON;
  cluster?: boolean;
  clusterRadius?: number;
  clusterMinPoints?: number;
  clusterMaxZoom?: number;
  clusterProperties?: GeoJSONSourceSpecification["clusterProperties"];
  maxzoom?: number;
  buffer?: number;
  tolerance?: number;
  lineMetrics?: boolean;
  children?: ReactNode;
  testID?: string;
}

export interface GeoJSONSourceRef {
  getData(filter?: FilterSpecification): Promise<GeoJSON.FeatureCollection>;
  getClusterExpansionZoom(clusterId: number): Promise<number>;
  getClusterLeaves(clusterId: number, limit: number, offset: number): Promise<GeoJSON.Feature[]>;
  getClusterChildren(clusterId: number): Promise<GeoJSON.Feature[]>;
}
