/**
 * The headless `useAudioController` hook. Instead of minting its own controller,
 * it joins the SHARED audio engine: it registers a player slot (keyed by a stable
 * id), mirrors the engine's snapshot for that slot into React, and returns a
 * per-player facade. Playing one `<Audio>` switches the single shared `<audio>`
 * to its source; the rest go idle, remembering their position.
 *
 * The shared-engine wiring lives in {@link createMediaControllerHook}; this module
 * supplies only the audio deltas — the engine accessor, the descriptor config
 * bag, and the sampling sync effect.
 */
import * as React from "react";

import {
  createMediaControllerHook,
  type MediaControllerHookContext,
} from "../../core/react/createMediaControllerHook";
import type { AudioController } from "../controller/audio-controller-base";
import { useAudioEngine } from "../session/audio-engine";
import type { AudioControllerState, AudioSource } from "../types";
import type {
  UseAudioControllerOptions,
  UseAudioControllerResult,
} from "./useAudioController.shared";

/** The declarative props folded into the registry descriptor's config bag. */
function configBag(options: UseAudioControllerOptions): Record<string, unknown> {
  return {
    volume: options.volume,
    muted: options.muted,
    loop: options.loop,
    playbackRate: options.playbackRate,
    // Only seed `sampling` when the prop is EXPLICITLY set. Otherwise omit it so
    // `applyConfig` (which is guarded on `typeof === "boolean"`) doesn't force
    // sampling OFF on every activation — that would stomp a visualizer that armed
    // sampling out-of-band via `useAudioSpectrum`. See `useAudioExtraSync`.
    ...(options.sampling == null ? {} : { sampling: options.sampling }),
  };
}

/** Audio's one extra sync effect: toggle real-time waveform sampling. */
function useAudioExtraSync(
  ctx: MediaControllerHookContext<
    AudioSource,
    AudioControllerState,
    AudioController,
    UseAudioControllerOptions
  >,
): void {
  const { facade, options } = ctx;
  React.useEffect(() => {
    // Only drive sampling from the prop when it's EXPLICITLY provided. When the
    // prop is absent, leave sampling to whoever else owns it (e.g. a visualizer's
    // `useAudioSpectrum`) instead of force-disabling it and racing that consumer.
    if (options.sampling == null) return;
    facade.setSamplingEnabled(options.sampling);
  }, [facade, options.sampling]);
}

export const useAudioController: (options: UseAudioControllerOptions) => UseAudioControllerResult =
  createMediaControllerHook<
    AudioSource,
    AudioControllerState,
    AudioController,
    UseAudioControllerOptions
  >({
    useEngine: useAudioEngine,
    configBag,
    useExtraSync: useAudioExtraSync,
  });
