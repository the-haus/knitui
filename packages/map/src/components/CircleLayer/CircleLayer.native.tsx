import { memo } from "react";

import { Layer, type LayerProps } from "@maplibre/maplibre-react-native";

import { resolvePaintLayout } from "../layers/resolvePaintLayout";
import type { CircleLayerProps } from "./CircleLayer.types";

export const CircleLayer = memo(function CircleLayer(props: CircleLayerProps) {
  // Normalize the (deprecated) camelCase `style` prop into spec-shaped
  // paint/layout so upstream never sees `style` (it warns / removes in v12).
  const { paint, layout } = resolvePaintLayout(props.style, props.paint, props.layout);

  const layerProps = {
    type: "circle" as const,
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
