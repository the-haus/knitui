import { memo } from "react";

import { Layer } from "@maplibre/maplibre-react-native";

import { useNativeLayerProps } from "../layers/useNativeLayerProps";
import type { BackgroundLayerProps } from "./BackgroundLayer.types";

export const BackgroundLayer = memo(function BackgroundLayer(props: BackgroundLayerProps) {
  // `background` binds to no source, so `source`/`source-layer`/`filter` are
  // omitted entirely (the last arg) rather than forwarded as `undefined`.
  const layerProps = useNativeLayerProps("background", props, false);

  return <Layer {...layerProps} />;
});
