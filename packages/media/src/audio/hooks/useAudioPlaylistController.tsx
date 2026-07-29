/**
 * Headless `useAudioPlaylistController` hook. The playlist is a QUEUE over the ONE
 * shared audio engine — NOT a second player. It registers a slot in the same
 * {@link ../session/audio-engine shared session} as `<Audio>` (so there is one
 * `<audio>` for the whole app and the two are mutually exclusive), wraps the slot
 * facade in a {@link SessionAudioPlaylistController}, and exposes a snapshot
 * `store` (read slices with `useMediaSelector`).
 *
 * Mirrors {@link ./useAudioController}'s wiring: stable id → `getFacade` →
 * commit-phase `register`/`unregister` → declarative prop syncs through refs.
 * Cross-platform — the shared engine resolves `expo-audio` per platform.
 */
import * as React from "react";

import type { MediaStore } from "../../core/react/useMediaSelector";
import { useDeclarativeMediaSync, useSlotRegistration } from "../../core/react/useMediaSlot";
import type { AudioPlaylistState } from "../controller/playlist-controller-base";
import { SessionAudioPlaylistController } from "../controller/session-playlist-controller";
import { useAudioEngine } from "../session/audio-engine";
import type {
  UseAudioPlaylistControllerOptions,
  UseAudioPlaylistControllerResult,
} from "./useAudioPlaylistController.shared";

/** The declarative props folded into the slot descriptor's config bag. */
function configBag(options: UseAudioPlaylistControllerOptions): Record<string, unknown> {
  // NB: NOT `loop` — the playlist owns looping (advance / replay on track end), so
  // the slot's single-track loop must stay off or a track would repeat forever and
  // never fire `playToEnd`.
  return {
    volume: options.volume,
    muted: options.muted,
    playbackRate: options.playbackRate,
  };
}

export function useAudioPlaylistController(
  options: UseAudioPlaylistControllerOptions = {},
): UseAudioPlaylistControllerResult {
  const engine = useAudioEngine();
  const id = React.useId();

  // The shared-engine slot facade for this playlist (stable across renders).
  const facade = React.useMemo(() => engine.getFacade(id), [engine, id]);

  const controller = React.useMemo(
    () =>
      new SessionAudioPlaylistController(facade, {
        sources: options.sources ?? [],
        loop: options.loop ?? "none",
      }),
    // Sources/loop are applied via the effects below, not by rebuilding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [facade],
  );

  // Register the slot in the COMMIT phase (see useSlotRegistration). The playlist
  // seeds the slot with its first track; the queue itself lives on the controller.
  useSlotRegistration(engine.session, id, () => ({
    source: (options.sources ?? [])[0] ?? null,
    config: configBag(options),
  }));

  React.useEffect(() => () => controller.dispose(), [controller]);

  // Snapshot store bound to this controller. `subscribeKeys` gives the chrome
  // state-level isolation: a per-frame `currentTime` tick wakes only the Scrubber
  // / TimeDisplay, never the queue (`tracks` / `currentIndex`) or transport leaves.
  const store = React.useMemo<MediaStore<AudioPlaylistState>>(
    () => ({
      subscribe: (listener) => controller.subscribe(listener),
      getSnapshot: () => controller.state,
      subscribeKeys: (keys, listener) => controller.subscribeKeys(keys, listener),
    }),
    [controller],
  );

  // Keep the queue in sync with the `sources` prop (skip the first run — register
  // + the controller's initial queue already reflect it).
  const sourcesKey = JSON.stringify(options.sources ?? []);
  const firstSources = React.useRef(true);
  React.useEffect(() => {
    if (firstSources.current) {
      firstSources.current = false;
      return;
    }
    controller.setSources(options.sources ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, sourcesKey]);

  // Declarative property syncs (stored on the slot while inactive, applied live
  // when active). The playlist owns `loop` as a queue MODE (not the slot's
  // single-track boolean), so it syncs onto the controller here.
  useDeclarativeMediaSync(controller, {
    loop: options.loop,
    muted: options.muted,
    volume: options.volume,
    playbackRate: options.playbackRate,
  });

  // `facade` rides along as `player`: the queue contract can't express the
  // PLAYER-level surfaces (PCM sampling for a visualizer), and the slot id is an
  // internal `useId` no caller could pass to `getFacade`. See the result type.
  return { controller, store, player: facade };
}
