import * as React from "react";

import type { VideoController } from "./controller/video-controller-base";
import { act, fireEvent, render, screen } from "./test-utils";
import { Video } from "./Video";

const SRC = "https://example.com/clip.mp4";

function getVideoEl(): HTMLVideoElement {
  const el = document.querySelector("video");
  if (!el) throw new Error("no <video> rendered");
  return el as HTMLVideoElement;
}

/**
 * Mark the expo-video web element ready: define a duration, force `readyState`
 * so expo's `oncanplay` accepts it, and fire `canplay`. expo's web player has no
 * `loadedmetadata`/`sourceLoad` event, so the controller picks the duration up
 * from the player on the `readyToPlay` status change.
 */
function markReady(el: HTMLVideoElement, duration: number): void {
  Object.defineProperty(el, "duration", { value: duration, configurable: true, writable: true });
  Object.defineProperty(el, "readyState", { value: 4, configurable: true });
  act(() => {
    el.dispatchEvent(new Event("canplay"));
  });
}

describe("<Video> (web)", () => {
  it("renders a real <video> element wired to the source", () => {
    render(<Video source={SRC} />);
    const el = getVideoEl();
    expect(el).toBeInTheDocument();
    expect(el.getAttribute("src")).toBe(SRC);
  });

  it("renders the default control bar", () => {
    render(<Video source={SRC} />);
    // Big play button + bar play button both labelled "Play" while paused.
    expect(screen.getAllByLabelText("Play").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Mute")).toBeInTheDocument();
    expect(screen.getByLabelText("Fullscreen")).toBeInTheDocument();
  });

  it("shows a 0:00 / 0:00 timecode initially and updates once the player is ready", () => {
    render(<Video source={SRC} />);
    expect(screen.getByText("0:00 / 0:00")).toBeInTheDocument();
    markReady(getVideoEl(), 95);
    expect(screen.getByText("0:00 / 1:35")).toBeInTheDocument();
  });

  it("reflects play state from media events", () => {
    render(<Video source={SRC} />);
    const el = getVideoEl();
    act(() => {
      el.dispatchEvent(new Event("play"));
    });
    expect(screen.getByLabelText("Pause")).toBeInTheDocument();
  });

  it("drives the element via the play button", () => {
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    render(<Video source={SRC} />);
    const playButtons = screen.getAllByLabelText("Play");
    act(() => {
      fireEvent.click(playButtons[playButtons.length - 1]);
    });
    expect(playSpy).toHaveBeenCalled();
  });

  it("shows the buffering loader while loading", () => {
    render(<Video source={SRC} />);
    const el = getVideoEl();
    act(() => {
      el.dispatchEvent(new Event("waiting"));
    });
    expect(screen.getByLabelText("Buffering")).toBeInTheDocument();
  });

  it("surfaces errors via onError and the error status", () => {
    const onError = jest.fn();
    render(<Video source={SRC} onError={onError} />);
    const el = getVideoEl();
    act(() => {
      el.dispatchEvent(new Event("error"));
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("exposes the controller via getController", () => {
    const getController = jest.fn();
    render(<Video source={SRC} getController={getController} />);
    expect(getController).toHaveBeenCalledTimes(1);
    expect(getController.mock.calls[0][0]).toHaveProperty("play");
  });

  it("hides the kit chrome when controls={false}", () => {
    render(<Video source={SRC} controls={false} />);
    expect(screen.queryByLabelText("Fullscreen")).not.toBeInTheDocument();
  });

  it("renders custom chrome passed to controls", () => {
    render(<Video source={SRC} controls={<Video.PlayPause />}></Video>);
    // Custom bar has the play/pause button but not the full default bar's mute.
    expect(screen.queryByLabelText("Mute")).not.toBeInTheDocument();
  });

  it("exposes a focusable, labelled region", () => {
    render(<Video source={SRC} label="Demo reel" />);
    const region = document.querySelector('[role="region"]') as HTMLElement;
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-label", "Demo reel");
    expect(region.tabIndex).toBe(0);
  });

  it("supports keyboard play/pause (space) and seeking (arrows)", () => {
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    render(<Video source={SRC} />);
    const region = document.querySelector('[role="region"]') as HTMLElement;
    markReady(getVideoEl(), 100);

    act(() => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    expect(playSpy).toHaveBeenCalled();

    act(() => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(getVideoEl().currentTime).toBe(5);
  });

  it("does not bind shortcuts when keyboard={false}", () => {
    const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    render(<Video source={SRC} keyboard={false} />);
    const region = document.querySelector('[role="region"]') as HTMLElement;
    act(() => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("requests fullscreen via the video view on the 'f' key", () => {
    const fsSpy = jest.spyOn(window.HTMLElement.prototype, "requestFullscreen");
    fsSpy.mockClear();
    render(<Video source={SRC} />);
    const region = document.querySelector('[role="region"]') as HTMLElement;
    act(() => {
      region.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
    });
    // The expo-video `VideoView` owns fullscreen on web too (it requests it on
    // its own container), so it's no longer the kit wrapper region itself.
    expect(fsSpy).toHaveBeenCalled();
  });

  it("shows an error overlay with a working retry", () => {
    const loadSpy = jest.spyOn(window.HTMLMediaElement.prototype, "load");
    render(<Video source={SRC} />);
    act(() => {
      getVideoEl().dispatchEvent(new Event("error"));
    });
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry).toBeInTheDocument();
    loadSpy.mockClear();
    act(() => {
      fireEvent.click(retry);
    });
    expect(loadSpy).toHaveBeenCalled();
  });

  it("registers sidecar caption files as selectable subtitle tracks", () => {
    // expo-video can't load external `textTracks` itself (on either platform), so
    // the controller exposes them as selectable subtitle tracks and paints the
    // active cue with the kit's own overlay — there is no `<track>` element.
    let controller: VideoController | undefined;
    render(
      <Video
        source={SRC}
        getController={(c) => {
          controller = c;
        }}
        textTracks={[{ src: "https://example.com/en.vtt", label: "English", language: "en" }]}
      />,
    );
    expect(document.querySelector("track")).not.toBeInTheDocument();
    expect(controller).toBeDefined();
    expect(controller?.state.availableSubtitleTracks.map((t) => t.label)).toContain("English");
  });
});
