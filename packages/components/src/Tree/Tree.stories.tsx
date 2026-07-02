import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Checkbox } from "../Checkbox";
import { Text } from "../Text";
import { getTreeExpandedState, Tree, type TreeNodeData, useTree } from "./Tree";

/* -------------------------------------------------------------------------- */
/* Shared sample data                                                          */
/* -------------------------------------------------------------------------- */

const FILE_TREE: TreeNodeData[] = [
  {
    value: "src",
    label: "src",
    children: [
      {
        value: "src/components",
        label: "components",
        children: [
          { value: "src/components/Button.tsx", label: "Button.tsx" },
          { value: "src/components/Input.tsx", label: "Input.tsx" },
        ],
      },
      { value: "src/index.ts", label: "index.ts" },
      { value: "src/app.ts", label: "app.ts" },
    ],
  },
  {
    value: "tests",
    label: "tests",
    children: [
      { value: "tests/Button.test.tsx", label: "Button.test.tsx" },
      { value: "tests/Input.test.tsx", label: "Input.test.tsx" },
    ],
  },
  { value: "package.json", label: "package.json" },
  { value: "tsconfig.json", label: "tsconfig.json" },
];

const SIMPLE_TREE: TreeNodeData[] = [
  {
    value: "fruits",
    label: "Fruits",
    children: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "cherry", label: "Cherry" },
    ],
  },
  {
    value: "vegetables",
    label: "Vegetables",
    children: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
    ],
  },
  { value: "dairy", label: "Dairy" },
];

/* -------------------------------------------------------------------------- */
/* Meta                                                                        */
/* -------------------------------------------------------------------------- */

const meta = {
  title: "Data Display/Tree",
  component: Tree,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Tree renders a hierarchical, expandable node list. State lives in a `useTree` controller (expanded/selected/checked, with cascading checks); pass your own via the `tree` prop or let `Tree` create one. Subtree expand/collapse animates through `Collapse` (reduced-motion aware). Pass `renderNode` for fully custom node rows.",
      },
    },
  },
  args: {
    data: SIMPLE_TREE,
    expandOnClick: true,
    selectOnClick: false,
    withLines: false,
    levelOffset: "$lg",
  },
  argTypes: {
    expandOnClick: {
      control: "boolean",
      description: "Expand/collapse a branch when its row is pressed.",
    },
    selectOnClick: {
      control: "boolean",
      description: "Select a node when its row is pressed.",
    },
    withLines: {
      control: "boolean",
      description: "Render connecting guide lines along each subtree.",
    },
    levelOffset: {
      control: "select",
      options: ["$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl"],
      description: "Horizontal indent added per nesting level.",
    },
    renderNode: { control: false },
    tree: { control: false },
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Tree>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Tree>>;

/* -------------------------------------------------------------------------- */
/* Stories                                                                     */
/* -------------------------------------------------------------------------- */

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The shadow elevation prop, inherited from Box, across all token levels. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <Tree {...args} data={SIMPLE_TREE} shadow={shadow} />
        </Box>
      ))}
    </Box>
  ),
};

/** Connecting guide lines drawn along each subtree indent. */
export const WithLines: Story = {
  args: {
    data: FILE_TREE,
    withLines: true,
  },
};

/** Nodes become selectable on press; the selected row is visually highlighted. */
export const SelectOnClick: Story = {
  args: {
    data: SIMPLE_TREE,
    selectOnClick: true,
  },
};

/** Deeper nesting offset makes hierarchy levels easier to distinguish. */
export const DeepLevelOffset: Story = {
  args: {
    data: FILE_TREE,
    levelOffset: "$xl",
    withLines: true,
  },
};

/**
 * Custom node renderer via `renderNode` — each row gets a file-type icon
 * derived from the node value, with the expand chevron driven manually via
 * `elementProps`.
 */
export const CustomRenderNode: Story = {
  args: {
    data: FILE_TREE,
    renderNode: ({ node, expanded, hasChildren, selected, elementProps }) => (
      <Box
        {...elementProps}
        flexDirection="row"
        alignItems="center"
        gap="$xs"
        paddingVertical="$xs"
        paddingHorizontal="$xs"
        borderRadius="$xs"
        backgroundColor={selected ? "$color4" : "transparent"}
        hoverStyle={{ backgroundColor: "$color3" }}
      >
        <Text width="$xxs" textAlign="center" fontSize="$xs">
          {hasChildren ? (expanded ? "▼" : "▶") : "·"}
        </Text>
        <Text fontSize="$xs">{hasChildren ? "📁" : "📄"}</Text>
        <Text
          fontSize="$sm"
          color={selected ? "$color11" : "$color"}
          fontWeight={selected ? "600" : "400"}
        >
          {node.label}
        </Text>
      </Box>
    ),
  },
};

