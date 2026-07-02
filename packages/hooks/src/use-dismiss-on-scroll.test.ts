/**
 * Tests for the native close-on-scroll detector. It polls the reference's window
 * rect and dismisses once it *scrolls* — but distinguishes a scroll from the three
 * non-scroll movements that would otherwise close a dropdown mid-interaction:
 *
 * - the keyboard animating (a settle window after open / each keyboard event),
 * - a late `KeyboardAvoidingView` re-layout (a one-shot jump — a scroll moves
 *   continuously, so a single moved poll never dismisses),
 * - content reflow that resizes the reference (a scroll keeps the size constant).
 *
 * Timeline (POLL_MS = 100, KEYBOARD_SETTLE_MS = 350, MOVED_TICKS_TO_DISMISS = 2):
 * the settle window clears ~350ms after open / after the last keyboard event, and
 * a dismiss needs two consecutive polls of same-size movement after that.
 */
import type * as React from "react";

import { renderHook } from "@testing-library/react";

import { useDismissOnScroll } from "./use-dismiss-on-scroll.native";
import * as keyboard from "./use-keyboard-height";

// Controllable keyboard tracker: tests fire show/hide via `fireKeyboard()`.
jest.mock("./use-keyboard-height", () => {
  const listeners = new Set<() => void>();
  return {
    getKeyboardHeight: () => 0,
    useKeyboardHeight: () => 0,
    subscribeKeyboardHeight: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    __fireKeyboard: () => listeners.forEach((listener) => listener()),
  };
});
const fireKeyboard = () => (keyboard as unknown as { __fireKeyboard: () => void }).__fireKeyboard();

/** Advance past the open settle window so movement can be evaluated. */
const SETTLE_MS = 400;
/** One poll interval. */
const POLL = 100;

type Pos = { x: number; y: number; w?: number; h?: number };

/** A fake reference node whose `measureInWindow` reports the current `pos`. */
function makeRef(getPos: () => Pos): React.RefObject<never> {
  return {
    current: {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => {
        const p = getPos();
        cb(p.x, p.y, p.w ?? 10, p.h ?? 10);
      },
    },
  } as unknown as React.RefObject<never>;
}

