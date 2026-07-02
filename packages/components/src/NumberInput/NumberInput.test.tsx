import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
