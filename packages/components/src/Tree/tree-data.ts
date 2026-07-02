import type * as React from "react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** A single node in a `Tree`. Mirrors Mantine's `TreeNodeData`. */
export interface TreeNodeData {
  /** Node label, rendered in the node row (or passed to `renderNode`). */
  label: React.ReactNode;
  /** Unique value identifying the node across the whole tree. */
  value: string;
  /** Arbitrary props forwarded by a custom `renderNode`. */
  nodeProps?: Record<string, unknown>;
  /** Child nodes. A non-empty array marks the node as expandable. */
  children?: TreeNodeData[];
}

/** Per-value expanded flags, e.g. `{ "src": true, "src/index.ts": false }`. */
export type TreeExpandedState = Record<string, boolean>;

/** Aggregate checked status of a node (leaf or branch). */
export interface CheckedNodeStatus {
  checked: boolean;
  indeterminate: boolean;
  hasChildren: boolean;
  value: string;
}

/* -------------------------------------------------------------------------- */
/* Lookup / traversal                                                         */
/* -------------------------------------------------------------------------- */

/** Depth-first search for the node with `value`, or `null`. */
export function findTreeNode(value: string, data: TreeNodeData[]): TreeNodeData | null {
  for (const node of data) {
    if (node.value === value) {
      return node;
    }
    if (Array.isArray(node.children)) {
      const childNode = findTreeNode(value, node.children);
      if (childNode) {
        return childNode;
      }
    }
  }
  return null;
}

/** Values of all leaf descendants of `value` (or `[value]` if it is a leaf). */
export function getChildrenNodesValues(
  value: string,
  data: TreeNodeData[],
  acc: string[] = [],
): string[] {
  const node = findTreeNode(value, data);
  if (!node) {
    return acc;
  }
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return [node.value];
  }
  node.children.forEach((child) => {
    if (Array.isArray(child.children) && child.children.length > 0) {
      getChildrenNodesValues(child.value, data, acc);
    } else {
      acc.push(child.value);
    }
  });
  return acc;
}

/** Values of every leaf node in the tree. */
export function getAllChildrenNodes(data: TreeNodeData[]): string[] {
  return data.reduce<string[]>((acc, node) => {
    if (Array.isArray(node.children) && node.children.length > 0) {
      acc.push(...getAllChildrenNodes(node.children));
    } else {
      acc.push(node.value);
    }
    return acc;
  }, []);
}

/** Values of every node (leaves and branches) in the tree. */
export function getAllNodeValues(data: TreeNodeData[]): string[] {
  const acc: string[] = [];
  for (const node of data) {
    acc.push(node.value);
    if (Array.isArray(node.children) && node.children.length > 0) {
      acc.push(...getAllNodeValues(node.children));
    }
  }
  return acc;
}

/* -------------------------------------------------------------------------- */
/* Checked-state derivation                                                   */
/* -------------------------------------------------------------------------- */

/** Resolves the full checked/indeterminate status of every relevant node. */
export function getAllCheckedNodes(
  data: TreeNodeData[],
  checkedState: string[],
  acc: CheckedNodeStatus[] = [],
): { result: CheckedNodeStatus[]; currentTreeChecked: CheckedNodeStatus[] } {
  const currentTreeChecked: CheckedNodeStatus[] = [];

  for (const node of data) {
    if (Array.isArray(node.children) && node.children.length > 0) {
      const innerChecked = getAllCheckedNodes(node.children, checkedState, acc);
      if (innerChecked.currentTreeChecked.length === node.children.length) {
        const isChecked = innerChecked.currentTreeChecked.every((item) => item.checked);
        const item: CheckedNodeStatus = {
          checked: isChecked,
          indeterminate: !isChecked,
          value: node.value,
          hasChildren: true,
        };
        currentTreeChecked.push(item);
        acc.push(item);
      } else if (innerChecked.currentTreeChecked.length > 0) {
        const item: CheckedNodeStatus = {
          checked: false,
          indeterminate: true,
          value: node.value,
          hasChildren: true,
        };
        currentTreeChecked.push(item);
        acc.push(item);
      }
    } else if (checkedState.includes(node.value)) {
      const item: CheckedNodeStatus = {
        checked: true,
        indeterminate: false,
        value: node.value,
        hasChildren: false,
      };
      currentTreeChecked.push(item);
      acc.push(item);
    }
  }

  return { result: acc, currentTreeChecked };
}

/** `true` if `value` is fully checked (directly or via its descendants). */
export function isNodeChecked(
  value: string,
  data: TreeNodeData[],
  checkedState: string[],
): boolean {
  if (checkedState.length === 0) {
    return false;
  }
  if (checkedState.includes(value)) {
    return true;
  }
  const checkedNodes = getAllCheckedNodes(data, checkedState).result;
  return checkedNodes.some((node) => node.value === value && node.checked);
}

/** `true` if `value` is partially checked (some-but-not-all descendants). */
export function isNodeIndeterminate(
  value: string,
  data: TreeNodeData[],
  checkedState: string[],
): boolean {
  if (checkedState.length === 0) {
    return false;
  }
  const checkedNodes = getAllCheckedNodes(data, checkedState).result;
  return checkedNodes.some((node) => node.value === value && node.indeterminate);
}

/* -------------------------------------------------------------------------- */
/* Expanded-state helpers                                                     */
/* -------------------------------------------------------------------------- */

function getInitialTreeExpandedState(
  initialState: TreeExpandedState,
  data: TreeNodeData[],
  value: string | string[] | undefined,
  acc: TreeExpandedState = {},
): TreeExpandedState {
  data.forEach((node) => {
    acc[node.value] = node.value in initialState ? initialState[node.value] : node.value === value;
    if (Array.isArray(node.children)) {
      getInitialTreeExpandedState(initialState, node.children, value, acc);
    }
  });
  return acc;
}

export { getInitialTreeExpandedState };

/**
 * Builds an expanded-state record from a list of values to expand, or `'*'`
 * to expand every node. Mirrors Mantine's `getTreeExpandedState`.
 */
export function getTreeExpandedState(
  data: TreeNodeData[],
  expandedNodesValues: string[] | "*",
): TreeExpandedState {
  const state = getInitialTreeExpandedState({}, data, []);

  if (expandedNodesValues === "*") {
    const result: TreeExpandedState = {};
    Object.keys(state).forEach((key) => {
      result[key] = true;
    });
    return result;
  }

  expandedNodesValues.forEach((node) => {
    state[node] = true;
  });

  return state;
}

/* -------------------------------------------------------------------------- */
/* Filtering (TreeSelect search)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Returns a copy of `data` keeping only nodes whose label (or any descendant's
 * label) matches `query` (case-insensitive). Branches with a matching descendant
 * are retained so the path to the match stays visible. Empty query → original data.
 */
export function filterTreeData(data: TreeNodeData[], query: string): TreeNodeData[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === "") {
    return data;
  }

  const matches = (node: TreeNodeData): TreeNodeData | null => {
    const labelText = typeof node.label === "string" ? node.label : node.value;
    const selfMatch = labelText.toLowerCase().includes(trimmed);

    if (Array.isArray(node.children) && node.children.length > 0) {
      const keptChildren = node.children
        .map(matches)
        .filter((child): child is TreeNodeData => child !== null);
      if (selfMatch || keptChildren.length > 0) {
        return { ...node, children: keptChildren.length > 0 ? keptChildren : node.children };
      }
      return null;
    }

    return selfMatch ? node : null;
  };

  return data.map(matches).filter((node): node is TreeNodeData => node !== null);
}
