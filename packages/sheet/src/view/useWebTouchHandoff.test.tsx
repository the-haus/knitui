import * as React from "react";

import { render } from "@testing-library/react";

import type { SheetScrollContextValue } from "./scrollContext";
import { useWebTouchHandoff } from "./useWebTouchHandoff";

/** Just the fields the hook reads; the sheet offset is a plain `{ value }` here. */
function ctxAt(sheetOffset: number): SheetScrollContextValue {
  return {
    handoffEnabled: true,
    expandedOffset: 100,
    sheetOffset: { value: sheetOffset },
  } as unknown as SheetScrollContextValue;
}

function Harness({ ctx }: { ctx: SheetScrollContextValue | null }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useWebTouchHandoff(ctx, () => ref.current);
  return <div data-testid="list" ref={ref} />;
}

function touch(node: Element, type: string, x: number, y: number): boolean {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value: type === "touchend" ? [] : [{ clientX: x, clientY: y }],
  });
  return node.dispatchEvent(event);
}

/** Drag from (0,0) by `dy`; returns whether the browser was left to scroll. */
function drag(node: HTMLElement, dy: number, dx = 0): boolean {
  touch(node, "touchstart", 0, 0);
  const first = touch(node, "touchmove", dx, dy);
  const second = touch(node, "touchmove", dx * 2, dy * 2);
  touch(node, "touchend", 0, 0);
  expect(first).toBe(second); // one owner for the whole touch
  return first;
}

describe("useWebTouchHandoff", () => {
  it("gives a pull down at the top of the list to the sheet", () => {
    const { getByTestId } = render(<Harness ctx={ctxAt(100)} />);
    const list = getByTestId("list");
    list.scrollTop = 0;
    expect(drag(list, 20)).toBe(false);
  });

  it("leaves the list to scroll when it is scrolled, or the finger pushes up", () => {
    const { getByTestId } = render(<Harness ctx={ctxAt(100)} />);
    const list = getByTestId("list");
    list.scrollTop = 0;
    expect(drag(list, -20)).toBe(true);
    list.scrollTop = 50;
    expect(drag(list, 20)).toBe(true);
  });

  it("gives every vertical drag to the sheet while it is not fully open", () => {
    const { getByTestId } = render(<Harness ctx={ctxAt(300)} />);
    const list = getByTestId("list");
    list.scrollTop = 50;
    expect(drag(list, -20)).toBe(false);
  });

  it("leaves horizontal swipes and lists outside a sheet alone", () => {
    const { getByTestId, rerender } = render(<Harness ctx={ctxAt(300)} />);
    expect(drag(getByTestId("list"), 3, 20)).toBe(true);
    rerender(<Harness ctx={null} />);
  });

  it("does nothing outside a sheet", () => {
    const { getByTestId } = render(<Harness ctx={null} />);
    expect(drag(getByTestId("list"), 20)).toBe(true);
  });
});
