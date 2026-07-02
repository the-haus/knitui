/**
 * Native measurement layer for the floating engine.
 *
 * Model (kept deliberately simple — this was the most accurate in practice): the
 * **reference (target)** is the shared source of truth. We measure it in window
 * coordinates (`measureInWindow`) and position the floating element at those same
 * coordinates inside the full-screen portal host that `@knitui/core`'s `<Provider>`
 * mounts at the window origin. All the placement math therefore stays in one
 * coordinate space.
 *
 * The one wrinkle is **Android**: with an edge-to-edge / translucent status bar,
 * `measureInWindow` reports the target relative to the app window, which is offset
 * from the full-screen host by the status-bar height — so the popup lands too high
 * (on a small trigger it reads as "centered" on it). We correct for exactly that
 * by translating the final position down by `StatusBar.currentHeight` (expressed
 * as a negative container origin, since the hook computes `result − containerOrigin`).
 * iOS needs no correction (window ≈ screen).
 *
 * Measurement callbacks fire **asynchronously over the bridge — later than any
 * microtask** — so never race them with a microtask/timer that resolves data. A
 * long, idempotent safety timeout only releases the in-flight guard if a callback
 * never arrives.
 */
import { Platform, Dimensions as RNDimensions, StatusBar } from "react-native";

import type { TamaguiElement } from "@knitui/core";
import { getKeyboardHeight, subscribeKeyboardHeight } from "@knitui/hooks";

import type { Coords, Dimensions, Rect, Strategy } from "./core";

/** What {@link measure} resolves to (shared shape with the web platform). */
export type MeasureResult = {
  reference: Rect | null;
  floating: Dimensions | null;
  /** Window-space origin of the floating element's positioning context. */
  containerOrigin: Coords;
};

type Measurable = {
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
  measure?: (
    callback: (
      x: number,
      y: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number,
    ) => void,
  ) => void;
};

const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** A measurement is only usable if it has finite, non-negative dimensions. */
const isValidRect = (r: Rect): boolean =>
  isFiniteNumber(r.x) &&
  isFiniteNumber(r.y) &&
  isFiniteNumber(r.width) &&
  isFiniteNumber(r.height) &&
  r.width >= 0 &&
  r.height >= 0;

/**
 * The full-screen portal host's origin relative to the window space that
 * `measureInWindow` reports in. On Android, an edge-to-edge status bar offsets the
 * window from the screen-spanning host by the status-bar height; encoding it as a
 * negative origin makes the hook shift the final position down by that amount.
 * (If a build ever shows the popup too LOW instead, flip the sign here.)
 */
function getHostOrigin(): Coords {
  if (Platform.OS === "android") {
    const statusBarHeight = StatusBar.currentHeight ?? 0;
    return { x: 0, y: -statusBarHeight };
  }
  return { x: 0, y: 0 };
}

/**
 * Safety net so a node that never fires its measure callback (e.g. detached
 * mid-measure) can't leave the hook's in-flight guard stuck forever. The delay is
 * far longer than a real bridge round-trip (~a frame), so it never races and
 * clobbers a genuine measurement — `resolve` is idempotent, so whichever fires
 * first wins and this is a no-op in the normal case.
 */
const MEASURE_TIMEOUT_MS = 2000;

function withTimeout<T>(run: (resolve: (value: T | null) => void) => void): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: T | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => settle(null), MEASURE_TIMEOUT_MS);
    run(settle);
  });
}

/** Measure a node's **window-space** rect via `measureInWindow` (or `measure`). */
function measureWindowRect(node: TamaguiElement | null): Promise<Rect | null> {
  const m = node as unknown as Measurable | null;
  if (!m) return Promise.resolve(null);

  if (typeof m.measureInWindow === "function") {
    return withTimeout<Rect>((resolve) => {
      m.measureInWindow!((x, y, width, height) => {
        const rect = { x, y, width, height };
        resolve(isValidRect(rect) ? rect : null);
      });
    });
  }
  if (typeof m.measure === "function") {
    return withTimeout<Rect>((resolve) => {
      m.measure!((_x, _y, width, height, pageX, pageY) => {
        const rect = { x: pageX, y: pageY, width, height };
        resolve(isValidRect(rect) ? rect : null);
      });
    });
  }
  return Promise.resolve(null);
}

