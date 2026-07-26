import { memo } from "react";

import { Layer } from "@maplibre/maplibre-react-native";

import { useNativeLayerProps } from "../layers/useNativeLayerProps";
import type { FillExtrusionLayerProps } from "./FillExtrusionLayer.types";

export const FillExtrusionLayer = memo(function FillExtrusionLayer(props: FillExtrusionLayerProps) {
  // Resolved + identity-stable, so upstream's `reactStyle` prop (and the native
  // layer behind it) only churns when the style actually changed.
  const layerProps = useNativeLayerProps("fill-extrusion", props);

  return <Layer {...layerProps} />;
});
