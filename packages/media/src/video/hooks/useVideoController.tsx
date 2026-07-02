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
import type { VideoControllerState, VideoSource } from "../types";
import type {
  UseVideoControllerOptions,
  UseVideoControllerResult,
} from "./useVideoController.shared";

/** The declarative props folded into the registry descriptor's config bag. */
function configBag(options: UseVideoControllerOptions): Record<string, unknown> {
  return {
    volume: options.volume,
    muted: options.muted,
    loop: options.loop,
    playbackRate: options.playbackRate,
    surface: options.surface,
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
  const { engine, id, options } = ctx;
  React.useEffect(() => {
    engine.session.update(id, { config: { surface: options.surface } });
  }, [engine, id, options.surface]);
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
