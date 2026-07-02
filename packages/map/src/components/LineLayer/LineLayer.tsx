"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { LineLayerProps } from "./LineLayer.types";

export const LineLayer = memo(function LineLayer(props: LineLayerProps) {
  useWebLayer("line", props);
  return null;
});
