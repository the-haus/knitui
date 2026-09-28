import * as React from "react";
import { StyleSheet, View } from "react-native";
import { PortalHost } from "react-native-teleport";

import type { OverlayHostProps } from "./types";

/** The full-screen host `@knitui/core`'s `<Provider>` mounts (via `PortalProvider`). */
export const ROOT_OVERLAY_HOST = "root";

type OverlayHostContextValue = {
  /** Host name the kit's overlays teleport into. */
  name: string;
  /** Nesting depth: 0 for the root host, +1 per enclosing {@link OverlayHost}. */
  depth: number;
  /**
   * The view wrapping the scoped host, so the native floating engine can measure
   * the host's window origin. `null` for the root host (it sits at the window
   * origin by construction).
   */
  frameRef: React.RefObject<View | null> | null;
};

const ROOT_VALUE: OverlayHostContextValue = { name: ROOT_OVERLAY_HOST, depth: 0, frameRef: null };

const OverlayHostContext = React.createContext<OverlayHostContextValue>(ROOT_VALUE);

// ---------------------------------------------------------------------------
// Mounted-host registry — backs `useTopmostOverlayHost`. Module-level because
// the question it answers ("which host is on top right now?") is asked by
// app-global singletons (a toast layer) that sit OUTSIDE every scoped host.
// ---------------------------------------------------------------------------

type Entry = { name: string; depth: number; seq: number };

let entries: Entry[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Deepest host wins; among equals, the most recently mounted one. */
function getTopmost(): string {
  let top: Entry | undefined;
  for (const e of entries) {
    if (!top || e.depth > top.depth || (e.depth === top.depth && e.seq > top.seq)) top = e;
  }
  return top?.name ?? ROOT_OVERLAY_HOST;
}

function register(name: string, depth: number): () => void {
  const entry: Entry = { name, depth, seq: ++seq };
  entries = [...entries, entry];
  listeners.forEach((l) => l());
  return () => {
    entries = entries.filter((e) => e !== entry);
    listeners.forEach((l) => l());
  };
}

/**
 * A **scoped** portal host. Mounts a `PortalHost` named `name` over its
 * children (an absolute fill of the parent) and tells every kit overlay rendered
 * inside it — `Popover`/`Menu`/`Combobox`/date-picker dropdowns, `Tooltip`,
 * `Modal`/`Drawer`, `Affix`, a modal `Sheet` — to teleport there instead of into
 * the app-wide `"root"` host.
 *
 * Use it to wrap a screen that the platform presents in its own native container
 * (an iOS `formSheet` / `fullScreenModal`, an Android dialog): the root host
 * lives in the window underneath, so without a scope those overlays would draw
 * BEHIND the modal.
 *
 * Nothing changes outside an `OverlayHost` — overlays keep using `"root"`.
 * Names must be unique among mounted hosts (a route key is a good suffix).
 *
 * @example
 * ```tsx
 * <OverlayHost name={`modal:${route.key}`}>
 *   <FiltersScreen />
 * </OverlayHost>
 * ```
 */
export function OverlayHost({ name, children }: OverlayHostProps) {
  const parent = React.useContext(OverlayHostContext);
  const depth = parent.depth + 1;
  const frameRef = React.useRef<View>(null);

  const value = React.useMemo<OverlayHostContextValue>(
    () => ({ name, depth, frameRef }),
    [name, depth],
  );

  React.useEffect(() => register(name, depth), [name, depth]);

  return (
    <OverlayHostContext.Provider value={value}>
      {children}
      {/* After the children, so teleported overlays paint above the screen.
          `box-none`: the empty host must never swallow touches meant for the
          screen beneath it. `collapsable={false}` keeps the wrapper a real
          native view so it can be measured. */}
      <View ref={frameRef} collapsable={false} style={styles.frame}>
        <PortalHost name={name} style={StyleSheet.absoluteFill} />
      </View>
    </OverlayHostContext.Provider>
  );
}

const styles = StyleSheet.create({
  frame: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, pointerEvents: "box-none" },
});

/**
 * The host name overlays at this point in the tree should teleport into:
 * the nearest {@link OverlayHost}'s, else `"root"`. The kit's own overlays read
 * it; use it for a custom `<Portal hostName={useOverlayHost()}>`.
 */
export function useOverlayHost(): string {
  return React.useContext(OverlayHostContext).name;
}

/**
 * The name of the top-most MOUNTED {@link OverlayHost} anywhere in the app, else
 * `"root"`. For app-global overlays rendered OUTSIDE any scope — e.g. one toast
 * layer near the app root — that should still show above whatever modal is up.
 */
export function useTopmostOverlayHost(): string {
  return React.useSyncExternalStore(subscribe, getTopmost, getTopmost);
}

/**
 * @internal The scoped host's measurable frame (or `null` under the root host),
 * for the native floating engine's container-origin math.
 */
export function useOverlayHostFrame(): React.RefObject<View | null> | null {
  return React.useContext(OverlayHostContext).frameRef;
}
