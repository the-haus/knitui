import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { TimePicker } from "./TimePicker";

/**
 * Segment access helpers. The hours/minutes/seconds segments are kit `SpinInput`s
 * (role="spinbutton"); am/pm is the kit `AmPmInput`. We label segments through the
 * picker's *InputLabel props so they are queryable.
 */
function renderPicker(props: Partial<React.ComponentProps<typeof TimePicker>> = {}) {
  return render(
    <TimePicker
      hoursInputLabel="hours"
      minutesInputLabel="minutes"
      secondsInputLabel="seconds"
      amPmInputLabel="ampm"
      {...props}
    />,
  );
}

const hoursInput = () => screen.getByLabelText("hours") as HTMLInputElement;
const minutesInput = () => screen.getByLabelText("minutes") as HTMLInputElement;

describe("TimePicker", () => {
  describe("rendering & value", () => {
    it("renders hours + minutes segments by default, no seconds, no am/pm (24h)", () => {
      renderPicker();
      expect(screen.getByLabelText("hours")).toBeInTheDocument();
      expect(screen.getByLabelText("minutes")).toBeInTheDocument();
      expect(screen.queryByLabelText("seconds")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("ampm")).not.toBeInTheDocument();
    });

    it("hydrates segments from a controlled value", () => {
      renderPicker({ value: "13:45" });
      expect(hoursInput().value).toBe("13");
      expect(minutesInput().value).toBe("45");
    });

    it("hydrates segments from defaultValue (uncontrolled)", () => {
      renderPicker({ defaultValue: "07:08" });
      expect(hoursInput().value).toBe("07");
      expect(minutesInput().value).toBe("08");
    });

    it("renders the seconds segment when withSeconds is set", () => {
      renderPicker({ withSeconds: true, value: "13:45:30" });
      const seconds = screen.getByLabelText("seconds") as HTMLInputElement;
      expect(seconds).toBeInTheDocument();
      expect(seconds.value).toBe("30");
    });
  });

  describe("12h / am-pm format", () => {
    it("renders the am/pm segment in 12h format", () => {
      renderPicker({ format: "12h", value: "13:30" });
      expect(screen.getByLabelText("ampm")).toBeInTheDocument();
      // 13h -> 1 in 12h hours segment
      expect(hoursInput().value).toBe("01");
    });

    it("does not render am/pm in 24h format", () => {
      renderPicker({ format: "24h", value: "13:30" });
      expect(screen.queryByLabelText("ampm")).not.toBeInTheDocument();
    });

    it("forces 24h (no am/pm) for type='duration' even if format='12h'", () => {
      renderPicker({ type: "duration", format: "12h", value: "30:15" });
      expect(screen.queryByLabelText("ampm")).not.toBeInTheDocument();
      // duration hours can exceed 24
      expect(hoursInput().value).toBe("30");
    });
  });

  describe("onChange & editing", () => {
    it("emits onChange as a time string when a segment is edited (24h)", () => {
      const onChange = jest.fn();
      renderPicker({ value: "10:00", onChange });
      fireEvent.change(minutesInput(), { target: { value: "30" } });
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls.at(-1)?.[0]).toBe("10:30");
    });

    it("updates segments in uncontrolled mode", () => {
      renderPicker({ defaultValue: "10:00" });
      fireEvent.change(hoursInput(), { target: { value: "11" } });
      expect(hoursInput().value).toBe("11");
    });

    it("clamps an edited hour into [0,23] in 24h mode (max via the segment)", () => {
      renderPicker({ value: "10:00" });
      // 99 should clamp to the segment max (23)
      fireEvent.change(hoursInput(), { target: { value: "99" } });
      expect(hoursInput().value).toBe("23");
    });
  });

  describe("clearable", () => {
    it("does not show a clear button by default", () => {
      renderPicker({ value: "10:00" });
      expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    });

    it("shows a clear button when clearable and there is a value", () => {
      renderPicker({ value: "10:00", clearable: true });
      // CloseButton's accessible name is "Close".
      expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    });

    it("clearing emits an empty string and empties the segments", () => {
      const onChange = jest.fn();
      renderPicker({ defaultValue: "10:00", clearable: true, onChange });
      fireEvent.click(screen.getByRole("button", { name: /close/i }));
      expect(onChange).toHaveBeenCalledWith("");
      expect(hoursInput().value).toBe("");
      expect(minutesInput().value).toBe("");
    });
  });

  describe("readOnly & disabled", () => {
    it("does not emit onChange when readOnly", () => {
      const onChange = jest.fn();
      renderPicker({ value: "10:00", readOnly: true, onChange });
      fireEvent.change(minutesInput(), { target: { value: "30" } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("marks the segments disabled so they reject real interaction", () => {
      renderPicker({ value: "10:00", disabled: true });
      // A disabled <input> dispatches no change from real user interaction.
      expect(hoursInput()).toBeDisabled();
      expect(minutesInput()).toBeDisabled();
    });

    it("hides the clear button when readOnly even if clearable", () => {
      renderPicker({ value: "10:00", clearable: true, readOnly: true });
      expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
    });
  });

  describe("placeholders", () => {
    it("uses custom hour/minute placeholders when empty", () => {
      renderPicker({ hoursPlaceholder: "hh", minutesPlaceholder: "mm" });
      expect(hoursInput()).toHaveAttribute("placeholder", "hh");
      expect(minutesInput()).toHaveAttribute("placeholder", "mm");
    });

    it("defaults the duration hours placeholder to minHoursDigits dashes", () => {
      renderPicker({ type: "duration", minHoursDigits: 3 });
      expect(hoursInput()).toHaveAttribute("placeholder", "---");
    });
  });

  describe("aria & segment props", () => {
    it("exposes aria-valuemin / aria-valuemax on the hours spinbutton (24h)", () => {
      renderPicker({ value: "10:00" });
      const h = hoursInput();
      expect(h).toHaveAttribute("role", "spinbutton");
      expect(h).toHaveAttribute("aria-valuemin", "0");
      expect(h).toHaveAttribute("aria-valuemax", "23");
    });

    it("sets hours min=1/max=12 in 12h mode", () => {
      renderPicker({ format: "12h", value: "10:00" });
      const h = hoursInput();
      expect(h).toHaveAttribute("aria-valuemin", "1");
      expect(h).toHaveAttribute("aria-valuemax", "12");
    });

    it("forwards extra props onto the hours segment via hoursInputProps", () => {
      renderPicker({ hoursInputProps: { testID: "hh-seg" } });
      expect(screen.getByTestId("hh-seg")).toBeInTheDocument();
    });
  });

  describe("label / description / error", () => {
    it("renders a label", () => {
      renderPicker({ label: "Start time" });
      expect(screen.getByText("Start time")).toBeInTheDocument();
    });

    it("renders a description", () => {
      renderPicker({ description: "Pick a time" });
      expect(screen.getByText("Pick a time")).toBeInTheDocument();
    });

    it("renders an error message", () => {
      renderPicker({ error: "Required field" });
      expect(screen.getByText("Required field")).toBeInTheDocument();
    });
  });

  describe("dropdown", () => {
    it("does not render the dropdown when withDropdown is false", () => {
      renderPicker({ value: "10:00" });
      fireEvent.focus(hoursInput());
      // hours-list control "10" should not exist (only the segment value)
      expect(screen.queryByRole("button", { name: /^10$/ })).not.toBeInTheDocument();
    });

    it("opens a time-controls dropdown on focus when withDropdown is set", async () => {
      renderPicker({ value: "10:00", withDropdown: true });
      fireEvent.focus(hoursInput());
      // Two columns (hours 0..23, minutes 0..59), so shared values appear twice.
      // Queried by the control's label text so the test is robust to the leaf's
      // a11y role (the `TimeControl` leaf owns whether it's button/option).
      const hourCells = await screen.findAllByText("08");
      expect(hourCells.length).toBeGreaterThan(0);
      // "59" only exists in the minutes column.
      expect(screen.getByText("59")).toBeInTheDocument();
    });

    it("selecting an hour control in the dropdown updates the value", async () => {
      const onChange = jest.fn();
      renderPicker({ value: "10:00", withDropdown: true, onChange });
      fireEvent.focus(hoursInput());
      // "08" exists in both columns; the hours column is rendered first, so the
      // first match is the hours control.
      await screen.findAllByText("08");
      const hoursControl = screen.getAllByText("08")[0];
      fireEvent.click(hoursControl);
      expect(onChange.mock.calls.at(-1)?.[0]).toBe("08:00");
    });

    it("renders presets in the dropdown when presets is set", async () => {
      renderPicker({ value: "", withDropdown: true, presets: ["09:00", "17:30"] });
      fireEvent.focus(hoursInput());
      expect(await screen.findByText("09:00")).toBeInTheDocument();
      expect(screen.getByText("17:30")).toBeInTheDocument();
    });

    it("selecting a preset emits its value", async () => {
      const onChange = jest.fn();
      renderPicker({ value: "", withDropdown: true, presets: ["09:00", "17:30"], onChange });
      fireEvent.focus(hoursInput());
      const preset = await screen.findByText("17:30");
      fireEvent.click(preset);
      expect(onChange).toHaveBeenCalledWith("17:30");
    });

    it("does not open the dropdown for type='duration'", () => {
      renderPicker({ value: "30:00", withDropdown: true, type: "duration" });
      fireEvent.focus(hoursInput());
      expect(screen.queryByRole("button", { name: "30" })).not.toBeInTheDocument();
    });
  });

  describe("focus callbacks", () => {
    it("fires onFocus once when the field gains focus", () => {
      const onFocus = jest.fn();
      renderPicker({ value: "10:00", onFocus });
      fireEvent.focus(hoursInput());
      expect(onFocus).toHaveBeenCalledTimes(1);
      // moving between segments does not re-fire
      fireEvent.focus(minutesInput());
      expect(onFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe("hidden form input", () => {
    it("renders a hidden input carrying the time value when name is set", () => {
      const { container } = renderPicker({ value: "10:30", name: "startTime" });
      const hidden = container.querySelector(
        'input[type="hidden"][name="startTime"]',
      ) as HTMLInputElement;
      expect(hidden).toBeInTheDocument();
      expect(hidden.value).toBe("10:30");
    });

    it("does not render a hidden input without a name", () => {
      const { container } = renderPicker({ value: "10:30" });
      expect(container.querySelector('input[type="hidden"]')).not.toBeInTheDocument();
    });
  });

  describe("ref", () => {
    it("forwards a ref to the field frame host node", () => {
      const ref = React.createRef<HTMLElement>();
      renderPicker({ value: "10:00", ref: ref as React.Ref<never> });
      expect(ref.current).toBeTruthy();
    });
  });

  describe("styles slot sugar", () => {
    it("spreads the `segment` slot onto every editable segment", () => {
      renderPicker({ value: "10:30", withSeconds: true, styles: { segment: { testID: "seg" } } });
      // hours + minutes + seconds all carry the slot testID.
      expect(screen.getAllByTestId("seg")).toHaveLength(3);
    });

    it("an explicit `hoursInputProps` wins over the `segment` slot (explicit beats sugar)", () => {
      renderPicker({
        value: "10:30",
        styles: { segment: { testID: "from-slot" } },
        hoursInputProps: { testID: "from-explicit" },
      });
      // The hours segment uses the explicit id; minutes still falls back to the slot.
      expect(screen.getByTestId("from-explicit")).toBeInTheDocument();
      expect(screen.getAllByTestId("from-slot")).toHaveLength(1);
    });

    it("forwards the wrapper-chrome slots to Input.Wrapper (label slot)", () => {
      renderPicker({ label: "Start", styles: { label: { testID: "label-slot" } } });
      expect(screen.getByTestId("label-slot")).toBeInTheDocument();
    });
  });

  describe("static parts", () => {
    it("exposes the Field frame part", () => {
      expect(TimePicker.Field).toBeDefined();
    });
  });
});
