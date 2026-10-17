import type * as React from "react";

/**
 * A style object for a portal's container. Structural (no `react-native`
 * import) so the web portal types without the native packages; a
 * `StyleProp<ViewStyle>` from react-native is assignable.
 */
export type PortalStyle = unknown;

/** Props for `PortalProvider`: wraps the app and mounts the `"root"` host. */
export type PortalProviderProps = {
  children: React.ReactNode;
};

/** Props for `PortalHost` — the anchor a `Portal` teleports into. */
export type PortalHostProps = {
  /** Unique host name; referenced by `Portal` via `hostName`. */
  name: string;
  /** Style applied to the host. */
  style?: PortalStyle;
  /** Content rendered inside the host. */
  children?: React.ReactNode;
};

/** Props for `Portal`. Without `hostName` the children render in place. */
export type PortalProps = {
  /** Identifies this portal within its host (for `usePortal().removePortal`). */
  name?: string;
  /** Name of the `PortalHost` to teleport into. */
  hostName?: string;
  /** Style applied to the portal's container. */
  style?: PortalStyle;
  /** Content rendered into the portal. */
  children?: React.ReactNode;
};
