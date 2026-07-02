import * as React from "react";

import { buildBoxShadow } from "./shadow";
import type { ShadowProps } from "./types";

export type ShadowViewProps = React.ComponentPropsWithRef<"div"> & ShadowProps;

/**
 * A drop-in `<div>` that renders a drop shadow from RN's `shadow*` inputs as a
 * CSS `box-shadow`, so the same props produce a shadow on web as they do on
 * native (where the {@link import("./ShadowView").ShadowView} counterpart
 * paints it with Skia). A `boxShadow` already in `style` is kept when no shadow
 * props are given.
 */
export function ShadowView({
  shadowColor,
  shadowOffset,
  shadowRadius,
  shadowOpacity,
  inner,
  style,
  children,
  ...rest
}: ShadowViewProps) {
  const boxShadow = buildBoxShadow({
    shadowColor,
    shadowOffset,
    shadowRadius,
    shadowOpacity,
    inner,
  });

  return (
    <div style={boxShadow ? { ...style, boxShadow } : style} {...rest}>
      {children}
    </div>
  );
}
