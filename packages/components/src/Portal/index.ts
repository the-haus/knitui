export type { PortalHostProps, PortalProps, PortalProviderProps } from "./types";
/**
 * Portal system — a thin re-export of `react-native-teleport`.
 *
 * `react-native-teleport` performs **native view re-parenting** (real Fabric
 * portals on iOS/Android, `createPortal` + DOM `moveBefore` on web), so overlays
 * (`Popover`, `Menu`, `Tooltip`, `Modal`, `Drawer`, …) truly escape clipping and
 * stacking ancestors instead of relying on JS re-rendering or `zIndex` tricks.
 *
 * Usage:
 * - Mount `<PortalProvider>` once near the app root — `@knitui/core`'s `<Provider>`
 *   already does this and adds a full-screen host named `"root"`.
 * - Teleport content with `<Portal hostName="root">…</Portal>`. Omit `hostName`
 *   to render inline in place (the no-teleport fallback).
 * - Add extra mount points with `<PortalHost name="…" />` and target them by name.
 * - `usePortal(hostName)` exposes `{ isHostAvailable, removePortal }`.
 *
 * @see https://kirillzyusko.github.io/react-native-teleport
 */
export { Portal, PortalHost, PortalProvider, usePortal } from "react-native-teleport";
