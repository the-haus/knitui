"use client";

import { memo } from "react";

import { useWebLayer } from "../layers/useWebLayer";
import type { SymbolLayerProps } from "./SymbolLayer.types";

export const SymbolLayer = memo(function SymbolLayer(props: SymbolLayerProps) {
  useWebLayer("symbol", props);
  return null;
});
