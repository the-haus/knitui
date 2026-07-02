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
    fireEvent.click(screen.getByRole("textbox"));
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
    fireEvent.click(screen.getByRole("textbox"));
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
      expect(screen.getByRole("textbox", { name: "tree field" })).toBeInTheDocument();
    });
  });
});
