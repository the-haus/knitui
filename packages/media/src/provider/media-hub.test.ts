import type { AudioEngine } from "../audio/session/audio-engine.shared";
import type { VideoEngine } from "../video/session/video-engine.shared";
import { MediaHub } from "./media-hub";

/** A stand-in for one domain's real controller: just playing, mute and volume. */
class FakeController {
  state = { playing: false, muted: false, volume: 1 };
  pauseCalls = 0;
  private listeners: Array<(event: { playing: boolean }) => void> = [];
  private levelListeners: Array<(event: { muted: boolean; volume: number }) => void> = [];

  on(type: string, listener: (event: never) => void): () => void {
    if (type === "volumeChange") {
      this.levelListeners.push(listener as (event: { muted: boolean; volume: number }) => void);
      return () => {
        this.levelListeners = this.levelListeners.filter((l) => l !== listener);
      };
    }
    this.listeners.push(listener as (event: { playing: boolean }) => void);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  setMuted(muted: boolean): void {
    this.state = { ...this.state, muted };
    for (const listener of [...this.levelListeners]) listener(this.state);
  }

  setPlaying(playing: boolean): void {
    if (this.state.playing === playing) return;
    this.state = { ...this.state, playing };
    for (const listener of [...this.listeners]) listener({ playing });
  }

  mixingModes: string[] = [];
  setPlaybackOptions(options: { audioMixingMode?: string }): void {
    if (options.audioMixingMode) this.mixingModes.push(options.audioMixingMode);
  }

  pause(): void {
    this.pauseCalls++;
    this.setPlaying(false);
  }

  get listenerCount(): number {
    return this.listeners.length;
  }
}

function make(): { hub: MediaHub; audio: FakeController; video: FakeController } {
  const audio = new FakeController();
  const video = new FakeController();
  const engine = (controller: FakeController, id: string) => ({
    session: { controller, activeId: id },
    getFacade: (facadeId: string) => ({ id: facadeId, togglePlay: () => controller.pause() }),
    setDefaultAudioMixingMode: (mode: string) =>
      controller.setPlaybackOptions({ audioMixingMode: mode }),
  });
  const hub = new MediaHub({
    audio: engine(audio, "a1") as unknown as AudioEngine,
    video: engine(video, "v1") as unknown as VideoEngine,
  });
  return { hub, audio, video };
}

describe("MediaHub", () => {
  it("gives focus to whichever domain started playing last", () => {
    const { hub, audio, video } = make();
    const seen: (string | null)[] = [];
    hub.subscribe(() => seen.push(hub.focus));
    expect(hub.focus).toBeNull();
    expect(hub.active).toBeNull();

    audio.setPlaying(true);
    expect(hub.focus).toBe("audio");
    expect(hub.activeId).toBe("a1");

    video.setPlaying(true);
    expect(hub.focus).toBe("video");
    expect(hub.activeId).toBe("v1");
    expect(seen).toEqual(["audio", "video"]);
  });

  it("pauses the other domain when audible playback starts", () => {
    const { hub, audio, video } = make();
    audio.setPlaying(true);
    video.setPlaying(true);
    expect(audio.state.playing).toBe(false);
    expect(audio.pauseCalls).toBe(1);

    audio.setPlaying(true);
    expect(video.state.playing).toBe(false);
    expect(hub.focus).toBe("audio");
  });

  it("lets a muted or silent video play alongside the music", () => {
    const { audio, video } = make();
    audio.setPlaying(true);

    video.state = { ...video.state, muted: true };
    video.setPlaying(true);
    expect(audio.state.playing).toBe(true);

    video.setPlaying(false);
    video.state = { ...video.state, muted: false, volume: 0 };
    video.setPlaying(true);
    expect(audio.state.playing).toBe(true);
  });

  it("takes over when a video that started muted is unmuted", () => {
    const { hub, audio, video } = make();
    audio.setPlaying(true);
    video.setMuted(true);
    video.setPlaying(true);
    expect(audio.state.playing).toBe(true);

    video.setMuted(false);
    expect(audio.state.playing).toBe(false);
    expect(hub.focus).toBe("video");
  });

  it("mixes both when exclusive is off", () => {
    const { hub, audio, video } = make();
    hub.exclusive = false;
    audio.setPlaying(true);
    video.setPlaying(true);
    expect(audio.state.playing).toBe(true);
    expect(hub.playing).toBe(true);
    // The platform has to agree: the video is told to share the output.
    expect(video.mixingModes).toEqual(["mixWithOthers"]);
    // Back on while both play: the one without focus (audio) goes quiet.
    hub.exclusive = true;
    expect(video.mixingModes).toEqual(["mixWithOthers", "auto"]);
    expect(audio.state.playing).toBe(false);
    expect(video.state.playing).toBe(true);
  });

  it("pauses everything, and only what is playing", () => {
    const { hub, audio, video } = make();
    hub.exclusive = false;
    audio.setPlaying(true);
    hub.pauseAll();
    expect(audio.pauseCalls).toBe(1);
    expect(video.pauseCalls).toBe(0);
    expect(hub.playing).toBe(false);
  });

  it("toggles the focused player and lets go of the controllers on dispose", () => {
    const { hub, audio, video } = make();
    hub.togglePlay(); // nothing has focus yet
    expect(audio.pauseCalls + video.pauseCalls).toBe(0);

    video.setPlaying(true);
    hub.togglePlay();
    expect(video.pauseCalls).toBe(1);

    hub.dispose();
    expect(audio.listenerCount).toBe(0);
    expect(video.listenerCount).toBe(0);
  });
});
