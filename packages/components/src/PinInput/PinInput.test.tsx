import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
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

  it("exposes PinInput.Field as a static property", () => {
    expect(PinInput.Field).toBeDefined();
  });
});
