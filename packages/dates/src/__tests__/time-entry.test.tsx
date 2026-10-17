/**
 * End-to-end time ENTRY through the segmented `TimePicker` (SpinInput hours /
 * minutes / seconds + AmPmInput) on Tamagui v3: digit entry with auto-advance,
 * Backspace stepping back, the 12h am/pm tap/letter toggle, arrow stepping, and
 * the group-blur clamp into `[min, max]`. Focus is asserted on the real host.
 */
import * as React from "react";

import { act, fireEvent, render, screen } from "../test-utils";
import { TimeInput } from "../TimeInput";
import { TimePicker } from "../TimePicker";

function renderPicker(props: Partial<React.ComponentProps<typeof TimePicker>> = {}) {
  return render(
    <>
      <TimePicker
        hoursInputLabel="hours"
        minutesInputLabel="minutes"
        secondsInputLabel="seconds"
        amPmInputLabel="ampm"
        {...props}
      />
      <button type="button">outside</button>
    </>,
  );
}

const hours = () => screen.getByLabelText("hours") as HTMLInputElement;
const minutes = () => screen.getByLabelText("minutes") as HTMLInputElement;
const amPm = () => screen.getByLabelText("ampm") as HTMLInputElement;

describe("TimePicker entry (24h)", () => {
  it("types hours then minutes and emits HH:mm", () => {
    const onChange = jest.fn();
    renderPicker({ onChange });
    fireEvent.change(hours(), { target: { value: "13" } });
    fireEvent.change(minutes(), { target: { value: "45" } });
    expect(onChange).toHaveBeenLastCalledWith("13:45");
  });

  it("auto-advances to minutes when the first hour digit can't start a valid hour", () => {
    renderPicker();
    act(() => hours().focus());
    fireEvent.change(hours(), { target: { value: "5" } });
    expect(hours().value).toBe("05");
    expect(document.activeElement).toBe(minutes());
  });

  it("Backspace on an empty minutes segment steps back to hours", () => {
    renderPicker();
    act(() => minutes().focus());
    fireEvent.keyDown(minutes(), { key: "Backspace" });
    expect(document.activeElement).toBe(hours());
  });

  it("ArrowUp / ArrowDown step the focused segment", () => {
    const onChange = jest.fn();
    renderPicker({ defaultValue: "10:15", onChange });
    fireEvent.keyDown(hours(), { key: "ArrowUp" });
    expect(hours().value).toBe("11");
    fireEvent.keyDown(minutes(), { key: "ArrowDown" });
    expect(minutes().value).toBe("14");
    expect(onChange).toHaveBeenLastCalledWith("11:14");
  });

  it("includes seconds when withSeconds is set", () => {
    const onChange = jest.fn();
    renderPicker({ withSeconds: true, onChange });
    fireEvent.change(hours(), { target: { value: "08" } });
    fireEvent.change(minutes(), { target: { value: "05" } });
    fireEvent.change(screen.getByLabelText("seconds"), { target: { value: "09" } });
    expect(onChange).toHaveBeenLastCalledWith("08:05:09");
  });
});

describe("TimePicker entry (12h)", () => {
  it("am/pm letter entry converts to a 24h value", () => {
    const onChange = jest.fn();
    renderPicker({ format: "12h", onChange });
    fireEvent.change(hours(), { target: { value: "05" } });
    fireEvent.change(minutes(), { target: { value: "30" } });
    fireEvent.change(amPm(), { target: { value: "p" } });
    expect(amPm().value).toBe("PM");
    expect(onChange).toHaveBeenLastCalledWith("17:30");
  });

  it("ArrowUp toggles am ↔ pm", () => {
    renderPicker({ format: "12h", defaultValue: "09:00" });
    expect(amPm().value).toBe("AM");
    fireEvent.keyDown(amPm(), { key: "ArrowUp" });
    expect(amPm().value).toBe("PM");
  });
});

describe("group-blur clamp", () => {
  it("clamps a typed time into [min, max] when focus leaves the field", () => {
    const onChange = jest.fn();
    renderPicker({ min: "09:00", max: "17:00", onChange });
    act(() => hours().focus());
    fireEvent.change(hours(), { target: { value: "07" } });
    fireEvent.change(minutes(), { target: { value: "30" } });
    const outside = screen.getByText("outside");
    fireEvent.blur(minutes(), { relatedTarget: outside });
    // Mantine parity: the clamp commits `clampTime`'s full `HH:mm:ss` string.
    expect(onChange).toHaveBeenLastCalledWith("09:00:00");
    expect(hours().value).toBe("09");
    expect(minutes().value).toBe("00");
  });

  it("does not clamp while focus moves between the field's own segments", () => {
    const onChange = jest.fn();
    renderPicker({ min: "09:00", onChange });
    fireEvent.change(hours(), { target: { value: "07" } });
    fireEvent.change(minutes(), { target: { value: "30" } });
    fireEvent.blur(hours(), { relatedTarget: minutes() });
    expect(onChange).toHaveBeenLastCalledWith("07:30");
  });
});

describe("TimeInput entry", () => {
  it("emits the typed HH:mm and clamps into [minTime, maxTime] on blur", () => {
    const onChange = jest.fn();
    render(<TimeInput minTime="10:00" maxTime="12:00" onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "13:30" } });
    expect(onChange).toHaveBeenLastCalledWith("13:30");
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith("12:00");
  });
});
