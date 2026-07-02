/**
 * MediaProvider wiring: the single provider must mount the real shared elements
 * (one `<audio>`, one `<video>`) by teleporting each surface into its active
 * player, and `useMediaState` must report the active players.
 */
import * as React from "react";

import { render, screen } from "@testing-library/react";

import { Provider } from "@knitui/core";

import { Audio } from "../audio/Audio";
import { Video } from "../video/Video";
import { MediaProvider } from "./MediaProvider";
import { useMediaState } from "./useMediaState";

const AUDIO_SRC = "https://example.com/song.mp3";
const VIDEO_SRC = "https://example.com/clip.mp4";

/**
 * Audio has no teleported DOM element — `expo-audio` owns its `<audio>` element
 * internally. Reach it through the captured controller (the facade delegates to
 * the shared engine's real `ExpoAudioController`, whose `player.media` is it).
 */
function expoAudioEl(controller: unknown): HTMLAudioElement {
  const real = (controller as { session: { controller: unknown } }).session.controller;
  const el = (real as { player: { media?: HTMLAudioElement } }).player.media;
  if (!el) throw new Error("expo-audio web player has no media element");
  return el;
}

function StateProbe(): React.ReactElement {
  const { activeAudioId, activeVideoId } = useMediaState();
  return (
    <div
      data-testid="probe"
      data-audio={activeAudioId ? "yes" : "no"}
      data-video={activeVideoId ? "yes" : "no"}
    />
  );
}

function renderWithProvider(ui: React.ReactNode): ReturnType<typeof render> {
  return render(
    <Provider forceColorScheme="light">
      <MediaProvider>{ui}</MediaProvider>
    </Provider>,
  );
}

describe("<MediaProvider> (web)", () => {
  it("mounts exactly one shared <video> wired to the active player's source", () => {
    renderWithProvider(<Video source={VIDEO_SRC} />);
    const videos = document.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(videos[0].getAttribute("src")).toBe(VIDEO_SRC);
  });

  it("drives audio through expo's single shared player wired to the active source", () => {
    let controller: unknown;
    renderWithProvider(<Audio source={AUDIO_SRC} getController={(c) => (controller = c)} />);
    // Audio has no teleported DOM element — expo-audio owns it internally.
    expect(document.querySelectorAll("audio")).toHaveLength(0);
    // ...but the shared player is wired to the active source.
    expect(expoAudioEl(controller).getAttribute("src")).toBe(AUDIO_SRC);
  });

  it("shares ONE player/element per medium across multiple players", () => {
    let c1: unknown;
    let c2: unknown;
    renderWithProvider(
      <>
        <Audio source={AUDIO_SRC} id="a1" getController={(c) => (c1 = c)} />
        <Audio source="https://example.com/song2.mp3" id="a2" getController={(c) => (c2 = c)} />
        <Video source={VIDEO_SRC} id="v1" />
        <Video source="https://example.com/clip2.mp4" id="v2" />
      </>,
    );
    expect(document.querySelectorAll("video")).toHaveLength(1);
    // Both <Audio> facades delegate to the SAME shared expo player.
    expect(expoAudioEl(c1)).toBe(expoAudioEl(c2));
  });

  it("reports the active players via useMediaState", () => {
    renderWithProvider(
      <>
        <StateProbe />
        <Audio source={AUDIO_SRC} />
        <Video source={VIDEO_SRC} />
      </>,
    );
    const probe = screen.getByTestId("probe");
    // The first player registered in each session becomes active (paused).
    expect(probe).toHaveAttribute("data-audio", "yes");
    expect(probe).toHaveAttribute("data-video", "yes");
  });

  it("renders no media element when no player is mounted", () => {
    renderWithProvider(<div />);
    expect(document.querySelectorAll("video")).toHaveLength(0);
    expect(document.querySelectorAll("audio")).toHaveLength(0);
  });
});
