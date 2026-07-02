import * as React from "react";
import {
  type LayoutChangeEvent,
  View as RNView,
  type ViewProps as RNViewProps,
  StyleSheet,
} from "react-native";

import type { Size } from "../../types";
import { EffectCanvas } from "./EffectLayer";
import type { EffectLayer } from "./types";

export type ViewProps = RNViewProps & {
  /**
   * The effects painted onto this element, bottom-to-top. Each entry is a
   * `{ effect, ...props }` descriptor — frame paints (`fill`, `border`, `glow`,
   * `shadow`) and the package's component-backed effects (`dottedGrid`, `noise`,
   * `image`, …). Geometry (corner radius and size) is read off the element's own
   * `style`; you pass data, never a component.
   */
  effects?: readonly EffectLayer[];
  ref?: React.Ref<RNView>;
  androidWarmup?: boolean;
};

/** A fixed `ViewStyle` length is a number; percentages / `"auto"` can't seed the geometry. */
function numericLength(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * A drop-in replacement for a React Native `<View>` that paints a stack of Skia
 * {@link EffectLayer}s onto itself. It wraps the View, **extracts its geometry
 * (corner radius and size) straight from the element's own `style`**, and lines
 * the effects up with the box layout produces. When the size isn't pinned in
 * `style`, it measures via `onLayout` and adapts.
 *
 * The default (native) implementation; the web build resolves
 * `EffectView.web.tsx`, which wraps an HTML `<div>` instead.
 */
export function EffectView({
  effects,
  ref,
  androidWarmup,
  style,
  children,
  onLayout,
  ...rest
}: ViewProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const styleWidth = numericLength(flat.width);
  const styleHeight = numericLength(flat.height);
  const radius = numericLength(flat.borderRadius);

  const [measured, setMeasured] = React.useState<Size>({
    width: styleWidth ?? 0,
    height: styleHeight ?? 0,
  });

  const needsMeasure = styleWidth == null || styleHeight == null;

  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      if (needsMeasure) {
        const next = event.nativeEvent.layout;
        setMeasured((current) =>
          current.width === next.width && current.height === next.height
            ? current
            : { width: next.width, height: next.height },
        );
      }

      onLayout?.(event);
    },
    [needsMeasure, onLayout],
  );

  const contentWidth = styleWidth ?? measured.width;
  const contentHeight = styleHeight ?? measured.height;
  const size: Size = { width: contentWidth, height: contentHeight };
  const layers = effects ?? [];

  // Declaration order is paint order here: the behind canvas first, then the
  // content, then the front canvas.
  return (
    <RNView ref={ref} onLayout={handleLayout} style={[styles.root, style]} {...rest}>
      <EffectCanvas
        layers={layers}
        placement="behind"
        size={size}
        radius={radius}
        androidWarmup={androidWarmup}
      />
      <RNView>{children}</RNView>
      <EffectCanvas
        layers={layers}
        placement="front"
        size={size}
        radius={radius}
        androidWarmup={androidWarmup}
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
});
