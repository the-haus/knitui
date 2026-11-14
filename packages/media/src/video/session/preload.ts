/**
 * Video preloading: fetch the start of a video before anyone presses play, so the
 * first frame is there when they do. The video counterpart of the audio `preload`,
 * with the same four functions.
 *
 * - **iOS / Android:** a short-lived, muted, view-less player opens the source with
 *   the on-disk cache turned on and buffers the first seconds into it, then goes
 *   away. When the real player later loads the same source it reads those bytes
 *   back from the cache ({@link withPreloadCache}). HLS is skipped on iOS, whose
 *   cache does not cover it.
 * - **Web:** a detached `<video preload="auto">` pulls the start of the file into
 *   the browser's HTTP cache, which the real element then hits. That depends on the
 *   server sending cacheable responses.
 *
 * Best effort by design: a preload that fails or is cut short only means playback
 * starts the ordinary way.
 */
import "../../shared/expo-globals";

import { isWeb } from "@knitui/core";
import { createVideoPlayer, type VideoPlayer } from "@knitui/media/native/video";

import { sourceUriOf } from "../../shared";
import type { VideoSource, VideoSourceObject } from "../types";

export interface VideoPreloadOptions {
  /** How many seconds to buffer ahead before the preload is done. Default `10`. */
  preferredForwardBufferDuration?: number;
}

/** How long one preload may run before it is cut off. */
const PRELOAD_TIMEOUT_MS = 20_000;
/** Preloads that run at once; the rest wait their turn. */
const MAX_CONCURRENT = 2;
/** Detached elements kept on web; the oldest is dropped past this. */
const MAX_WEB_ELEMENTS = 4;
const POLL_MS = 400;

/** Sources whose start is (being) cached, by URI. */
const preloaded = new Set<string>();
const inFlight = new Map<string, Promise<void>>();
/** Cancels for the preloads that are running or kept (web elements). */
const cancels = new Map<string, () => void>();
const waiting: (() => void)[] = [];
let running = 0;

function isRemote(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function isHls(source: VideoSource, uri: string): boolean {
  if (typeof source === "object" && source?.contentType === "hls") return true;
  return /\.m3u8(\?|#|$)/i.test(uri);
}

/** `process.env.EXPO_OS` is inlined at build time by babel-preset-expo. */
function isIOS(): boolean {
  return !isWeb && process.env.EXPO_OS === "ios";
}

/** Whether this source can be preloaded through the native cache. */
function cacheable(source: VideoSource, uri: string): boolean {
  if (!isRemote(uri)) return false;
  if (typeof source === "object" && source?.drm) return false;
  return !(isIOS() && isHls(source, uri));
}

/**
 * The source to hand the real player: with the cache on when its start was
 * preloaded into that cache, untouched otherwise.
 */
export function withPreloadCache(source: VideoSource): VideoSource {
  if (isWeb) return source;
  const uri = sourceUriOf(source);
  if (!uri || !preloaded.has(uri)) return source;
  const object: VideoSourceObject = typeof source === "object" && source ? source : { uri };
  return object.useCaching ? source : { ...object, useCaching: true };
}

function acquireSlot(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waiting.push(resolve));
}

function releaseSlot(): void {
  const next = waiting.shift();
  if (next) next();
  else running--;
}

function preloadNative(source: VideoSource, uri: string, seconds: number): Promise<void> {
  const object: VideoSourceObject = typeof source === "object" && source ? source : { uri };
  return new Promise((resolve) => {
    let player: VideoPlayer | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      if (poll !== null) clearInterval(poll);
      if (timeout !== null) clearTimeout(timeout);
      cancels.delete(uri);
      try {
        player?.release();
      } catch {
        // Already released with the runtime.
      }
      resolve();
    };
    cancels.set(uri, finish);
    try {
      player = createVideoPlayer({ ...object, useCaching: true, metadata: undefined });
      player.muted = true;
      player.staysActiveInBackground = false;
      player.showNowPlayingNotification = false;
      player.keepScreenOnWhilePlaying = false;
      player.bufferOptions = { ...player.bufferOptions, preferredForwardBufferDuration: seconds };
    } catch {
      finish();
      return;
    }
    const warm = player;
    poll = setInterval(() => {
      const failed = warm.status === "error";
      const duration = warm.duration;
      const target = duration > 0 ? Math.min(seconds, duration) : seconds;
      // A little short of the target counts: players stop a touch before it.
      if (failed || (warm.status === "readyToPlay" && warm.bufferedPosition >= target - 1))
        finish();
    }, POLL_MS);
    timeout = setTimeout(finish, PRELOAD_TIMEOUT_MS);
  });
}

function preloadWeb(uri: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(settle, PRELOAD_TIMEOUT_MS);
    video.addEventListener("canplaythrough", settle, { once: true });
    video.addEventListener("error", settle, { once: true });
    cancels.set(uri, () => {
      settle();
      // Dropping the source is what makes the browser stop fetching.
      video.removeAttribute("src");
      video.load();
    });
    video.src = uri;
    video.load();

    // Keep only the newest few elements alive (Map keeps insertion order).
    if (cancels.size > MAX_WEB_ELEMENTS) {
      const oldest = cancels.keys().next().value;
      if (oldest !== undefined && oldest !== uri) {
        cancels.get(oldest)?.();
        cancels.delete(oldest);
        preloaded.delete(oldest);
      }
    }
  });
}

/**
 * Preload the start of a video. Resolves when enough is buffered, when the preload
 * gives up, or at once for a source that cannot be preloaded (a local file, DRM).
 * Calling it again for the same source joins the preload already running.
 */
export function preload(source: VideoSource, options: VideoPreloadOptions = {}): Promise<void> {
  const uri = sourceUriOf(source);
  if (!uri) return Promise.resolve();
  const existing = inFlight.get(uri);
  if (existing) return existing;
  if (preloaded.has(uri)) return Promise.resolve();
  if (isWeb ? !isRemote(uri) && !uri.startsWith("/") : !cacheable(source, uri)) {
    return Promise.resolve();
  }

  const seconds = Math.max(1, options.preferredForwardBufferDuration ?? 10);
  preloaded.add(uri);
  const task = acquireSlot()
    .then(() => {
      // Cleared while it waited for a slot.
      if (!preloaded.has(uri)) return undefined;
      return isWeb ? preloadWeb(uri) : preloadNative(source, uri, seconds);
    })
    .finally(() => {
      inFlight.delete(uri);
      releaseSlot();
    });
  inFlight.set(uri, task);
  return task;
}

/** Stop preloading a source and forget it. Bytes already cached stay cached. */
export function clearPreloadedSource(source: VideoSource): Promise<void> {
  const uri = sourceUriOf(source);
  if (uri) {
    preloaded.delete(uri);
    cancels.get(uri)?.();
    cancels.delete(uri);
  }
  return Promise.resolve();
}

export function clearAllPreloadedSources(): Promise<void> {
  preloaded.clear();
  for (const cancel of [...cancels.values()]) cancel();
  cancels.clear();
  return Promise.resolve();
}

/** The URIs that are preloaded or being preloaded. */
export function getPreloadedSources(): Promise<string[]> {
  return Promise.resolve([...preloaded]);
}
