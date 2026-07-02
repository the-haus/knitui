import React, { memo } from "react";

import { NativeUserLocation as MapLibreNativeUserLocation } from "@maplibre/maplibre-react-native";

import type { NativeUserLocationProps } from "./NativeUserLocation.types";

export const NativeUserLocation = memo(function NativeUserLocation({
  mode,
  androidPreferredFramesPerSecond,
}: NativeUserLocationProps) {
  return (
    <MapLibreNativeUserLocation
      mode={mode}
      androidPreferredFramesPerSecond={androidPreferredFramesPerSecond}
    />
  );
});
