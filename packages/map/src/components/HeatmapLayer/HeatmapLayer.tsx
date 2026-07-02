"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { HeatmapLayerProps } from "./HeatmapLayer.types";

export const HeatmapLayer = memo(function HeatmapLayer(props: HeatmapLayerProps) {
  useWebLayer("heatmap", props);
  return null;
});
