import { setWebAudioActive, WebAudioPlayer, webPreloadCache } from "./web-audio-player";

/** The `<audio>` the player built, read through its private field. */
const mediaOf = (p: WebAudioPlayer) => (p as unknown as { media: HTMLAudioElement }).media;

describe("WebAudioPlayer (the kit's web audio backend)", () => {
  afterEach(() => {
    setWebAudioActive(true);
    webPreloadCache.clear();
  });

  it("speaks expo's event shape: playbackStatusUpdate with `playing`", () => {
    const player = new WebAudioPlayer("https://example.test/a.mp3");
    const seen: { playing: boolean; id: string }[] = [];
    const sub = player.addListener("playbackStatusUpdate", (s: { playing: boolean; id: string }) =>
      seen.push(s),
    );
    mediaOf(player).dispatchEvent(new Event("play"));
    mediaOf(player).dispatchEvent(new Event("pause"));
    expect(seen.map((s) => s.playing)).toEqual([true, false]);
    expect(seen[0]?.id).toBe(player.id);
    sub.remove();
    mediaOf(player).dispatchEvent(new Event("play"));
    expect(seen).toHaveLength(2);
    player.release();
  });

  it("refuses to play while the audio session is inactive, and pauses what was playing", () => {
    const player = new WebAudioPlayer("https://example.test/a.mp3");
    player.play();
    expect(player.playing).toBe(true);
    setWebAudioActive(false);
    expect(player.playing).toBe(false);
    player.play();
    expect(player.playing).toBe(false);
    setWebAudioActive(true);
    player.play();
    expect(player.playing).toBe(true);
    player.release();
  });

  it("replace() swaps the element, keeps playing, and uses a preloaded blob", () => {
    webPreloadCache.set("https://example.test/b.mp3", {
      blobUrl: "blob:preloaded-b",
      audio: new Audio(),
    });
    const player = new WebAudioPlayer("https://example.test/a.mp3");
    player.play();
    const before = mediaOf(player);
    player.replace("https://example.test/b.mp3");
    expect(mediaOf(player)).not.toBe(before);
    expect(mediaOf(player).src).toBe("blob:preloaded-b");
    expect(player.playing).toBe(true);
    player.release();
  });

  it("reports an error status when the element fails", () => {
    const player = new WebAudioPlayer("https://example.test/broken.mp3");
    const errors: (string | null)[] = [];
    player.addListener("playbackStatusUpdate", (s: { error: string | null }) =>
      errors.push(s.error),
    );
    mediaOf(player).dispatchEvent(new Event("error"));
    expect(errors[0]).toMatch(/error/i);
    player.release();
  });

  it("builds on a server render, where there is no Audio, and reports an idle player", () => {
    const real = globalThis.Audio;
    // @ts-expect-error -- a server render has no `Audio`.
    delete globalThis.Audio;
    try {
      const player = new WebAudioPlayer("https://example.test/a.mp3");
      expect(player.playing).toBe(false);
      expect(player.muted).toBe(false);
      expect(player.currentTime).toBe(0);
      expect(() => player.pause()).not.toThrow();
      player.release();
    } finally {
      globalThis.Audio = real;
    }
  });
});
