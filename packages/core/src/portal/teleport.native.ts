/**
 * Native portals: `react-native-teleport` re-parents real native views, so
 * overlays escape clipping and stacking ancestors. The web twin is
 * `teleport.ts`.
 */
export { Portal, PortalHost, PortalProvider, usePortal } from "react-native-teleport";
