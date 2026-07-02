import * as React from "react";

import { Audio } from "./Audio";
import { act, fireEvent, render, screen } from "./test-utils";

const SRC = "https://example.com/track.mp3";

/**
 * The audio player has no rendered DOM element anymore: `expo-audio` owns its
 * `<audio>` element internally (a detached element in its `.web` backend). Reach
 * it through the captured controller — the per-player facade delegates to the
 * shared engine's real `ExpoAudioController`, whose `player.media` is that
 * element — so we can still drive media events to exercise the chrome wiring.
 */
function expoAudioEl(controller: unknown): HTMLAudioElement {
  const real = (controller as { session: { controller: unknown } }).session.controller;
  const el = (real as { player: { media?: HTMLAudioElement } }).player.media;
  if (!el) throw new Error("expo-audio web player has no media element");
  return el;
}

/** Render `<Audio>` capturing its controller; returns a live accessor for the element. */
function renderAudio(
  node: React.ReactElement<React.ComponentProps<typeof Audio>>,
): () => HTMLAudioElement {
  let controller: unknown;
  render(React.cloneElement(node, { getController: (c: unknown) => (controller = c) }));
  return () => expoAudioEl(controller);
}

function loadMetadata(el: HTMLAudioElement, duration: number): void {
  Object.defineProperty(el, "duration", { value: duration, configurable: true, writable: true });
  act(() => {
    // expo-audio's web player wires `onloadeddata`, not `loadedmetadata`.
    el.dispatchEvent(new Event("loadeddata"));
  });
}

describe("<Audio> (web)", () => {
  it("wires expo's shared player to the source", () => {
    const el = renderAudio(<Audio source={SRC} />);
    expect(el().getAttribute("src")).toBe(SRC);
  });

  it("renders the default control bar", () => {
    render(<Audio source={SRC} />);
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
    expect(screen.getByLabelText("Mute")).toBeInTheDocument();
    expect(screen.getByLabelText("Loop")).toBeInTheDocument();
  });

  it("shows timecodes and updates on metadata", () => {
    const el = renderAudio(<Audio source={SRC} />);
    // Current 0:00 and total 0:00 both render initially.
    expect(screen.getAllByText("0:00").length).toBeGreaterThanOrEqual(2);
    loadMetadata(el(), 95);
    expect(screen.getByText("1:35")).toBeInTheDocument();
  });

  it("advances the displayed current time on timeupdate (per-field channel)", () => {
    // Guards the hot path end-to-end: a per-frame `currentTime` tick must reach
    // the timecode through the field-scoped store, not just move the element.
    const el = renderAudio(<Audio source={SRC} />);
    loadMetadata(el(), 100);
    Object.defineProperty(el(), "currentTime", { value: 30, configurable: true, writable: true });
    act(() => {
      el().dispatchEvent(new Event("timeupdate"));
    });
    expect(screen.getByText("0:30")).toBeInTheDocument();
  });

  it("reflects play state from media events", () => {
    const el = renderAudio(<Audio source={SRC} />);
    act(() => {
      el().dispatchEvent(new Event("play"));
    });
    expect(screen.getByLabelText("Pause")).toBeInTheDocument();
  });

  it("drives the element via the play button", () => {
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    render(<Audio source={SRC} />);
    act(() => {
      fireEvent.click(screen.getByLabelText("Play"));
    });
    expect(playSpy).toHaveBeenCalled();
  });

  it("renders the metadata header", () => {
    render(<Audio source={SRC} title="Song Title" artist="The Artist" />);
    expect(screen.getByText("Song Title")).toBeInTheDocument();
    expect(screen.getByText("The Artist")).toBeInTheDocument();
  });

  it("surfaces errors via onError and the error UI", () => {
    const onError = jest.fn();
    let controller: unknown;
    render(
      <Audio source={SRC} onError={onError} getController={(c: unknown) => (controller = c)} />,
    );
    act(() => {
      expoAudioEl(controller).dispatchEvent(new Event("error"));
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("exposes the controller via getController", () => {
    const getController = jest.fn();
    render(<Audio source={SRC} getController={getController} />);
    expect(getController).toHaveBeenCalledTimes(1);
    expect(getController.mock.calls[0][0]).toHaveProperty("play");
  });

  it("hides chrome when controls={false}", () => {
    render(<Audio source={SRC} controls={false} />);
    expect(screen.queryByLabelText("Play")).not.toBeInTheDocument();
  });

  it("renders custom chrome passed to controls", () => {
    render(<Audio source={SRC} controls={<Audio.PlayPause />} />);
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
    expect(screen.queryByLabelText("Mute")).not.toBeInTheDocument();
  });

  it("exposes a focusable, labelled region", () => {
    render(<Audio source={SRC} label="Podcast player" />);
    const region = document.querySelector('[role="group"]') as HTMLElement;
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-label", "Podcast player");
    expect(region.tabIndex).toBe(0);
  });

  it("supports keyboard play/pause (space) and seeking (arrows)", () => {
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    const el = renderAudio(<Audio source={SRC} />);
    const region = document.querySelector('[role="group"]') as HTMLElement;
    loadMetadata(el(), 100);
    act(() => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    expect(playSpy).toHaveBeenCalled();
    act(() => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(el().currentTime).toBe(5);
  });

  it("does not bind shortcuts when keyboard={false}", () => {
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    render(<Audio source={SRC} keyboard={false} />);
    const region = document.querySelector('[role="group"]') as HTMLElement;
    act(() => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("toggles loop via the loop button", () => {
    const el = renderAudio(<Audio source={SRC} />);
    const loop = screen.getByLabelText("Loop");
    act(() => {
      fireEvent.click(loop);
    });
    expect(screen.getByLabelText("Disable loop")).toBeInTheDocument();
    expect(el().loop).toBe(true);
  });

  it("forwards a source's crossOrigin to the media element (for remote visualization)", () => {
    // A CORS-enabled remote source must carry the `crossOrigin` attribute or the
    // browser taints it and expo's Web-Audio sampler refuses to read it.
    const el = renderAudio(<Audio source={{ uri: SRC, crossOrigin: "anonymous" }} />);
    expect(el().crossOrigin).toBe("anonymous");
  });
});
