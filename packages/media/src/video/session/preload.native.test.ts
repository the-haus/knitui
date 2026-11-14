/**
 * The NATIVE preload path, run here with the platform flag flipped and a fake
 * player: a short-lived muted player buffers the start of the source into the
 * cache, and the real player is then pointed at that cache.
 */
import {
  clearAllPreloadedSources,
  getPreloadedSources,
  preload,
  withPreloadCache,
} from "./preload";

interface FakePlayer {
  source: Record<string, unknown>;
  status: string;
  duration: number;
  bufferedPosition: number;
  muted: boolean;
  staysActiveInBackground: boolean;
  showNowPlayingNotification: boolean;
  keepScreenOnWhilePlaying: boolean;
  bufferOptions: Record<string, unknown>;
  released: boolean;
  release(): void;
}

const players: FakePlayer[] = [];

jest.mock("@knitui/core", () => ({ ...jest.requireActual("@knitui/core"), isWeb: false }));
jest.mock("@knitui/media/native/video", () => ({
  createVideoPlayer: (source: Record<string, unknown>): FakePlayer => {
    const player: FakePlayer = {
      source,
      status: "loading",
      duration: 0,
      bufferedPosition: 0,
      muted: false,
      staysActiveInBackground: true,
      showNowPlayingNotification: true,
      keepScreenOnWhilePlaying: true,
      bufferOptions: {},
      released: false,
      release() {
        this.released = true;
      },
    };
    players.push(player);
    return player;
  },
}));

const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe("video preload (native)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    players.length = 0;
  });
  afterEach(async () => {
    await clearAllPreloadedSources();
    jest.useRealTimers();
  });

  it("buffers the start through a muted, cache-backed player and then releases it", async () => {
    let done = false;
    void preload("https://cdn.test/a.mp4", { preferredForwardBufferDuration: 8 }).then(() => {
      done = true;
    });
    await flush();

    expect(players).toHaveLength(1);
    const player = players[0];
    expect(player.source).toMatchObject({ uri: "https://cdn.test/a.mp4", useCaching: true });
    expect(player.muted).toBe(true);
    expect(player.keepScreenOnWhilePlaying).toBe(false);
    expect(player.showNowPlayingNotification).toBe(false);
    expect(player.bufferOptions).toMatchObject({ preferredForwardBufferDuration: 8 });

    jest.advanceTimersByTime(1000);
    await flush();
    expect(done).toBe(false); // still loading

    player.status = "readyToPlay";
    player.duration = 60;
    player.bufferedPosition = 7.5;
    jest.advanceTimersByTime(500);
    await flush();
    expect(done).toBe(true);
    expect(player.released).toBe(true);
    expect(await getPreloadedSources()).toEqual(["https://cdn.test/a.mp4"]);
  });

  it("points the real player at the cache for a preloaded source only", async () => {
    void preload("https://cdn.test/a.mp4");
    await flush();
    expect(withPreloadCache("https://cdn.test/a.mp4")).toEqual({
      uri: "https://cdn.test/a.mp4",
      useCaching: true,
    });
    expect(withPreloadCache({ uri: "https://cdn.test/a.mp4", headers: { a: "b" } })).toEqual({
      uri: "https://cdn.test/a.mp4",
      headers: { a: "b" },
      useCaching: true,
    });
    expect(withPreloadCache("https://cdn.test/other.mp4")).toBe("https://cdn.test/other.mp4");
  });

  it("joins a preload already running, and runs two at a time", async () => {
    const first = preload("https://cdn.test/a.mp4");
    expect(preload("https://cdn.test/a.mp4")).toBe(first);
    void preload("https://cdn.test/b.mp4");
    void preload("https://cdn.test/c.mp4");
    await flush();
    expect(players).toHaveLength(2);

    players[0].status = "error"; // a failed preload frees its slot too
    jest.advanceTimersByTime(500);
    await flush();
    expect(players).toHaveLength(3);
    expect(players[0].released).toBe(true);
  });

  it("gives up after the timeout, and skips what the cache cannot hold", async () => {
    let done = false;
    void preload("https://cdn.test/slow.mp4").then(() => {
      done = true;
    });
    await flush();
    jest.advanceTimersByTime(20_000);
    await flush();
    expect(done).toBe(true);
    expect(players[0].released).toBe(true);

    players.length = 0;
    await preload("file:///local/clip.mp4");
    await preload({
      uri: "https://cdn.test/drm.mp4",
      drm: { type: "widevine", licenseServer: "x" },
    });
    await preload(null);
    expect(players).toHaveLength(0);
  });

  it("stops and forgets everything on clear", async () => {
    void preload("https://cdn.test/a.mp4");
    await flush();
    await clearAllPreloadedSources();
    expect(players[0].released).toBe(true);
    expect(await getPreloadedSources()).toEqual([]);
    expect(withPreloadCache("https://cdn.test/a.mp4")).toBe("https://cdn.test/a.mp4");
  });
});
