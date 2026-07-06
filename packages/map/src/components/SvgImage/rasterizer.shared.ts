/**
 * Cross-platform SVG → bitmap rasterizer, shared by web and native.
 *
 * MapLibre draws markers as GPU symbols (`SymbolLayer` `iconImage`), and a symbol
 * needs a raster bitmap, not an SVG. Neither engine decodes SVG icons directly —
 * so we rasterize each distinct SVG **once** via `react-native-svg` (`toDataURL`)
 * and register the resulting PNG as a named image. Thousands of markers then reuse
 * that single texture on the GPU; no per-marker DOM/native view is ever created.
 *
 * The rasterization surface (an offscreen `<SvgXml>`) must be mounted somewhere it
 * reliably paints. The engine's own map view is *not* such a place — on the New
 * Architecture a react-native-svg view nested inside the native MapView often
 * isn't painted on the frames we snapshot, so the capture silently returns empty
 * bytes and no icon ever appears. This store decouples *who wants a raster*
 * (`SvgImage`, deep inside the map tree) from *where it is drawn* (`RasterizerHost`,
 * a sibling of the map view). They communicate through this subscription store
 * rather than through React tree position, so the surface lives outside the map
 * view and paints normally.
 */

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { resolveSvgSize, type SvgToImageOptions } from "../../svg/svgToImage";
import { useMapContext } from "../MapView/MapView.context";

/** Minimal shape of a react-native-svg `Svg` instance we rasterize through. */
export interface CapturableSvg {
  toDataURL: (
    callback: (base64: string) => void,
    options?: { width?: number; height?: number },
  ) => void;
}

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decode the first `maxBytes` bytes of a base64 string (skips `=`/whitespace). */
function decodeBase64Prefix(b64: string, maxBytes: number): number[] {
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < b64.length && out.length < maxBytes; i++) {
    const v = B64_ALPHABET.indexOf(b64[i]);
    if (v < 0) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return out;
}

/**
 * The bitmap's real pixel width, read from the PNG `IHDR` chunk (a big-endian
 * uint32 at byte offset 16). react-native-svg's `toDataURL` does **not** always
 * produce a bitmap of the requested dimensions: on iOS it bakes in
 * `UIScreen.scale` (a 60pt request yields a 180px bitmap on a @3x device), while
 * Android and web produce exactly the requested pixels. Reading the true width
 * lets us register the correct density so the icon draws at its logical size on
 * every platform. Returns `undefined` if the bytes aren't a decodable PNG header.
 */
