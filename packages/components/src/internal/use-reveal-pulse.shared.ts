import { DURATIONS } from "@knitui/core";

/**
 * Shared types + defaults for the reveal-then-pulse primitive
 * (`use-reveal-pulse` web / `.native`) behind `SkeletonGroup`. One element, one
 * animation timeline:
 *
 *   1. HOLD at opacity 0 for `delayMs` — content that arrives inside it swaps in
 *      without a placeholder ever painting (no grey strobe on a fast load);
 *   2. FADE to 1 over `fadeMs`;
 *   3. PULSE between 1 and `minOpacity` forever, `durationMs` per half-cycle.
 *
 * Reduced motion keeps the hold (it is about flashing, not motion) and snaps in
 * with no fade and no pulse. Both platform files read these defaults so the
 * web and native silhouettes keep the same clock.
 */
export interface RevealPulseMotion {
  /** Hold invisible before revealing, ms. @default 150 */
  delayMs?: number;
  /** Fade-in once the hold ends, ms. @default 200 (`DURATIONS.base`) */
  fadeMs?: number;
  /** One pulse half-cycle, ms. @default 1200 (2 × `DURATIONS.ambient`) */
  durationMs?: number;
  /** Dimmest opacity at the pulse's trough. @default 0.5 */
  minOpacity?: number;
  /** Pulse after revealing. `false` → hold, fade in, stay solid. @default true */
  pulse?: boolean;
}

export type ResolvedRevealPulse = Required<RevealPulseMotion>;

export const REVEAL_PULSE_DEFAULTS: ResolvedRevealPulse = {
  delayMs: DURATIONS.fast,
  fadeMs: DURATIONS.base,
  durationMs: DURATIONS.ambient * 2,
  minOpacity: 0.5,
  pulse: true,
};

/** Apply the documented defaults; negative times clamp to 0. */
export function resolveRevealPulse(motion: RevealPulseMotion = {}): ResolvedRevealPulse {
  const m = { ...REVEAL_PULSE_DEFAULTS, ...stripUndefined(motion) };
  return {
    ...m,
    delayMs: Math.max(0, m.delayMs),
    fadeMs: Math.max(0, m.fadeMs),
    durationMs: Math.max(0, m.durationMs),
  };
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(o) as Array<keyof T>) {
    if (o[k] !== undefined) out[k] = o[k];
  }
  return out;
}
