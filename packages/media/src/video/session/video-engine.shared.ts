/**
 * Video binding of the generic shared-engine core ({@link ../../session}). Wraps a
 * single real {@link VideoController} in a {@link MediaSession} so every `<Video>`
 * drives ONE shared `expo-video` `VideoView` — playing another switches the engine
 * to its source (and re-parents the single surface into that player's frame; see
 * {@link ../../provider/MediaProvider}). Inactive players remember their position.
 */
import { MediaFacadeBase } from "../../session/media-facade.shared";
import {
  applyCommonConfig,
  commonIdleFields,
  MediaSession,
} from "../../session/media-session.shared";
import type { VideoController } from "../controller/video-controller-base";
import { createInitialState } from "../engine";
import type { VideoControllerState, VideoSource } from "../types";

type VideoMediaSession = MediaSession<VideoController, VideoControllerState, VideoSource>;

/** Per-player façade implementing the full {@link VideoController} contract. */
export class VideoControllerFacade
  extends MediaFacadeBase<VideoController, VideoControllerState, VideoSource>
  implements VideoController
{
  setNowPlayingEnabled(enabled: boolean): void {
    // Only the active player owns the OS notification; an inactive façade just
    // remembers the intent so the session can re-apply it on activation.
    if (this.active) this.rc.setNowPlayingEnabled(enabled);
    else this.session.update(this.id, { config: { nowPlaying: enabled } });
  }

  selectAudioTrack(trackId: string | null): void {
    if (this.active) this.rc.selectAudioTrack(trackId);
    else this.session.update(this.id, { config: { audioTrackId: trackId } });
  }

  selectSubtitleTrack(trackId: string | null): void {
    if (this.active) this.rc.selectSubtitleTrack(trackId);
    else this.session.update(this.id, { config: { subtitleTrackId: trackId } });
  }

  // Presentation implies this player is showing — activate it first.
  enterFullscreen(): Promise<void> {
    this.session.activate(this.id);
    return this.rc.enterFullscreen();
  }
  exitFullscreen(): Promise<void> {
    return this.active ? this.rc.exitFullscreen() : Promise.resolve();
  }
  toggleFullscreen(): Promise<void> {
    this.session.activate(this.id);
    return this.rc.toggleFullscreen();
  }
  startPictureInPicture(): Promise<void> {
    this.session.activate(this.id);
    return this.rc.startPictureInPicture();
  }
  stopPictureInPicture(): Promise<void> {
    return this.active ? this.rc.stopPictureInPicture() : Promise.resolve();
  }
  togglePictureInPicture(): Promise<void> {
    this.session.activate(this.id);
    return this.rc.togglePictureInPicture();
  }
}

export interface VideoEngine {
  readonly session: VideoMediaSession;
  getFacade(id: string): VideoController;
  dispose(): void;
}

/** Build an engine around an already-constructed real controller. */
export function buildVideoEngine(controller: VideoController): VideoEngine {
  const session: VideoMediaSession = new MediaSession({
    controller,
    createIdleState: (d) => createInitialState(commonIdleFields(d)),
    applyConfig: (c, d) => applyCommonConfig(c, d),
    onActivate: (c, d) => {
      const sub = d.config.subtitleTrackId;
      if (typeof sub === "string" || sub === null) c.selectSubtitleTrack(sub);
      if (d.config.nowPlaying === true) c.setNowPlayingEnabled(true);
    },
    onDeactivate: (c) => {
      if (c.state.fullscreen) void c.exitFullscreen();
      if (c.state.pictureInPicture) void c.stopPictureInPicture();
      c.setNowPlayingEnabled(false);
    },
  });

  const facades = new Map<string, VideoController>();
  return {
    session,
    getFacade(id) {
      let facade = facades.get(id);
      if (!facade) {
        facade = new VideoControllerFacade(session, id);
        facades.set(id, facade);
      }
      return facade;
    },
    dispose() {
      facades.clear();
      session.dispose();
    },
  };
}
