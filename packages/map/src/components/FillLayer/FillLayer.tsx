"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { FillLayerProps } from "./FillLayer.types";

export const FillLayer = memo(function FillLayer(props: FillLayerProps) {
  useWebLayer("fill", props);
  return null;
});