/**
 * Controlled tree using an external `useTree` controller — expand-all and
 * collapse-all buttons drive the tree from outside the component.
 */
export const ControlledWithActions: Story = {
  render: (args) => {
    const tree = useTree();

    return (
      <Box gap="$md">
        <Box flexDirection="row" gap="$sm" flexWrap="wrap">
          <Box
            paddingHorizontal="$sm"
            paddingVertical="$xs"
            borderRadius="$xs"
            borderWidth={1}
            borderColor="$color7"
            onPress={() => tree.expandAllNodes()}
            hoverStyle={{ backgroundColor: "$color3" }}
          >
            <Text fontSize="$sm">Expand all</Text>
          </Box>
          <Box
            paddingHorizontal="$sm"
            paddingVertical="$xs"
            borderRadius="$xs"
            borderWidth={1}
            borderColor="$color7"
            onPress={() => tree.collapseAllNodes()}
            hoverStyle={{ backgroundColor: "$color3" }}
          >
            <Text fontSize="$sm">Collapse all</Text>
          </Box>
        </Box>

        <Tree {...args} data={FILE_TREE} tree={tree} selectOnClick withLines />

        <Text fontSize="$xs" color="$color11">
          selected: {tree.selectedState.join(", ") || "—"}
        </Text>
      </Box>
    );
  },
};

/**
 * Pre-expanded tree — the `src` subtree is open on first render using
 * `getTreeExpandedState` passed to `useTree`.
 */
export const PreExpanded: Story = {
  render: (args) => {
    const tree = useTree({
      initialExpandedState: getTreeExpandedState(FILE_TREE, ["src", "src/components"]),
    });

    return <Tree {...args} data={FILE_TREE} tree={tree} withLines />;
  },
};

/**
 * Checkable nodes — a `Checkbox` per row driven by the `useTree` controller.
 * `checkNode`/`uncheckNode` cascade to descendants, and parents render the
 * partial `isNodeIndeterminate` state automatically.
 */
export const CheckedNodes: Story = {
  render: (args) => {
    const tree = useTree({ initialCheckedState: ["apple"] });

    return (
      <Box gap="$md">
        <Tree
          {...args}
          data={SIMPLE_TREE}
          tree={tree}
          expandOnClick={false}
          renderNode={({ node, expanded, hasChildren, level, elementProps }) => {
            const checked = tree.isNodeChecked(node.value);
            const indeterminate = tree.isNodeIndeterminate(node.value);
            return (
              <Box
                {...elementProps}
                flexDirection="row"
                alignItems="center"
                gap="$xs"
                paddingVertical="$xs"
                paddingLeft={(level - 1) * 20}
              >
                <Checkbox
                  checked={checked}
                  indeterminate={indeterminate}
                  onChange={() =>
                    checked || indeterminate
                      ? tree.uncheckNode(node.value)
                      : tree.checkNode(node.value)
                  }
                  aria-label={node.value}
                />
                <Text fontSize="$sm" onPress={() => hasChildren && tree.toggleExpanded(node.value)}>
                  {hasChildren ? (expanded ? "▼ " : "▶ ") : ""}
                  {node.label}
                </Text>
              </Box>
            );
          }}
        />
        <Text fontSize="$xs" color="$color11">
          checked: {tree.checkedState.join(", ") || "—"}
        </Text>
      </Box>
    );
  },
};

/**
 * Multiple selection — `useTree({ multiple: true })` lets several nodes be
 * selected at once (Ctrl/Cmd-click semantics), instead of the default single
 * selection.
 */
export const MultipleSelection: Story = {
  render: (args) => {
    const tree = useTree({ multiple: true });

    return (
      <Box gap="$md">
        <Tree {...args} data={SIMPLE_TREE} tree={tree} selectOnClick expandOnClick />
        <Text fontSize="$xs" color="$color11">
          selected: {tree.selectedState.join(", ") || "—"}
        </Text>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `label` and `chevron`. */
export const Styles: Story = {
  args: {
    data: SIMPLE_TREE,
    styles: {
      label: { color: "$blue9", fontWeight: "700" },
      chevron: { color: "$blue9" },
    },
  },
};
