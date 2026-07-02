"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { CircleLayerProps } from "./CircleLayer.types";

export const CircleLayer = memo(function CircleLayer(props: CircleLayerProps) {
  useWebLayer("circle", props);
  return null;
});
