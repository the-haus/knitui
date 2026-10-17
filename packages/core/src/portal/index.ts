/**
 * The kit's portal primitives — `Portal`, `PortalHost`, `PortalProvider`,
 * `usePortal` — behind ONE platform seam (`./teleport`):
 *
 * - **native** (`teleport.native.ts`): `react-native-teleport`, which re-parents
 *   real native views (Fabric portals on iOS/Android).
 * - **web** (`teleport.ts`): the kit's own react-dom implementation, so a web
 *   build never reaches a react-native-* package for its overlays.
 *
 * Imported as `@knitui/core/portal` (not the main barrel) by `<Provider>` and by
 * `@knitui/components`' `Portal`, so both sides share one module instance — the
 * provider's registry and the portals that read it must be the same context.
 */
export { Portal, PortalHost, PortalProvider, usePortal } from "./teleport";
export type { PortalHostProps, PortalProps, PortalProviderProps } from "./types";
