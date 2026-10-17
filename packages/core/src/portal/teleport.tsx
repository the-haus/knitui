/// <reference lib="dom" />
/**
 * Web portals, with no `react-native-*` package behind them.
 *
 * A port of `react-native-teleport`'s own web path (MIT, © Kiryl Ziusko —
 * https://github.com/kirillzyusko/react-native-teleport): the same public API
 * (`Portal`, `PortalHost`, `PortalProvider`, `usePortal`), the same `"root"` host
 * the provider mounts, and the same mechanics — a portal renders its children
 * with `createPortal` into a detached `<div>` that is then MOVED into the host's
 * node (`moveBefore` where the browser has it, so focus, selection and running
 * CSS animations survive the move), or back next to an in-place sentinel while
 * no host of that name is mounted. Kept on the web so a web bundle of the kit
 * never reaches a native-only package; native keeps the original
 * (`teleport.native.ts`), which re-parents real native views.
 *
 * Dropped from the original: its scroll-view context plumbing, which is a
 * native-only concern (the web original carries it as a constant `null`).
 */
import * as React from "react";
import { createPortal } from "react-dom";

import type { PortalHostProps, PortalProps, PortalProviderProps, PortalStyle } from "./types";

// ── registry: host name → DOM node, plus portals waiting for a host ─────────

type Registry = {
  registerHost: (name: string, node: HTMLElement | null) => void;
  getHost: (name: string) => HTMLElement | null;
  registerPendingPortal: (name: string, callback: () => void) => void;
  unregisterPendingPortal: (name: string, callback: () => void) => void;
};

const RegistryContext = React.createContext<Registry | null>(null);

function useRegistry(): Registry {
  const registry = React.useContext(RegistryContext);
  if (!registry) throw new Error("Portal and PortalHost must be used within a PortalProvider");
  return registry;
}

// ── manager: mounted hosts + portals removed through `usePortal` ─────────────

type ManagerState = {
  /** Portal names removed per host, per mounted instance. */
  removed: Record<string, Record<string, Record<string, boolean>>>;
  /** Mounted host count per name. */
  hosts: Record<string, number>;
};

type ManagerAction =
  | { type: "REMOVE_PORTAL"; hostName: string; name: string }
  | { type: "CLEAR_REMOVED_ON_UNMOUNT"; hostName: string; name: string; instanceId: string }
  | { type: "REGISTER_PORTAL"; hostName: string; name: string; instanceId: string }
  | { type: "REGISTER_HOST"; hostName: string }
  | { type: "UNREGISTER_HOST"; hostName: string };

const INITIAL_STATE: ManagerState = { removed: {}, hosts: {} };

function managerReducer(state: ManagerState, action: ManagerAction): ManagerState {
  switch (action.type) {
    case "REGISTER_HOST": {
      const hosts = { ...state.hosts, [action.hostName]: (state.hosts[action.hostName] ?? 0) + 1 };
      return { ...state, hosts };
    }
    case "UNREGISTER_HOST": {
      const hosts = { ...state.hosts };
      const count = (hosts[action.hostName] ?? 0) - 1;
      if (count <= 0) delete hosts[action.hostName];
      else hosts[action.hostName] = count;
      return { ...state, hosts };
    }
    default: {
      const removed = { ...state.removed };
      const hostRemoved = { ...removed[action.hostName] };
      const nameRemoved = { ...hostRemoved[action.name] };
      if (action.type === "REGISTER_PORTAL") {
        if (!nameRemoved[action.instanceId]) nameRemoved[action.instanceId] = false;
      } else if (action.type === "REMOVE_PORTAL") {
        for (const id of Object.keys(nameRemoved)) nameRemoved[id] = true;
      } else {
        delete nameRemoved[action.instanceId];
      }
      if (Object.keys(nameRemoved).length === 0) delete hostRemoved[action.name];
      else hostRemoved[action.name] = nameRemoved;
      removed[action.hostName] = hostRemoved;
      return { ...state, removed };
    }
  }
}

type Manager = { state: ManagerState; dispatch: React.Dispatch<ManagerAction> };

const ManagerContext = React.createContext<Manager | null>(null);

function useManager(): Manager {
  const manager = React.useContext(ManagerContext);
  if (!manager) throw new Error("usePortal must be used within a PortalProvider");
  return manager;
}

// ── DOM helpers ─────────────────────────────────────────────────────────────

const supportsMoveBefore = typeof Element !== "undefined" && "moveBefore" in Element.prototype;

function moveElementTo(parent: Element, child: Element, before: Element | null = null): void {
  if (supportsMoveBefore && child.parentNode) {
    (parent as Element & { moveBefore: (node: Node, ref: Node | null) => void }).moveBefore(
      child,
      before,
    );
    return;
  }
  if (child.parentNode) child.parentNode.removeChild(child);
  parent.insertBefore(child, before);
}

/** An RN-style style prop (object, nested arrays, falsy entries) as one object. */
function flattenStyle(style: PortalStyle): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => Object.assign(acc, flattenStyle(s)),
      {},
    );
  }
  return typeof style === "object" ? (style as Record<string, unknown>) : {};
}

/** Numbers are pixels, as React DOM would write them. */
function toCssValue(key: string, value: unknown): string {
  if (typeof value === "number" && value !== 0 && !UNITLESS.has(key)) return `${value}px`;
  return String(value);
}

const UNITLESS = new Set(["opacity", "zIndex", "flex", "flexGrow", "flexShrink", "order"]);

let instanceCounter = 0;

function useInstanceId(): string {
  const ref = React.useRef("");
  if (!ref.current) ref.current = `portal-${++instanceCounter}`;
  return ref.current;
}

