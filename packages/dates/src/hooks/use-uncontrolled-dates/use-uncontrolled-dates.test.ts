/**
 * Tests for the controlled/uncontrolled value plumbing — both the pure
 * `convertDatesValue` normaliser (raw `Date`/string → canonical stored string)
 * and the `useUncontrolledDates` hook (controlled detection, type-shaped empty
 * values, setter updates). DOM-free; runs under the package's jsdom jest config.
 */
import { act, renderHook } from "@testing-library/react";

import { convertDatesValue, useUncontrolledDates } from "./use-uncontrolled-dates";

describe("convertDatesValue", () => {
  it("passes `undefined` straight through (controlled/uncontrolled detection)", () => {
    expect(convertDatesValue<"default">(undefined, false)).toBeUndefined();
  });

  it("normalises a scalar Date to a `YYYY-MM-DD` string", () => {
    expect(convertDatesValue<"default">(new Date(2023, 0, 15), false)).toBe("2023-01-15");
  });

  it("normalises a scalar ISO string to `YYYY-MM-DD`", () => {
    expect(convertDatesValue<"default">("2023-01-15", false)).toBe("2023-01-15");
  });

  it("keeps a scalar `null`", () => {
    expect(convertDatesValue<"default">(null, false)).toBeNull();
  });

  it("converts both ends of a `range` value", () => {
    expect(
      convertDatesValue<"range">([new Date(2023, 0, 1), new Date(2023, 0, 31)], false),
    ).toEqual(["2023-01-01", "2023-01-31"]);
  });

  it("preserves a `null` end of a `range` value", () => {
    expect(convertDatesValue<"range">([new Date(2023, 0, 1), null], false)).toEqual([
      "2023-01-01",
      null,
    ]);
  });

  it("converts every entry of a `multiple` value", () => {
    expect(
      convertDatesValue<"multiple">([new Date(2023, 0, 1), new Date(2023, 0, 2)], false),
    ).toEqual(["2023-01-01", "2023-01-02"]);
  });

  it("uses the date-time converter when `withTime` is set", () => {
    expect(convertDatesValue<"default">(new Date(2023, 0, 15, 13, 45, 30), true)).toBe(
      "2023-01-15 13:45:30",
    );
  });
});

describe("useUncontrolledDates", () => {
  it("starts uncontrolled from `defaultValue` and updates via the setter", () => {
    const { result } = renderHook(() =>
      useUncontrolledDates<"default">({
        type: "default",
        value: undefined,
        defaultValue: new Date(2023, 0, 15),
        onChange: undefined,
      }),
    );

    expect(result.current[0]).toBe("2023-01-15");
    expect(result.current[2]).toBe(false);

    act(() => {
      result.current[1]("2023-02-20");
    });

    expect(result.current[0]).toBe("2023-02-20");
  });

  it("tracks the prop and ignores the setter when controlled", () => {
    let captured: string | null = null;
    const { result } = renderHook(() =>
      useUncontrolledDates<"default">({
        type: "default",
        value: new Date(2023, 0, 15),
        defaultValue: undefined,
        onChange: (value) => {
          captured = value;
        },
      }),
    );

    expect(result.current[0]).toBe("2023-01-15");
    expect(result.current[2]).toBe(true);

    act(() => {
      result.current[1]("2023-02-20");
    });

    // Controlled wins: the returned value still mirrors the prop, only onChange fired.
    expect(result.current[0]).toBe("2023-01-15");
    expect(captured).toBe("2023-02-20");
  });

  it("falls back to a `null` empty value for `default`", () => {
    const { result } = renderHook(() =>
      useUncontrolledDates<"default">({
        type: "default",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
      }),
    );

    expect(result.current[0]).toBeNull();
  });

  it("falls back to a `[null, null]` empty value for `range`", () => {
    const { result } = renderHook(() =>
      useUncontrolledDates<"range">({
        type: "range",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
      }),
    );

    expect(result.current[0]).toEqual([null, null]);
  });

  it("falls back to an empty array for `multiple`", () => {
    const { result } = renderHook(() =>
      useUncontrolledDates<"multiple">({
        type: "multiple",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
      }),
    );

    expect(result.current[0]).toEqual([]);
  });
});
