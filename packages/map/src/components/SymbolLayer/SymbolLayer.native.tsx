import { memo } from "react";

import { Layer, type LayerProps } from "@maplibre/maplibre-react-native";

import { resolvePaintLayout } from "../layers/resolvePaintLayout";
import type { SymbolLayerProps } from "./SymbolLayer.types";

export const SymbolLayer = memo(function SymbolLayer(props: SymbolLayerProps) {
  const { paint, layout } = resolvePaintLayout(props.style, props.paint, props.layout);

  const layerProps = {
    type: "symbol" as const,
    id: props.id,
    source: props.source,
    "source-layer": props.sourceLayer ?? props["source-layer"],
    beforeId: props.beforeId,
    afterId: props.afterId,
    layerIndex: props.layerIndex,
    minzoom: props.minzoom,
    maxzoom: props.maxzoom,
    filter: props.filter,
    ...(paint ? { paint } : {}),
    ...(layout ? { layout } : {}),
  } as LayerProps;

  return <Layer {...layerProps} />;
});
