/**
 * Platform-free contract for audio preloading. The single, cross-platform
 * {@link ./preload} implementation (over expo-audio) backs it. Mirrors
 * expo-audio's `preload` / `clearPreloadedSource` / `clearAllPreloadedSources` /
 * `getPreloadedSources`.
 */
export interface PreloadOptions {
  /** Seconds to buffer ahead. Default ~10 (native); ignored on web. */
  preferredForwardBufferDuration?: number;
}
