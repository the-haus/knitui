/**
 * Holds the browser's Screen Wake Lock while it is both wanted and playing.
 *
 * The web counterpart of the native players' keep-screen-on flag. Browsers already
 * keep the screen on for a video with sound, but not for a muted or silent one, and
 * they drop a wake lock whenever the tab is hidden, so it is re-acquired when the
 * tab comes back. A no-op where the API is missing (and on native, where the player
 * does this itself).
 */
interface WakeLockSentinelLike {
  release(): Promise<void>;
}

interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

function wakeLock(): WakeLockLike | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as { wakeLock?: WakeLockLike }).wakeLock ?? null;
}

export class ScreenWakeLock {
  private wanted = false;
  private playing = false;
  private sentinel: WakeLockSentinelLike | null = null;
  /** Bumped on every change so a request that resolves late knows it is stale. */
  private generation = 0;
  private listening = false;

  setWanted(wanted: boolean): void {
    if (this.wanted === wanted) return;
    this.wanted = wanted;
    this.sync();
  }

  setPlaying(playing: boolean): void {
    if (this.playing === playing) return;
    this.playing = playing;
    this.sync();
  }

  dispose(): void {
    this.wanted = false;
    this.sync();
  }

  private readonly onVisibility = (): void => {
    // The browser released the lock when the tab was hidden: forget the dead
    // sentinel, or coming back would look like the lock is still held.
    if (document.visibilityState !== "visible") this.sentinel = null;
    this.sync();
  };

  private sync(): void {
    const api = wakeLock();
    if (!api || typeof document === "undefined") return;
    const hold = this.wanted && this.playing;
    const generation = ++this.generation;

    if (hold !== this.listening) {
      this.listening = hold;
      if (hold) document.addEventListener("visibilitychange", this.onVisibility);
      else document.removeEventListener("visibilitychange", this.onVisibility);
    }

    if (!hold) {
      const held = this.sentinel;
      this.sentinel = null;
      void held?.release().catch(() => {});
      return;
    }
    if (this.sentinel || document.visibilityState !== "visible") return;
    api.request("screen").then(
      (sentinel) => {
        if (generation !== this.generation || this.sentinel) {
          void sentinel.release().catch(() => {});
          return;
        }
        this.sentinel = sentinel;
      },
      () => {
        // Refused (battery saver, no user activation). Nothing to do but carry on.
      },
    );
  }
}
