import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { MultiSelect } from "./MultiSelect";

const data = ["React", "Vue", "Svelte"];

describe("MultiSelect", () => {
  it("renders the placeholder", () => {
    render(<MultiSelect data={data} placeholder="Pick frameworks" />);
    expect(screen.getByPlaceholderText("Pick frameworks")).toBeInTheDocument();
  });

  it("renders selected values as pills (uncontrolled defaultValue)", () => {
    render(<MultiSelect data={data} defaultValue={["React", "Vue"]} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Vue")).toBeInTheDocument();
  });

  it("reflects a controlled value", () => {
    render(<MultiSelect data={data} value={["Svelte"]} onChange={() => {}} />);
    expect(screen.getByText("Svelte")).toBeInTheDocument();
  });

  it("forwards a ref to the input frame", () => {
    const ref = React.createRef<GetRef<typeof MultiSelect>>();
    render(<MultiSelect ref={ref} data={data} />);
    expect(ref.current).not.toBeNull();
  });

  it("fires onChange removing a value when a pill remove button is pressed", () => {
    const onChange = jest.fn();
    render(<MultiSelect data={data} defaultValue={["React", "Vue"]} onChange={onChange} />);
    // Pill remove buttons render an `IconX` (aria-hidden), one per selected value.
    const removeGlyphs = document.querySelectorAll(".tabler-icon-x");
    expect(removeGlyphs).toHaveLength(2);
    fireEvent.click(removeGlyphs[0]);
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).not.toContain("React");
  });

  it("renders a label", () => {
    render(<MultiSelect data={data} label="Frameworks" />);
    expect(screen.getByText("Frameworks")).toBeInTheDocument();
  });

  it("renders without throwing when disabled", () => {
    render(<MultiSelect data={data} defaultValue={["React"]} disabled placeholder="d" />);
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("forwards the `option` style slot to the rendered options", () => {
    render(
      <MultiSelect
        data={data}
        searchable
        placeholder="Pick"
        styles={{ option: { testID: "opt" } }}
      />,
    );
    fireEvent.click(screen.getByPlaceholderText("Pick"));
    expect(screen.getAllByTestId("opt")).toHaveLength(data.length);
    expect(screen.getByText("React").closest('[data-testid="opt"]')).not.toBeNull();
  });

  describe("composable parts", () => {
    it("exposes Root, Trigger, Pills, Pill, Dropdown, Options + Combobox re-exports", () => {
      expect(MultiSelect.Root).toBeDefined();
      expect(MultiSelect.Trigger).toBeDefined();
      expect(MultiSelect.Pills).toBeDefined();
      expect(MultiSelect.Pill).toBeDefined();
      expect(MultiSelect.Dropdown).toBeDefined();
      expect(MultiSelect.Options).toBeDefined();
      expect(MultiSelect.Option).toBeDefined();
      expect(MultiSelect.Group).toBeDefined();
      expect(MultiSelect.Empty).toBeDefined();
      expect(MultiSelect.Chevron).toBeDefined();
      expect(MultiSelect.ClearButton).toBeDefined();
    });

    it("works via the explicit <MultiSelect.Root><Trigger/><Dropdown> path", () => {
      const onChange = jest.fn();
      render(
        <MultiSelect.Root data={data} onChange={onChange}>
          <MultiSelect.Trigger placeholder="Pick frameworks" />
          <MultiSelect.Dropdown />
        </MultiSelect.Root>,
      );
      const input = screen.getByPlaceholderText("Pick frameworks");
      fireEvent.click(input);
      fireEvent.click(screen.getByText("Vue"));
      expect(onChange).toHaveBeenCalledWith(["Vue"]);
    });

    it("renders selected values as MultiSelect.Pill chips via Root", () => {
      render(
        <MultiSelect.Root data={data} defaultValue={["React", "Svelte"]}>
          <MultiSelect.Trigger placeholder="Pick" />
          <MultiSelect.Dropdown />
        </MultiSelect.Root>,
      );
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Svelte")).toBeInTheDocument();
      expect(document.querySelectorAll(".tabler-icon-x")).toHaveLength(2);
    });
  });
});
