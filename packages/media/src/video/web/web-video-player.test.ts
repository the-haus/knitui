import { WebVideoPlayer } from "./web-video-player";

describe("WebVideoPlayer (the kit's web video backend)", () => {
  it("hands settings made before any view to the first mounted <video>", () => {
    const player = new WebVideoPlayer(null);
    player.muted = true;
    player.loop = true;
    player.playbackRate = 1.5;
    const video = document.createElement("video");
    player.mountVideoView(video);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.playbackRate).toBe(1.5);
  });

  it("emits expo's playingChange / statusChange / playToEnd from the mounted element", () => {
    const player = new WebVideoPlayer(null);
    const video = document.createElement("video");
    player.mountVideoView(video);
    const playing: boolean[] = [];
    const statuses: string[] = [];
    let ended = 0;
    player.addListener("playingChange", (e: { isPlaying: boolean }) => playing.push(e.isPlaying));
    player.addListener("statusChange", (e: { status: string }) => statuses.push(e.status));
    player.addListener("playToEnd", () => (ended += 1));

    video.dispatchEvent(new Event("play"));
    video.dispatchEvent(new Event("pause"));
    video.dispatchEvent(new Event("waiting"));
    Object.defineProperty(video, "readyState", { configurable: true, value: 4 });
    video.dispatchEvent(new Event("canplay"));
    video.dispatchEvent(new Event("ended"));

    expect(playing).toEqual([true, false]);
    expect(statuses).toEqual(["loading", "readyToPlay"]);
    expect(ended).toBe(1);
  });

  it("replace() points the mounted element at the new source", () => {
    const player = new WebVideoPlayer(null);
    const video = document.createElement("video");
    player.mountVideoView(video);
    player.replace({ uri: "https://example.test/clip.mp4" });
    expect(video.getAttribute("src")).toBe("https://example.test/clip.mp4");
    expect(player.src).toEqual({ uri: "https://example.test/clip.mp4" });
    player.replace(null);
    expect(video.hasAttribute("src")).toBe(false);
  });

  it("stops driving an element once it unmounts", () => {
    const player = new WebVideoPlayer(null);
    const video = document.createElement("video");
    player.mountVideoView(video);
    player.unmountVideoView(video);
    player.volume = 0.25;
    expect(video.volume).toBe(1);
  });
});