// ── public components ───────────────────────────────────────────────────────

/** Mounts a full-screen host named `"root"` and the registry every portal reads. */
export function PortalProvider({ children }: PortalProviderProps) {
  const hosts = React.useRef(new Map<string, HTMLElement>());
  const pending = React.useRef(new Map<string, Set<() => void>>());

  const registerHost = React.useCallback((name: string, node: HTMLElement | null) => {
    if (node) hosts.current.set(name, node);
    else hosts.current.delete(name);
    pending.current.get(name)?.forEach((callback) => callback());
  }, []);
  const getHost = React.useCallback((name: string) => hosts.current.get(name) ?? null, []);
  const registerPendingPortal = React.useCallback((name: string, callback: () => void) => {
    const callbacks = pending.current.get(name) ?? new Set();
    callbacks.add(callback);
    pending.current.set(name, callbacks);
  }, []);
  const unregisterPendingPortal = React.useCallback((name: string, callback: () => void) => {
    const callbacks = pending.current.get(name);
    if (!callbacks) return;
    callbacks.delete(callback);
    if (callbacks.size === 0) pending.current.delete(name);
  }, []);
  const registry = React.useMemo(
    () => ({ registerHost, getHost, registerPendingPortal, unregisterPendingPortal }),
    [registerHost, getHost, registerPendingPortal, unregisterPendingPortal],
  );

  const [state, dispatch] = React.useReducer(managerReducer, INITIAL_STATE);
  const manager = React.useMemo(() => ({ state, dispatch }), [state]);

  return (
    <RegistryContext.Provider value={registry}>
      <ManagerContext.Provider value={manager}>
        {children}
        <PortalHost name="root" style={ROOT_HOST_STYLE} />
      </ManagerContext.Provider>
    </RegistryContext.Provider>
  );
}

const ROOT_HOST_STYLE = { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 } as const;

/**
 * An anchor portals teleport into. Never takes pointer events itself: what is
 * teleported in decides its own.
 */
export const PortalHost = React.memo(function PortalHost({
  name,
  children,
  style,
}: PortalHostProps) {
  const { registerHost } = useRegistry();
  const { dispatch } = useManager();

  React.useEffect(() => {
    dispatch({ type: "REGISTER_HOST", hostName: name });
    return () => dispatch({ type: "UNREGISTER_HOST", hostName: name });
  }, [name, dispatch]);

  React.useEffect(() => () => registerHost(name, null), [name, registerHost]);

  const ref = React.useCallback(
    (node: HTMLDivElement | null) => registerHost(name, node),
    [name, registerHost],
  );

  return (
    <div style={{ ...flattenStyle(style), pointerEvents: "none" } as React.CSSProperties} ref={ref}>
      {children}
    </div>
  );
});

/**
 * Renders `children` into the host named `hostName`, or in place while there is
 * none (or no `hostName` at all).
 */
export function Portal({ hostName, name, style, children }: PortalProps) {
  const { getHost, registerPendingPortal, unregisterPendingPortal } = useRegistry();
  const { state, dispatch } = useManager();
  const instanceId = useInstanceId();

  const elRef = React.useRef<HTMLDivElement | null>(null);
  if (!elRef.current && typeof document !== "undefined") {
    elRef.current = document.createElement("div");
  }
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const isRemoved = hostName && name ? state.removed[hostName]?.[name]?.[instanceId] : false;

  React.useEffect(() => {
    if (!hostName || !name) return;
    dispatch({ type: "REGISTER_PORTAL", hostName, name, instanceId });
    return () => dispatch({ type: "CLEAR_REMOVED_ON_UNMOUNT", hostName, name, instanceId });
  }, [dispatch, hostName, name, instanceId]);

  React.useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    for (const [key, value] of Object.entries(flattenStyle(style))) {
      if (value != null) el.style.setProperty(cssName(key), toCssValue(key, value));
    }
  }, [style]);

  const teleportToHost = React.useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const hostNode = hostName ? getHost(hostName) : null;
    if (hostNode) {
      moveElementTo(hostNode, el);
    } else if (sentinelRef.current?.parentElement) {
      moveElementTo(sentinelRef.current.parentElement, el, sentinelRef.current);
    }
  }, [hostName, getHost]);

  React.useLayoutEffect(() => {
    teleportToHost();
    if (!hostName) return;
    registerPendingPortal(hostName, teleportToHost);
    return () => unregisterPendingPortal(hostName, teleportToHost);
  }, [hostName, registerPendingPortal, unregisterPendingPortal, teleportToHost]);

  React.useLayoutEffect(
    () => () => {
      const el = elRef.current;
      if (el?.parentNode) el.parentNode.removeChild(el);
    },
    [],
  );

  // Server render: no DOM to portal into; the client takes over on mount.
  if (!elRef.current) return null;

  return (
    <>
      {createPortal(isRemoved ? null : children, elRef.current)}
      {/* Invisible sentinel for the in-place position. */}
      <div ref={sentinelRef} style={SENTINEL_STYLE} />
    </>
  );
}

const SENTINEL_STYLE: React.CSSProperties = { display: "contents" };

function cssName(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * Imperative portal control for a host: whether one of that name is mounted,
 * and removing a named portal from it.
 */
export function usePortal(hostName: string = "root") {
  const { state, dispatch } = useManager();
  return {
    /** Whether a `PortalHost` with this name is currently mounted. */
    isHostAvailable: (state.hosts[hostName] ?? 0) > 0,
    /**
     * Remove a portal from the host. Re-renders don't restore it; mounting a new
     * portal of that name shows it again.
     */
    removePortal: (name: string) => dispatch({ type: "REMOVE_PORTAL", hostName, name }),
  };
}
