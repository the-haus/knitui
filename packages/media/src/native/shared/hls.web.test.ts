import {
  detachHls,
  isHlsSource,
  needsHlsLibrary,
  resetHlsSupportForTests,
  syncHlsSource,
} from "./hls.web";

interface MockHlsShape {
  loaded: string | null;
  media: HTMLMediaElement | null;
  destroyed: boolean;
  config: { xhrSetup?: (xhr: { setRequestHeader(name: string, value: string): void }) => void };
  fail(type: string, fatal?: boolean): void;
  startLoad: jest.Mock;
  recoverMediaError: jest.Mock;
}

const mockInstances: MockHlsShape[] = [];
let mockSupported = true;

jest.mock("hls.js", () => {
  class MockHls {
    static Events = { ERROR: "hlsError" };
    static ErrorTypes = { NETWORK_ERROR: "networkError", MEDIA_ERROR: "mediaError" };
    static isSupported = (): boolean => mockSupported;

    loaded: string | null = null;
    media: HTMLMediaElement | null = null;
    destroyed = false;
    startLoad = jest.fn();
    recoverMediaError = jest.fn();
    private handler: ((event: string, data: { fatal: boolean; type: string }) => void) | null =
      null;

    config: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.config = options;
      mockInstances.push(this as never);
    }
    on(
      _event: string,
      handler: (event: string, data: { fatal: boolean; type: string }) => void,
    ): void {
      this.handler = handler;
    }
    loadSource(uri: string): void {
      this.loaded = uri;
    }
    attachMedia(media: HTMLMediaElement): void {
      this.media = media;
    }
    destroy(): void {
      this.destroyed = true;
    }
    fail(type: string, fatal = true): void {
      this.handler?.("hlsError", { fatal, type });
    }
  }
  return { __esModule: true, default: MockHls };
});

/** Let the dynamic `import("hls.js")` settle. */
const loaded = async (): Promise<void> => {
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

function setNativeHls(native: boolean): void {
  jest
    .spyOn(HTMLMediaElement.prototype, "canPlayType")
    .mockImplementation((type) => (native && type.includes("mpegurl") ? "maybe" : ""));
  resetHlsSupportForTests();
}

describe("web HLS adapter", () => {
  beforeEach(() => {
    mockInstances.length = 0;
    mockSupported = true;
    setNativeHls(false);
  });
  afterEach(() => jest.restoreAllMocks());

  it("recognises HLS by extension or by an explicit content type", () => {
    expect(isHlsSource("https://a.test/live.m3u8")).toBe(true);
    expect(isHlsSource("https://a.test/live.m3u8?token=1")).toBe(true);
    expect(isHlsSource("https://a.test/stream", "hls")).toBe(true);
    expect(isHlsSource("https://a.test/clip.mp4")).toBe(false);
  });

  it("leaves HLS to a browser that plays it natively", async () => {
    setNativeHls(true);
    const video = document.createElement("video");
    expect(needsHlsLibrary("https://a.test/live.m3u8")).toBe(false);
    expect(syncHlsSource(video, "https://a.test/live.m3u8")).toBe(false);
    await loaded();
    expect(mockInstances).toHaveLength(0);
  });

  it("leaves an ordinary file alone", () => {
    const video = document.createElement("video");
    expect(syncHlsSource(video, "https://a.test/clip.mp4")).toBe(false);
    expect(syncHlsSource(video, null)).toBe(false);
  });

  it("feeds an HLS stream through hls.js, with the source's headers", async () => {
    const video = document.createElement("video");
    expect(
      syncHlsSource(video, "https://a.test/live.m3u8", { headers: { Authorization: "Bearer x" } }),
    ).toBe(true);
    await loaded();

    expect(mockInstances).toHaveLength(1);
    expect(mockInstances[0].loaded).toBe("https://a.test/live.m3u8");
    expect(mockInstances[0].media).toBe(video);
    const setRequestHeader = jest.fn();
    mockInstances[0].config.xhrSetup?.({ setRequestHeader });
    expect(setRequestHeader).toHaveBeenCalledWith("Authorization", "Bearer x");
  });

  it("replaces the stream when the source changes, and frees it on detach", async () => {
    const video = document.createElement("video");
    syncHlsSource(video, "https://a.test/one.m3u8");
    await loaded();
    syncHlsSource(video, "https://a.test/two.m3u8");
    await loaded();
    expect(mockInstances[0].destroyed).toBe(true);
    expect(mockInstances[1].loaded).toBe("https://a.test/two.m3u8");

    detachHls(video);
    expect(mockInstances[1].destroyed).toBe(true);
  });

  it("never attaches when the source changed before the library arrived", async () => {
    const video = document.createElement("video");
    syncHlsSource(video, "https://a.test/one.m3u8");
    syncHlsSource(video, "https://a.test/clip.mp4"); // replaced straight away
    await loaded();
    expect(mockInstances).toHaveLength(0);
  });

  it("recovers once from a fatal error of each kind, then reports the failure", async () => {
    const video = document.createElement("video");
    const onError = jest.fn();
    video.addEventListener("error", onError);
    syncHlsSource(video, "https://a.test/live.m3u8");
    await loaded();
    const hls = mockInstances[0];

    hls.fail("networkError", false); // not fatal: hls.js handles it
    hls.fail("networkError");
    expect(hls.startLoad).toHaveBeenCalledTimes(1);
    hls.fail("mediaError");
    expect(hls.recoverMediaError).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();

    hls.fail("networkError");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(hls.destroyed).toBe(true);
  });

  it("reports an error where Media Source Extensions are missing", async () => {
    mockSupported = false;
    const video = document.createElement("video");
    const onError = jest.fn();
    video.addEventListener("error", onError);
    syncHlsSource(video, "https://a.test/live.m3u8");
    await loaded();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
