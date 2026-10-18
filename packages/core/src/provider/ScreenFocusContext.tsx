import { createContext, useContext } from "react";

/** A hook answering "is the screen this component renders in focused?". */
export type UseScreenFocus = () => boolean;

/** Without a navigation integration every screen counts as focused. */
export const alwaysFocused: UseScreenFocus = () => true;

/**
 * Carries the app's screen-focus hook (`<Provider useScreenFocus>`) down to the
 * kit's overlays. The value is the hook itself, called by {@link useScreenFocused}
 * inside each consumer, so it reads the focus of the screen that consumer sits in.
 */
export const ScreenFocusContext = createContext<UseScreenFocus>(alwaysFocused);

/**
 * Whether the screen this component renders in is focused, per the hook passed to
 * `<Provider useScreenFocus>`; always `true` when none was passed. The kit's
 * overlays read it so a backgrounded stack screen's popovers stop drawing over the
 * screen in front of it.
 */
export function useScreenFocused(): boolean {
  const useFocus = useContext(ScreenFocusContext);
  return useFocus();
}
