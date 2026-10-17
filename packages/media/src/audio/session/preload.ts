/**
 * Audio preloading — WEB: fetch the source once into a blob URL and keep a
 * pre-buffering `HTMLAudioElement` on it; the kit's web player picks the blob up
 * when it is handed that source. The native build passes through to expo-audio
 * (`preload.native.ts`).
 */
import { mediaSourceUri } from "../../shared/web-media";
import type { AudioSource } from "../types";
import { webPreloadCache } from "../web/web-audio-player";
import type { PreloadOptions } from "./preload.shared";

/**
 * Starts buffering and resolves at once, as the native backend does: the blob
 * is used by the next player handed this source once it has arrived.
 */
export function preload(source: AudioSource, _options: PreloadOptions = {}): Promise<void> {
  void fetchIntoCache(source);
  return Promise.resolve();
}

async function fetchIntoCache(source: AudioSource): Promise<void> {
  const uri = mediaSourceUri(source);
  if (!uri || webPreloadCache.has(uri)) return;
  const headers =
    source && typeof source === "object" && "headers" in source
      ? (source as { headers?: Record<string, string> }).headers
      : undefined;
  try {
    const response = await fetch(uri, headers ? { headers } : undefined);
    const blobUrl = URL.createObjectURL(await response.blob());
    const audio = new Audio(blobUrl);
    audio.preload = "auto";
    webPreloadCache.set(uri, { blobUrl, audio });
  } catch {
    // A failed preload just means the source streams when played.
  }
}

export function clearPreloadedSource(source: AudioSource): Promise<void> {
  const uri = mediaSourceUri(source);
  const cached = uri ? webPreloadCache.get(uri) : undefined;
  if (uri && cached) {
    URL.revokeObjectURL(cached.blobUrl);
    webPreloadCache.delete(uri);
  }
  return Promise.resolve();
}

export function clearAllPreloadedSources(): Promise<void> {
  for (const cached of webPreloadCache.values()) URL.revokeObjectURL(cached.blobUrl);
  webPreloadCache.clear();
  return Promise.resolve();
}

export function getPreloadedSources(): Promise<string[]> {
  return Promise.resolve([...webPreloadCache.keys()]);
}
