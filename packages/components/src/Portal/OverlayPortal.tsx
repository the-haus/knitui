import * as React from "react";
import { Portal } from "react-native-teleport";

import { isWeb, useScreenFocused } from "@knitui/core";

import { useRegisterTeleportedLayer } from "./teleported-layer-scope";

export interface OverlayPortalProps {
  /** Host to teleport into (usually `useOverlayHost()`); omit to render inline. */
  hostName?: string;
  children?: React.ReactNode;
}

/**
 * The portal the kit's overlays render through: a `Portal` that teleports into
 * `hostName` only while the screen it sits in is focused (`<Provider useScreenFocus>`).
 *
 * On a backgrounded stack screen the screen stays mounted, but the shared host it
 * teleports into does not belong to it, so an open popover would draw over the
 * screen in front. Dropping `hostName` while unfocused keeps the overlay inline in
 * its own (now hidden) screen instead. Teleport re-parents rather than remounts, so
 * the overlay keeps its state and is back, still open, when the screen regains focus.
 * Without `useScreenFocus` this is exactly `<Portal hostName={hostName}>`.
 */
export function OverlayPortal({ hostName, children }: OverlayPortalProps) {
  const focused = useScreenFocused();
  const target = focused ? hostName : undefined;
  // Native: while teleported, tell the scrollers this layer sits inside (in
  // React) to stop capturing its first tap to dismiss the keyboard (see
  // `teleported-layer-scope.tsx`). Web has no such capture.
  useRegisterTeleportedLayer(!isWeb && target !== undefined);
  return <Portal hostName={target}>{children}</Portal>;
}
