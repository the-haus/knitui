import * as React from "react";

import type { AudioController } from "../controller/audio-controller-base";
import { SessionAudioPlaylistController } from "../controller/session-playlist-controller";
import { createInitialState } from "../engine";
import { getSharedAudioSession } from "../session/audio-engine";
import { act, fireEvent, render, screen } from "../test-utils";
import type { AudioControllerState } from "../types";
import { AudioPlaylist } from "./AudioPlaylist";

const SOURCES = [
  { uri: "https://example.com/a.mp3", name: "Track A" },
  { uri: "https://example.com/b.mp3", name: "Track B" },
  { uri: "https://example.com/c.mp3", name: "Track C" },
];

/**
 * A minimal fake of the shared-engine SLOT FACADE the
 * {@link SessionAudioPlaylistController} drives — enough to exercise the queue
 * logic, the playback-field mirroring, and track-end auto-advance without the
 * real `expo-audio` player. `emitState` pushes a snapshot change; `fire` raises a
 * granular event (e.g. `playToEnd`).
 */
class FakeFacade {
  state: AudioControllerState = createInitialState();
  calls: string[] = [];
  private subs = new Set<(s: AudioControllerState) => void>();
  private handlers: Record<string, Set<(p: unknown) => void>> = {};

  subscribe(listener: (s: AudioControllerState) => void): () => void {
    this.subs.add(listener);
    return () => this.subs.delete(listener);
  }
  on(type: string, listener: (p: unknown) => void): () => void {
    (this.handlers[type] ??= new Set()).add(listener);
    return () => this.handlers[type]?.delete(listener);
  }
  emitState(patch: Partial<AudioControllerState>): void {
    this.state = { ...this.state, ...patch };
    this.subs.forEach((l) => l(this.state));
  }
  fire(type: string, payload?: unknown): void {
    this.handlers[type]?.forEach((l) => l(payload));
  }
  subCount(): number {
    return this.subs.size;
  }

  play(): void {
    this.calls.push("play");
  }
  pause(): void {
    this.calls.push("pause");
  }
  replay(): void {
    this.calls.push("replay");
  }
  async seekTo(s: number): Promise<void> {
    this.calls.push(`seekTo:${s}`);
  }
  setVolume(v: number): void {
    this.calls.push(`setVolume:${v}`);
  }
  setMuted(m: boolean): void {
    this.calls.push(`setMuted:${m}`);
  }
  setPlaybackRate(r: number): void {
    this.calls.push(`setPlaybackRate:${r}`);
  }
  replace(src: unknown): void {
    this.calls.push(
      `replace:${typeof src === "object" && src ? (src as { uri?: string }).uri : src}`,
    );
  }
}

function makeController(sources = SOURCES): {
  ctrl: SessionAudioPlaylistController;
  facade: FakeFacade;
} {
  const facade = new FakeFacade();
  const ctrl = new SessionAudioPlaylistController(facade as unknown as AudioController, {
    sources,
  });
  return { ctrl, facade };
}

