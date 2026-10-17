export {
  OverlayHost,
  ROOT_OVERLAY_HOST,
  useOverlayHost,
  useTopmostOverlayHost,
} from "./OverlayHost";
export type { OverlayHostProps, PortalHostProps, PortalProps, PortalProviderProps } from "./types";
/**
 * Portal system — a thin re-export of `@knitui/core/portal`, which is
 * `react-native-teleport` on native and the kit's own react-dom port of it on
 * web (so a web bundle never reaches a react-native-* package).
 *
 * Native performs **native view re-parenting** (real Fabric portals on
 * iOS/Android); web uses `createPortal` + DOM `moveBefore`, so overlays
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
 * - Wrap a natively presented modal screen in `<OverlayHost name="…">` so the
 *   kit's overlays inside it teleport into THAT host rather than `"root"` (which
 *   lives in the window underneath the modal). They read the host through
 *   `useOverlayHost()`; `useTopmostOverlayHost()` serves app-global layers.
 *
 * @see https://kirillzyusko.github.io/react-native-teleport
 */
export { Portal, PortalHost, PortalProvider, usePortal } from "@knitui/core/portal";
