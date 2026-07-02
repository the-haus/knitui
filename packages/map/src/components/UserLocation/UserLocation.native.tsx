import React, { memo } from "react";

import { UserLocation as MapLibreUserLocation } from "@maplibre/maplibre-react-native";

import type { UserLocationProps } from "./UserLocation.types";

export const UserLocation = memo(function UserLocation({
  animated,
  accuracy,
  heading,
  minDisplacement,
  onPress,
  children,
}: UserLocationProps) {
  return (
    <MapLibreUserLocation
      animated={animated}
      accuracy={accuracy}
      heading={heading}
      minDisplacement={minDisplacement}
      onPress={onPress}
    >
      {children}
    </MapLibreUserLocation>
  );
});
