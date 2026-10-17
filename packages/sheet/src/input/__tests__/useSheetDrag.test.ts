import { renderHook } from "@testing-library/react";

import type { SettleResult } from "../../engine";
import { MotionValue } from "../../motion/value";
import type { SheetDragParams } from "../drag.types";
import { useSheetDrag, type WebSheetDrag } from "../useSheetDrag";

/** Snaps at 80 % and 10 % of an 800 px layer: offsets 160 and 720, closed 800. */
const OFFSETS = [160, 720];
const CLOSED = 800;

let clock = 0;

/** jsdom has no PointerEvent: a MouseEvent carrying the pointer fields. */
function pointer(type: string, y: number, x = 100, extra: Partial<PointerEvent> = {}): Event {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperties(e, {
    pointerId: { value: 1 },
    pointerType: { value: "touch" },
    timeStamp: { value: clock },
  });
  Object.assign(e, extra);
  return e;
}

function setup(overrides: Partial<SheetDragParams> = {}) {
  const offset = new MotionValue(160);
  const onStart = jest.fn();
  const onSettle = jest.fn<void, [SettleResult]>();
  const params: SheetDragParams = {
    offset,
    offsets: OFFSETS,
    closed: CLOSED,
    dismissible: true,
    enabled: true,
    onStart,
    onSettle,
    ...overrides,
  };
  const { result } = renderHook(() => useSheetDrag(params));
  const element = document.createElement("div");
  document.body.appendChild(element);
  const detach = (result.current as WebSheetDrag).attach(element);
  const down = (y: number, x?: number) => element.dispatchEvent(pointer("pointerdown", y, x));
  const move = (y: number, x?: number) => {
    clock += 16;
    window.dispatchEvent(pointer("pointermove", y, x));
  };
  const up = (y: number) => {
    clock += 16;
    window.dispatchEvent(pointer("pointerup", y));
  };
  const cancel = () => window.dispatchEvent(pointer("pointercancel", 0));
  return { offset, onStart, onSettle, element, detach, down, move, up, cancel };
}

describe("useSheetDrag (web)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clock = 0;
  });
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  it("stops the page from panning under the sheet while attached", () => {
    const { element, detach } = setup();
    expect(element.style.touchAction).toBe("none");
    detach();
    expect(element.style.touchAction).toBe("");
  });

  it("leaves a tap alone (below the activation threshold)", () => {
    const { offset, onStart, onSettle, down, move, up } = setup();
    down(300);
    move(304);
    up(304);
    expect(onStart).not.toHaveBeenCalled();
    expect(onSettle).not.toHaveBeenCalled();
    expect(offset.value).toBe(160);
  });

  it("follows the pointer once it travels vertically, and settles on release", () => {
    const { offset, onStart, onSettle, down, move, up } = setup();
    down(300);
    move(310);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(offset.value).toBe(170);
    // Slow drag to near the lower snap, then a still release.
    for (let y = 320; y <= 860; y += 20) move(y);
    jest.advanceTimersByTime(200);
    clock += 200;
    up(860);
    expect(onSettle).toHaveBeenCalledWith({ index: 1, offset: 720, dismiss: false });
    jest.advanceTimersByTime(2000);
    expect(offset.value).toBe(720);
  });

  it("dismisses on a fast downward flick when dismissible", () => {
    const { onSettle, down, move, up } = setup();
    down(300);
    for (let y = 340; y <= 700; y += 60) move(y);
    up(760);
    expect(onSettle).toHaveBeenCalledWith(expect.objectContaining({ dismiss: true }));
  });

  it("stops at the most-open snap and at the dismiss offset", () => {
    const { offset, down, move } = setup();
    down(300);
    move(200);
    expect(offset.value).toBe(160);
    move(1200);
    expect(offset.value).toBe(CLOSED);
  });

  it("leaves a sideways move to the content", () => {
    const { onStart, down, move } = setup();
    down(300, 100);
    move(302, 130);
    move(320, 140);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("re-settles to the nearest visible snap when the pointer is cancelled", () => {
    const { onSettle, down, move, cancel } = setup();
    down(300);
    move(330);
    move(380);
    cancel();
    expect(onSettle).toHaveBeenCalledWith({ index: 0, offset: 160, dismiss: false });
  });

  it("ignores pointers while disabled", () => {
    const { onStart, down, move } = setup({ enabled: false });
    down(300);
    move(400);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("swallows the click a drag ends with", () => {
    const { element, down, move, up } = setup();
    const clicked = jest.fn();
    element.addEventListener("click", clicked);
    down(300);
    move(340);
    up(340);
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicked).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(clicked).toHaveBeenCalledTimes(1);
  });
});
