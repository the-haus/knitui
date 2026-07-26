import { memo } from "react";

import { Layer } from "@maplibre/maplibre-react-native";

import { useNativeLayerProps } from "../layers/useNativeLayerProps";
import type { CircleLayerProps } from "./CircleLayer.types";

export const CircleLayer = memo(function CircleLayer(props: CircleLayerProps) {
  // Resolved + identity-stable, so upstream's `reactStyle` prop (and the native
  // layer behind it) only churns when the style actually changed.
  const layerProps = useNativeLayerProps("circle", props);

  return <Layer {...layerProps} />;
});
