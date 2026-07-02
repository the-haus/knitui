import * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Path, Svg } from "react-native-svg";

import type { IconComponent, IconGeometry, IconProps, IconType, PathSpec } from "../types";
import { useIconContext } from "./icon-context";

/**
 * Native renderer. Draws the compiled geometry with `react-native-svg` — no
 * dependency on `@tabler/icons-react-native`.
 *
 * The generator merges each icon down to (almost always) a single `<Path>`, so
 * a typical icon is just `<Svg>` + one `<Path>` — two native views instead of
 * the one-per-node it used to be, and one path-string parse instead of several.
 * Geometry is resolved to a `PathSpec[]` ONCE at module eval; each render only
 * rebuilds the paint object, and `React.memo` skips renders with stable props.
 *
 * Paint is applied per `<Path>` because react-native-svg does not inherit it
 * from the parent `<Svg>` as reliably as the DOM does. Unset `size`/`color`/
 * `stroke` fall back to the ambient `IconProvider` (so an icon inside a control
 * matches it) and then to the hard defaults.
 */
export function createIcon(
  type: IconType,
  _iconName: string,
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
      accessibilityLabel,
      testID,
      style,
      children,
      // DOM-only props are dropped so they never reach react-native-svg.
      className: _className,
      fallback: _fallback,
      "aria-label": _ariaLabel,
      "aria-hidden": _ariaHidden,
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
        Svg,
        {
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          accessibilityLabel: accessibilityLabel ?? title,
          testID,
          style: style as StyleProp<ViewStyle>,
          ...rest,
        },
        // `paint` first, then the spec so any per-path override (fill/stroke/opacity) wins.
        ...specs.map((spec, index) => React.createElement(Path, { key: index, ...paint, ...spec })),
        children,
      );
    },
  );

  Icon.displayName = displayName;
  return Icon;
}
