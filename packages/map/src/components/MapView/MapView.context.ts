import { createContext, useContext } from "react";

import type { RasterStore } from "../SvgImage/rasterizer.shared";
import type { ImageEntry, LayerEntry, SourceEntry } from "./MapView.registry";

// ── Adapter kind ────────────────────────────────────────────────────

export type AdapterKind = "web" | "native";

// ── Capabilities ────────────────────────────────────────────────────

export interface MapCapabilities {
  /** Whether the adapter supports native-level user location tracking. */
  nativeUserLocation: boolean;
  /** Whether sources/layers/images need replay after style reload (web). */
  styleReplay: boolean;
}

export const WEB_CAPABILITIES: MapCapabilities = {
  nativeUserLocation: false,
  styleReplay: true,
};

export const NATIVE_CAPABILITIES: MapCapabilities = {
  nativeUserLocation: true,
  styleReplay: false,
};

// ── Context value ───────────────────────────────────────────────────

export interface MapContextValue {
  /** Whether the map engine has finished loading and is ready for interaction. */
  ready: boolean;

  /** Which platform adapter is active. */
  adapterKind: AdapterKind;

  /** Capabilities of the current adapter. */
  capabilities: MapCapabilities;

  /**
   * Opaque reference to the underlying map engine.
   * - Web: `maplibre-gl.Map`
   * - Native: native MapView ref
   *
   * Platform-specific code should cast to the concrete type.
   * Never expose this in public types.
   */
  mapEngine: unknown;

  // ── Source registration ──────────────────────────────────────────
  registerSource: (entry: SourceEntry) => void;
  unregisterSource: (id: string) => void;

  // ── Layer registration ──────────────────────────────────────────
  registerLayer: (entry: LayerEntry) => void;
  unregisterLayer: (id: string) => void;

  // ── Image registration ──────────────────────────────────────────
  registerImage: (entry: ImageEntry) => void;
  unregisterImage: (id: string) => void;

  // ── Interactive source registration (for cursor: pointer on hover) ──
  registerInteractiveSource: (sourceId: string) => void;
  unregisterInteractiveSource: (sourceId: string) => void;

  /**
   * Shared SVG → bitmap rasterizer. `SvgImage`/`useRasterizedSvg` register icons
   * here; `MapView` renders the offscreen surfaces via `RasterizerHost`.
   */
  rasterizer: RasterStore;
}

// ── React context ───────────────────────────────────────────────────

export const MapContext = createContext<MapContextValue | null>(null);

/**
 * Internal hook — gives child components access to the map context.
 * Throws if used outside a MapView tree.
 */
export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMapContext must be used within a MapView");
  }
  return ctx;
}
