import type * as React from "react";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * Props for {@link Portal}. Mirrors `react-native-teleport`'s `Portal` — the
 * library this kit's portal system is built on.
 *
 * Teleporting is opt-in via `hostName`: with a `hostName` the children are moved
 * into the matching {@link PortalHost} (the root host is named `"root"` and is
 * mounted by `@knitui/core`'s `<Provider>`); without one they render inline in
 * place. So the common overlay pattern is `hostName={open ? "root" : undefined}`
 * — or simply `hostName="root"`.
 */
export type PortalProps = {
  /** Identifies this portal within its host. @default a generated id */
  name?: string;
  /**
   * Name of the {@link PortalHost} to teleport into. Omit to render children
   * inline at their current position (no teleport). @default undefined
   */
  hostName?: string;
  /** Style applied to the portal's container view. */
  style?: StyleProp<ViewStyle>;
  /** Content rendered into the portal. */
  children?: React.ReactNode;
};

/**
 * Props for {@link PortalHost} — the anchor a {@link Portal} teleports into.
 */
export type PortalHostProps = {
  /** Unique host name; referenced by `Portal` via `hostName`. */
  name: string;
  /** Style applied to the host view (set explicit dimensions for it). */
  style?: StyleProp<ViewStyle>;
  /** Content rendered inside the host. */
  children?: React.ReactNode;
};

/**
 * Props for {@link PortalProvider} — wraps the app to enable the portal system
 * and mounts a full-screen root host. `@knitui/core`'s `<Provider>` already
 * renders one, so apps rarely mount this directly.
 */
export type PortalProviderProps = {
  children: React.ReactNode;
};