/**
 * The viewport rect in window coordinates (the space the reference is measured
 * in), with the on-screen keyboard excluded from the bottom so flip/shift keep
 * the floating element out from behind it. Keyboard height comes from the shared
 * tracker in `@knitui/hooks` (`getKeyboardHeight` wires its listeners on first use).
 */
export function getViewport(): Rect {
  const { width, height } = RNDimensions.get("window");
  return { x: 0, y: 0, width, height: Math.max(0, height - getKeyboardHeight()) };
}

/**
 * Measure the reference (window-space rect, the shared source of truth). The
 * floating element's size is taken from `floatingSize` when provided (the
 * consumer reports it from `onLayout` — reliable and timely); otherwise it's
 * measured as a fallback. The container origin accounts for the Android status
 * bar so the window-space placement lands correctly in the full-screen host.
 */
export async function measure(
  referenceNode: TamaguiElement | null,
  floatingNode: TamaguiElement | null,
  _strategy: Strategy,
  floatingSize?: Dimensions | null,
): Promise<MeasureResult> {
  const hasSize =
    !!floatingSize && isFiniteNumber(floatingSize.width) && isFiniteNumber(floatingSize.height);

  const [reference, floating] = await Promise.all([
    measureWindowRect(referenceNode),
    hasSize ? Promise.resolve(null) : measureWindowRect(floatingNode),
  ]);

  if (!reference) {
    return { reference: null, floating: null, containerOrigin: getHostOrigin() };
  }

  const size: Dimensions | null = hasSize
    ? { width: floatingSize!.width, height: floatingSize!.height }
    : floating
      ? { width: floating.width, height: floating.height }
      : null;

  if (!size) {
    return { reference: null, floating: null, containerOrigin: getHostOrigin() };
  }

  return { reference, floating: size, containerOrigin: getHostOrigin() };
}

/**
 * If the reference sits inside a `KeyboardAvoidingView`, its keyboard-driven
 * layout shift lands in a render AFTER the keyboard event itself, so the
 * immediate re-measure would capture its pre-shift position. A single short
 * trailing re-measure catches the settled layout once it commits (cheap, and
 * coalesced by the position hook's in-flight guard). Intentionally just one — the
 * popover settles to its keyboard-clear spot and stays put, so it stays navigable
 * rather than chasing the keyboard across several frames.
 */
const KEYBOARD_RESETTLE_DELAY_MS = 150;

/**
 * Keep the floating element aligned while it's open — **event-driven, no polling**:
 *
 * - position once on mount, and
 * - reposition once on keyboard show/hide (the usable viewport shrinks — see
 *   `getViewport` — so the dropdown flips/shifts clear of the keyboard), with one
 *   trailing re-measure as the post-keyboard layout settles
 *   (see {@link KEYBOARD_RESETTLE_DELAY_MS}). The overlay does NOT follow the
 *   keyboard frame-by-frame; it settles to its keyboard-clear position and holds.
 *
 * Scroll is intentionally NOT followed here: React Native has no global scroll
 * event, so following would require per-frame polling. The overlay instead
 * *closes* on scroll (see `useDismissOnScroll`), the idiomatic native behavior.
 */
export function autoUpdate(
  _referenceNode: TamaguiElement | null,
  _floatingNode: TamaguiElement | null,
  onUpdate: () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Reposition whenever the keyboard shows/hides — the shared tracker fans those
  // out to one app-lifetime listener pair (see `@knitui/hooks`).
  const onKeyboard = () => {
    if (timer) clearTimeout(timer);
    onUpdate();
    timer = setTimeout(onUpdate, KEYBOARD_RESETTLE_DELAY_MS);
  };
  const unsubscribe = subscribeKeyboardHeight(onKeyboard);

  onUpdate();

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
