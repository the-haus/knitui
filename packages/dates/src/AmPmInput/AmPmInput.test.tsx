import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { AmPmInput } from "./AmPmInput";

/**
 * AmPmInput — the controlled am/pm leaf. Tests cover the public API: controlled
 * value rendering, letter entry through onChangeText (matched against the first
 * letter of labels.am/labels.pm + auto-advance), clearing, readOnly, the web
 * keyboard machine (Home/End/Backspace/Delete/Arrows/letters), focusable/tabIndex,
 * placeholder and ref forwarding. Uses fixed English am/pm labels for determinism.
 */
const labels = { am: "AM", pm: "PM" };
const noop = () => {};

const renderAmPm = (props: Partial<React.ComponentProps<typeof AmPmInput>> = {}) =>
  render(
    <AmPmInput
      value={props.value ?? ""}
      labels={props.labels ?? labels}
      focusable={props.focusable ?? true}
      onChange={props.onChange ?? noop}
      {...props}
    />,
  );

describe("AmPmInput", () => {
  it("renders a textbox", () => {
    renderAmPm();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders the placeholder when empty", () => {
    renderAmPm({ value: "" });
    expect(screen.getByPlaceholderText("--")).toBeInTheDocument();
  });

  it("reflects the controlled value", () => {
    renderAmPm({ value: "PM" });
    expect(screen.getByRole("textbox")).toHaveValue("PM");
  });

  describe("letter entry via onChangeText", () => {
    it("sets am when the typed letter matches the am label's first letter", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "", onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "a" } });
      expect(onChange).toHaveBeenCalledWith("AM");
    });

    it("sets pm when the typed letter matches the pm label's first letter", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "", onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "p" } });
      expect(onChange).toHaveBeenCalledWith("PM");
    });

    it("matches case-insensitively", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "", onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "P" } });
      expect(onChange).toHaveBeenCalledWith("PM");
    });

    it("uses only the last typed character", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "AM", onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "AMp" } });
      expect(onChange).toHaveBeenCalledWith("PM");
    });

    it("advances to the next input after a matching letter", () => {
      const onNextInput = jest.fn();
      renderAmPm({ value: "", onNextInput });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "a" } });
      expect(onNextInput).toHaveBeenCalledTimes(1);
    });

    it("clears the value when the text becomes empty", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "AM", onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith("");
    });

    it("ignores a non-matching letter", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "", onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "z" } });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("works with localized labels", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "", labels: { am: "vm", pm: "nm" }, onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "n" } });
      expect(onChange).toHaveBeenCalledWith("nm");
    });

    it("does not change when readOnly", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "", readOnly: true, onChange });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "a" } });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("keyboard", () => {
    it("Home sets am", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "PM", onChange });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Home" });
      expect(onChange).toHaveBeenCalledWith("AM");
    });

    it("End sets pm", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "AM", onChange });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "End" });
      expect(onChange).toHaveBeenCalledWith("PM");
    });

    it("ArrowUp toggles am to pm", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "AM", onChange });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowUp" });
      expect(onChange).toHaveBeenCalledWith("PM");
    });

    it("ArrowDown toggles pm to am", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "PM", onChange });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowDown" });
      expect(onChange).toHaveBeenCalledWith("AM");
    });

    it("Backspace clears a set value", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "PM", onChange });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Backspace" });
      expect(onChange).toHaveBeenCalledWith("");
    });

    it("Delete clears a set value", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "PM", onChange });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Delete" });
      expect(onChange).toHaveBeenCalledWith("");
    });

    it("Backspace on an empty value moves to the previous input", () => {
      const onPreviousInput = jest.fn();
      renderAmPm({ value: "", onPreviousInput });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Backspace" });
      expect(onPreviousInput).toHaveBeenCalledTimes(1);
    });

    it("ArrowRight advances to the next input", () => {
      const onNextInput = jest.fn();
      renderAmPm({ value: "AM", onNextInput });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowRight" });
      expect(onNextInput).toHaveBeenCalledTimes(1);
    });

    it("ArrowLeft returns to the previous input", () => {
      const onPreviousInput = jest.fn();
      renderAmPm({ value: "AM", onPreviousInput });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowLeft" });
      expect(onPreviousInput).toHaveBeenCalledTimes(1);
    });

    it("a matching letter key sets the value and advances", () => {
      const onChange = jest.fn();
      const onNextInput = jest.fn();
      renderAmPm({ value: "", onChange, onNextInput });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "p" });
      expect(onChange).toHaveBeenCalledWith("PM");
      expect(onNextInput).toHaveBeenCalledTimes(1);
    });

    it("does not handle keys when readOnly", () => {
      const onChange = jest.fn();
      renderAmPm({ value: "AM", readOnly: true, onChange });
      fireEvent.keyDown(screen.getByRole("textbox"), { key: "End" });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("focus", () => {
    it("selects the field on focus so a typed letter replaces it", () => {
      const selectSpy = jest.spyOn(HTMLInputElement.prototype, "select");
      renderAmPm({ value: "AM" });
      fireEvent.focus(screen.getByRole("textbox"));
      expect(selectSpy).toHaveBeenCalled();
      selectSpy.mockRestore();
    });

    it("forwards the consumer onFocus handler", () => {
      const onFocus = jest.fn();
      renderAmPm({ value: "AM", onFocus });
      fireEvent.focus(screen.getByRole("textbox"));
      expect(onFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe("focusable / tabIndex", () => {
    it("is in the tab order when focusable", () => {
      renderAmPm({ focusable: true });
      expect(screen.getByRole("textbox")).not.toHaveAttribute("tabindex", "-1");
    });

    it("is removed from the tab order when not focusable", () => {
      renderAmPm({ focusable: false });
      expect(screen.getByRole("textbox")).toHaveAttribute("tabindex", "-1");
    });
  });

  it("marks the input read-only in the DOM", () => {
    renderAmPm({ value: "AM", readOnly: true });
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("marks the input disabled in the DOM", () => {
    renderAmPm({ value: "AM", disabled: true });
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("forwards its ref to the host element", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<AmPmInput ref={ref} value="" labels={labels} focusable onChange={noop} />);
    expect(ref.current).not.toBeNull();
  });
});
