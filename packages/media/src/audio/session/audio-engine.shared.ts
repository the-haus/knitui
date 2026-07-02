/**
 * Audio binding of the generic shared-engine core ({@link ../../session}). Wraps a
 * single real {@link AudioController} in a {@link MediaSession} and exposes a
 * per-player {@link AudioControllerFacade} so every `<Audio>` drives ONE shared
 * player — playing another switches the engine to its source and remembers the
 * previous player's position.
 *
 * Platform-agnostic: the concrete {@link ExpoAudioController} (over `expo-audio`,
 * which resolves per platform) is injected by the engine entry (`audio-engine.ts`).
 */
import { MediaFacadeBase } from "../../session/media-facade.shared";
import {
  applyCommonConfig,
  commonIdleFields,
  MediaSession,
} from "../../session/media-session.shared";
import type { AudioController } from "../controller/audio-controller-base";
import { createInitialState } from "../engine";
import type {
  AudioControllerState,
  AudioLockScreenOptions,
  AudioMetadata,
  AudioSource,
  PitchCorrectionQuality,
} from "../types";

type AudioMediaSession = MediaSession<AudioController, AudioControllerState, AudioSource>;

interface LockScreenConfig {
  active: boolean;
  metadata?: AudioMetadata;
  options?: AudioLockScreenOptions;
}

/** Per-player façade implementing the full {@link AudioController} contract. */
export class AudioControllerFacade
  extends MediaFacadeBase<AudioController, AudioControllerState, AudioSource>
  implements AudioController
{
  setActiveForLockScreen(
    active: boolean,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions,
  ): void {
    if (this.active) this.rc.setActiveForLockScreen(active, metadata, options);
    else this.session.update(this.id, { config: { lockScreen: { active, metadata, options } } });
  }

  updateLockScreenMetadata(metadata: AudioMetadata): void {
    if (this.active) this.rc.updateLockScreenMetadata(metadata);
    else
      this.session.update(this.id, {
        config: { lockScreen: { active: true, metadata } satisfies LockScreenConfig },
      });
  }

  clearLockScreenControls(): void {
    if (this.active) this.rc.clearLockScreenControls();
    else this.session.update(this.id, { config: { lockScreen: undefined } });
  }

  setSamplingEnabled(enabled: boolean): void {
    if (this.active) this.rc.setSamplingEnabled(enabled);
    else this.session.update(this.id, { config: { sampling: enabled } });
  }

  // Narrow the base's `pitchCorrection?: unknown` to the audio contract.
  override setPlaybackRate(rate: number, pitchCorrection?: PitchCorrectionQuality): void {
    super.setPlaybackRate(rate, pitchCorrection);
  }
}

export interface AudioEngine {
  readonly session: AudioMediaSession;
  getFacade(id: string): AudioController;
  dispose(): void;
}

/** Build an engine around an already-constructed real controller. */
export function buildAudioEngine(controller: AudioController): AudioEngine {
  const session: AudioMediaSession = new MediaSession({
    controller,
    createIdleState: (d) => createInitialState(commonIdleFields(d)),
    applyConfig: (c, d) => {
      applyCommonConfig(c, d);
      if (typeof d.config.sampling === "boolean") c.setSamplingEnabled(d.config.sampling);
    },
    onActivate: (c, d) => {
      const ls = d.config.lockScreen as LockScreenConfig | undefined;
      if (ls?.active) c.setActiveForLockScreen(true, ls.metadata, ls.options);
    },
    onDeactivate: (c) => {
      c.clearLockScreenControls();
      c.setSamplingEnabled(false);
    },
  });

  const facades = new Map<string, AudioController>();
  return {
    session,
    getFacade(id) {
      let facade = facades.get(id);
      if (!facade) {
        facade = new AudioControllerFacade(session, id);
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
