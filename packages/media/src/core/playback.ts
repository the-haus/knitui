/**
 * The small rules every player adapter applies the same way. They used to be
 * written out in both the audio and the video controller.
 */

/** A seek target held inside `[0, duration]`, or just non-negative while the duration is unknown. */
export function clampSeekTarget(seconds: number, duration: number): number {
  const target = Math.max(0, seconds);
  return Number.isFinite(duration) && duration > 0 ? Math.min(target, duration) : target;
}

/** A volume held inside `[0, 1]`. */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

/**
 * A one-shot timer for "this has been stuck too long". `arm()` starts it unless it
 * is already running, so repeated stall reports do not push the deadline back;
 * `clear()` cancels it.
 */
export class StallWatch {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly timeoutMs: number,
    private readonly onStall: () => void,
  ) {}

  get armed(): boolean {
    return this.timer !== null;
  }

  arm(): void {
    this.timer ??= setTimeout(() => {
      this.timer = null;
      this.onStall();
    }, this.timeoutMs);
  }

  /** Start the countdown over. */
  restart(): void {
    this.clear();
    this.arm();
  }

  clear(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
