import { memo } from "react";

import { Layer, type LayerProps } from "@maplibre/maplibre-react-native";

import { resolvePaintLayout } from "../layers/resolvePaintLayout";
import type { BackgroundLayerProps } from "./BackgroundLayer.types";

export const BackgroundLayer = memo(function BackgroundLayer(props: BackgroundLayerProps) {
  const { paint, layout } = resolvePaintLayout(props.style, props.paint, props.layout);

  const layerProps = {
    type: "background" as const,
    id: props.id,
    beforeId: props.beforeId,
    afterId: props.afterId,
    layerIndex: props.layerIndex,
    minzoom: props.minzoom,
    maxzoom: props.maxzoom,
    ...(paint ? { paint } : {}),
    ...(layout ? { layout } : {}),
  } as LayerProps;

  return <Layer {...layerProps} />;
});
