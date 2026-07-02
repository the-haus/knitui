import * as React from "react";

import { useUncontrolled } from "@knitui/hooks";

import {
  type CheckedNodeStatus,
  findTreeNode,
  getAllCheckedNodes,
  getAllChildrenNodes,
  getAllNodeValues,
  getChildrenNodesValues,
  getInitialTreeExpandedState,
  isNodeChecked as isNodeCheckedFn,
  isNodeIndeterminate as isNodeIndeterminateFn,
  type TreeExpandedState,
  type TreeNodeData,
} from "./tree-data";

export interface UseTreeInput {
  /** Initial expanded state of all nodes, uncontrolled. */
  initialExpandedState?: TreeExpandedState;
  /** Expanded state of all nodes, controlled. */
  expandedState?: TreeExpandedState;
  /** Called when the expanded state changes. */
  onExpandedStateChange?: (expandedState: TreeExpandedState) => void;
  /** Initial selected node values, uncontrolled. */
  initialSelectedState?: string[];
  /** Selected node values, controlled. */
  selectedState?: string[];
  /** Called when the selected state changes. */
  onSelectedStateChange?: (selectedState: string[]) => void;
  /** Initial checked node values, uncontrolled. */
  initialCheckedState?: string[];
  /** Checked node values, controlled. */
  checkedState?: string[];
  /** Called when the checked state changes. */
  onCheckedStateChange?: (checkedState: string[]) => void;
  /** Allow multiple nodes to be selected at once. @default false */
  multiple?: boolean;
  /** Called with the node value when it is expanded. */
  onNodeExpand?: (value: string) => void;
  /** Called with the node value when it is collapsed. */
  onNodeCollapse?: (value: string) => void;
  /**
   * When `true`, a node's checked state is independent of its parent/children
   * (no cascading). @default false
   */
  checkStrictly?: boolean;
}

export interface TreeController {
  /** Whether each node's checked state is independent (no cascading). */
  checkStrictly: boolean;
  /** Whether multiple nodes can be selected. */
  multiple: boolean;
  /** Per-value expanded flags. */
  expandedState: TreeExpandedState;
  /** Selected node values. */
  selectedState: string[];
  /** Checked node values. */
  checkedState: string[];
  /** Last clicked node — anchor for range selection. */
  anchorNode: string | null;

  /** Seeds expanded/checked state from `data`; called by `Tree` automatically. */
  initialize: (data: TreeNodeData[]) => void;

  toggleExpanded: (value: string) => void;
  collapse: (value: string) => void;
  expand: (value: string) => void;
  expandAllNodes: () => void;
  collapseAllNodes: () => void;
  setExpandedState: (value: TreeExpandedState) => void;

  toggleSelected: (value: string) => void;
  select: (value: string) => void;
  deselect: (value: string) => void;
  clearSelected: () => void;
  setSelectedState: (value: string[]) => void;

  checkNode: (value: string) => void;
  uncheckNode: (value: string) => void;
  checkAllNodes: () => void;
  uncheckAllNodes: () => void;
  setCheckedState: (value: string[]) => void;

  getCheckedNodes: () => CheckedNodeStatus[];
  isNodeChecked: (value: string) => boolean;
  isNodeIndeterminate: (value: string) => boolean;
}

function shallowEqualArray<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => item === b[index]);
}

function shallowEqualRecord<T>(a: Record<string, T>, b: Record<string, T>): boolean {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }
  return aKeys.every((key) => key in b && a[key] === b[key]);
}

function getInitialCheckedState(
  initialState: string[],
  data: TreeNodeData[],
  checkStrictly: boolean,
): string[] {
  if (checkStrictly) {
    return initialState;
  }
  const acc: string[] = [];
  initialState.forEach((node) => acc.push(...getChildrenNodesValues(node, data)));
  return Array.from(new Set(acc));
}

/**
 * Tree state controller — port of Mantine's `useTree`. Owns expanded/selected/
 * checked state (each controllable via `useUncontrolled`), with cascading check
 * logic from `tree-data.ts`. Pass the return value to `Tree`'s `tree` prop to
 * drive it externally, or let `Tree` create its own.
 *
 * DEFERRED (web-only / no cross-platform primitive, documented): async
 * `onLoadChildren` loading and drag-and-drop.
 */
