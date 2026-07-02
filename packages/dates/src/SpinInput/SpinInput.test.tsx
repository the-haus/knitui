import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { SpinInput } from "./SpinInput";

/**
 * SpinInput — the controlled two-digit number leaf. These tests exercise the
 * public API: controlled value rendering (padded), onChange on digit entry,
 * clamping into [min, max], auto-advance, allowTemporaryZero, the web keyboard
 * machine (arrows/Home/End/Backspace/Delete/"0"), readOnly, focusable/tabIndex,
 * placeholder, accessibility (spinbutton role + aria-value*) and ref forwarding.
 */
const noop = () => {};

const renderSpin = (props: Partial<React.ComponentProps<typeof SpinInput>> = {}) =>
  render(
    <SpinInput
      value={props.value ?? null}
      min={props.min ?? 0}
      max={props.max ?? 59}
      step={props.step ?? 1}
      focusable={props.focusable ?? true}
      onChange={props.onChange ?? noop}
      {...props}
    />,
  );

describe("SpinInput", () => {
  it("renders a spinbutton with aria-value attributes", () => {
    renderSpin({ value: 12, min: 0, max: 59 });
    const el = screen.getByRole("spinbutton");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-valuemin", "0");
    expect(el).toHaveAttribute("aria-valuemax", "59");
    expect(el).toHaveAttribute("aria-valuenow", "12");
  });

  it("pads the controlled value to two digits", () => {
    renderSpin({ value: 5 });
    expect(screen.getByRole("spinbutton")).toHaveValue("05");
  });

  it("renders an empty string and aria-valuenow=0 when value is null", () => {
    renderSpin({ value: null });
    const el = screen.getByRole("spinbutton");
    expect(el).toHaveValue("");
    expect(el).toHaveAttribute("aria-valuenow", "0");
  });

  it("renders the default placeholder when empty", () => {
    renderSpin({ value: null });
    expect(screen.getByPlaceholderText("--")).toBeInTheDocument();
  });

  it("supports a custom placeholder", () => {
    renderSpin({ value: null, placeholder: "hh" });
    expect(screen.getByPlaceholderText("hh")).toBeInTheDocument();
  });

  it("fires onChange with the parsed digits", () => {
    const onChange = jest.fn();
    renderSpin({ value: null, onChange, min: 0, max: 59 });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("strips non-digit characters before parsing", () => {
    const onChange = jest.fn();
    renderSpin({ value: null, onChange, min: 0, max: 59 });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1a2" } });
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("clamps a value above max down to max", () => {
    const onChange = jest.fn();
    renderSpin({ value: null, onChange, min: 0, max: 23 });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "99" } });
    expect(onChange).toHaveBeenCalledWith(23);
  });

  it("clamps a value below min up to min", () => {
    const onChange = jest.fn();
    renderSpin({ value: null, onChange, min: 10, max: 23 });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("does not fire onChange when the cleared value is empty", () => {
    const onChange = jest.fn();
    renderSpin({ value: 5, onChange });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("auto-advances to the next input when a digit exceeds the leading digit of max", () => {
    const onNextInput = jest.fn();
    // max=23 → maxDigit=2; typing 3 (>2) auto-advances
    renderSpin({ value: null, max: 23, onNextInput });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });
    expect(onNextInput).toHaveBeenCalledTimes(1);
  });

  it("does not auto-advance when disableAutoAdvance is set", () => {
    const onNextInput = jest.fn();
    renderSpin({ value: null, max: 23, onNextInput, disableAutoAdvance: true });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });
    expect(onNextInput).not.toHaveBeenCalled();
  });

  it("auto-advances when the text starts with 00", () => {
    const onNextInput = jest.fn();
    renderSpin({ value: null, max: 59, onNextInput });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "00" } });
    expect(onNextInput).toHaveBeenCalledTimes(1);
  });

  it("allows a transient zero when allowTemporaryZero is set and min > 0", () => {
    const onChange = jest.fn();
    renderSpin({ value: null, min: 1, max: 12, allowTemporaryZero: true, onChange });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("clamps zero up to min when allowTemporaryZero is not set", () => {
    const onChange = jest.fn();
    renderSpin({ value: null, min: 1, max: 12, onChange });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("does not fire onChange when readOnly", () => {
    const onChange = jest.fn();
    renderSpin({ value: null, readOnly: true, onChange });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the input read-only in the DOM", () => {
    renderSpin({ value: 1, readOnly: true });
    expect(screen.getByRole("spinbutton")).toHaveAttribute("readonly");
  });

  describe("keyboard", () => {
    it("ArrowUp increments by step", () => {
      const onChange = jest.fn();
      renderSpin({ value: 5, min: 0, max: 59, step: 1, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
      expect(onChange).toHaveBeenCalledWith(6);
    });

    it("ArrowDown decrements by step", () => {
      const onChange = jest.fn();
      renderSpin({ value: 5, min: 0, max: 59, step: 1, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowDown" });
      expect(onChange).toHaveBeenCalledWith(4);
    });

    it("ArrowUp from null sets the min value", () => {
      const onChange = jest.fn();
      renderSpin({ value: null, min: 0, max: 59, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it("ArrowDown from null sets the arrows-max value (max + 1 - step)", () => {
      const onChange = jest.fn();
      renderSpin({ value: null, min: 0, max: 59, step: 1, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowDown" });
      expect(onChange).toHaveBeenCalledWith(59);
    });

    it("ArrowUp wraps within arrows-max bound", () => {
      const onChange = jest.fn();
      // arrowsMax = max + 1 - step = 59 + 1 - 1 = 59
      renderSpin({ value: 59, min: 0, max: 59, step: 1, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
      expect(onChange).toHaveBeenCalledWith(59);
    });

    it("Home sets the value to min", () => {
      const onChange = jest.fn();
      renderSpin({ value: 30, min: 0, max: 59, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Home" });
      expect(onChange).toHaveBeenCalledWith(0);
    });

    it("End sets the value to max", () => {
      const onChange = jest.fn();
      renderSpin({ value: 30, min: 0, max: 59, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "End" });
      expect(onChange).toHaveBeenCalledWith(59);
    });

    it("Backspace clears a non-null value to null", () => {
      const onChange = jest.fn();
      renderSpin({ value: 12, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Backspace" });
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("Delete clears a non-null value to null", () => {
      const onChange = jest.fn();
      renderSpin({ value: 12, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Delete" });
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("Backspace on an empty value moves to the previous input", () => {
      const onPreviousInput = jest.fn();
      renderSpin({ value: null, onPreviousInput });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Backspace" });
      expect(onPreviousInput).toHaveBeenCalledTimes(1);
    });

    it("ArrowRight advances to the next input", () => {
      const onNextInput = jest.fn();
      renderSpin({ value: 5, onNextInput });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowRight" });
      expect(onNextInput).toHaveBeenCalledTimes(1);
    });

    it("ArrowLeft returns to the previous input", () => {
      const onPreviousInput = jest.fn();
      renderSpin({ value: 5, onPreviousInput });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowLeft" });
      expect(onPreviousInput).toHaveBeenCalledTimes(1);
    });

    it("pressing 0 when the value is already 0 advances to the next input", () => {
      const onNextInput = jest.fn();
      const onChange = jest.fn();
      renderSpin({ value: 0, min: 0, max: 59, onNextInput, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "0" });
      expect(onNextInput).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not handle keys when readOnly", () => {
      const onChange = jest.fn();
      renderSpin({ value: 5, readOnly: true, onChange });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("focus", () => {
    it("selects the whole segment on focus so the next keystroke replaces it", () => {
      const selectSpy = jest.spyOn(HTMLInputElement.prototype, "select");
      renderSpin({ value: 12 });
      fireEvent.focus(screen.getByRole("spinbutton"));
      expect(selectSpy).toHaveBeenCalled();
      selectSpy.mockRestore();
    });

    it("forwards the consumer onFocus handler", () => {
      const onFocus = jest.fn();
      renderSpin({ value: 12, onFocus });
      fireEvent.focus(screen.getByRole("spinbutton"));
      expect(onFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe("focusable / tabIndex", () => {
    it("is in the tab order when focusable", () => {
      renderSpin({ value: 1, focusable: true });
      expect(screen.getByRole("spinbutton")).not.toHaveAttribute("tabindex", "-1");
    });

    it("is removed from the tab order when not focusable", () => {
      renderSpin({ value: 1, focusable: false });
      expect(screen.getByRole("spinbutton")).toHaveAttribute("tabindex", "-1");
    });
  });

  it("forwards consumer props through to the host element", () => {
    // The `...others` passthrough is what TimePicker relies on to override the
    // standalone defaults (e.g. its per-size `width` and `aria-label`).
    renderSpin({ value: 1, "aria-label": "Hours" });
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-label", "Hours");
  });

  it("forwards its ref to the host element", () => {
    const ref = React.createRef<TamaguiElement>();
    renderSpin({ value: 1 });
    render(<SpinInput ref={ref} value={1} min={0} max={59} step={1} focusable onChange={noop} />);
    expect(ref.current).not.toBeNull();
  });
});