export function pngPixelWidth(base64: string): number | undefined {
  const bytes = decodeBase64Prefix(base64, 24);
  if (bytes.length < 20 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return undefined;
  const w = ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0;
  return w > 0 ? w : undefined;
}

/** A distinct rasterization job. Multiple consumers of the same icon share one. */
export interface RasterRequest {
  /** Content key — identical `(svg, width, height)` triples collapse to one job. */
  key: string;
  svg: string;
  width: number;
  height: number;
}

/** A resolved raster: its data URI plus the bitmap's real pixel width. */
export interface ResolvedRaster {
  uri: string;
  /** Actual PNG pixel width (may exceed the requested width on iOS — see {@link pngPixelWidth}). */
  pixelWidth?: number;
}

export interface RasterStore {
  /** Register interest in a raster. Ref-counted; first caller mounts the surface. */
  acquire: (req: RasterRequest) => void;
  /** Drop interest. When the last consumer leaves, the surface unmounts. */
  release: (key: string) => void;
  /** Called by the host once a surface has produced a PNG data URI. */
  resolve: (key: string, uri: string, pixelWidth?: number) => void;
  /** The current PNG data URI for a key, or `undefined` until it resolves. */
  getUri: (key: string) => string | undefined;
  /** The current resolved raster (uri + real pixel width), or `undefined`. Stable reference. */
  getResolved: (key: string) => ResolvedRaster | undefined;
  /** Stable snapshot of the surfaces the host should currently render. */
  getRequests: () => RasterRequest[];
  /** Subscribe to any change (request list or a resolved uri). */
  subscribe: (listener: () => void) => () => void;
}

/**
 * Stable, short content key for a rasterization job. djb2 over the markup plus the
 * pixel dimensions — identical icons at the same size dedupe to one GPU texture.
 */
export function keyFor(svg: string, width: number, height: number): string {
  let hash = 5381;
  for (let i = 0; i < svg.length; i++) {
    hash = ((hash << 5) + hash + svg.charCodeAt(i)) | 0;
  }
  return `${width}x${height}@${(hash >>> 0).toString(36)}`;
}

interface Slot {
  req: RasterRequest;
  refs: number;
  resolved?: ResolvedRaster;
}

export function createRasterStore(): RasterStore {
  const slots = new Map<string, Slot>();
  const listeners = new Set<() => void>();

  // useSyncExternalStore requires getRequests to return a referentially-stable
  // value between notifications, or it loops forever. Rebuild the snapshot only
  // when the set of live surfaces actually changes.
  let snapshot: RasterRequest[] = [];
  const rebuildSnapshot = (): void => {
    snapshot = Array.from(slots.values(), (s) => s.req);
  };

  const emit = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    acquire(req) {
      const existing = slots.get(req.key);
      if (existing) {
        existing.refs += 1;
        return;
      }
      slots.set(req.key, { req, refs: 1 });
      rebuildSnapshot();
      emit();
    },

    release(key) {
      const slot = slots.get(key);
      if (!slot) return;
      slot.refs -= 1;
      if (slot.refs <= 0) {
        slots.delete(key);
        rebuildSnapshot();
        emit();
      }
    },

    resolve(key, uri, pixelWidth) {
      const slot = slots.get(key);
      // Ignore late captures for surfaces that were released, and no-op if the
      // uri is unchanged so we don't wake subscribers for nothing.
      if (!slot || slot.resolved?.uri === uri) return;
      slot.resolved = { uri, pixelWidth };
      emit();
    },

    getUri(key) {
      return slots.get(key)?.resolved?.uri;
    },

    getResolved(key) {
      return slots.get(key)?.resolved;
    },

    getRequests() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * How many frames to keep retrying `toDataURL` for. The offscreen `Svg` may not be
 * attached (ref still null) or painted (empty bytes) on the first frame — on the
 * New Architecture especially — so a single capture races the draw. ~30 frames
 * (a few hundred ms) is plenty for the surface to exist and paint.
 */
const MAX_CAPTURE_ATTEMPTS = 30;

/**
 * Drive a react-native-svg surface to a PNG data URI, retrying across frames until
 * the view is attached and painted. Platform-agnostic: both the web and native
 * `Svg` instances expose the same `toDataURL(cb, {width,height})` contract and
 * hand back **raw base64** (no data-URI prefix). Returns a cleanup that cancels
 * any pending frame so a captured-then-unmounted surface can't call back.
 */
export function runCapture(
  ref: { current: CapturableSvg | null },
  size: { width: number; height: number },
  onCapture: (uri: string, pixelWidth?: number) => void,
): () => void {
  let cancelled = false;
  let attempts = 0;
  let raf = 0;

  const schedule = (): void => {
    raf = requestAnimationFrame(attempt);
  };

  const attempt = (): void => {
    if (cancelled) return;

    const node = ref.current;
    if (!node) {
      if (attempts++ < MAX_CAPTURE_ATTEMPTS) schedule();
      return;
    }

    node.toDataURL(
      (base64) => {
        if (cancelled) return;
        if (base64) {
          onCapture(`data:image/png;base64,${base64}`, pngPixelWidth(base64));
        } else if (attempts++ < MAX_CAPTURE_ATTEMPTS) {
          schedule();
        }
      },
      { width: size.width, height: size.height },
    );
  };

  schedule();

  return () => {
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
  };
}

/** A ready rasterized icon: its data URI and the density to register it with. */
export interface RasterizedSvg {
  uri: string;
  /**
   * Density to register the bitmap with (`bitmap px ÷ scale = logical size`), so
   * the icon draws at its logical `width`/`height` on every platform. Derived from
   * the bitmap's **real** pixel width, which absorbs any device-scale factor a
   * platform bakes into `toDataURL` (notably iOS `UIScreen.scale`).
   */
  scale: number;
}

/**
 * Rasterize `svg` to a PNG data URI via the map's rasterizer host, returning the
 * uri and its density scale once ready (`undefined` until then). Ref-counts the
 * underlying surface so identical icons are rasterized once and shared. Pass
 * `null`/`undefined` markup (e.g. while a remote SVG is still loading, or for a
 * raster passthrough) to opt out — the hook then does nothing and returns
 * `undefined`.
 */
export function useRasterizedSvg(
  svg: string | null | undefined,
  options: SvgToImageOptions = {},
): RasterizedSvg | undefined {
  const { rasterizer } = useMapContext();
  const { width, height, pixelRatio } = options;
  const ratio = pixelRatio ?? 1;

  const request = useMemo<RasterRequest | null>(() => {
    if (!svg) return null;
    const size = resolveSvgSize(svg, { width, height, pixelRatio });
    if (size.width <= 0 || size.height <= 0) return null;
    return {
      key: keyFor(svg, size.width, size.height),
      svg,
      width: size.width,
      height: size.height,
    };
  }, [svg, width, height, pixelRatio]);

  useEffect(() => {
    if (!request) return;
    rasterizer.acquire(request);
    return () => rasterizer.release(request.key);
  }, [rasterizer, request]);

  const resolved = useSyncExternalStore(
    rasterizer.subscribe,
    () => (request ? rasterizer.getResolved(request.key) : undefined),
    () => undefined,
  );

  return useMemo<RasterizedSvg | undefined>(() => {
    if (!resolved || !request) return undefined;
    // The bitmap is `request.width` px wide only when the platform honours the
    // requested size (Android/web). When it bakes an extra device factor (iOS),
    // the real width is larger — derive the scale from it so the logical size
    // (`bitmap px ÷ scale`) equals the intended `width`/`height` everywhere.
    // logical = request.width / ratio, so scale = realWidth / logical = realWidth * ratio / request.width.
    const realWidth = resolved.pixelWidth ?? request.width;
    const scale = (realWidth * ratio) / request.width;
    return { uri: resolved.uri, scale };
  }, [resolved, request, ratio]);
}
