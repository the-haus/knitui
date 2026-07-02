import type { LightSpecification } from "@maplibre/maplibre-gl-style-spec";

/** @deprecated Use the `light` prop on `Map` instead. */
export interface LightProps {
  style?: LightSpecification;
  testID?: string;
}
