import { memo } from "react";

import { Layer } from "@maplibre/maplibre-react-native";

import { useNativeLayerProps } from "../layers/useNativeLayerProps";
import type { HeatmapLayerProps } from "./HeatmapLayer.types";

export const HeatmapLayer = memo(function HeatmapLayer(props: HeatmapLayerProps) {
  // Resolved + identity-stable, so upstream's `reactStyle` prop (and the native
  // layer behind it) only churns when the style actually changed.
  const layerProps = useNativeLayerProps("heatmap", props);

  return <Layer {...layerProps} />;
});
