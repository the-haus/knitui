import * as React from "react";

import type { GetRef } from "@knitui/core";

import { hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { NumberInput, type NumberInputHandlers } from "./NumberInput";

describe("NumberInput", () => {
  it("renders an input reflecting the controlled value", () => {
    render(<NumberInput value={5} aria-label="amount" />);
    expect(screen.getByLabelText("amount")).toHaveValue("5");
  });

  it("fires onChange with a numeric value when typing", () => {
    const onChange = jest.fn();
    render(<NumberInput onChange={onChange} aria-label="amount" />);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it("sanitizes non-numeric characters out of the typed value", () => {
    const onChange = jest.fn();
    render(<NumberInput onChange={onChange} aria-label="amount" />);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "1a2b3" } });
    expect(onChange).toHaveBeenCalledWith(123);
  });

  it("strips negatives when allowNegative is false", () => {
    const onChange = jest.fn();
    render(<NumberInput onChange={onChange} allowNegative={false} aria-label="amount" />);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "-9" } });
    expect(onChange).toHaveBeenCalledWith(9);
  });

  it("exposes increment/decrement via handlersRef", () => {
    const onChange = jest.fn();
    const handlers = React.createRef<NumberInputHandlers>();
    render(
      <NumberInput value={5} handlersRef={handlers} onChange={onChange} aria-label="amount" />,
    );
    handlers.current?.increment();
    expect(onChange).toHaveBeenCalledWith(6);
    handlers.current?.decrement();
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("does not change when disabled and incremented", () => {
    const onChange = jest.fn();
    const handlers = React.createRef<NumberInputHandlers>();
    render(
      <NumberInput
        value={5}
        disabled
        handlersRef={handlers}
        onChange={onChange}
        aria-label="amount"
      />,
    );
    handlers.current?.increment();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("labels the increment and decrement controls", () => {
    render(<NumberInput defaultValue={5} aria-label="amount" />);
    expect(screen.getByRole("button", { name: "Increment value" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrement value" })).toBeInTheDocument();
  });

  it("marks out-of-range controls as disabled", () => {
    render(<NumberInput value={10} max={10} min={0} aria-label="amount" />);
    expect(screen.getByRole("button", { name: "Increment value" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrement value" })).not.toBeDisabled();
  });

  it("forwards its ref to the underlying input", () => {
    const ref = React.createRef<GetRef<typeof NumberInput>>();
    render(<NumberInput ref={ref} aria-label="amount" />);
    expect(ref.current).not.toBeNull();
  });

  it("exposes the stepper parts as statics that render", () => {
    expect(NumberInput.Controls).toBeDefined();
    expect(NumberInput.Increment).toBeDefined();
    expect(NumberInput.Decrement).toBeDefined();
    render(
      <NumberInput.Controls>
        <NumberInput.Increment render="button" aria-label="up" />
        <NumberInput.Decrement render="button" aria-label="down" />
      </NumberInput.Controls>,
    );
    expect(screen.getByRole("button", { name: "up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "down" })).toBeInTheDocument();
  });

  it("reaches the stepper controls through styles slots", () => {
    render(
      <NumberInput
        defaultValue={5}
        aria-label="amount"
        styles={{
          increment: { testID: "inc-slot" },
          decrement: { testID: "dec-slot" },
        }}
      />,
    );
    expect(screen.getByTestId("inc-slot")).toBeInTheDocument();
    expect(screen.getByTestId("dec-slot")).toBeInTheDocument();
  });

  it("forwards field-chrome styles through to the label", () => {
    render(
      <NumberInput
        defaultValue={5}
        label="Quantity"
        styles={{ label: { testID: "label-slot" } }}
      />,
    );
    expect(screen.getByTestId("label-slot")).toBeInTheDocument();
  });

  describe("step / clamp", () => {
    const field = () => screen.getByLabelText("amount") as HTMLInputElement;

    it("steps with ArrowUp / ArrowDown by `step`, without float drift", () => {
      render(<NumberInput defaultValue={0.1} step={0.2} aria-label="amount" />);
      fireEvent.keyDown(field(), { key: "ArrowUp" });
      fireEvent.keyUp(field(), { key: "ArrowUp" });
      expect(field()).toHaveValue("0.3");
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(field()).toHaveValue("-0.1");
    });

    it("steps from startValue when empty, clamped into range", () => {
      render(<NumberInput min={10} max={20} startValue={0} aria-label="amount" />);
      fireEvent.keyDown(field(), { key: "ArrowUp" });
      expect(field()).toHaveValue("10");
    });

    it("never steps past max/min and reports reaching them", () => {
      const onMaxReached = jest.fn();
      const onMinReached = jest.fn();
      render(
        <NumberInput
          defaultValue={9}
          min={8}
          max={10}
          onMaxReached={onMaxReached}
          onMinReached={onMinReached}
          aria-label="amount"
        />,
      );
      fireEvent.keyDown(field(), { key: "ArrowUp" });
      fireEvent.keyDown(field(), { key: "ArrowUp" });
      expect(field()).toHaveValue("10");
      expect(onMaxReached).toHaveBeenCalled();
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(field()).toHaveValue("8");
      expect(onMinReached).toHaveBeenCalled();
    });

    it("clamps a typed out-of-range value on blur (default clampBehavior)", () => {
      render(<NumberInput min={0} max={100} aria-label="amount" />);
      fireEvent.change(field(), { target: { value: "250" } });
      expect(field()).toHaveValue("250");
      fireEvent.blur(field());
      expect(field()).toHaveValue("100");
    });

    it("refuses an out-of-range value outright under clampBehavior='strict'", () => {
      render(<NumberInput min={0} max={100} clampBehavior="strict" aria-label="amount" />);
      fireEvent.change(field(), { target: { value: "50" } });
      fireEvent.change(field(), { target: { value: "500" } });
      expect(field()).toHaveValue("50");
    });

    it("rounds to decimalScale when stepping", () => {
      render(<NumberInput defaultValue={1} step={0.333} decimalScale={2} aria-label="amount" />);
      fireEvent.keyDown(field(), { key: "ArrowUp" });
      expect(field()).toHaveValue("1.33");
    });

    it("ignores arrows when readOnly or withKeyboardEvents is false, and hides controls", () => {
      const { rerender } = render(<NumberInput defaultValue={1} readOnly aria-label="amount" />);
      fireEvent.keyDown(field(), { key: "ArrowUp" });
      expect(field()).toHaveValue("1");
      expect(screen.queryByRole("button", { name: "Increment value" })).not.toBeInTheDocument();
      rerender(<NumberInput defaultValue={1} withKeyboardEvents={false} aria-label="amount" />);
      fireEvent.keyDown(field(), { key: "ArrowUp" });
      expect(field()).toHaveValue("1");
    });

    it("steps when a stepper control is pressed", () => {
      render(<NumberInput defaultValue={1} aria-label="amount" />);
      const up = screen.getByRole("button", { name: "Increment value" });
      fireEvent.pointerDown(up);
      fireEvent.mouseDown(up);
      fireEvent.pointerUp(up);
      fireEvent.mouseUp(up);
      expect(Number(field().value)).toBeGreaterThan(1);
    });

    it("gives each stepper control the keyboard focus ring", () => {
      render(<NumberInput defaultValue={1} aria-label="amount" />);
      const up = screen.getByRole("button", { name: "Increment value" });
      expect(up.tagName).toBe("BUTTON");
      expect(hasFocusRing(up)).toBe(true);
    });
  });
});
