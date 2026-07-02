import * as React from "react";

import { type GetRef } from "@knitui/core";

import { Box } from "../Box";
import { fireEvent, render, screen } from "../test-utils";
import { Tree } from "./Tree";
import { type TreeNodeData } from "./tree-data";

const data: TreeNodeData[] = [
  {
    value: "src",
    label: "src",
    children: [
      { value: "src/index.ts", label: "index.ts" },
      { value: "src/app.ts", label: "app.ts" },
    ],
  },
  { value: "readme", label: "README.md" },
];

describe("Tree", () => {
  it("renders the top-level node labels", () => {
    render(<Tree data={data} />);
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
  });

  it("exposes the tree role", () => {
    render(<Tree data={data} />);
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("forwards refs to the tree root", () => {
    const ref = React.createRef<GetRef<typeof Tree>>();
    render(<Tree ref={ref} data={data} />);
    expect(ref.current).not.toBeNull();
  });

  it("renders branch nodes as treeitems with aria-expanded", () => {
    render(<Tree data={data} />);
    const branch = screen.getByText("src").closest('[role="treeitem"]');
    expect(branch).not.toBeNull();
    expect(branch).toHaveAttribute("aria-expanded", "false");
  });

  it("expands a branch when its row is pressed (expandOnClick default)", () => {
    render(<Tree data={data} />);
    fireEvent.click(screen.getByText("src"));
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    const branch = screen.getByText("src").closest('[role="treeitem"]');
    expect(branch).toHaveAttribute("aria-expanded", "true");
  });

  it("passes interactive aria props to custom nodes", () => {
    render(
      <Tree
        data={data}
        renderNode={({ elementProps, node }) => <Box {...elementProps}>{`node:${node.value}`}</Box>}
      />,
    );
    expect(screen.getByText("node:readme")).toBeInTheDocument();
    const branch = screen.getByText("node:src").closest('[role="treeitem"]');
    expect(branch).not.toBeNull();
    expect(branch).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByText("node:src"));
    expect(screen.getByText("node:src/index.ts")).toBeInTheDocument();
  });
});

describe("Tree composable parts", () => {
  it("renders a hand-composed tree from Tree.Root + Tree.Node", () => {
    render(
      <Tree.Root>
        {data.map((node) => (
          <Tree.Node key={node.value} node={node} />
        ))}
      </Tree.Root>,
    );
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
  });

  it("expands a composed branch on press, reproducing the default behavior", () => {
    render(
      <Tree.Root>
        {data.map((node) => (
          <Tree.Node key={node.value} node={node} />
        ))}
      </Tree.Root>,
    );
    const branch = screen.getByText("src").closest('[role="treeitem"]');
    expect(branch).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByText("src"));
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(branch).toHaveAttribute("aria-expanded", "true");
  });

  it("exposes the styled parts as static properties", () => {
    expect(Tree.Root).toBeDefined();
    expect(Tree.Node).toBeDefined();
    expect(Tree.Row).toBeDefined();
    expect(Tree.Chevron).toBeDefined();
    expect(Tree.Label).toBeDefined();
    expect(Tree.Subtree).toBeDefined();
  });

  it("routes a `styles` slot down to the matching part (row)", () => {
    render(<Tree data={data} styles={{ row: { testID: "styled-row" } }} />);
    const rows = screen.getAllByTestId("styled-row");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("routes a `styles` slot to the label part", () => {
    render(<Tree data={data} styles={{ label: { testID: "styled-label" } }} />);
    expect(screen.getAllByTestId("styled-label").length).toBeGreaterThan(0);
  });
});
