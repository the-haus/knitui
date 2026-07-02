import * as React from "react";

import { Canvas } from "@shopify/react-native-skia";

import type { Size } from "../../types";

export type OverlayCanvasProps = Required<Size> & {
  outset: number;
  androidWarmup?: boolean;
  children: React.ReactNode;
};

/**
 * An absolutely-positioned, non-interactive Skia canvas inflated by `outset` on
 * every side. Native build: a React Native `View`. The web build resolves
 * `OverlayCanvas.tsx`, which uses a `<div>` and so keeps react-native-web out of
 * the web bundle.
 */
export function OverlayCanvas({
  width,
  height,
  outset,
  androidWarmup,
  children,
}: OverlayCanvasProps) {
  const canvasWidth = width + outset * 2;
  const canvasHeight = height + outset * 2;

  return (
    <Canvas
      style={{
        position: "absolute",
        left: -outset,
        top: -outset,
        width: canvasWidth,
        height: canvasHeight,
      }}
      androidWarmup={androidWarmup}
    >
      {children}
    </Canvas>
  );
}
