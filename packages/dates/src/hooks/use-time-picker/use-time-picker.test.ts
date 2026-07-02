/**
 * Tests for {@link useTimePicker} — the segment controller behind `TimePicker`.
 * The LAST untested controller hook (closes the trilogy with `use-dates-state`
 * and `use-dates-input`). Driven with `renderHook` + `act`, asserting against
 * OUR hook's real return shape (`values`/`setHours`/…/`clear`/`onPaste`/
 * `hiddenInputValue`/`isClearable`), NOT Mantine's signature. The hook has no
 * context dependency, so a bare `renderHook` (no provider) is enough. DOM-free
 * except for a hand-built clipboard-event-like object exercising `onPaste`.
 */
import { act, renderHook } from "@testing-library/react";

import type { TimePickerAmPmLabels } from "../../types";
import { useTimePicker, type UseTimePickerInput } from "./use-time-picker";

const AM_PM_LABELS: TimePickerAmPmLabels = { am: "AM", pm: "PM" };

/** Fully-typed input builder — every field is required on `UseTimePickerInput`. */
function makeInput(overrides: Partial<UseTimePickerInput>): UseTimePickerInput {
  return {
    value: undefined,
    defaultValue: undefined,
    onChange: undefined,
    format: "24h",
    amPmLabels: AM_PM_LABELS,
    withSeconds: undefined,
    min: undefined,
    max: undefined,
    readOnly: undefined,
    disabled: undefined,
    clearable: undefined,
    pasteSplit: undefined,
    type: "time",
    ...overrides,
  };
}

describe("useTimePicker parse/split", () => {
  it("splits a 24h value into hours/minutes (no seconds)", () => {
    const { result } = renderHook(() => useTimePicker(makeInput({ defaultValue: "13:45" })));

    expect(result.current.values.hours).toBe(13);
    expect(result.current.values.minutes).toBe(45);
    expect(result.current.values.seconds).toBeNull();
    expect(result.current.values.amPm).toBeNull();
  });

  it("includes seconds when present", () => {
    const { result } = renderHook(() =>
      useTimePicker(makeInput({ defaultValue: "13:45:30", withSeconds: true })),
    );

    expect(result.current.values.hours).toBe(13);
    expect(result.current.values.minutes).toBe(45);
    expect(result.current.values.seconds).toBe(30);
  });

  it("maps a 24h value into the 12h range with an amPm segment", () => {
    const { result } = renderHook(() =>
      useTimePicker(makeInput({ defaultValue: "13:45", format: "12h" })),
    );

    expect(result.current.values.hours).toBe(1);
    expect(result.current.values.minutes).toBe(45);
    expect(result.current.values.amPm).toBe("PM");
  });
});

describe("useTimePicker setter round-trip", () => {
  it("re-assembles + emits the canonical zero-padded string via onChange", () => {
    let captured: string | undefined;
    const { result } = renderHook(() =>
      useTimePicker(
        makeInput({
          onChange: (next) => {
            captured = next;
          },
        }),
      ),
    );

    act(() => {
      result.current.setHours(9);
    });
    act(() => {
      result.current.setMinutes(5);
    });

    expect(result.current.values.hours).toBe(9);
    expect(result.current.values.minutes).toBe(5);
    expect(captured).toBe("09:05");
    expect(result.current.hiddenInputValue).toBe("09:05");
  });

  it("wraps a 12h hours setter above 12 back into the 1–12 range", () => {
    const { result } = renderHook(() => useTimePicker(makeInput({ format: "12h" })));

    act(() => {
      result.current.setHours(13);
    });

    expect(result.current.values.hours).toBe(1);
  });
});

describe("useTimePicker clamp (paste)", () => {
  it("clamps a pasted value above max into range", () => {
    let captured: string | undefined;
    const { result } = renderHook(() =>
      useTimePicker(
        makeInput({
          max: "12:00",
          onChange: (next) => {
            captured = next;
          },
        }),
      ),
    );

    act(() => {
      result.current.onPaste({
        preventDefault: () => {},
        clipboardData: { getData: () => "15:30" },
      });
    });

    expect(captured).toBe("12:00:00");
  });

  it("ignores a non-clipboard event (native no-op)", () => {
    let captured: string | undefined;
    const { result } = renderHook(() =>
      useTimePicker(
        makeInput({
          onChange: (next) => {
            captured = next;
          },
        }),
      ),
    );

    act(() => {
      result.current.onPaste({});
    });

    expect(captured).toBeUndefined();
  });
});

describe("useTimePicker clear affordance", () => {
  it("reports isClearable with a value and clear() empties the segments", () => {
    let captured: string | undefined = "init";
    const { result } = renderHook(() =>
      useTimePicker(
        makeInput({
          defaultValue: "13:45",
          clearable: true,
          onChange: (next) => {
            captured = next;
          },
        }),
      ),
    );

    expect(result.current.isClearable).toBe(true);

    act(() => {
      result.current.clear();
    });

    expect(result.current.values.hours).toBeNull();
    expect(result.current.values.minutes).toBeNull();
    expect(result.current.values.seconds).toBeNull();
    expect(result.current.values.amPm).toBeNull();
    expect(result.current.hiddenInputValue).toBe("");
    expect(captured).toBe("");
  });

  it("never reports isClearable when clearable is unset", () => {
    const { result } = renderHook(() =>
      useTimePicker(makeInput({ defaultValue: "13:45", clearable: false })),
    );

    expect(result.current.isClearable).toBe(false);
  });
});

describe("useTimePicker controlled vs uncontrolled", () => {
  it("drives values from a controlled value and re-syncs on a prop change", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string | undefined }) => useTimePicker(makeInput({ value })),
      { initialProps: { value: "13:45" as string | undefined } },
    );

    expect(result.current.values.hours).toBe(13);
    expect(result.current.values.minutes).toBe(45);

    rerender({ value: "08:15" });

    expect(result.current.values.hours).toBe(8);
    expect(result.current.values.minutes).toBe(15);
  });

  it("initializes from defaultValue and lets setters update it (uncontrolled)", () => {
    const { result } = renderHook(() => useTimePicker(makeInput({ defaultValue: "13:45" })));

    expect(result.current.values.hours).toBe(13);

    act(() => {
      result.current.setHours(7);
    });

    expect(result.current.values.hours).toBe(7);
  });
});
