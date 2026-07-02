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

/** Read the ambient icon defaults. Returns an empty object when unprovided. */
export function useIconContext(): IconContextValue {
  return React.useContext(IconContext) ?? EMPTY;
}
