/**
 * Audio preloading — a thin, cross-platform pass-through to `expo-audio`.
 * `expo-audio` resolves to its native module on device and to its `.web` backend
 * in the browser, where `preload` caches a detached, pre-buffering
 * `HTMLAudioElement` (blob-backed). A SINGLE file drives both; the expo functions
 * return synchronously, so we wrap them to keep the package's `Promise`-based
 * contract uniform across call sites.
 */
import {
  clearPreloadedSource as expoClear,
  clearAllPreloadedSources as expoClearAll,
  getPreloadedSources as expoGet,
  preload as expoPreload,
} from "expo-audio";

import type { AudioSource } from "../types";
import type { PreloadOptions } from "./preload.shared";

export function preload(source: AudioSource, options: PreloadOptions = {}): Promise<void> {
  expoPreload(source as Parameters<typeof expoPreload>[0], options);
  return Promise.resolve();
}

export function clearPreloadedSource(source: AudioSource): Promise<void> {
  expoClear(source as Parameters<typeof expoClear>[0]);
  return Promise.resolve();
}

export function clearAllPreloadedSources(): Promise<void> {
  expoClearAll();
  return Promise.resolve();
}

export function getPreloadedSources(): Promise<string[]> {
  return Promise.resolve(expoGet());
}
