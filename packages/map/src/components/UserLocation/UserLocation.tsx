"use client";

import React, { memo, useEffect, useRef } from "react";

import type { Map as MLMap } from "maplibre-gl";
import maplibregl from "maplibre-gl";

import { useMapContext } from "../MapView/MapView.context";
import type { UserLocationProps } from "./UserLocation.types";

export const UserLocation = memo(function UserLocation({
  animated: _animated,
  accuracy: _accuracy,
  heading: _heading,
  minDisplacement: _minDisplacement,
  onPress: _onPress,
  children: _children,
  testID,
}: UserLocationProps) {
  const warnedRef = useRef(false);
  const { mapEngine, ready } = useMapContext();
  const map = mapEngine as MLMap | null;

  useEffect(() => {
    if (!warnedRef.current) {
      warnedRef.current = true;
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn(
          "UserLocation on web uses browser Geolocation API; behavior may differ from native.",
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!ready || !map) return;

    const control = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserLocation: true,
    });

    map.addControl(control);

    return () => {
      if (map.hasControl(control)) {
        map.removeControl(control);
      }
    };
  }, [ready, map]);

  return testID ? <div data-testid={testID} style={{ display: "none" }} /> : null;
});

declare const __DEV__: boolean;
