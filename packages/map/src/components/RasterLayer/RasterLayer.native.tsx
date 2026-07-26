import { memo } from "react";

import { Layer } from "@maplibre/maplibre-react-native";

import { useNativeLayerProps } from "../layers/useNativeLayerProps";
import type { RasterLayerProps } from "./RasterLayer.types";

export const RasterLayer = memo(function RasterLayer(props: RasterLayerProps) {
  // Resolved + identity-stable, so upstream's `reactStyle` prop (and the native
  // layer behind it) only churns when the style actually changed.
  const layerProps = useNativeLayerProps("raster", props);

  return <Layer {...layerProps} />;
});
