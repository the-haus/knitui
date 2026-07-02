import * as React from "react";

import type { IconComponent, IconGeometry, IconProps, IconType, PathSpec } from "../types";
import { useIconContext } from "./icon-context";

/**
 * Web renderer. Builds a self-contained `<svg>` from the compiled geometry — no
 * dependency on `@tabler/icons-react`. The native counterpart lives in
 * `create-icon.native.tsx`; bundlers/Metro pick the right one per platform.
 *
 * The geometry is resolved to a `PathSpec[]` ONCE here, at module eval, so every
 * render only rebuilds the small paint object (the one thing that depends on
 * props). The component is wrapped in `React.memo`, so icons in lists/toolbars
 * skip re-rendering when their props are referentially stable. Unset `size`/
 * `color`/`stroke` fall back to the ambient `IconProvider`, then the hard
 * defaults — `color` defaults to `currentColor`, which on the web inherits the
 * surrounding text color as usual.
 */
export function createIcon(
  type: IconType,
  iconName: string,
  displayName: string,
  geometry: IconGeometry,
): IconComponent {
  const filled = type === "filled";
  const specs: ReadonlyArray<PathSpec> =
    typeof geometry === "string" ? [{ d: geometry }] : geometry;

  const Icon = React.memo(
    ({
      size: sizeProp,
      color: colorProp,
      stroke: strokeProp,
      strokeWidth,
      title,
      className,
      accessibilityLabel,
      testID,
      children,
      // Destructured purely so they never leak onto the DOM element.
      fallback: _fallback,
      ...rest
    }: IconProps) => {
      // Explicit prop → ambient IconProvider → hard default.
      const ctx = useIconContext();
      const size = sizeProp ?? ctx.size ?? 24;
      const color = colorProp ?? ctx.color ?? "currentColor";
      const stroke = strokeProp ?? ctx.stroke ?? 2;
      const paint = filled
        ? { fill: color, stroke: "none" }
        : {
            fill: "none",
            stroke: color,
            strokeWidth: strokeWidth ?? stroke,
            strokeLinecap: "round" as const,
            strokeLinejoin: "round" as const,
          };

      return React.createElement(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          ...paint,
          className: ["tabler-icon", `tabler-icon-${iconName}`, className]
            .filter(Boolean)
            .join(" "),
          "aria-label": rest["aria-label"] ?? accessibilityLabel,
          "aria-hidden": (rest["aria-label"] ?? accessibilityLabel ?? title) ? undefined : true,
          "data-testid": testID,
          ...rest,
        },
        title ? React.createElement("title", { key: "svg-title" }, title) : null,
        // `paint` first, then the spec so any per-path override (fill/stroke/opacity) wins.
        ...specs.map((spec, index) =>
          React.createElement("path", { key: index, ...paint, ...spec }),
        ),
        children,
      );
    },
  );

  Icon.displayName = displayName;
  return Icon;
}
