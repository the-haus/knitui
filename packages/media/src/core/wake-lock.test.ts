import { ScreenWakeLock } from "./wake-lock";

function installWakeLock(): { requests: number; released: number } {
  const stats = { requests: 0, released: 0 };
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: {
      request: async () => {
        stats.requests++;
        return {
          release: async () => {
            stats.released++;
          },
        };
      },
    },
  });
  return stats;
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe("ScreenWakeLock", () => {
  afterEach(() => {
    delete (navigator as { wakeLock?: unknown }).wakeLock;
  });

  it("holds the lock only while wanted AND playing", async () => {
    const stats = installWakeLock();
    const lock = new ScreenWakeLock();

    lock.setWanted(true);
    await settle();
    expect(stats.requests).toBe(0); // not playing yet

    lock.setPlaying(true);
    await settle();
    expect(stats.requests).toBe(1);

    lock.setPlaying(false);
    await settle();
    expect(stats.released).toBe(1);

    lock.setPlaying(true);
    await settle();
    lock.setWanted(false);
    await settle();
    expect(stats.requests).toBe(2);
    expect(stats.released).toBe(2);
  });

  it("releases a lock that was granted after it stopped being wanted", async () => {
    const stats = installWakeLock();
    const lock = new ScreenWakeLock();
    lock.setWanted(true);
    lock.setPlaying(true);
    lock.setPlaying(false); // before the request resolved
    await settle();
    expect(stats.requests).toBe(1);
    expect(stats.released).toBe(1);
  });

  it("asks again when the tab comes back, since the browser dropped the lock", async () => {
    const stats = installWakeLock();
    const lock = new ScreenWakeLock();
    const setVisibility = (state: string): void => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    try {
      lock.setWanted(true);
      lock.setPlaying(true);
      await settle();
      expect(stats.requests).toBe(1);

      setVisibility("hidden");
      await settle();
      expect(stats.requests).toBe(1);

      setVisibility("visible");
      await settle();
      expect(stats.requests).toBe(2);
    } finally {
      lock.dispose();
      delete (document as { visibilityState?: unknown }).visibilityState;
    }
  });

  it("does nothing where the API is missing", () => {
    const lock = new ScreenWakeLock();
    expect(() => {
      lock.setWanted(true);
      lock.setPlaying(true);
      lock.dispose();
    }).not.toThrow();
  });
});
