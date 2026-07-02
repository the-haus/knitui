/**
 * The single cross-domain media context. One {@link MediaProvider} owns BOTH
 * shared engines (audio + video) and exposes them here, so every `<Audio>` /
 * `<Video>` shares ONE real `<audio>` / `<video>` element per medium and the host
 * app has a single source of "what's playing".
 *
 * This module is intentionally leaf-level — it imports only React + engine TYPES,
 * so the provider, the player roots, and the per-domain engine hooks can all
 * depend on it without an import cycle.
 */
import * as React from "react";

import type { AudioEngine } from "../audio/session/audio-engine.shared";
import type { VideoEngine } from "../video/session/video-engine.shared";

/** The pair of shared engines a {@link MediaProvider} owns. */
export interface MediaEngines {
  audio: AudioEngine;
  video: VideoEngine;
}

export const MediaContext = React.createContext<MediaEngines | null>(null);

/** Read both shared engines. Returns `null` when no {@link MediaProvider} wraps. */
export function useMediaEngines(): MediaEngines | null {
  return React.useContext(MediaContext);
}

/** The Portal host name a `<Video>` exposes for the shared `<video>` surface. */
export function videoHostName(id: string): string {
  return `knitui-video-host:${id}`;
}

/** The Portal host name an `<Audio>` exposes for the shared (hidden) `<audio>` surface. */
export function audioHostName(id: string): string {
  return `knitui-audio-host:${id}`;
}

/**
 * Dev-only guard: warns once (per player mount) when a player renders with no
 * {@link MediaProvider} in context. Without the provider no surface is mounted,
 * so the real element never attaches and the player stays blank/silent — this
 * turns that silent failure into an actionable message.
 */
export function useRequireMediaProvider(component: "Audio" | "Video"): void {
  const engines = React.useContext(MediaContext);
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!engines) {
      console.warn(
        `[@knitui/media] <${component}> is rendered without a <MediaProvider> ancestor. ` +
          `Mount <MediaProvider> once near your app root so the shared media element ` +
          `has a host to render into — otherwise the player stays blank/silent.`,
      );
    }
  }, [engines, component]);
}
