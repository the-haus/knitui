"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { BackgroundLayerProps } from "./BackgroundLayer.types";

export const BackgroundLayer = memo(function BackgroundLayer(props: BackgroundLayerProps) {
  useWebLayer("background", props);
  return null;
});