export function useTree({
  initialSelectedState = [],
  expandedState,
  initialCheckedState = [],
  checkedState,
  initialExpandedState = {},
  selectedState,
  multiple = false,
  onNodeCollapse,
  onNodeExpand,
  onCheckedStateChange,
  onSelectedStateChange,
  onExpandedStateChange,
  checkStrictly = false,
}: UseTreeInput = {}): TreeController {
  const [data, setData] = React.useState<TreeNodeData[]>([]);

  const [_expandedState, setExpandedState] = useUncontrolled<TreeExpandedState>({
    value: expandedState,
    defaultValue: initialExpandedState,
    finalValue: {},
    onChange: onExpandedStateChange,
  });

  const [_selectedState, setSelectedState] = useUncontrolled<string[]>({
    value: selectedState,
    defaultValue: initialSelectedState,
    finalValue: [],
    onChange: onSelectedStateChange,
  });

  const [_checkedState, setCheckedState] = useUncontrolled<string[]>({
    value: checkedState,
    defaultValue: initialCheckedState,
    finalValue: [],
    onChange: onCheckedStateChange,
  });

  const [anchorNode, setAnchorNode] = React.useState<string | null>(null);

  const initialize = React.useCallback(
    (_data: TreeNodeData[]) => {
      // Only push state when the computed value actually differs. `initialize`
      // runs from a `[data]` effect; if a parent owns the controller and passes
      // an inline `data` array, an unconditional setState here re-renders the
      // parent, which recreates `data`, which re-fires the effect — an infinite
      // loop. Bailing when nothing changed breaks that cycle.
      const nextExpanded = getInitialTreeExpandedState(_expandedState, _data, _selectedState);
      if (!shallowEqualRecord(nextExpanded, _expandedState)) {
        setExpandedState(nextExpanded);
      }
      const nextChecked = getInitialCheckedState(_checkedState, _data, checkStrictly);
      if (!shallowEqualArray(nextChecked, _checkedState)) {
        setCheckedState(nextChecked);
      }
      setData((current) => (shallowEqualArray(current, _data) ? current : _data));
    },
    [_selectedState, _checkedState, _expandedState, checkStrictly], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggleExpanded = React.useCallback(
    (value: string) => {
      const nextState = { ..._expandedState, [value]: !_expandedState[value] };
      if (nextState[value]) {
        onNodeExpand?.(value);
      } else {
        onNodeCollapse?.(value);
      }
      setExpandedState(nextState);
    },
    [onNodeCollapse, onNodeExpand, _expandedState], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const collapse = React.useCallback(
    (value: string) => {
      if (_expandedState[value] !== false) {
        onNodeCollapse?.(value);
      }
      setExpandedState({ ..._expandedState, [value]: false });
    },
    [onNodeCollapse, _expandedState], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const expand = React.useCallback(
    (value: string) => {
      if (_expandedState[value] !== true) {
        onNodeExpand?.(value);
      }
      setExpandedState({ ..._expandedState, [value]: true });
    },
    [onNodeExpand, _expandedState], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const expandAllNodes = React.useCallback(() => {
    const nextState = { ..._expandedState };
    Object.keys(nextState).forEach((key) => {
      nextState[key] = true;
    });
    setExpandedState(nextState);
  }, [_expandedState]); // eslint-disable-line react-hooks/exhaustive-deps

  const collapseAllNodes = React.useCallback(() => {
    const nextState = { ..._expandedState };
    Object.keys(nextState).forEach((key) => {
      nextState[key] = false;
    });
    setExpandedState(nextState);
  }, [_expandedState]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelected = React.useCallback(
    (value: string) => {
      if (!multiple) {
        if (_selectedState.includes(value)) {
          setAnchorNode(null);
          setSelectedState([]);
          return;
        }
        setAnchorNode(value);
        setSelectedState([value]);
        return;
      }

      if (_selectedState.includes(value)) {
        setAnchorNode(null);
        setSelectedState(_selectedState.filter((item) => item !== value));
        return;
      }
      setAnchorNode(value);
      setSelectedState([..._selectedState, value]);
    },
    [_selectedState, multiple], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const select = React.useCallback(
    (value: string) => {
      setAnchorNode(value);
      setSelectedState(
        multiple
          ? _selectedState.includes(value)
            ? _selectedState
            : [..._selectedState, value]
          : [value],
      );
    },
    [_selectedState, multiple], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const deselect = React.useCallback(
    (value: string) => {
      if (anchorNode === value) {
        setAnchorNode(null);
      }
      setSelectedState(_selectedState.filter((item) => item !== value));
    },
    [_selectedState, anchorNode], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const clearSelected = React.useCallback(() => {
    setSelectedState([]);
    setAnchorNode(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkNode = React.useCallback(
    (value: string) => {
      if (checkStrictly) {
        if (!_checkedState.includes(value)) {
          setCheckedState([..._checkedState, value]);
        }
      } else {
        const checkedNodes = getChildrenNodesValues(value, data);
        setCheckedState(Array.from(new Set([..._checkedState, ...checkedNodes])));
      }
    },
    [data, _checkedState, checkStrictly], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const uncheckNode = React.useCallback(
    (value: string) => {
      if (checkStrictly) {
        setCheckedState(_checkedState.filter((item) => item !== value));
      } else {
        const checkedNodes = getChildrenNodesValues(value, data);
        setCheckedState(_checkedState.filter((item) => !checkedNodes.includes(item)));
      }
    },
    [data, _checkedState, checkStrictly], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const checkAllNodes = React.useCallback(() => {
    setCheckedState(checkStrictly ? getAllNodeValues(data) : getAllChildrenNodes(data));
  }, [data, checkStrictly]); // eslint-disable-line react-hooks/exhaustive-deps

  const uncheckAllNodes = React.useCallback(() => {
    setCheckedState([]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCheckedNodes = React.useCallback((): CheckedNodeStatus[] => {
    if (checkStrictly) {
      return _checkedState.map((value) => {
        const node = findTreeNode(value, data);
        return {
          checked: true,
          indeterminate: false,
          value,
          hasChildren: node ? Array.isArray(node.children) && node.children.length > 0 : false,
        };
      });
    }
    return getAllCheckedNodes(data, _checkedState).result;
  }, [checkStrictly, _checkedState, data]);

  const isNodeChecked = React.useCallback(
    (value: string) =>
      checkStrictly ? _checkedState.includes(value) : isNodeCheckedFn(value, data, _checkedState),
    [checkStrictly, _checkedState, data],
  );

  const isNodeIndeterminate = React.useCallback(
    (value: string) => (checkStrictly ? false : isNodeIndeterminateFn(value, data, _checkedState)),
    [checkStrictly, _checkedState, data],
  );

  return React.useMemo(
    () => ({
      checkStrictly,
      multiple,
      expandedState: _expandedState,
      selectedState: _selectedState,
      checkedState: _checkedState,
      anchorNode,
      initialize,
      toggleExpanded,
      collapse,
      expand,
      expandAllNodes,
      collapseAllNodes,
      setExpandedState,
      toggleSelected,
      select,
      deselect,
      clearSelected,
      setSelectedState,
      checkNode,
      uncheckNode,
      checkAllNodes,
      uncheckAllNodes,
      setCheckedState,
      getCheckedNodes,
      isNodeChecked,
      isNodeIndeterminate,
    }),
    [
      checkStrictly,
      multiple,
      _expandedState,
      _selectedState,
      _checkedState,
      anchorNode,
      initialize,
      toggleExpanded,
      collapse,
      expand,
      expandAllNodes,
      collapseAllNodes,
      setExpandedState,
      toggleSelected,
      select,
      deselect,
      clearSelected,
      setSelectedState,
      checkNode,
      uncheckNode,
      checkAllNodes,
      uncheckAllNodes,
      setCheckedState,
      getCheckedNodes,
      isNodeChecked,
      isNodeIndeterminate,
    ],
  );
}
