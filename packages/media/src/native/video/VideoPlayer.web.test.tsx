/**
 * The web player's hand-over to a new `<video>`: an element that has been sampled
 * plays through Web Audio for good, and Web Audio turns a cross-origin source
 * without CORS into silence.
 */
import { act, render } from "@testing-library/react";
import React from "react";

import VideoPlayer from "./VideoPlayer.web";
import { VideoView } from "./VideoView.web";

const SAME_ORIGIN = `${window.location.origin}/clip.mp4`;
const CROSS_ORIGIN = "https://cdn.example.com/clip.mp4";

function setup(): { player: VideoPlayer; video: () => HTMLVideoElement } {
  const player = new VideoPlayer({ uri: SAME_ORIGIN });
  const view = render(<VideoView player={player} />);
  return { player, video: () => view.container.querySelector("video") as HTMLVideoElement };
}

describe("VideoPlayer (web) and a sampled element", () => {
  beforeAll(() => {
    // The jsdom stub's source node has no `context`, which a real one has.
    const proto = (window as unknown as { AudioContext: { prototype: AudioContext } }).AudioContext
      .prototype;
    const create = proto.createMediaElementSource;
    proto.createMediaElementSource = function (this: AudioContext, element: HTMLMediaElement) {
      return Object.assign(create.call(this, element), { context: this });
    };
  });

  it("keeps the element for a source Web Audio can play", () => {
    const { player, video } = setup();
    const first = video();
    act(() => player.setAudioSamplingEnabled(true));

    act(() => player.replace({ uri: `${window.location.origin}/other.mp4` }));
    expect(video()).toBe(first);

    act(() => player.replace({ uri: CROSS_ORIGIN, crossOrigin: "anonymous" } as never));
    expect(video()).toBe(first);
  });

  it("renders a new element for a cross-origin source without CORS, and plays it", () => {
    const play = jest.spyOn(window.HTMLMediaElement.prototype, "play");
    const { player, video } = setup();
    const first = video();
    act(() => player.setAudioSamplingEnabled(true));
    play.mockClear();

    act(() => player.replace({ uri: CROSS_ORIGIN }));

    const second = video();
    expect(second).not.toBe(first);
    expect(second.getAttribute("src")).toBe(CROSS_ORIGIN);
    expect(first.hasAttribute("src")).toBe(false);
    expect([...player._mountedVideos]).toEqual([second]);
    expect(play.mock.instances).toContain(second);
    play.mockRestore();
  });

  it("leaves an element that was never sampled alone", () => {
    const { player, video } = setup();
    const first = video();
    act(() => player.replace({ uri: CROSS_ORIGIN }));
    expect(video()).toBe(first);
  });
});
