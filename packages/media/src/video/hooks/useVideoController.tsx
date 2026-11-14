/**
 * The headless `useVideoController` hook. Instead of minting its own controller,
 * it joins the SHARED video engine: it registers a player slot (keyed by a stable
 * id, carrying the surface props), mirrors the engine's snapshot for that slot
 * into React, and returns a per-player facade. Playing one `<Video>` switches the
 * single shared `<video>` to its source and teleports the surface into that
 * player's frame; the rest go idle, remembering their position.
 *
 * The shared-engine wiring lives in {@link createMediaControllerHook}; this module
 * supplies only the video deltas — the engine accessor, the descriptor config
 * bag, and the surface-config sync effect.
 */
import * as React from "react";

import {
  createMediaControllerHook,
  type MediaControllerHookContext,
} from "../../core/react/createMediaControllerHook";
import type { VideoController } from "../controller/video-controller-base";
import { useVideoEngine } from "../session/video-engine";
import type { VideoControllerState, VideoPlaybackOptions, VideoSource } from "../types";
import type {
  UseVideoControllerOptions,
  UseVideoControllerResult,
} from "./useVideoController.shared";

/** The declarative props folded into the registry descriptor's config bag. */
/** The playback options a caller actually set; an absent prop must not reset one. */
function definedPlaybackOptions(options: VideoPlaybackOptions): VideoPlaybackOptions {
  const { maxResolution, keepAwake, backgroundPlayback, buffer, audioMixingMode } = options;
  return {
    ...(maxResolution !== undefined && { maxResolution }),
    ...(keepAwake !== undefined && { keepAwake }),
    ...(backgroundPlayback !== undefined && { backgroundPlayback }),
    ...(buffer !== undefined && { buffer }),
    ...(audioMixingMode !== undefined && { audioMixingMode }),
  };
}

function configBag(options: UseVideoControllerOptions): Record<string, unknown> {
  return {
    volume: options.volume,
    muted: options.muted,
    loop: options.loop,
    playbackRate: options.playbackRate,
    surface: options.surface,
    ...definedPlaybackOptions(options),
  };
}

/** Video's one extra sync effect: keep the surface config on the descriptor. */
function useVideoExtraSync(
  ctx: MediaControllerHookContext<
    VideoSource,
    VideoControllerState,
    VideoController,
    UseVideoControllerOptions
  >,
): void {
  const { engine, facade, id, options } = ctx;
  React.useEffect(() => {
    engine.session.update(id, { config: { surface: options.surface } });
  }, [engine, id, options.surface]);

  // Compared by value: an inline `maxResolution={{ ... }}` or `buffer={{ ... }}` is
  // a new object every render and must not re-apply the options each time.
  const optionsKey = JSON.stringify(definedPlaybackOptions(options));
  React.useEffect(() => {
    const next = JSON.parse(optionsKey) as VideoPlaybackOptions;
    if (Object.keys(next).length > 0) facade.setPlaybackOptions(next);
  }, [facade, optionsKey]);
}

export const useVideoController: (options: UseVideoControllerOptions) => UseVideoControllerResult =
  createMediaControllerHook<
    VideoSource,
    VideoControllerState,
    VideoController,
    UseVideoControllerOptions
  >({
    useEngine: useVideoEngine,
    configBag,
    useExtraSync: useVideoExtraSync,
  });
