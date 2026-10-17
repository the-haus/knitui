import * as React from "react";

import type { GetRef } from "@knitui/core";

import { act, fireEvent, render, screen } from "../test-utils";
import { PinInput } from "./PinInput";

describe("PinInput", () => {
  it("renders the default number of inputs (4)", () => {
    render(<PinInput />);
    expect(screen.getAllByLabelText("PinInput")).toHaveLength(4);
  });

  it("renders the requested number of inputs", () => {
    render(<PinInput length={6} />);
    expect(screen.getAllByLabelText("PinInput")).toHaveLength(6);
  });

  it("uses a custom aria-label for every input", () => {
    render(<PinInput ariaLabel="code" length={3} />);
    expect(screen.getAllByLabelText("code")).toHaveLength(3);
  });

  it("fires onChange as characters are entered", () => {
    const onChange = jest.fn();
    render(<PinInput onChange={onChange} type="number" />);
    const inputs = screen.getAllByLabelText("PinInput");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("reflects a controlled value across the fields", () => {
    render(<PinInput value="12" length={4} />);
    const inputs = screen.getAllByLabelText("PinInput") as HTMLInputElement[];
    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
  });

  it("disables every input when disabled", () => {
    render(<PinInput disabled />);
    screen.getAllByLabelText("PinInput").forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it("keeps the last digit when typing into an already-filled last field", () => {
    const onChange = jest.fn();
    render(<PinInput length={3} type="number" onChange={onChange} />);
    const inputs = screen.getAllByLabelText("PinInput") as HTMLInputElement[];

    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });
    fireEvent.change(inputs[2], { target: { value: "3" } });
    expect(inputs[2]).toHaveValue("3");

    // Continued typing into the filled last field must not overwrite it.
    fireEvent.change(inputs[2], { target: { value: "34" } });
    expect(inputs[2]).toHaveValue("3");
    expect(onChange).toHaveBeenLastCalledWith("123");

    // Backspacing the last field still clears it.
    fireEvent.change(inputs[2], { target: { value: "" } });
    expect(inputs[2]).toHaveValue("");
  });

  it("forwards its ref to the first input", () => {
    const ref = React.createRef<GetRef<typeof PinInput>>();
    render(<PinInput ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("applies the field styles slot to every input", () => {
    render(<PinInput length={3} styles={{ field: { "aria-label": "from-slot" } }} />);
    expect(screen.getAllByLabelText("from-slot")).toHaveLength(3);
  });

  it("lets getInputProps win over the field styles slot", () => {
    render(
      <PinInput
        length={2}
        styles={{ field: { "aria-label": "from-slot" } }}
        getInputProps={() => ({ "aria-label": "from-getter" })}
      />,
    );
    expect(screen.getAllByLabelText("from-getter")).toHaveLength(2);
    expect(screen.queryByLabelText("from-slot")).not.toBeInTheDocument();
  });

  it("calls a getInputProps onFocus/onBlur without losing its own focus tracking", () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    render(<PinInput length={2} placeholder="x" getInputProps={() => ({ onFocus, onBlur })} />);
    const inputs = screen.getAllByLabelText("PinInput");
    expect(inputs[0]).toHaveAttribute("placeholder", "x");

    fireEvent.focus(inputs[0]);
    expect(onFocus).toHaveBeenCalledTimes(1);
    // The row still knows which field has the caret: its placeholder is hidden.
    expect(inputs[0]).toHaveAttribute("placeholder", "");

    fireEvent.blur(inputs[0]);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(inputs[0]).toHaveAttribute("placeholder", "x");
  });

  it("submits the joined code under `name`/`form` through one hidden input (KIT-03)", () => {
    const { container } = render(
      <form id="otp-form">
        <PinInput name="code" form="otp-form" length={4} />
      </form>,
    );
    const hidden = () =>
      container.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="code"]');
    expect(hidden()).toHaveLength(1);
    expect(hidden()[0]).toHaveAttribute("form", "otp-form");
    expect(hidden()[0]!.value).toBe("");
    const fields = screen.getAllByLabelText("PinInput");
    fireEvent.change(fields[0]!, { target: { value: "4" } });
    fireEvent.change(fields[1]!, { target: { value: "2" } });
    expect(hidden()[0]!.value).toBe("42");
    // The boxes stay nameless; the hidden input is the one named field.
    expect(container.querySelectorAll("input[name]")).toHaveLength(1);
    expect(new FormData(container.querySelector("form")!).get("code")).toBe("42");
  });

  it("renders no hidden input without a name", () => {
    const { container } = render(<PinInput />);
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });

  it("exposes PinInput.Field as a static property", () => {
    expect(PinInput.Field).toBeDefined();
  });

  describe("keyboard navigation", () => {
    const fields = () => screen.getAllByLabelText("PinInput") as HTMLInputElement[];

    it("advances focus as each character is typed and calls onComplete once", () => {
      const onComplete = jest.fn();
      render(<PinInput type="number" onComplete={onComplete} />);
      const inputs = fields();
      act(() => inputs[0].focus());
      fireEvent.change(inputs[0], { target: { value: "1" } });
      expect(inputs[1]).toHaveFocus();
      fireEvent.change(inputs[1], { target: { value: "2" } });
      fireEvent.change(inputs[2], { target: { value: "3" } });
      expect(inputs[3]).toHaveFocus();
      fireEvent.change(inputs[3], { target: { value: "4" } });
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith("1234");
    });

    it("moves with ArrowLeft / ArrowRight", () => {
      render(<PinInput />);
      const inputs = fields();
      act(() => inputs[1].focus());
      fireEvent.keyDown(inputs[1], { key: "ArrowRight" });
      expect(inputs[2]).toHaveFocus();
      fireEvent.keyDown(inputs[2], { key: "ArrowLeft" });
      fireEvent.keyDown(inputs[1], { key: "ArrowLeft" });
      expect(inputs[0]).toHaveFocus();
      // Nowhere further left.
      fireEvent.keyDown(inputs[0], { key: "ArrowLeft" });
      expect(inputs[0]).toHaveFocus();
    });

    it("steps back on Backspace in an empty field, and on clearing a character", () => {
      const onChange = jest.fn();
      render(<PinInput defaultValue="12" onChange={onChange} />);
      const inputs = fields();
      act(() => inputs[2].focus());
      fireEvent.keyDown(inputs[2], { key: "Backspace" });
      expect(inputs[1]).toHaveFocus();
      fireEvent.change(inputs[1], { target: { value: "" } });
      expect(onChange).toHaveBeenLastCalledWith("1");
      expect(inputs[0]).toHaveFocus();
    });

    it("rejects characters outside `type` and keeps focus", () => {
      const onChange = jest.fn();
      render(<PinInput type="number" onChange={onChange} />);
      const inputs = fields();
      act(() => inputs[0].focus());
      fireEvent.change(inputs[0], { target: { value: "a" } });
      expect(inputs[0]).toHaveValue("");
      expect(inputs[0]).toHaveFocus();
    });

    it("distributes a pasted full code across the fields", () => {
      const onComplete = jest.fn();
      render(<PinInput type="number" onComplete={onComplete} />);
      const inputs = fields();
      fireEvent.change(inputs[0], { target: { value: "9876" } });
      expect(inputs.map((input) => input.value)).toEqual(["9", "8", "7", "6"]);
      expect(onComplete).toHaveBeenCalledWith("9876");
    });

    it("does not move focus when manageFocus is false", () => {
      render(<PinInput manageFocus={false} />);
      const inputs = fields();
      act(() => inputs[0].focus());
      fireEvent.change(inputs[0], { target: { value: "a" } });
      expect(inputs[0]).toHaveFocus();
      fireEvent.keyDown(inputs[0], { key: "ArrowRight" });
      expect(inputs[0]).toHaveFocus();
    });

    it("hides the placeholder on the focused field only", () => {
      render(<PinInput placeholder="*" length={2} />);
      const inputs = fields();
      fireEvent.focus(inputs[0]);
      expect(inputs[0]).toHaveAttribute("placeholder", "");
      expect(inputs[1]).toHaveAttribute("placeholder", "*");
    });

    it("marks every field aria-invalid under error and renders a group", () => {
      render(<PinInput error length={2} />);
      for (const input of fields()) expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("group")).not.toHaveAttribute("name");
    });

    it("infers type/inputMode from `type` and `mask`", () => {
      const { rerender } = render(<PinInput type="number" length={1} />);
      expect(fields()[0]).toHaveAttribute("type", "tel");
      expect(fields()[0]).toHaveAttribute("inputmode", "numeric");
      rerender(<PinInput mask length={1} />);
      expect(fields()[0]).toHaveAttribute("type", "password");
    });
  });
});