describe("useDismissOnScroll (native)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("dismisses on a sustained scroll (incl. with the keyboard up)", () => {
    let pos: Pos = { x: 0, y: 300 }; // e.g. an input near the keyboard
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        true,
        makeRef(() => pos),
        onDismiss,
      ),
    );

    // Still through the settle window: no dismissal.
    jest.advanceTimersByTime(SETTLE_MS);
    expect(onDismiss).not.toHaveBeenCalled();

    // Scroll moves the reference continuously across consecutive polls.
    pos = { x: 0, y: 270 };
    jest.advanceTimersByTime(POLL);
    expect(onDismiss).not.toHaveBeenCalled(); // one moved poll is not yet a scroll
    pos = { x: 0, y: 240 };
    jest.advanceTimersByTime(POLL);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss on a single one-shot jump (late KAV re-layout)", () => {
    // The reference jumps once and then stays put — a layout shift, not a scroll.
    let pos: Pos = { x: 0, y: 300 };
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        true,
        makeRef(() => pos),
        onDismiss,
      ),
    );
    jest.advanceTimersByTime(SETTLE_MS);

    pos = { x: 0, y: 120 }; // one big jump
    jest.advanceTimersByTime(POLL);
    jest.advanceTimersByTime(POLL * 3); // then still
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not dismiss while the reference stays put", () => {
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        true,
        makeRef(() => ({ x: 0, y: 300 })),
        onDismiss,
      ),
    );
    jest.advanceTimersByTime(1500);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("ignores sub-threshold jitter", () => {
    let pos: Pos = { x: 0, y: 300 };
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        true,
        makeRef(() => pos),
        onDismiss,
      ),
    );
    jest.advanceTimersByTime(SETTLE_MS);
    pos = { x: 1, y: 302 }; // < 6px each poll
    jest.advanceTimersByTime(300);
    pos = { x: 2, y: 304 };
    jest.advanceTimersByTime(300);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not dismiss when the reference reflows (grows), even while moving", () => {
    // A searchable MultiSelect grows its field when a pill is added — the field
    // both resizes AND shifts under KeyboardAvoidingView. The size change marks it
    // a reflow, so it never counts as a scroll however far it moved.
    let pos: Pos = { x: 0, y: 300, h: 40 };
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        true,
        makeRef(() => pos),
        onDismiss,
      ),
    );
    jest.advanceTimersByTime(SETTLE_MS);

    // Pill added: field grows and shifts up over two polls.
    pos = { x: 0, y: 260, h: 80 };
    jest.advanceTimersByTime(POLL);
    pos = { x: 0, y: 220, h: 120 };
    jest.advanceTimersByTime(POLL);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("ignores movement during the open settle window", () => {
    // The reference moves while the dropdown is opening (keyboard animation / KAV
    // relayout in progress): no dismissal, and a real scroll afterwards still does.
    let pos: Pos = { x: 0, y: 300 };
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        true,
        makeRef(() => pos),
        onDismiss,
      ),
    );

    jest.advanceTimersByTime(POLL);
    pos = { x: 0, y: 120 }; // shift lands inside the settle window
    jest.advanceTimersByTime(SETTLE_MS);
    expect(onDismiss).not.toHaveBeenCalled();

    // A sustained scroll afterwards still dismisses.
    pos = { x: 0, y: 90 };
    jest.advanceTimersByTime(POLL);
    pos = { x: 0, y: 60 };
    jest.advanceTimersByTime(POLL);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss when a keyboard event's layout shift lands late (KAV after keyboardDidShow)", () => {
    // Regression: KeyboardAvoidingView re-lays out in a render AFTER
    // `keyboardDidShow`, so the old detector closed a focus-driven dropdown ~0.5s
    // after it opened. A keyboard event opens a fresh settle window, and the late
    // shift lands as a one-shot jump regardless.
    let pos: Pos = { x: 0, y: 300 };
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        true,
        makeRef(() => pos),
        onDismiss,
      ),
    );

    jest.advanceTimersByTime(SETTLE_MS);
    fireKeyboard(); // keyboardDidShow — reopens the settle window

    // The KAV shift lands well after the event (even past the settle window).
    jest.advanceTimersByTime(400);
    pos = { x: 0, y: 80 };
    jest.advanceTimersByTime(SETTLE_MS);
    expect(onDismiss).not.toHaveBeenCalled();

    // Once settled, a real (sustained) scroll still dismisses.
    pos = { x: 0, y: 50 };
    jest.advanceTimersByTime(POLL);
    pos = { x: 0, y: 20 };
    jest.advanceTimersByTime(POLL);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    let pos: Pos = { x: 0, y: 300 };
    const onDismiss = jest.fn();
    renderHook(() =>
      useDismissOnScroll(
        false,
        makeRef(() => pos),
        onDismiss,
      ),
    );
    pos = { x: 0, y: 0 };
    jest.advanceTimersByTime(1500);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("tolerates a reference that mounts after the effect runs", () => {
    // Ref starts empty (node not yet mounted), then resolves a node later. The
    // detector must keep polling rather than bail permanently on the null ref.
    let pos: Pos = { x: 0, y: 300 };
    const ref = { current: null } as unknown as React.RefObject<never>;
    const node = {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(pos.x, pos.y, 10, 10),
    };
    const onDismiss = jest.fn();
    renderHook(() => useDismissOnScroll(true, ref, onDismiss));

    // Reference mounts after the hook's effect has already run.
    (ref as { current: unknown }).current = node;
    jest.advanceTimersByTime(SETTLE_MS); // baseline captured from the mounted node

    pos = { x: 0, y: 270 }; // sustained scroll
    jest.advanceTimersByTime(POLL);
    pos = { x: 0, y: 240 };
    jest.advanceTimersByTime(POLL);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
