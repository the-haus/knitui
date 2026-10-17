import * as React from "react";

import { type GetRef } from "@knitui/core";

import { cssRulesOf, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
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

  const row = (name: string) =>
    screen.getAllByRole("treeitem").find((el) => el.textContent?.includes(name))!;

  it("renders semantic list hosts: ul[role=tree] > li > ul[role=group]", () => {
    render(<Tree data={data} />);
    const tree = screen.getByRole("tree");
    expect(tree.tagName).toBe("UL");
    expect(tree.firstElementChild?.tagName).toBe("LI");
    fireEvent.click(row("src"));
    expect(tree.querySelector("ul")).toHaveAttribute("role", "group");
  });

  it("toggles a branch from the keyboard (Enter / Space) and is focusable", () => {
    render(<Tree data={data} />);
    const branch = row("src");
    expect(branch).toHaveAttribute("tabindex", "0");
    expect(branch).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(branch, { key: "Enter" });
    expect(row("src")).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(row("src"), { key: " " });
    expect(row("src")).toHaveAttribute("aria-expanded", "false");
  });

  it("announces depth with aria-level and leaves aria-expanded off leaves", () => {
    render(<Tree data={data} />);
    expect(row("src")).toHaveAttribute("aria-level", "1");
    expect(row("README")).not.toHaveAttribute("aria-expanded");
    fireEvent.click(row("src"));
    expect(row("index.ts")).toHaveAttribute("aria-level", "2");
  });

  it("selects on click when selectOnClick is set (aria-selected)", () => {
    render(<Tree data={data} selectOnClick />);
    fireEvent.click(row("README"));
    expect(row("README")).toHaveAttribute("aria-selected", "true");
    expect(row("src")).toHaveAttribute("aria-selected", "false");
  });

  it("gives rows hover/press fills, a selected fill and a focus ring", () => {
    render(<Tree data={data} selectOnClick />);
    const r = row("README");
    expect(declarationsUnder(r, ":hover")).toContain("background-color: var(--color3)");
    expect(declarationsUnder(r, ":active")).toContain("background-color: var(--color4)");
    expect(hasFocusRing(r)).toBe(true);
    fireEvent.click(r);
    const resting = cssRulesOf(row("README"))
      .filter((rule) => !rule.startsWith("@") && !rule.includes(":where("))
      .join("\n");
    expect(resting).toMatch(/background-color: var\(--color4\)/);
  });

  it("indents subtrees by levelOffset and draws lines with withLines", () => {
    render(<Tree data={data} levelOffset={24} withLines />);
    fireEvent.click(row("src"));
    const group = screen.getByRole("tree").querySelector('[role="group"]')!;
    const rules = cssRulesOf(group).join("\n");
    expect(rules).toMatch(/padding-left: 24px/);
    expect(rules).toMatch(/border-left-width: 1px/);
  });
});
