import React, { memo } from "react";
import type { ViewStyle } from "react-native";

import { Callout as MapLibreCallout } from "@maplibre/maplibre-react-native";

import type { CalloutProps } from "./Callout.types";

export const Callout = memo(function Callout({
  title,
  style,
  contentStyle,
  tipStyle,
  titleStyle,
  children,
  testID,
}: CalloutProps) {
  return (
    <MapLibreCallout
      title={title}
      style={style as ViewStyle}
      contentStyle={contentStyle as ViewStyle}
      tipStyle={tipStyle as ViewStyle}
      titleStyle={titleStyle as ViewStyle}
      testID={testID}
    >
      {children}
    </MapLibreCallout>
  );
});
