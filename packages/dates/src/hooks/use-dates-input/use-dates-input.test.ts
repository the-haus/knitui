/**
 * Tests for {@link useDatesInput} — the value/dropdown controller shared by every
 * input-trigger picker (`*PickerInput`). Driven with `renderHook` + `act`,
 * asserting against OUR hook's real return shape (`_value`/`setValue`/
 * `formattedValue`/`dropdownOpened`/`dropdownHandlers`/`onClear`/`shouldClear`),
 * NOT Mantine's signature. The hook reads `useDatesContext`, which has built-in
 * defaults, so a bare `renderHook` (no provider) is enough. DOM-free.
 */
import { act, renderHook } from "@testing-library/react";

import type { DateStringValue } from "../../types";
import { useDatesInput } from "./use-dates-input";

describe("useDatesInput (default)", () => {
  it("commits a value via setValue and formats it through the dayjs format", () => {
    let captured: DateStringValue | null = "init";
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: undefined,
        defaultValue: undefined,
        onChange: (value) => {
          captured = value;
        },
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: undefined,
        clearable: undefined,
      }),
    );

    // No value yet → empty trigger text.
    expect(result.current._value).toBeNull();
    expect(result.current.formattedValue).toBe("");

    act(() => {
      result.current.setValue("2023-01-15");
    });

    expect(result.current._value).toBe("2023-01-15");
    expect(result.current.formattedValue).toBe("2023-01-15");
    expect(captured).toBe("2023-01-15");
  });

  it("renders the value with the supplied display format", () => {
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: undefined,
        defaultValue: "2023-01-15",
        onChange: undefined,
        format: "MMMM D, YYYY",
        labelSeparator: undefined,
        closeOnChange: undefined,
        clearable: undefined,
      }),
    );

    expect(result.current.formattedValue).toBe("January 15, 2023");
  });

  it("closes the dropdown on change when closeOnChange is set", () => {
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: true,
        clearable: undefined,
      }),
    );

    act(() => {
      result.current.dropdownHandlers.open();
    });
    expect(result.current.dropdownOpened).toBe(true);

    act(() => {
      result.current.setValue("2023-01-15");
    });
    expect(result.current.dropdownOpened).toBe(false);
  });

  it("does not close the dropdown on change when closeOnChange is unset", () => {
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: undefined,
        defaultValue: undefined,
        onChange: undefined,
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: false,
        clearable: undefined,
      }),
    );

    act(() => {
      result.current.dropdownHandlers.open();
    });
    act(() => {
      result.current.setValue("2023-01-15");
    });

    expect(result.current.dropdownOpened).toBe(true);
  });
});

describe("useDatesInput clear affordance", () => {
  it("reports shouldClear only with clearable + a value, and onClear empties it", () => {
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: undefined,
        defaultValue: "2023-01-15",
        onChange: undefined,
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: undefined,
        clearable: true,
      }),
    );

    expect(result.current.shouldClear).toBe(true);

    act(() => {
      result.current.onClear();
    });

    expect(result.current._value).toBeNull();
    expect(result.current.formattedValue).toBe("");
    expect(result.current.shouldClear).toBe(false);
  });

  it("never reports shouldClear when clearable is unset", () => {
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: undefined,
        defaultValue: "2023-01-15",
        onChange: undefined,
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: undefined,
        clearable: false,
      }),
    );

    expect(result.current.shouldClear).toBe(false);
  });
});

describe("useDatesInput controlled vs uncontrolled", () => {
  it("keeps the controlled value while still reporting edits via onChange", () => {
    let captured: DateStringValue | null = null;
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: "2023-01-15",
        defaultValue: undefined,
        onChange: (value) => {
          captured = value;
        },
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: undefined,
        clearable: undefined,
      }),
    );

    expect(result.current._value).toBe("2023-01-15");

    act(() => {
      result.current.setValue("2023-02-20");
    });

    // Controlled: the prop still wins, but the edit is reported.
    expect(result.current._value).toBe("2023-01-15");
    expect(captured).toBe("2023-02-20");
  });

  it("initializes from defaultValue and lets the setter update it (uncontrolled)", () => {
    const { result } = renderHook(() =>
      useDatesInput<"default">({
        type: "default",
        value: undefined,
        defaultValue: "2023-01-15",
        onChange: undefined,
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: undefined,
        clearable: undefined,
      }),
    );

    expect(result.current._value).toBe("2023-01-15");

    act(() => {
      result.current.setValue("2023-02-20");
    });

    expect(result.current._value).toBe("2023-02-20");
  });
});

describe("useDatesInput (multiple)", () => {
  it("sorts the committed dates ascending when sortDates is set", () => {
    let captured: DateStringValue[] = [];
    const { result } = renderHook(() =>
      useDatesInput<"multiple">({
        type: "multiple",
        value: undefined,
        defaultValue: undefined,
        onChange: (value) => {
          captured = value;
        },
        format: "YYYY-MM-DD",
        labelSeparator: undefined,
        closeOnChange: undefined,
        sortDates: true,
        clearable: undefined,
      }),
    );

    act(() => {
      result.current.setValue(["2023-03-10", "2023-01-05", "2023-02-20"]);
    });

    expect(captured).toEqual(["2023-01-05", "2023-02-20", "2023-03-10"]);
    expect(result.current._value).toEqual(["2023-01-05", "2023-02-20", "2023-03-10"]);
  });
});
