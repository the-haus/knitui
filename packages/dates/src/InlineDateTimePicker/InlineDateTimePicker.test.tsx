import * as React from "react";

import { act, fireEvent, render, screen } from "../test-utils";
import { InlineDateTimePicker } from "./InlineDateTimePicker";

/** The day cell whose visible label is exactly `day`. */
function dayCell(day: string): HTMLElement {
  const button = screen
    .getAllByText(day, { selector: "span" })
    .map((node) => node.closest("button"))
    .find((node): node is HTMLButtonElement => node !== null);
  if (!button) throw new Error(`No day "${day}"`);
  return button;
}

const timeProps = { hoursInputLabel: "hours", minutesInputLabel: "minutes" };

describe("InlineDateTimePicker", () => {
  it("renders the calendar, a time picker and the submit button together (no popover)", () => {
    render(<InlineDateTimePicker defaultDate="2024-01-01" timePickerProps={timeProps} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByLabelText("hours")).toBeInTheDocument();
    expect(screen.getByLabelText("minutes")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("picking a day emits a YYYY-MM-DD HH:mm:ss string at midnight and focuses the hours", () => {
    const onChange = jest.fn();
    render(
      <InlineDateTimePicker
        defaultDate="2024-01-01"
        onChange={onChange}
        timePickerProps={timeProps}
      />,
    );
    act(() => {
      fireEvent.click(dayCell("15"));
    });
    expect(onChange).toHaveBeenLastCalledWith("2024-01-15 00:00:00");
    expect(document.activeElement).toBe(screen.getByLabelText("hours"));
  });

  it("assigns defaultTimeValue to a newly picked day", () => {
    const onChange = jest.fn();
    render(
      <InlineDateTimePicker
        defaultDate="2024-01-01"
        defaultTimeValue="09:30"
        onChange={onChange}
      />,
    );
    fireEvent.click(dayCell("15"));
    expect(onChange).toHaveBeenLastCalledWith("2024-01-15 09:30:00");
  });

  it("editing the time re-assigns the time onto the selected date", () => {
    function Controlled({ onChange }: { onChange: (v: string | null) => void }) {
      const [value, setValue] = React.useState<string | null>("2024-01-15 10:00:00");
      return (
        <InlineDateTimePicker
          value={value}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
          timePickerProps={timeProps}
        />
      );
    }
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    expect((screen.getByLabelText("hours") as HTMLInputElement).value).toBe("10");
    fireEvent.change(screen.getByLabelText("hours"), { target: { value: "14" } });
    expect(onChange).toHaveBeenLastCalledWith("2024-01-15 14:00:00");
  });

  it("bounds the calendar by minDate; the picked day takes the chosen time (Mantine parity)", () => {
    const onChange = jest.fn();
    render(
      <InlineDateTimePicker
        defaultDate="2024-01-01"
        minDate="2024-01-15 12:00:00"
        defaultTimeValue="08:00"
        onChange={onChange}
      />,
    );
    expect(dayCell("14")).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(dayCell("15"));
    // The DATE is clamped; the time is assigned after the clamp. Bounding the
    // time is the TimePicker's `min` (it gets minDate's time on that day).
    expect(onChange).toHaveBeenLastCalledWith("2024-01-15 08:00:00");
  });

  it("the submit button calls onSubmit and the consumer's own onPress", () => {
    const onSubmit = jest.fn();
    const onPress = jest.fn();
    render(
      <InlineDateTimePicker
        defaultDate="2024-01-01"
        onSubmit={onSubmit}
        submitButtonProps={{ onPress, "aria-label": "Apply" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("Enter in a time input calls __onEnter", () => {
    const onEnter = jest.fn();
    render(
      <InlineDateTimePicker
        defaultDate="2024-01-01"
        timePickerProps={timeProps}
        __onEnter={onEnter}
      />,
    );
    fireEvent.keyDown(screen.getByLabelText("minutes"), { key: "Enter" });
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("hides the time row off the month level", () => {
    render(
      <InlineDateTimePicker
        defaultDate="2024-01-01"
        defaultLevel="year"
        timePickerProps={timeProps}
      />,
    );
    expect(screen.queryByLabelText("hours")).not.toBeInTheDocument();
  });

  describe("type='range'", () => {
    it("renders a start and an end time picker plus the range summary", () => {
      render(
        <InlineDateTimePicker
          type="range"
          value={["2024-01-10 09:00:00", "2024-01-12 17:30:00"]}
          onChange={jest.fn()}
          timePickerProps={{ hoursInputLabel: "start hours" }}
          endTimePickerProps={{ hoursInputLabel: "end hours" }}
        />,
      );
      expect((screen.getByLabelText("start hours") as HTMLInputElement).value).toBe("09");
      expect((screen.getByLabelText("end hours") as HTMLInputElement).value).toBe("17");
      expect(screen.getByText("10/01/2024 09:00 – 12/01/2024 17:30")).toBeInTheDocument();
    });

    it("assigns each endpoint's time when the range is picked", () => {
      const onChange = jest.fn();
      render(
        <InlineDateTimePicker
          type="range"
          defaultDate="2024-01-01"
          defaultTimeValue="08:00"
          onChange={onChange}
        />,
      );
      fireEvent.click(dayCell("10"));
      fireEvent.click(dayCell("12"));
      expect(onChange).toHaveBeenLastCalledWith(["2024-01-10 08:00:00", "2024-01-12 08:00:00"]);
    });
  });

  describe("layout + styles", () => {
    it("stretches to full width by default and not when fullWidth={false}", () => {
      const { unmount } = render(<InlineDateTimePicker data-testid="root" />);
      expect(screen.getByTestId("root")).toHaveStyle({ width: "100%" });
      unmount();
      render(<InlineDateTimePicker data-testid="root" fullWidth={false} />);
      expect(screen.getByTestId("root")).not.toHaveStyle({ width: "100%" });
    });

    it("styles.timeWrapper lands on the time row; explicit timePickerProps beat styles.timeInput", () => {
      render(
        <InlineDateTimePicker
          styles={{
            timeWrapper: { "aria-label": "time row" } as never,
            timeInput: { hoursInputLabel: "slot hours" },
          }}
          timePickerProps={{ hoursInputLabel: "explicit hours" }}
        />,
      );
      expect(screen.getByLabelText("time row")).toBeInTheDocument();
      expect(screen.getByLabelText("explicit hours")).toBeInTheDocument();
      expect(screen.queryByLabelText("slot hours")).not.toBeInTheDocument();
    });

    it("exposes the styled wrapper parts", () => {
      expect(InlineDateTimePicker.TimeWrapper).toBeDefined();
      expect(InlineDateTimePicker.RangeInfo).toBeDefined();
    });
  });
});
