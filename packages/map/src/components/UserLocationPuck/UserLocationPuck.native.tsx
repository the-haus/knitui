import React, { memo } from "react";

import type { UserLocationPuckProps } from "./UserLocationPuck.types";

let MapLibreUserLocationPuck: React.ComponentType<UserLocationPuckProps> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@maplibre/maplibre-react-native");
  MapLibreUserLocationPuck = mod.UserLocationPuck ?? null;
} catch {
  // Component not available
}

export const UserLocationPuck = memo(function UserLocationPuck(props: UserLocationPuckProps) {
  if (!MapLibreUserLocationPuck) {
    return null;
  }

  return <MapLibreUserLocationPuck {...props} />;
});
