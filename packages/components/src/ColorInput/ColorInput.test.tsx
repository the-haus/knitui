import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { ColorInput } from "./ColorInput";

describe("ColorInput", () => {
  it("renders a textbox input", () => {
    render(<ColorInput aria-label="Color" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("reflects the controlled value in the input", () => {
    render(<ColorInput value="#ff0000" aria-label="Color" />);
    expect(screen.getByRole("textbox")).toHaveValue("#ff0000");
  });

  it("fires onChange while typing (uncontrolled)", () => {
    const onChange = jest.fn();
    render(<ColorInput onChange={onChange} aria-label="Color" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "#00ff00" } });
    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("fires onChangeEnd when a valid color is typed", () => {
    const onChangeEnd = jest.fn();
    render(<ColorInput onChangeEnd={onChangeEnd} aria-label="Color" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "#0000ff" } });
    expect(onChangeEnd).toHaveBeenCalled();
  });

  it("renders the input as read-only when disallowInput is set", () => {
    render(<ColorInput disallowInput aria-label="Color" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("forwards a ref to the input element", () => {
    const ref = React.createRef<GetRef<typeof ColorInput>>();
    render(<ColorInput ref={ref} aria-label="Color" />);
    expect(ref.current).not.toBeNull();
  });

  it("reaches the preview swatch through a styles slot", () => {
    render(
      <ColorInput
        value="#ff0000"
        aria-label="Color"
        styles={{ preview: { testID: "preview-slot" } }}
      />,
    );
    expect(screen.getByTestId("preview-slot")).toBeInTheDocument();
  });

  it("forwards field-chrome styles through to the label", () => {
    render(
      <ColorInput
        value="#ff0000"
        label="Brand color"
        styles={{ label: { testID: "label-slot" } }}
      />,
    );
    expect(screen.getByTestId("label-slot")).toBeInTheDocument();
  });

  it("exposes the composable parts as statics", () => {
    expect(ColorInput.Root).toBeDefined();
    expect(ColorInput.Target).toBeDefined();
    expect(ColorInput.Dropdown).toBeDefined();
    expect(ColorInput.Picker).toBeDefined();
    expect(ColorInput.Swatch).toBeDefined();
    expect(ColorInput.Swatches).toBeDefined();
  });

  it("renders the dropdown picker part composed inside the root", () => {
    render(
      <ColorInput.Root opened>
        <ColorInput.Dropdown>
          <ColorInput.Picker value="#ff0000" aria-label="Composed picker" />
        </ColorInput.Dropdown>
      </ColorInput.Root>,
    );
    expect(screen.getByLabelText("Composed picker")).toBeInTheDocument();
  });
});
