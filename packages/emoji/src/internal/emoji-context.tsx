import * as React from "react";

import type { EmojiProps } from "../types";

/**
 * Cross-platform replacement for the web's `em`/`font-size` cascade. React
 * Native has no cascade, so an emoji dropped inside a control can't inherit the
 * control's size the way an inline `<svg>` does in the DOM. A surface instead
 * *publishes* the default size it wants its emoji to take via `EmojiProvider`,
 * and every emoji reads it through `useEmojiContext`. An explicit `size` on the
 * emoji always wins; context only fills it in when the caller left it unset.
 *
 * Emoji are full-color artwork, so — unlike `@knitui/icons` — there is no
 * `color`/`stroke` to publish; `size` is the only ambient default.
 */
export interface EmojiContextValue {
  size?: EmojiProps["size"];
}

const EmojiContext = React.createContext<EmojiContextValue | null>(null);

const EMPTY: EmojiContextValue = {};

const stripUndefined = (value: EmojiContextValue): EmojiContextValue => {
  const out: EmojiContextValue = {};
  if (value.size !== undefined) out.size = value.size;
  return out;
};

export interface EmojiProviderProps {
  value: EmojiContextValue;
  children?: React.ReactNode;
}

/**
 * Publish a default `size` to every emoji in the subtree. Nested providers are
 * additive — a child provider overrides only the fields it sets, inheriting the
 * rest from its parent.
 */
export function EmojiProvider({ value, children }: EmojiProviderProps) {
  const parent = React.useContext(EmojiContext);
  const merged = React.useMemo(
    // Compare on the primitive field, not the (often inline) `value` identity,
    // so a stable default doesn't re-render the emoji subtree.
    () => ({ ...parent, ...stripUndefined(value) }),
    [parent, value.size],
  );
  return React.createElement(EmojiContext.Provider, { value: merged }, children);
}

/** Read the ambient emoji defaults. Returns an empty object when unprovided. */
export function useEmojiContext(): EmojiContextValue {
  return React.useContext(EmojiContext) ?? EMPTY;
}
