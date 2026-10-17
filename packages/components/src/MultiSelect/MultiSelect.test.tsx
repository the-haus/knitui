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

  describe("keyboard, pills + aria", () => {
    const field = () => screen.getByRole("combobox");
    const activeOption = () => {
      const id = field().getAttribute("aria-activedescendant");
      return id ? document.getElementById(id) : null;
    };

    it("toggles values from the keyboard and keeps the dropdown open", () => {
      const onChange = jest.fn();
      render(<MultiSelect data={data} onChange={onChange} placeholder="Pick" />);
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(field()).toHaveAttribute("aria-expanded", "true");
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(activeOption()).toHaveTextContent("React");
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(activeOption()).toHaveTextContent("Vue");
      fireEvent.keyDown(field(), { key: "Enter" });
      expect(onChange).toHaveBeenLastCalledWith(["Vue"]);
      expect(field()).toHaveAttribute("aria-expanded", "true");
      // Enter on a picked option deselects it.
      fireEvent.keyDown(field(), { key: "Enter" });
      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it("marks every picked option aria-selected", () => {
      render(<MultiSelect data={data} defaultValue={["React", "Svelte"]} placeholder="Pick" />);
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      const selected = screen
        .getAllByRole("option")
        .filter((o) => o.getAttribute("aria-selected") === "true")
        .map((o) => o.textContent?.replace("✓", ""));
      expect(selected).toEqual(["React", "Svelte"]);
    });

    it("removes the last pill on Backspace in an empty field", () => {
      const onRemove = jest.fn();
      render(
        <MultiSelect data={data} searchable defaultValue={["React", "Vue"]} onRemove={onRemove} />,
      );
      fireEvent.keyDown(field(), { key: "Backspace" });
      expect(onRemove).toHaveBeenCalledWith("Vue");
      expect(document.querySelectorAll(".tabler-icon-x")).toHaveLength(1);
    });

    it("stops at maxValues and reports onMaxValues", () => {
      const onMaxValues = jest.fn();
      const onChange = jest.fn();
      render(
        <MultiSelect
          data={data}
          maxValues={1}
          defaultValue={["React"]}
          onChange={onChange}
          onMaxValues={onMaxValues}
          placeholder="Pick"
        />,
      );
      fireEvent.click(field());
      fireEvent.click(screen.getByText("Vue"));
      expect(onChange).not.toHaveBeenCalled();
      expect(onMaxValues).toHaveBeenCalledTimes(1);
    });

    it("hides picked options when hidePickedOptions is set", () => {
      render(
        <MultiSelect data={data} hidePickedOptions defaultValue={["Vue"]} placeholder="Pick" />,
      );
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["React", "Svelte"]);
    });

    it("filters by search and highlights the first match", () => {
      render(<MultiSelect data={data} searchable selectFirstOptionOnChange placeholder="Pick" />);
      fireEvent.change(field(), { target: { value: "sv" } });
      expect(screen.getAllByRole("option")).toHaveLength(1);
      expect(activeOption()).toHaveTextContent("Svelte");
    });
  });
});
