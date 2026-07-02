import type * as React from "react";
import type { ViewStyle } from "react-native";

import type { DataSourceParam } from "@shopify/react-native-skia";

export type SkiaColor = string;

export type CanvasLength = number | `${number}%`;

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type RectLike = Point & Size;

export type Radius = number | { x: number; y: number };

export type ImageSource = DataSourceParam | string | number;

export type Fit = "contain" | "cover" | "fill" | "fitHeight" | "fitWidth" | "scaleDown" | "none";

export type TileMode = "clamp" | "repeat" | "mirror" | "decal";

export type GradientStop = {
  color: SkiaColor;
  position?: number;
};

export type GradientStops = readonly SkiaColor[] | readonly GradientStop[];

export type GraphicCanvasProps = {
  width?: CanvasLength;
  height?: CanvasLength;
  style?: ViewStyle;
  children?: React.ReactNode;
  backgroundColor?: SkiaColor;
  androidWarmup?: boolean;
};

export type PaintStyle = "fill" | "stroke";
