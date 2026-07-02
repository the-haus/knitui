import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";
import { type KeyboardActionProps, useKeyboardActions } from "@knitui/hooks";

import { Box } from "../Box";
import { Collapse } from "../Collapse";
import { focusRingStyle, webCursor } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";
import { type TreeNodeData } from "./tree-data";
import { type TreeController, useTree } from "./use-tree";

export type { TreeController, TreeNodeData };
export { type CheckedNodeStatus, getTreeExpandedState, type TreeExpandedState } from "./tree-data";
export { useTree } from "./use-tree";

/* -------------------------------------------------------------------------- */
/* Render payload                                                             */
/* -------------------------------------------------------------------------- */

/** Payload passed to `Tree`'s `renderNode` for full control of a node row. */
export interface RenderTreeNodePayload {
  /** 1-based depth of the node. */
  level: number;
  /** `true` if the node is expanded (only meaningful when it has children). */
  expanded: boolean;
  /** `true` if the node has a non-empty `children` array. */
  hasChildren: boolean;
  /** `true` if the node is selected. */
  selected: boolean;
  /** The node's data. */
  node: TreeNodeData;
  /** The tree controller (`useTree` return value). */
  tree: TreeController;
  /**
   * Props to spread onto the interactive node row. Includes the cross-platform
   * focus/keyboard props from `useKeyboardActions` (`tabIndex` + `onKeyDown` on
   * web, accessibility actions on native) so the row is keyboard-focusable and its
   * `focusRingStyle` outline actually fires — a `<div role="treeitem">` is not
   * focusable on its own. See the focus contract in `internal/variant-colors.ts`.
   */
  elementProps: {
    onPress: () => void;
    role: "treeitem";
    "aria-selected": boolean;
    "aria-expanded": boolean | undefined;
    "data-value": string;
    "data-selected": boolean | undefined;
  } & KeyboardActionProps;
}

export type RenderNode = (payload: RenderTreeNodePayload) => React.ReactNode;

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const TreeRoot = styled(Box, {
  name: "Tree",
  flexDirection: "column",
  // Reset the browser's native <ul> chrome (block margin + 40px inline-start
  // indent). Markers are gone already because the flex display isn't list-item;
  // indentation is our own, via each subtree's `levelOffset` paddingLeft.
  margin: 0,
  padding: 0,
});

const TreeNodeItem = styled(Box, {
  name: "TreeNodeItem",
  flexDirection: "column",
});

const TreeNodeRow = styled(Box, {
  name: "TreeNode",
  flexDirection: "row",
  alignItems: "center",
  gap: "$xs",
  paddingVertical: "$xs",
  paddingHorizontal: "$xs",
  borderRadius: "$xs",
  ...webCursor("pointer"),
  userSelect: "none",
  hoverStyle: { backgroundColor: "$color3" },
  pressStyle: { backgroundColor: "$color4" },
  ...focusRingStyle,

  variants: {
    selected: {
      true: { backgroundColor: "$color4" },
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none" },
    },
  } as const,
});

/** Fixed-width slot so labels line up whether or not a node has a chevron. */
const TreeChevron = styled(Text, {
  name: "TreeChevron",
  width: "$xxs",
  fontSize: "$xxs",
  textAlign: "center",
  color: "$color",
  userSelect: "none",
  rotate: "0deg",

  variants: {
    expanded: {
      true: { rotate: "90deg" },
      false: { rotate: "0deg" },
    },
  } as const,
});

const TreeLabel = styled(Text, {
  name: "TreeLabel",
  fontSize: "$sm",
  color: "$color",
  userSelect: "none",
  flexShrink: 1,

  variants: {
    selected: {
      true: { color: "$color11", fontWeight: "600" },
    },
  } as const,
});

const TreeSubtree = styled(Box, {
  name: "TreeSubtree",
  flexDirection: "column",
  // Reset native <ul> chrome; `paddingLeft={levelOffset}` at render re-applies
  // only our own inline-start indent.
  margin: 0,
  padding: 0,

  variants: {
    withLines: {
      true: { borderLeftWidth: 1, borderLeftColor: "$color5" },
    },
  } as const,
});

type TreeLevelOffset = GetProps<typeof TreeSubtree>["paddingLeft"];

