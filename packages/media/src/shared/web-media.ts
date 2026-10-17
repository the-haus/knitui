/**
 * The browser primitives the kit's own WEB media backends share — the audio
 * player / recorder (`audio/web`) and the video player / view (`video/web`).
 *
 * The web build never loads `expo-audio`, `expo-video`, `expo` or
 * `expo-modules-core`: those are the NATIVE backends (`*.native.ts`). On the web
 * the same controllers drive these small, dependency-free classes instead, which
 * speak the subset of the expo player API the controllers use (`addListener`
 * returning a `{ remove }` subscription, the same event names and payloads), so
 * nothing above the session layer knows which backend it got.
 *
 * Adapted from expo-audio / expo-video's own `.web` backends (MIT, © 650
 * Industries), minus their dependency on expo's `SharedObject` runtime.
 */
import { TypedEmitter } from "./emitter";

/** The handle `addListener` returns, as expo's event emitters do. */
export interface WebSubscription {
  remove(): void;
}

/**
 * Event plumbing with expo's shape: `addListener(event, fn) → { remove }` and a
 * protected `emit`. The event map is loose on purpose — payload types are the
 * expo ones, declared where each backend is consumed.
 */
export class WebEventSource {
  private readonly emitter = new TypedEmitter<Record<string, unknown>>();

  addListener(event: string, listener: (payload: never) => void): WebSubscription {
    const off = this.emitter.on(event, listener as (payload: unknown) => void);
    return { remove: off };
  }

  removeAllListeners(event?: string): void {
    // Rebuild-free: `TypedEmitter` has no bulk removal, so listeners are tracked
    // by the subscriptions callers hold; this exists for API parity only.
    void event;
  }

  protected emit(event: string, payload?: unknown): void {
    this.emitter.emit(event, payload);
  }
}

/** Monotonic string ids, like expo's shared-object ids. */
export const nextMediaId = (() => {
  let id = 0;
  return () => String(id++);
})();

/** A finite, non-NaN duration in seconds (0 when unknown or live). */
export function safeDuration(duration: number): number {
  return Number.isNaN(duration) || !Number.isFinite(duration) ? 0 : duration;
}

/**
 * The URL of a media source. Strings and `{ uri }` objects pass through; a
 * bundler-imported asset (a string, `{ default }` or `{ src }` from webpack /
 * Next / Vite) is unwrapped. A React Native `require()` asset id (a number) only
 * exists in a Metro web build, where it is resolved by the asset registry the
 * caller already has — the kit's web backends treat it as unresolvable rather
 * than load `expo-asset`.
 */
export function mediaSourceUri(source: unknown): string | null {
  if (source == null) return null;
  if (typeof source === "string") return source;
  if (typeof source !== "object") return null;
  const s = source as { uri?: unknown; src?: unknown; default?: unknown };
  if (typeof s.uri === "string") return s.uri;
  if (typeof s.src === "string") return s.src;
  if (s.default != null) return mediaSourceUri(s.default);
  return null;
}

let audioContext: AudioContext | null = null;

/** The one shared `AudioContext` (created on first use, never in SSR). */
export function getSharedAudioContext(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

/** `navigator.mediaDevices.getUserMedia`, refusing cleanly where it is absent. */
export function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  const devices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  if (devices?.getUserMedia) return devices.getUserMedia(constraints);
  const error = new Error("Microphone access is not available in this browser");
  error.name = "NotAllowedError";
  return Promise.reject(error);
}

/**
 * The fields a fresh, unloaded `<audio>` element reports — what a status
 * snapshot taken during a server render must describe (an idle player).
 */
const IDLE_MEDIA_FIELDS: Record<string, unknown> = {
  volume: 1,
  muted: false,
  loop: false,
  playbackRate: 1,
  defaultPlaybackRate: 1,
  preservesPitch: true,
  currentTime: 0,
  duration: NaN,
  paused: true,
  ended: false,
  seeking: false,
  readyState: 0,
  networkState: 0,
  crossOrigin: null,
  src: "",
  currentSrc: "",
  error: null,
};

/**
 * A stand-in for `new Audio(src)` where there is no `Audio` — a server render
 * (Next's SSR builds the media provider's engine too). It holds the idle
 * fields above, accepts writes, dispatches nothing, and answers any method
 * (`play`, `pause`, `load`, …) with an inert function, so the engine can wire
 * itself up and report an idle player. Nothing global is touched: the browser
 * build of the same engine gets a real element.
 */
export function inertMediaElement(src?: string | null): HTMLAudioElement {
  const target = new EventTarget() as EventTarget & Record<string, unknown>;
  Object.assign(target, IDLE_MEDIA_FIELDS);
  if (src != null) {
    target.src = src;
    target.currentSrc = src;
  }
  return new Proxy(target, {
    get(t, prop, receiver) {
      if (typeof prop === "symbol" || prop in t) return Reflect.get(t, prop, receiver);
      return () => undefined;
    },
    set(t, prop, value) {
      t[prop as string] = value;
      return true;
    },
  }) as unknown as HTMLAudioElement;
}
