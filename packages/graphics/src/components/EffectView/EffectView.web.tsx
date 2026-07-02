import * as React from "react";

import type { Size } from "../../types";
import { EffectCanvas } from "./EffectLayer";
import type { EffectLayer } from "./types";

export type ViewProps = React.ComponentPropsWithRef<"div"> & {
  /**
   * The effects painted onto this element, bottom-to-top. Each entry is a
   * `{ effect, ...props }` descriptor — frame paints (`fill`, `border`, `glow`,
   * `shadow`) and the package's component-backed effects (`dottedGrid`, `noise`,
   * `image`, …). Geometry (corner radius and size) is read off the element's own
   * `style`; you pass data, never a component.
   */
  effects?: readonly EffectLayer[];
  androidWarmup?: boolean;
};

/** Parse a CSS length (`24`, `"24px"`) to a number, or `undefined` if it isn't a fixed px value. */
function parseLength(value: string | number | undefined): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return value.trim().endsWith("%") || !Number.isFinite(parsed) ? undefined : parsed;
  }

  return undefined;
}

/**
 * A drop-in replacement for a plain `<div>` that paints a stack of Skia
 * {@link EffectLayer}s onto itself. It wraps an HTML element, **extracts its
 * geometry (corner radius and size) straight from the element's own `style`**,
 * and lines the effects up with the box the browser renders. When the size isn't
 * pinned in `style`, it measures the element and adapts.
 *
 * The web override of {@link import("./EffectView").EffectView}; the default build
 * resolves `EffectView.tsx`, which wraps a React Native `View` instead.
 */
export function EffectView({ effects, ref, androidWarmup, style, children, ...rest }: ViewProps) {
  const innerRef = React.useRef<HTMLDivElement | null>(null);

  const elementStyle = style as React.CSSProperties | undefined;
  const styleWidth = parseLength(elementStyle?.width);
  const styleHeight = parseLength(elementStyle?.height);
  const radius = parseLength(elementStyle?.borderRadius);

  const [measured, setMeasured] = React.useState<Size>({
    width: styleWidth ?? 0,
    height: styleHeight ?? 0,
  });

  // Only observe the box when its size isn't already fixed by `style`.
  const needsMeasure = styleWidth == null || styleHeight == null;

  React.useLayoutEffect(() => {
    const node = innerRef.current;
    if (!node || !needsMeasure) {
      return;
    }

    const update = () => {
      const rect = node.getBoundingClientRect();
      setMeasured((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [needsMeasure]);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref],
  );

  const contentWidth = styleWidth ?? measured.width;
  const contentHeight = styleHeight ?? measured.height;
  const size: Size = { width: contentWidth, height: contentHeight };
  const layers = effects ?? [];

  // DOM order is paint order here: the behind canvas first, then the
  // (relatively-positioned) content, then the front canvas.
  return (
    <div ref={setRefs} style={{ position: "relative", ...style }} {...rest}>
      <EffectCanvas
        layers={layers}
        placement="behind"
        size={size}
        radius={radius}
        androidWarmup={androidWarmup}
      />
      <div style={{ position: "relative" }}>{children}</div>
      <EffectCanvas
        layers={layers}
        placement="front"
        size={size}
        radius={radius}
        androidWarmup={androidWarmup}
      />
    </div>
  );
}
