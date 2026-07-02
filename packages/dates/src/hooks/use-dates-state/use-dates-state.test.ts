/**
 * Tests for the selection state machine shared by every inline picker. Drives
 * the hook with `renderHook` + `act`, asserting via the `getControlProps(date)`
 * flags and the `onChange` spy across all three picker `type`s (default select/
 * deselect, multiple toggle, range pick/sort/in-range/single-date, and the
 * hovered range preview). DOM-free — `onRootMouseLeave` takes an opaque event.
 */
import { act, renderHook } from "@testing-library/react";

import { useDatesState } from "./use-dates-state";

/**
 * Widened view of a control's flags — the union `getControlProps` returns is
 * assignable to this (range flags optional), so range-only flags read cleanly
 * without a cast.
 */
interface ControlFlags {
  selected: boolean;
  inRange?: boolean;
  firstInRange?: boolean;
  lastInRange?: boolean;
}

describe("useDatesState (default)", () => {
  it("selects a date and reports it via onChange", () => {
    let captured: string | null = null;
    const { result } = renderHook(() =>
      useDatesState<"default">({
        type: "default",
        level: "day",
        value: undefined,
        defaultValue: undefined,
        onChange: (value) => {
          captured = value;
        },
      }),
    );

    act(() => {
      result.current.onDateChange("2023-01-15");
    });

    expect(result.current.getControlProps("2023-01-15").selected).toBe(true);
    expect(result.current.getControlProps("2023-01-16").selected).toBe(false);
    expect(captured).toBe("2023-01-15");
  });

  it("deselects the selected date when allowDeselect is set", () => {
    let captured: string | null = "init";
    const { result } = renderHook(() =>
      useDatesState<"default">({
        type: "default",
        level: "day",
        value: undefined,
        defaultValue: "2023-01-15",
        allowDeselect: true,
        onChange: (value) => {
          captured = value;
        },
      }),
    );

    expect(result.current.getControlProps("2023-01-15").selected).toBe(true);

    act(() => {
      result.current.onDateChange("2023-01-15");
    });

    expect(result.current.getControlProps("2023-01-15").selected).toBe(false);
    expect(captured).toBeNull();
  });
});

describe("useDatesState (multiple)", () => {
  it("accumulates selections and toggles a re-selected date off", () => {
    let captured: string[] = [];
    const { result } = renderHook(() =>
      useDatesState<"multiple">({
        type: "multiple",
        level: "day",
        value: undefined,
        defaultValue: undefined,
        onChange: (value) => {
          captured = value;
        },
      }),
    );

    act(() => {
      result.current.onDateChange("2023-01-10");
    });
    act(() => {
      result.current.onDateChange("2023-01-20");
    });

    expect(result.current.getControlProps("2023-01-10").selected).toBe(true);
    expect(result.current.getControlProps("2023-01-20").selected).toBe(true);
    expect(captured).toEqual(["2023-01-10", "2023-01-20"]);

    act(() => {
      result.current.onDateChange("2023-01-10");
    });

    expect(result.current.getControlProps("2023-01-10").selected).toBe(false);
    expect(result.current.getControlProps("2023-01-20").selected).toBe(true);
    expect(captured).toEqual(["2023-01-20"]);
  });
});

describe("useDatesState (range)", () => {
  it("picks a lower then upper bound and flags the dates in between", () => {
    const { result } = renderHook(() =>
      useDatesState<"range">({
        type: "range",
        level: "day",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
      }),
    );

    act(() => {
      result.current.onDateChange("2023-01-10");
    });
    // After the first pick only the lower bound is selected.
    expect(result.current.getControlProps("2023-01-10").selected).toBe(true);

    act(() => {
      result.current.onDateChange("2023-01-20");
    });

    const lower: ControlFlags = result.current.getControlProps("2023-01-10");
    const upper: ControlFlags = result.current.getControlProps("2023-01-20");
    const mid: ControlFlags = result.current.getControlProps("2023-01-15");

    expect(lower.selected).toBe(true);
    expect(upper.selected).toBe(true);
    expect(lower.firstInRange).toBe(true);
    expect(upper.lastInRange).toBe(true);
    expect(mid.inRange).toBe(true);
    expect(mid.selected).toBe(false);
  });

  it("sorts the bounds ascending when picked in reverse order", () => {
    const { result } = renderHook(() =>
      useDatesState<"range">({
        type: "range",
        level: "day",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
      }),
    );

    act(() => {
      result.current.onDateChange("2023-01-20");
    });
    act(() => {
      result.current.onDateChange("2023-01-10");
    });

    // Earlier date is the firstInRange regardless of pick order.
    const lower: ControlFlags = result.current.getControlProps("2023-01-10");
    const upper: ControlFlags = result.current.getControlProps("2023-01-20");
    expect(lower.firstInRange).toBe(true);
    expect(upper.lastInRange).toBe(true);
  });

  it("clears a one-day range unless allowSingleDateInRange is set", () => {
    const { result } = renderHook(() =>
      useDatesState<"range">({
        type: "range",
        level: "day",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
      }),
    );

    act(() => {
      result.current.onDateChange("2023-01-10");
    });
    act(() => {
      result.current.onDateChange("2023-01-10");
    });

    expect(result.current.getControlProps("2023-01-10").selected).toBe(false);
  });

  it("keeps a one-day range when allowSingleDateInRange is set", () => {
    const { result } = renderHook(() =>
      useDatesState<"range">({
        type: "range",
        level: "day",
        value: undefined,
        defaultValue: undefined,
        allowSingleDateInRange: true,
        onChange: undefined,
      }),
    );

    act(() => {
      result.current.onDateChange("2023-01-10");
    });
    act(() => {
      result.current.onDateChange("2023-01-10");
    });

    const day: ControlFlags = result.current.getControlProps("2023-01-10");
    expect(day.selected).toBe(true);
    expect(day.firstInRange).toBe(true);
    expect(day.lastInRange).toBe(true);
  });

  it("previews the hovered range and clears it on root mouse leave", () => {
    const { result } = renderHook(() =>
      useDatesState<"range">({
        type: "range",
        level: "day",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
      }),
    );

    act(() => {
      result.current.onDateChange("2023-01-10");
    });
    act(() => {
      result.current.onHoveredDateChange("2023-01-20");
    });

    const preview: ControlFlags = result.current.getControlProps("2023-01-15");
    expect(preview.inRange).toBe(true);

    act(() => {
      // Opaque cross-platform event — never a DOM event.
      result.current.onRootMouseLeave?.({});
    });

    const cleared: ControlFlags = result.current.getControlProps("2023-01-15");
    expect(cleared.inRange).toBe(false);
  });
});
