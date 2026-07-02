"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { RasterLayerProps } from "./RasterLayer.types";

export const RasterLayer = memo(function RasterLayer(props: RasterLayerProps) {
  useWebLayer("raster", props);
  return null;
});
