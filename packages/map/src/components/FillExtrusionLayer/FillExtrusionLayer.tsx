"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { FillExtrusionLayerProps } from "./FillExtrusionLayer.types";

export const FillExtrusionLayer = memo(function FillExtrusionLayer(props: FillExtrusionLayerProps) {
  useWebLayer("fill-extrusion", props);
  return null;
});