export type TreeNodeItemProps = GetProps<typeof TreeNodeItem>;
export type TreeRowProps = GetProps<typeof TreeNodeRow>;
export type TreeChevronProps = GetProps<typeof TreeChevron>;
export type TreeLabelProps = GetProps<typeof TreeLabel>;
export type TreeSubtreeProps = GetProps<typeof TreeSubtree>;

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the Tree
 * part surface. Each key maps to the props of the part it targets, so
 * `styles={{ row: { bg: "$color3" } }}` is sugar for `<Tree.Row bg="$color3" />`.
 */
export interface TreeStyles {
  /** Props for the tree root (`Tree.Root` → `<ul role="tree">`). */
  root?: Partial<Omit<GetProps<typeof TreeRoot>, "children">>;
  /** Props for each node wrapper (`Tree.Node` → `<li>`). */
  node?: Partial<Omit<TreeNodeItemProps, "children">>;
  /** Props for the interactive node row (`Tree.Row`). */
  row?: Partial<TreeRowProps>;
  /** Props for the per-node expand/collapse chevron (`Tree.Chevron`). */
  chevron?: Partial<TreeChevronProps>;
  /** Props for the per-node label (`Tree.Label`). */
  label?: Partial<TreeLabelProps>;
  /** Props for each subtree group (`Tree.Subtree` → `<ul role="group">`). */
  subtree?: Partial<Omit<TreeSubtreeProps, "children">>;
}

const TREE_SLOT_KEYS = [
  "root",
  "node",
  "row",
  "chevron",
  "label",
  "subtree",
] as const satisfies readonly (keyof TreeStyles)[];

/* -------------------------------------------------------------------------- */
/* Root context — the engine the parts read from                             */
/* -------------------------------------------------------------------------- */

interface TreeContextValue {
  /** The tree controller (expanded/selected/checked state lives here). */
  controller: TreeController;
  expandOnClick: boolean;
  selectOnClick: boolean;
  levelOffset: TreeLevelOffset;
  withLines: boolean;
  /** The retained all-or-nothing dynamic node hatch. */
  renderNode: RenderNode | undefined;
  /** Per-slot style sugar shared down to the parts. */
  styles?: SlotStyles<TreeStyles>;
}

const TreeContext = React.createContext<TreeContextValue | null>(null);