describe("SessionAudioPlaylistController (queue over the shared audio engine)", () => {
  it("maps the queue and current track into the snapshot on construction", () => {
    const { ctrl } = makeController();
    expect(ctrl.state.trackCount).toBe(3);
    expect(ctrl.state.currentIndex).toBe(0);
    expect(ctrl.state.tracks[1].name).toBe("Track B");
  });

  it("mirrors the slot's playback fields into the snapshot", () => {
    const { ctrl, facade } = makeController();
    act(() => facade.emitState({ playing: true, currentTime: 5, duration: 100, volume: 0.5 }));
    expect(ctrl.state.playing).toBe(true);
    expect(ctrl.state.currentTime).toBe(5);
    expect(ctrl.state.duration).toBe(100);
    expect(ctrl.state.volume).toBe(0.5);
    // Queue fields are owned by the controller, never clobbered by the mirror.
    expect(ctrl.state.currentIndex).toBe(0);
    expect(ctrl.state.trackCount).toBe(3);
  });

  it("skips to a track: moves the index, swaps the slot source, emits trackChange", () => {
    const { ctrl, facade } = makeController();
    const onTrack = jest.fn();
    ctrl.on("trackChange", onTrack);
    ctrl.skipTo(2);
    expect(ctrl.state.currentIndex).toBe(2);
    expect(onTrack).toHaveBeenLastCalledWith({ previousIndex: 0, currentIndex: 2 });
    expect(facade.calls).toContain("replace:https://example.com/c.mp3");
  });

  it("delegates playback + seeking + volume to the shared slot facade", () => {
    const { ctrl, facade } = makeController();
    ctrl.play();
    void ctrl.seekTo(10);
    ctrl.setVolume(0.25);
    expect(facade.calls).toEqual(expect.arrayContaining(["play", "seekTo:10", "setVolume:0.25"]));
  });

  it("auto-advances to the next track when the current one ends", () => {
    const { ctrl, facade } = makeController();
    facade.calls.length = 0;
    act(() => facade.fire("playToEnd"));
    expect(ctrl.state.currentIndex).toBe(1);
    expect(facade.calls).toEqual(
      expect.arrayContaining(["replace:https://example.com/b.mp3", "play"]),
    );
  });

  it("repeats the current track on end when loop='single'", () => {
    const { ctrl, facade } = makeController();
    ctrl.setLoop("single");
    facade.calls.length = 0;
    act(() => facade.fire("playToEnd"));
    expect(ctrl.state.currentIndex).toBe(0);
    expect(facade.calls).toContain("replay");
  });

  it("wraps to the first track on end of the last when loop='all'", () => {
    const { ctrl, facade } = makeController();
    ctrl.skipTo(2);
    ctrl.setLoop("all");
    facade.calls.length = 0;
    act(() => facade.fire("playToEnd"));
    expect(ctrl.state.currentIndex).toBe(0);
  });

  it("marks the playlist ended at the end of the queue with no loop", () => {
    const { ctrl, facade } = makeController();
    const onEnd = jest.fn();
    ctrl.on("playToEnd", onEnd);
    ctrl.skipTo(2);
    act(() => facade.fire("playToEnd"));
    expect(ctrl.state.ended).toBe(true);
    expect(ctrl.state.playing).toBe(false);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("sets the playlist loop mode in state (without touching the slot's track loop)", () => {
    const { ctrl } = makeController();
    expect(ctrl.state.loop).toBe("none");
    ctrl.setLoop("all");
    expect(ctrl.state.loop).toBe("all");
  });

  it("updates the queue on add / remove / clear", () => {
    const { ctrl } = makeController();
    ctrl.add({ uri: "https://example.com/d.mp3", name: "Track D" });
    expect(ctrl.state.trackCount).toBe(4);
    ctrl.remove(0);
    expect(ctrl.state.trackCount).toBe(3);
    ctrl.clear();
    expect(ctrl.state.trackCount).toBe(0);
  });

  it("stops mirroring + advancing once disposed", () => {
    const { ctrl, facade } = makeController();
    expect(facade.subCount()).toBe(1);
    ctrl.dispose();
    expect(facade.subCount()).toBe(0);
    facade.emitState({ playing: true });
    expect(ctrl.state.playing).toBe(false);
  });
});

describe("<AudioPlaylist> (web)", () => {
  it("renders the track list and transport", () => {
    render(<AudioPlaylist sources={SOURCES} />);
    expect(screen.getByText("Track A")).toBeInTheDocument();
    expect(screen.getByText("Track C")).toBeInTheDocument();
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
    expect(screen.getByLabelText("Next track")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous track")).toBeInTheDocument();
  });

  it("skips to a track when its row is pressed", () => {
    const onTrackChange = jest.fn();
    render(<AudioPlaylist sources={SOURCES} onTrackChange={onTrackChange} />);
    act(() => {
      fireEvent.click(screen.getByText("Track C"));
    });
    expect(onTrackChange).toHaveBeenCalledWith(2, 0);
  });

  it("exposes the controller via getController", () => {
    const getController = jest.fn();
    render(<AudioPlaylist sources={SOURCES} getController={getController} />);
    expect(getController.mock.calls[0][0]).toHaveProperty("next");
  });

  it("hides chrome when controls={false}", () => {
    render(<AudioPlaylist sources={SOURCES} controls={false} />);
    expect(screen.queryByLabelText("Play")).not.toBeInTheDocument();
    // track list still shows
    expect(screen.getByText("Track A")).toBeInTheDocument();
  });
});

describe("playlist + <Audio> share ONE engine (mutual exclusivity)", () => {
  it("playing a playlist takes the shared engine from a concurrent <Audio>", () => {
    // Both join the SAME shared session, so only one is ever active → only one
    // sound. This is the whole point of routing the playlist through the engine.
    const engine = getSharedAudioSession();
    engine.session.register("audio", { source: "https://example.com/solo.mp3", config: {} });
    engine.getFacade("audio").play();
    expect(engine.session.isActive("audio")).toBe(true);

    engine.session.register("list", { source: null, config: {} });
    const playlist = new SessionAudioPlaylistController(engine.getFacade("list"), {
      sources: SOURCES,
    });
    playlist.play();

    // The playlist now owns the engine; the plain <Audio> slot was deactivated.
    expect(engine.session.isActive("list")).toBe(true);
    expect(engine.session.isActive("audio")).toBe(false);

    playlist.dispose();
  });
});
