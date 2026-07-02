import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { SegmentedControl } from "./SegmentedControl";

const DATA = ["React", "Vue", "Svelte"];

describe("SegmentedControl", () => {
  it("renders an option for each data entry", () => {
    render(<SegmentedControl data={DATA} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Vue")).toBeInTheDocument();
    expect(screen.getByText("Svelte")).toBeInTheDocument();
  });

  it("exposes the radiogroup role with radio options", () => {
    render(<SegmentedControl data={DATA} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("checks the first option by default (uncontrolled)", () => {
    render(<SegmentedControl data={DATA} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
  });

  it("fires onChange with the selected value on press", () => {
    const onChange = jest.fn();
    render(<SegmentedControl data={DATA} onChange={onChange} />);
    fireEvent.click(screen.getByText("Vue"));
    expect(onChange).toHaveBeenCalledWith("Vue");
  });

  it("moves selection with arrow keys and skips disabled items", () => {
    render(
      <SegmentedControl
        data={[
          { value: "react", label: "React" },
          { value: "vue", label: "Vue", disabled: true },
          { value: "svelte", label: "Svelte" },
        ]}
      />,
    );

    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: "Svelte" })).toHaveAttribute("aria-checked", "true");
  });

  it("selects a focused item with Enter", () => {
    render(<SegmentedControl data={DATA} />);
    fireEvent.keyDown(screen.getByRole("radio", { name: "Vue" }), { key: "Enter" });
    expect(screen.getByRole("radio", { name: "Vue" })).toHaveAttribute("aria-checked", "true");
  });

  it("respects the controlled value prop", () => {
    render(<SegmentedControl data={DATA} value="Svelte" onChange={jest.fn()} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
  });

  it("renders a hidden input for form submission when name is provided", () => {
    const { container } = render(
      <SegmentedControl data={DATA} defaultValue="Vue" name="framework" />,
    );
    expect(container.querySelector('input[name="framework"]')).toHaveValue("Vue");
  });

  it("does not fire onChange when readOnly", () => {
    const onChange = jest.fn();
    render(<SegmentedControl data={DATA} readOnly onChange={onChange} />);
    fireEvent.click(screen.getByText("Vue"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the group and items disabled when disabled", () => {
    render(<SegmentedControl data={DATA} disabled />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-disabled", "true");
  });

  it("marks a disabled item with aria-disabled", () => {
    render(
      <SegmentedControl
        data={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta", disabled: true },
        ]}
      />,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toHaveAttribute("aria-disabled", "true");
  });

  it("exposes styled subparts", () => {
    expect(SegmentedControl.Root).toBeDefined();
    expect(SegmentedControl.Control).toBeDefined();
    expect(SegmentedControl.Label).toBeDefined();
  });
});
