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

/**
 * How many resolved rasters to keep after their last consumer leaves.
 *
 * `release()` drops the slot, which used to throw the finished bitmap away with
 * it: unmounting and remounting an icon (a filter toggle, a tab switch) forced a
 * fresh rasterization AND a `removeImage`/`addImage` round trip — and removing an
 * image a symbol layer references makes MapLibre redo symbol placement. Icons are
 * a small, bounded set (a per-category marker sheet), so keeping the last N data
 * URIs keyed by the existing content key makes a remount free.
 */
const RESOLVED_CACHE_LIMIT = 64;

export function createRasterStore(): RasterStore {
  const slots = new Map<string, Slot>();
  const listeners = new Set<() => void>();
  /** Content key → resolved raster, insertion-ordered (used as an LRU). */
  const resolvedCache = new Map<string, ResolvedRaster>();

  const cacheGet = (key: string): ResolvedRaster | undefined => {
    const hit = resolvedCache.get(key);
    if (hit) {
      // Touch: re-insert so this key becomes the most recently used.
      resolvedCache.delete(key);
      resolvedCache.set(key, hit);
    }
    return hit;
  };

  const cachePut = (key: string, value: ResolvedRaster): void => {
    resolvedCache.delete(key);
    resolvedCache.set(key, value);
    if (resolvedCache.size > RESOLVED_CACHE_LIMIT) {
      const oldest = resolvedCache.keys().next();
      if (!oldest.done) resolvedCache.delete(oldest.value);
    }
  };

  // useSyncExternalStore requires getRequests to return a referentially-stable
  // value between notifications, or it loops forever. Rebuild the snapshot only
  // when the set of live surfaces actually changes.
  //
  // Only UNRESOLVED slots make it into the snapshot. A surface exists solely to
  // produce a bitmap, so once it has, `RasterizerHost` must stop rendering it —
  // it used to keep every `<SvgXml>` mounted for the map's whole lifetime, and on
  // native those are real view trees with `collapsable={false}` that Android walks
  // on every layout pass.
  let snapshot: RasterRequest[] = [];
  const rebuildSnapshot = (): void => {
    const next: RasterRequest[] = [];
    for (const slot of slots.values()) {
      if (!slot.resolved) next.push(slot.req);
    }
    snapshot = next;
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
      // A cache hit means no surface has to mount at all — the slot is born
      // resolved, so `rebuildSnapshot` leaves it out.
      slots.set(req.key, { req, refs: 1, resolved: cacheGet(req.key) });
      rebuildSnapshot();
      emit();
    },

    release(key) {
      const slot = slots.get(key);
      if (!slot) return;
      slot.refs -= 1;
      if (slot.refs <= 0) {
        // The bitmap itself survives in `resolvedCache`, so a remount of the same
        // icon doesn't re-rasterize (and doesn't churn the map's image registry).
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
      cachePut(key, slot.resolved);
      // Drops the now-redundant surface from the render snapshot. Safe to unmount
      // only at this point — `runCapture`'s retry loop needs the surface mounted
      // until it actually succeeds.
      rebuildSnapshot();
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
 * How many EAGER retries of `toDataURL` before dropping to the patient cadence
 * below. The offscreen `Svg` may not be attached (ref still null) or painted
 * (empty bytes) yet — on the New Architecture especially — so a single capture
 * races the draw.
 *
 * With {@link CAPTURE_BACKOFF_LIMIT_FRAMES} the eager *window* is ~80 frames
 * (1+2+4+8×9), longer than the old flat 30, while the number of native view
 * snapshots per icon drops from 30 to 12.
 *
 * This is NOT a budget after which the capture fails — see
 * {@link CAPTURE_IDLE_INTERVAL_FRAMES}.
 */
const MAX_CAPTURE_ATTEMPTS = 12;

/** Cap on the geometric backoff between eager attempts, in animation frames. */
const CAPTURE_BACKOFF_LIMIT_FRAMES = 8;

/**
 * Cadence, in animation frames, that a capture falls back to once the eager
 * window is spent — and keeps for as long as its surface stays mounted.
 *
 * ── WHY GIVING UP IS NOT AN OPTION ────────────────────────────────────────────
 * Exhausting {@link MAX_CAPTURE_ATTEMPTS} used to END the job: it released the
 * concurrency slot and returned without ever calling `onCapture`. Nothing
 * re-requested it, so the store slot stayed unresolved forever, `SvgImage`
 * registered no MapLibre image, and every `SymbolLayer` drawing that icon
 * silently drew NOTHING for the rest of the session. No log, no error, no retry.
 *
 * That is not a hypothetical. The eager window assumes the surface is racing its
 * FIRST draw and will win within ~80 frames. A surface that is not being drawn at
 * all breaks the assumption instead of losing the race: a map mounted offscreen to
 * warm its GL context, a screen frozen by `freezeOnBlur`, an Android view pruned
 * before it painted. Those all resolve LATER — the map is shown, the screen
 * thaws — at which point the very next attempt would succeed. Ending the job
 * throws that away, and turns a transient condition into a permanent one.
 *
 * So the eager window is now only a change of PACE. Past it the job hands its
 * concurrency slot back (a surface that isn't painting must never keep a
 * faster-succeeding icon queued behind it — with four icons and a cap of three,
 * holding the slot would deadlock the queue) and keeps polling at this wider
 * interval until it succeeds or the surface unmounts.
 *
 * ~1 s at 60 fps: cheap enough to leave running for a map's whole lifetime (one
 * snapshot per second per stuck icon), tight enough that recovery is invisible
 * once the surface does paint. Deliberately FIXED rather than growing — a backoff
 * that decays would make the pathological case cheaper at the cost of the
 * recovery latency this exists to bound.
 */
const CAPTURE_IDLE_INTERVAL_FRAMES = 60;

/**
 * How many captures may be in flight at once.
 *
 * `toDataURL` is a synchronous native view snapshot. Retrying every icon once per
 * frame meant ~30 category icons × up to 30 frames = up to 900 snapshots in the
 * ~500 ms right after mount — precisely when MapLibre is loading its first tiles
 * and doing initial symbol placement. Draining a queue a few at a time spreads
 * that out without delaying the first icons.
 */
const MAX_CONCURRENT_CAPTURES = 3;

let activeCaptures = 0;
const captureQueue: Array<() => void> = [];

function pumpCaptureQueue(): void {
  while (activeCaptures < MAX_CONCURRENT_CAPTURES && captureQueue.length > 0) {
    const start = captureQueue.shift()!;
    activeCaptures += 1;
    start();
  }
}

/**
 * Drive a react-native-svg surface to a PNG data URI, retrying across frames until
 * the view is attached and painted. Platform-agnostic: both the web and native
 * `Svg` instances expose the same `toDataURL(cb, {width,height})` contract and
 * hand back **raw base64** (no data-URI prefix).
 *
 * Retries in two paces: an eager, geometrically-backed-off window
 * ({@link MAX_CAPTURE_ATTEMPTS}) that wins the usual race against the first draw,
 * then an indefinite patient poll ({@link CAPTURE_IDLE_INTERVAL_FRAMES}) for a
 * surface that is not being drawn *yet*. It does not give up — read
 * {@link CAPTURE_IDLE_INTERVAL_FRAMES} before adding a failure path, because the
 * one this replaced lost every pin on a map warmed offscreen.
 *
 * Concurrency-capped — see {@link MAX_CONCURRENT_CAPTURES}; a job holds its slot
 * only for the eager window. Returns a cleanup that cancels any pending frame (and
 * gives up the queue slot) so a captured-then-unmounted surface can't call back.
 */
export function runCapture(
  ref: { current: CapturableSvg | null },
  size: { width: number; height: number },
  onCapture: (uri: string, pixelWidth?: number) => void,
): () => void {
  let cancelled = false;
  let attempts = 0;
  let raf = 0;
  let backoff = 1;
  let started = false;
  let slotReleased = false;
  let warnedPatient = false;

  /**
   * Hand back this job's concurrency slot (or dequeue it if it never started).
   *
   * Deliberately NOT "the job is over": a job also releases its slot when it drops
   * to the patient cadence and keeps polling. Conflating the two is what made
   * exhaustion terminal.
   */
  const releaseSlot = (): void => {
    if (slotReleased) return;
    slotReleased = true;
    if (started) {
      activeCaptures -= 1;
      pumpCaptureQueue();
      return;
    }
    const queued = captureQueue.indexOf(start);
    if (queued >= 0) captureQueue.splice(queued, 1);
  };

  /** Run `attempt` after `frames` animation frames. */
  const scheduleIn = (frames: number): void => {
    let remaining = frames;
    const tick = (): void => {
      if (cancelled) return;
      remaining -= 1;
      if (remaining > 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      raf = 0;
      attempt();
    };
    raf = requestAnimationFrame(tick);
  };

  const retry = (): void => {
    if (attempts++ >= MAX_CAPTURE_ATTEMPTS) {
      // Past the eager window: give the slot back so nothing queues behind a
      // surface that isn't painting, then keep trying, slowly, indefinitely.
      releaseSlot();
      // `typeof` guarded, not a bare `__DEV__`: this branch is reachable under a
      // plain test runner or any consumer whose bundler does not define the global,
      // where a bare reference is a ReferenceError — and throwing here would turn a
      // slow icon into a crash. Same form `components/UserLocation` uses.
      if (typeof __DEV__ !== "undefined" && __DEV__ && !warnedPatient) {
        warnedPatient = true;
        console.warn(
          `SvgImage: a ${size.width}×${size.height} surface has not rasterized in ` +
            `${MAX_CAPTURE_ATTEMPTS} attempts — still retrying every ` +
            `${CAPTURE_IDLE_INTERVAL_FRAMES} frames. The usual cause is a host that ` +
            `is mounted but never drawn (a map warmed offscreen, a frozen screen), ` +
            `so the icon appears as soon as it paints.`,
        );
      }
      scheduleIn(CAPTURE_IDLE_INTERVAL_FRAMES);
      return;
    }
    backoff = Math.min(backoff * 2, CAPTURE_BACKOFF_LIMIT_FRAMES);
    scheduleIn(backoff);
  };

  const attempt = (): void => {
    if (cancelled) return;

    const node = ref.current;
    if (!node) {
      retry();
      return;
    }

    node.toDataURL(
      (base64) => {
        if (cancelled) return;
        if (base64) {
          onCapture(`data:image/png;base64,${base64}`, pngPixelWidth(base64));
          // Success is the one place the job really is over: nothing is
          // rescheduled after this, so releasing the slot ends it.
          releaseSlot();
        } else {
          retry();
        }
      },
      { width: size.width, height: size.height },
    );
  };

  const start = (): void => {
    started = true;
    scheduleIn(1);
  };

  captureQueue.push(start);
  pumpCaptureQueue();

  return () => {
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
    releaseSlot();
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

// React Native's global dev flag, matching how the rest of the package guards
// developer-only logging (see `svg/resource.ts`, `components/Images`). Declared
// rather than imported: the bundlers inline it, and on web `@knitui/plugins`
// defines it.
declare const __DEV__: boolean;
