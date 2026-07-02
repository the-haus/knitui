import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";

export interface BaseLayerProps {
  id?: string;
  source?: string;
  sourceLayer?: string;
  "source-layer"?: string;
  beforeId?: string;
  afterId?: string;
  layerIndex?: number;
  minzoom?: number;
  maxzoom?: number;
  filter?: FilterSpecification;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  /** @deprecated Use `paint`/`layout` instead. Will be removed in v12. */
  style?: never;
  testID?: string;
}
