import * as React from "react";

/**
 * Lets a scroller know that an overlay rendered INSIDE it in React (a `Sheet`,
 * `Modal`, `Drawer` or dropdown teleported on screen through `OverlayPortal`)
 * is currently open.
 *
 * Why (native): teleporting moves the native view, but in React the layer stays
 * where it was rendered, e.g. a comment sheet opened from a row of a feed list.
 * React Native's responder system walks the React tree, so that list's
 * `ScrollView` is an ancestor of every button in the sheet. With the default
 * `keyboardShouldPersistTaps="never"` the ScrollView CAPTURES a touch that starts
 * while the keyboard is up, only to dismiss the keyboard, and the sheet's button
 * never gets the first tap. A descendant cannot outbid an ancestor's capture, so
 * the scroller has to step back: while a layer is registered here it uses
 * `"handled"`, which leaves the tap to the control it lands on and still
 * dismisses the keyboard on a tap nothing handles.
 *
 * Scopes nest: a layer registers with the nearest scroller, which forwards the
 * registration to every scroller above it. Web has no such capture, so
 * `OverlayPortal` only registers on native.
 */

type RegisterLayer = () => () => void;

const TeleportedLayerContext = React.createContext<RegisterLayer | null>(null);

export interface TeleportedLayerScope {
  /** At least one teleported layer rendered inside this scope is open. */
  hasOpenLayer: boolean;
  /** Wrap the scroller's children so layers inside it can register. */
  Provider: typeof TeleportedLayerContext.Provider;
  register: RegisterLayer;
}

/** Scroller side: open a scope and learn whether a layer inside it is open. */
export function useTeleportedLayerScope(): TeleportedLayerScope {
  const parent = React.useContext(TeleportedLayerContext);
  const [count, setCount] = React.useState(0);
  const register = React.useCallback<RegisterLayer>(() => {
    setCount((c) => c + 1);
    const releaseParent = parent?.();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setCount((c) => c - 1);
      releaseParent?.();
    };
  }, [parent]);
  return { hasOpenLayer: count > 0, Provider: TeleportedLayerContext.Provider, register };
}

/** Layer side: register with the enclosing scroller(s) while `active`. */
export function useRegisterTeleportedLayer(active: boolean): void {
  const register = React.useContext(TeleportedLayerContext);
  React.useEffect(() => {
    if (!active || !register) return;
    return register();
  }, [active, register]);
}

/**
 * The `keyboardShouldPersistTaps` a native scroller should use: the consumer's
 * explicit value wins; otherwise `"handled"` while a layer inside it is open.
 */
export function resolvePersistTaps<T>(
  explicit: T | undefined,
  hasOpenLayer: boolean,
): T | "handled" | undefined {
  if (explicit !== undefined) return explicit;
  return hasOpenLayer ? "handled" : undefined;
}