const useTreeContext = (): TreeContextValue => {
  const ctx = React.useContext(TreeContext);
  if (!ctx) {
    throw new Error("Tree compound components must be rendered inside <Tree.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* Tree.Node — the recursive node, composed from the exposed parts            */
/* -------------------------------------------------------------------------- */

export interface TreeNodePartProps extends Partial<Omit<TreeNodeItemProps, "children">> {
  /** The node's data. */
  node: TreeNodeData;
  /** 1-based depth; the sugar passes `1` for top-level nodes. @default 1 */
  level?: number;
}

/**
 * A single tree node: the `<li>` wrapper holding a `Tree.Row` (chevron + label)
 * and, for branches, a `Collapse`d `Tree.Subtree` of child `Tree.Node`s. Reads
 * expansion/selection from the `Tree.Root` controller in context, so composing
 * `<Tree.Node node={…} />` reproduces the full default behavior without
 * `renderNode`. The retained `renderNode` hatch (from context) still replaces the
 * row wholesale when present.
 */
const TreeNode = React.memo(function TreeNode(props: TreeNodePartProps) {
  const ctx = useTreeContext();
  const s = slotStyles<TreeStyles>(ctx.styles, TREE_SLOT_KEYS, "Tree");
  const { node, level = 1, ...rest } = props;
  const { controller, expandOnClick, selectOnClick, levelOffset, withLines, renderNode } = ctx;

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const expanded = controller.expandedState[node.value] ?? false;
  const selected = controller.selectedState.includes(node.value);

  const handlePress = React.useCallback(() => {
    if (hasChildren && expandOnClick) {
      controller.toggleExpanded(node.value);
    }
    if (selectOnClick) {
      controller.select(node.value);
    }
  }, [hasChildren, expandOnClick, selectOnClick, controller, node.value]);

  // Make the row keyboard-focusable + Space/Enter-activatable on web (and AT-
  // actionable on native) so its `focusRingStyle` outline can fire. Spread into
  // `elementProps` so a custom `renderNode` inherits focusability too.
  const focusProps = useKeyboardActions({ onActivate: handlePress });

  const elementProps: RenderTreeNodePayload["elementProps"] = {
    onPress: handlePress,
    role: "treeitem",
    "aria-selected": selected,
    "aria-expanded": hasChildren ? expanded : undefined,
    "data-value": node.value,
    "data-selected": selected || undefined,
    ...focusProps,
  };

  const row =
    typeof renderNode === "function" ? (
      renderNode({
        node,
        level,
        expanded,
        hasChildren,
        selected,
        tree: controller,
        elementProps,
      })
    ) : (
      <TreeNodeRow {...s.get("row")} selected={selected} {...elementProps}>
        <TreeChevron {...s.get("chevron")} expanded={hasChildren ? expanded : undefined}>
          {hasChildren ? "▶" : ""}
        </TreeChevron>
        <TreeLabel {...s.get("label")} selected={selected}>
          {node.label}
        </TreeLabel>
      </TreeNodeRow>
    );

  return (
    <TreeNodeItem render="li" {...s.get("node")} {...rest}>
      {row}
      {hasChildren ? (
        <Collapse in={expanded}>
          <TreeSubtree
            {...s.get("subtree")}
            withLines={withLines}
            paddingLeft={levelOffset}
            role="group"
            render="ul"
          >
            {node.children!.map((child) => (
              <TreeNode key={child.value} node={child} level={level + 1} />
            ))}
          </TreeSubtree>
        </Collapse>
      ) : null}
    </TreeNodeItem>
  );
});

/* -------------------------------------------------------------------------- */
/* Tree.Root — the engine: provides the controller + behavior via context     */
/* -------------------------------------------------------------------------- */

export interface TreeRootProps extends Omit<GetProps<typeof TreeRoot>, "children"> {
  /** `Tree.Node`s (or any custom composition). */
  children?: React.ReactNode;
  /** Horizontal indent added per nesting level. @default "$lg" */
  levelOffset?: TreeLevelOffset;
  /** Expand/collapse a node with children when its row is pressed. @default true */
  expandOnClick?: boolean;
  /** Select a node when its row is pressed. @default false */
  selectOnClick?: boolean;
  /** External controller from `useTree`; an internal one is created when omitted. */
  tree?: TreeController;
  /** Render a fully custom node row from the `RenderTreeNodePayload`. */
  renderNode?: RenderNode;
  /** Render connecting lines down each subtree. @default false */
  withLines?: boolean;
  /** Per-slot style sugar — shared to the parts. */
  styles?: SlotStyles<TreeStyles>;
}

const TreeRootComponent = TreeRoot.styleable<TreeRootProps>(function TreeRootInner(props, ref) {
  const {
    children,
    levelOffset = "$lg",
    expandOnClick = true,
    selectOnClick = false,
    tree,
    renderNode,
    withLines = false,
    styles,
    ...rest
  } = props;

  const internalTree = useTree();
  const controller = tree ?? internalTree;

  const ctx = React.useMemo<TreeContextValue>(
    () => ({
      controller,
      expandOnClick,
      selectOnClick,
      levelOffset,
      withLines,
      renderNode,
      styles,
    }),
    // handlers/renderNode close over render-scoped state; mirror TreeSelect's
    // intentionally non-stable context.

    [controller, expandOnClick, selectOnClick, levelOffset, withLines, renderNode, styles],
  );

  const s = slotStyles<TreeStyles>(styles, TREE_SLOT_KEYS, "Tree");

  return (
    <TreeContext.Provider value={ctx}>
      <TreeRoot
        ref={ref}
        {...s.get("root")}
        {...rest}
        role="tree"
        aria-multiselectable={controller.multiple}
        render="ul"
      >
        {children}
      </TreeRoot>
    </TreeContext.Provider>
  );
});

/* -------------------------------------------------------------------------- */
/* Sugar wrapper — the backward-compatible <Tree data … /> prop API           */
/* -------------------------------------------------------------------------- */

export interface TreeProps extends Omit<GetProps<typeof TreeRoot>, "children"> {
  /** Hierarchical data used to render the tree. */
  data: TreeNodeData[];
  /** Horizontal indent added per nesting level. @default "$lg" */
  levelOffset?: TreeLevelOffset;
  /** Expand/collapse a node with children when its row is pressed. @default true */
  expandOnClick?: boolean;
  /** Select a node when its row is pressed. @default false */
  selectOnClick?: boolean;
  /** External controller from `useTree`; an internal one is created when omitted. */
  tree?: TreeController;
  /**
   * Render a fully custom node row from the `RenderTreeNodePayload`. Retained as
   * the ultimate dynamic escape hatch over the composable `Tree.Node`/`Tree.Row`
   * parts — when set it replaces each row wholesale.
   */
  renderNode?: RenderNode;
  /** Render connecting lines down each subtree. @default false */
  withLines?: boolean;
  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<TreeStyles>;
  /**
   * Accepted for Mantine parity. Space-to-expand is a web-only keyboard
   * behaviour (no cross-platform key primitive); on native, press to expand.
   * @default true
   */
  expandOnSpace?: boolean;
  /**
   * Accepted for Mantine parity. Space-to-check is a web-only keyboard
   * behaviour; drive checking via the controller (`checkNode`) from a
   * `renderNode` `Checkbox.Indicator` for cross-platform support. @default false
   */
  checkOnSpace?: boolean;
  /**
   * Accepted for Mantine parity. Clearing selection on outside click relies on
   * DOM click-outside detection (web-only); deferred. @default false
   */
  clearSelectionOnOutsideClick?: boolean;
}

/**
 * Hierarchical, expandable tree view — mirrors Mantine's `Tree` on `Box`/`Text`.
 * State lives in a `useTree` controller (expanded/selected/checked, with
 * cascading checks); pass your own via `tree` or let `Tree` create one. Accent
 * comes from the Tamagui `theme` prop + palette ramp, never a Mantine `color`
 * prop. Subtree expand/collapse animates through `Collapse` (reduced-motion
 * aware).
 *
 * This `<Tree data … />` prop API is sugar that renders the composable parts
 * (`Tree.Root` + a recursive `Tree.Node` per datum); it holds no behavior the
 * parts lack. Compose `Tree.Root` / `Tree.Node` / `Tree.Row` / `Tree.Chevron` /
 * `Tree.Label` / `Tree.Subtree` by hand for full control without `renderNode`.
 *
 * DEFERRED (web-only / no cross-platform primitive, documented): drag-and-drop,
 * DOM arrow-key / range keyboard navigation, async `onLoadChildren` loading,
 * React-19 `Activity` `keepMounted`.
 */
const TreeComponent = TreeRoot.styleable<TreeProps>(function Tree(props, ref) {
  const {
    data,
    levelOffset = "$lg",
    expandOnClick = true,
    selectOnClick = false,
    tree,
    renderNode,
    withLines = false,
    styles,
    expandOnSpace: _expandOnSpace,
    checkOnSpace: _checkOnSpace,
    clearSelectionOnOutsideClick: _clearSelectionOnOutsideClick,
    ...rest
  } = props;

  const internalTree = useTree();
  const controller = tree ?? internalTree;

  React.useEffect(() => {
    controller.initialize(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <TreeRootComponent
      ref={ref}
      {...rest}
      levelOffset={levelOffset}
      expandOnClick={expandOnClick}
      selectOnClick={selectOnClick}
      tree={controller}
      renderNode={renderNode}
      withLines={withLines}
      styles={styles}
    >
      {data.map((node) => (
        <TreeNode key={node.value} node={node} level={1} />
      ))}
    </TreeRootComponent>
  );
});

export const Tree = withStaticProperties(TreeComponent, {
  /** Engine: provides the `useTree` controller + behavior to the parts via context. */
  Root: TreeRootComponent,
  /** A recursive tree node (`<li>` + row + collapsed subtree). */
  Node: TreeNode,
  /** The interactive node row (chevron + label). */
  Row: TreeNodeRow,
  /** The per-node expand/collapse chevron. */
  Chevron: TreeChevron,
  /** The per-node label. */
  Label: TreeLabel,
  /** A subtree group (`<ul role="group">`) of child nodes. */
  Subtree: TreeSubtree,
});
