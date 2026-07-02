import React, { memo } from "react";
import type { NativeSyntheticEvent } from "react-native";

import { LayerAnnotation as MapLibreLayerAnnotation } from "@maplibre/maplibre-react-native";

import type { PressEventWithFeatures } from "../../types/primitives";
import type { LayerAnnotationProps } from "./Annotation.types";

export const Annotation = memo(function Annotation({
  id,
  animated,
  animationDuration,
  animationEasingFunction,
  lngLat,
  onPress,
  children,
}: LayerAnnotationProps) {
  return (
    <MapLibreLayerAnnotation
      id={id}
      animated={animated}
      animationDuration={animationDuration}
      animationEasingFunction={animationEasingFunction}
      lngLat={lngLat}
      onPress={
        onPress
          ? (e: NativeSyntheticEvent<PressEventWithFeatures>) => onPress(e.nativeEvent)
          : undefined
      }
    >
      {children}
    </MapLibreLayerAnnotation>
  );
});
