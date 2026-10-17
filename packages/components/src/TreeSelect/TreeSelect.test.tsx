import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { type TreeNodeData } from "../Tree";
import { TreeSelect, type TreeSelectSize } from "./TreeSelect";

const data: TreeNodeData[] = [
  {
    value: "fruit",
    label: "Fruit",
    children: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
    ],
  },
  { value: "veg", label: "Vegetable" },
];

describe("TreeSelect", () => {
  const sizes: TreeSelectSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

  it("renders an input control", () => {
    render(<TreeSelect data={data} placeholder="Pick one" />);
    expect(screen.getByPlaceholderText("Pick one")).toBeInTheDocument();
  });

  it.each(sizes)("supports the %s size", (size) => {
    render(<TreeSelect data={data} size={size} placeholder={size} />);
    expect(screen.getByPlaceholderText(size)).toBeInTheDocument();
  });

  it("shows the selected node's label in the input (controlled value)", () => {
    render(<TreeSelect data={data} value="veg" />);
    expect(screen.getByDisplayValue("Vegetable")).toBeInTheDocument();
  });

  it("shows the defaultValue label (uncontrolled)", () => {
    render(<TreeSelect data={data} defaultValue="apple" />);
    expect(screen.getByDisplayValue("Apple")).toBeInTheDocument();
  });

  it("opens the dropdown and renders top-level nodes on click", () => {
    render(<TreeSelect data={data} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByText("Vegetable")).toBeInTheDocument();
  });

  it("marks selected tree items with aria-selected", () => {
    render(<TreeSelect data={data} defaultValue="veg" defaultDropdownOpened />);
    expect(screen.getByRole("treeitem", { name: "Vegetable" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("selects a leaf node and fires onChange", () => {
    const onChange = jest.fn();
    render(<TreeSelect data={data} onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Vegetable"));
    expect(onChange).toHaveBeenCalledWith("veg", expect.objectContaining({ value: "veg" }));
  });

  it("does not select nodes when readOnly", () => {
    const onChange = jest.fn();
    render(<TreeSelect data={data} readOnly defaultDropdownOpened onChange={onChange} />);
    fireEvent.click(screen.getByText("Vegetable"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards ref to the input", () => {
    const ref = React.createRef<GetRef<typeof TreeSelect>>();
    render(<TreeSelect ref={ref} data={data} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  describe("composable parts", () => {
    it("renders + selects through the composed parts (Root/Trigger/Dropdown)", () => {
      const onChange = jest.fn();
      render(
        <TreeSelect.Root data={data} onChange={onChange} defaultDropdownOpened>
          <TreeSelect.Trigger placeholder="Composed" />
          <TreeSelect.Dropdown />
        </TreeSelect.Root>,
      );
      expect(screen.getByPlaceholderText("Composed")).toBeInTheDocument();
      // Top-level nodes render in the open dropdown.
      expect(screen.getByText("Fruit")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Vegetable"));
      expect(onChange).toHaveBeenCalledWith("veg", expect.objectContaining({ value: "veg" }));
    });

    it("renders a custom dropdown body via TreeSelect.Tree children override", () => {
      render(
        <TreeSelect.Root data={data} defaultDropdownOpened>
          <TreeSelect.Trigger />
          <TreeSelect.Dropdown>
            <TreeSelect.Tree />
          </TreeSelect.Dropdown>
        </TreeSelect.Root>,
      );
      expect(screen.getByRole("treeitem", { name: "Vegetable" })).toBeInTheDocument();
    });
  });

  describe("styles slot sugar", () => {
    it("reaches the node row part through styles={{ node }}", () => {
      render(
        <TreeSelect
          data={data}
          defaultDropdownOpened
          styles={{ node: { testID: "treeselect-node" } }}
        />,
      );
      // The slot reaches every rendered node row.
      const veg = screen.getByRole("treeitem", { name: "Vegetable" });
      expect(veg).toHaveAttribute("data-testid", "treeselect-node");
    });

    it("reaches the field trigger through styles={{ trigger }}", () => {
      render(<TreeSelect data={data} styles={{ trigger: { "aria-label": "tree field" } }} />);
      expect(screen.getByRole("combobox", { name: "tree field" })).toBeInTheDocument();
    });
  });

  describe("tree behaviour + aria", () => {
    it("is a combobox whose aria-controls points at the tree popup", () => {
      render(<TreeSelect data={data} placeholder="Pick" />);
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-haspopup", "tree");
      expect(input).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(input);
      expect(input).toHaveAttribute("aria-expanded", "true");
      const popup = document.getElementById(input.getAttribute("aria-controls") ?? "");
      expect(popup).not.toBeNull();
      expect(popup?.contains(screen.getByRole("tree"))).toBe(true);
    });

    it("expands a branch (keeping the dropdown open) and selects a nested leaf", () => {
      const onChange = jest.fn();
      render(<TreeSelect data={data} onChange={onChange} />);
      const input = screen.getByRole("combobox");
      fireEvent.click(input);
      const fruit = screen.getByRole("treeitem", { name: /Fruit/ });
      expect(fruit).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(screen.getByText("Fruit"));
      expect(screen.getByRole("treeitem", { name: /Fruit/ })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(input).toHaveAttribute("aria-expanded", "true");
      fireEvent.click(screen.getByText("Banana"));
      expect(onChange).toHaveBeenLastCalledWith(
        "banana",
        expect.objectContaining({ value: "banana" }),
      );
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveValue("Banana");
    });

    it("deselects when the selected node is pressed again (allowDeselect)", () => {
      const onChange = jest.fn();
      render(
        <TreeSelect data={data} defaultValue="veg" defaultDropdownOpened onChange={onChange} />,
      );
      fireEvent.click(screen.getByText("Vegetable"));
      expect(onChange).toHaveBeenLastCalledWith(null, null);
    });

    it("filters nodes by search, keeping the branches of matches", () => {
      render(<TreeSelect data={data} searchable nothingFoundMessage="None" />);
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "ban" } });
      // The matching leaf's ancestor branch survives; the non-matching sibling goes.
      expect(screen.getByText("Fruit")).toBeInTheDocument();
      expect(screen.queryByText("Vegetable")).not.toBeInTheDocument();
      fireEvent.change(input, { target: { value: "zzz" } });
      expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("clears the value via the clear button", () => {
      const onClear = jest.fn();
      render(<TreeSelect data={data} defaultValue="veg" clearable onClear={onClear} />);
      fireEvent.click(screen.getByLabelText("Clear value"));
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("combobox")).toHaveValue("");
    });
  });
});
