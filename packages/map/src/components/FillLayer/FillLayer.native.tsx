import { memo } from "react";

import { Layer } from "@maplibre/maplibre-react-native";

import { useNativeLayerProps } from "../layers/useNativeLayerProps";
import type { FillLayerProps } from "./FillLayer.types";

export const FillLayer = memo(function FillLayer(props: FillLayerProps) {
  // Resolved + identity-stable, so upstream's `reactStyle` prop (and the native
  // layer behind it) only churns when the style actually changed.
  const layerProps = useNativeLayerProps("fill", props);

  return <Layer {...layerProps} />;
});
