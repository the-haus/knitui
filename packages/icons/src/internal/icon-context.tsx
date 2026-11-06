import * as React from "react";

import type { IconProps } from "../types";

/**
 * Cross-platform replacement for the web's `color`/`em` cascade. React Native
 * has no cascade, so an icon dropped inside a control can't inherit the
 * control's size or color the way an `<svg>` does in the DOM. A surface instead
 * *publishes* the defaults it wants its icons to take via `IconProvider`, and
 * every icon reads them through `useIconContext`. Explicit props on the icon
 * always win; context only fills what the caller left unset.
 *
 * `color`/`stroke` should be resolved, concrete values (a hex/rgb string, a
 * number) — react-native-svg can't resolve `currentColor` or theme tokens, so
 * the provider is responsible for resolving them (see `@knitui/components`'
 * `ControlIconProvider`).
 */
export interface IconContextValue {
  size?: IconProps["size"];
  color?: IconProps["color"];
  stroke?: IconProps["stroke"];
}

const IconContext = React.createContext<IconContextValue | null>(null);

const EMPTY: IconContextValue = {};

const stripUndefined = (value: IconContextValue): IconContextValue => {
  const out: IconContextValue = {};
  if (value.size !== undefined) out.size = value.size;
  if (value.color !== undefined) out.color = value.color;
  if (value.stroke !== undefined) out.stroke = value.stroke;
  return out;
};

export interface IconProviderProps {
  value: IconContextValue;
  children?: React.ReactNode;
}

/**
 * Publish default `size`/`color`/`stroke` to every icon in the subtree. Nested
 * providers are additive — a child provider overrides only the fields it sets,
 * inheriting the rest from its parent.
 */
export function IconProvider({ value, children }: IconProviderProps) {
  const parent = React.useContext(IconContext);
  const merged = React.useMemo(
    () => ({ ...parent, ...stripUndefined(value) }),
    // Compare on the primitive fields, not the (often inline) `value` identity,
    // so a stable set of defaults doesn't re-render the icon subtree.
    [parent, value.size, value.color, value.stroke],
  );
  return React.createElement(IconContext.Provider, { value: merged }, children);
}

/** A hook resolving a theme colour name to something the platform can paint. */
export type IconColorResolver = (color: string) => string;

let iconColorResolver: IconColorResolver | null = null;

/**
 * Teach icons to read theme colour names. This package knows nothing about the theme,
 * so `@knitui/components` registers its resolver. Without one, `color` paints as given.
 */
export function registerIconColorResolver(resolver: IconColorResolver): void {
  iconColorResolver = resolver;
}

const LITERAL_COLOR = /^(#|rgba?\(|hsla?\(|hwb\(|lab\(|lch\(|oklab\(|oklch\(|color\(|var\()/i;
const KEYWORD_COLOR = /^(currentcolor|transparent|inherit|none)$/i;

/** Whether `color` may be a theme name rather than something paintable already. */
export function needsIconColorResolution(color: IconProps["color"]): color is string {
  return (
    iconColorResolver !== null &&
    typeof color === "string" &&
    !LITERAL_COLOR.test(color) &&
    !KEYWORD_COLOR.test(color)
  );
}

interface ResolvedIconColorProps {
  color: string;
  children?: React.ReactNode;
}

/**
 * Paints the icons inside it with `color`, resolved. A separate component so that only
 * icons given a theme name pay for the theme subscription a native lookup needs.
 */
export function ResolvedIconColor({ color, children }: ResolvedIconColorProps) {
  const resolved = (iconColorResolver as IconColorResolver)(color);
  return React.createElement(IconProvider, { value: { color: resolved } }, children);
}

/** Read the ambient icon defaults. Returns an empty object when unprovided. */
export function useIconContext(): IconContextValue {
  return React.useContext(IconContext) ?? EMPTY;
}
