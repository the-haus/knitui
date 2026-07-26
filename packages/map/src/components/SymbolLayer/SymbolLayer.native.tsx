import { memo } from "react";

import { Layer } from "@maplibre/maplibre-react-native";

import { useNativeLayerProps } from "../layers/useNativeLayerProps";
import type { SymbolLayerProps } from "./SymbolLayer.types";

export const SymbolLayer = memo(function SymbolLayer(props: SymbolLayerProps) {
  // Resolved + identity-stable, so upstream's `reactStyle` prop (and the native
  // layer behind it) only churns when the style actually changed.
  const layerProps = useNativeLayerProps("symbol", props);

  return <Layer {...layerProps} />;
});
