import type * as React from "react";

/**
 * Tabler stores every icon as a flat list of SVG child nodes. Each entry is a
 * `[tag, attributes]` tuple (e.g. `["path", { d: "M3 3 ..." }]`). The kit ships
 * this data inline so it never depends on `@tabler/icons-react` /
 * `@tabler/icons-react-native` at runtime — only on the raw `@tabler/icons`
 * package at generate time.
 */
export type IconNode = Array<[tag: string, attrs: Record<string, string | number>]>;

/**
 * A single render-ready `<path>`. The generator compiles Tabler's node list into
 * these: it merges every consecutive run of same-paint `<path>` nodes into one by
 * concatenating their `d` data (each subpath starts with a moveto, so stroking is
 * unchanged and nonzero fills don't cancel). `d` is always present; any per-node
 * paint override Tabler ships (`fill`/`stroke`/`opacity` on e.g. dice dots or
 * `percentage-*`) rides along verbatim and wins over the icon's base paint.
 */
export type PathSpec = { d: string } & Record<string, string | number>;

/**
 * Compiled geometry handed to `createIcon`. The overwhelming common case is a bare
 * merged `d` string (one `<path>`); icons that mix paints (≈96 of them) keep a short
 * ordered `PathSpec[]` so z-order and per-path overrides are preserved exactly.
 */
export type IconGeometry = string | ReadonlyArray<PathSpec>;

/** Tabler draws two visual styles: stroked `outline` icons and solid `filled` icons. */
export type IconType = "outline" | "filled";

export interface IconProps {
  /** Width and height of the rendered SVG. Defaults to `24`. */
  size?: number | string;
  /** Stroke color for outline icons, fill color for filled icons. Defaults to `currentColor`. */
  color?: string;
  /** Outline stroke width. Ignored by filled icons. Defaults to `2`. */
  stroke?: number | string;
  /** Alias for `stroke`; takes precedence when both are provided (mirrors native Tabler). */
  strokeWidth?: number | string;
  /** Suspense fallback used by the dynamic `Icon` component while a lazy icon loads. */
  fallback?: React.ReactNode;
  /** Accessible title. Rendered as `<title>` on web and mapped to `accessibilityLabel` on native. */
  title?: string;
  className?: string;
  style?: unknown;
  children?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  [key: string]: unknown;
}

export type IconComponent = React.FC<IconProps>;
