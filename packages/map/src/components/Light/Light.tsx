"use client";

import { memo, useEffect } from "react";

import type { Map as MLMap } from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { LightProps } from "./Light.types";

export const Light = memo(function Light({ style }: LightProps) {
  const { mapEngine, ready } = useMapContext();
  const map = mapEngine as MLMap | null;

  useEffect(() => {
    if (!ready || !map || !style) return;
    map.setLight(style as Parameters<MLMap["setLight"]>[0]);
  }, [ready, map, style]);

  return null;
});
