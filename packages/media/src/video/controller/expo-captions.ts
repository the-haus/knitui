/**
 * Custom (sidecar) caption pipeline for {@link ExpoVideoController}. `expo-video`
 * can't load external `textTracks`, so the controller fetches + parses them and
 * paints the active cue with the kit's own overlay. This file owns that logic —
 * the sidecar fetch/parse and the active-cue recomputation — operating on the
 * controller's caption state via the {@link CaptionHost} contract. Behavior is
 * identical to the inlined version.
 */
import { activeCueText, type Cue, decodeDataUri, parseCues } from "../engine";
import type { VideoControllerState, VideoTextTrack } from "../types";

/** The controller's caption state + plumbing the pipeline reads/writes. */
export interface CaptionHost {
  /** synthetic id → parsed cues (lazily fetched on first selection). */
  readonly captionCuesById: Map<string, Cue[]>;
  /** synthetic id (`custom:N`) → the sidecar track descriptor. */
  readonly customTrackById: Map<string, VideoTextTrack>;
  /** The selected custom track id, or `null` when a custom track isn't active. */
  readonly activeCustomId: string | null;
  /** Generation counter so a slow cue fetch can't apply after switching away. */
  loadToken: number;
  readonly state: VideoControllerState;
  setState(patch: Partial<VideoControllerState>): void;
}

/** Fetch + parse a custom track's cues once, then refresh the active cue. */
export async function ensureCuesLoaded(host: CaptionHost, id: string): Promise<void> {
  if (host.captionCuesById.has(id)) {
    updateActiveCue(host);
    return;
  }
  const track = host.customTrackById.get(id);
  if (!track) return;
  const token = ++host.loadToken;
  try {
    const text = await loadCueText(track.src);
    if (token !== host.loadToken) return;
    host.captionCuesById.set(id, parseCues(text));
  } catch {
    // A failed fetch yields no cues; cache the empty result so we don't retry.
    if (token !== host.loadToken) return;
    host.captionCuesById.set(id, []);
  }
  if (host.activeCustomId === id) updateActiveCue(host);
}

/** Recompute the cue to paint from the active custom track + current time. */
export function updateActiveCue(host: CaptionHost): void {
  if (host.activeCustomId === null) {
    if (host.state.activeCueText !== null) host.setState({ activeCueText: null });
    return;
  }
  const cues = host.captionCuesById.get(host.activeCustomId);
  if (!cues) return; // not loaded yet — overlay stays hidden until it is
  host.setState({ activeCueText: activeCueText(cues, host.state.currentTime) });
}

/* caption loading ----------------------------------------------------------- */

/**
 * Read a sidecar caption file to text. `data:` URIs are decoded inline (RN's
 * `fetch` doesn't reliably handle them); everything else goes over the network.
 */
async function loadCueText(src: string): Promise<string> {
  const inline = decodeDataUri(src);
  if (inline != null) return inline;
  const response = await fetch(src);
  return response.text();
}
