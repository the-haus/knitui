import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import {
  Combobox,
  type ComboboxChevronProps,
  type ComboboxClearButtonProps,
  type ComboboxDropdownProps,
  type ComboboxEmptyProps,
  type ComboboxProps,
  type ComboboxSize,
  composeTriggerRightSection,
  useCombobox,
} from "../Combobox";
import { INPUT_WRAPPER_SLOTS, type InputWrapperSlots } from "../Input/shared";
import { InputBase } from "../InputBase";
import { focusRingStyle, webCursor } from "../internal/style-props";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { ScrollArea } from "../ScrollArea";
import { Text } from "../Text";
import {
  filterTreeData,
  findTreeNode,
  type RenderTreeNodePayload,
  Tree,
  type TreeController,
  type TreeNodeData,
  type TreeProps,
  useTree,
} from "../Tree";

/* -------------------------------------------------------------------------- */
/* Dropdown node parts                                                        */
/* -------------------------------------------------------------------------- */

const NodeRow = styled(Box, {
  name: "TreeSelectNode",
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
  } as const,
});

const NodeChevron = styled(Text, {
  name: "TreeSelectChevron",
  width: "$xxs",
  fontSize: "$xxs",
  textAlign: "center",
  color: "$color",
  userSelect: "none",

  variants: {
    expanded: {
      true: { rotate: "90deg" },
      false: { rotate: "0deg" },
    },
  } as const,
});

const NodeLabel = styled(Text, {
  name: "TreeSelectLabel",
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

export type TreeSelectNodeProps = GetProps<typeof NodeRow>;
export type TreeSelectNodeChevronProps = GetProps<typeof NodeChevron>;
export type TreeSelectNodeLabelProps = GetProps<typeof NodeLabel>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Resolve a node's label to a plain string for display in the input. */
function nodeLabelText(node: TreeNodeData | null): string {
  if (!node) {
    return "";
  }
  return typeof node.label === "string" ? node.label : node.value;
}

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

export type TreeSelectSize = ComboboxSize;

type TreeSelectInputProps = Omit<
  GetProps<typeof InputBase>,
  "value" | "defaultValue" | "onChange" | "size"
>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the
 * TreeSelect part surface. Each key maps to the props of the part it targets, so
 * `styles={{ node: { bg: "$color3" } }}` is sugar for `<TreeSelect.Node bg="$color3" />`.
 */
export interface TreeSelectStyles {
  /** Props for the state-machine root (`TreeSelect.Root` → `<Combobox>`). */
  root?: Partial<ComboboxProps>;
  /** Props for the field trigger (`TreeSelect.Trigger` → `InputBase`). */
  trigger?: Partial<TreeSelectInputProps>;
  /** Props for the floating surface (`TreeSelect.Dropdown`). */
  dropdown?: Partial<ComboboxDropdownProps>;
  /** Props for the `<Tree>` body (`TreeSelect.Tree`). */
  tree?: Partial<Omit<TreeProps, "data" | "tree" | "renderNode">>;
  /** Props for each node row (`TreeSelect.Node`). */
  node?: Partial<TreeSelectNodeProps>;
  /** Props for the per-node expand/collapse chevron (`TreeSelect.NodeChevron`). */
  nodeChevron?: Partial<TreeSelectNodeChevronProps>;
  /** Props for the per-node label (`TreeSelect.NodeLabel`). */
  nodeLabel?: Partial<TreeSelectNodeLabelProps>;
  /** Props for the empty state (`TreeSelect.Empty`). */
  empty?: Partial<ComboboxEmptyProps>;
  /** Props for the field chevron (`TreeSelect.Chevron`). */
  chevron?: Partial<ComboboxChevronProps>;
  /** Props for the clear button (`TreeSelect.ClearButton`). */
  clearButton?: Partial<ComboboxClearButtonProps>;
}

const TREE_SELECT_SLOT_KEYS = [
  "root",
  "trigger",
  "dropdown",
  "tree",
  "node",
  "nodeChevron",
  "nodeLabel",
  "empty",
  "chevron",
  "clearButton",
] as const satisfies readonly (keyof TreeSelectStyles)[];

/* -------------------------------------------------------------------------- */
/* Root context                                                               */
/* -------------------------------------------------------------------------- */

interface TreeSelectContextValue {
  /** The shared combobox store (open state + keyboard target). */
  combobox: ReturnType<typeof useCombobox>;
  /** The tree controller (expanded state lives here). */
  controller: TreeController;
  size: ComboboxSize;
  disabled?: boolean;
  readOnly?: boolean;
  searchable: boolean;
  expandOnClick: boolean;
  /** The current committed value (single-select). */
  value: string | null;
  /** Text shown in the trigger input. */
  inputValue: string;
  /** Already-filtered hierarchical data for the dropdown. */
  filteredData: TreeNodeData[];
  /** id wiring `aria-controls` (trigger) ↔ the dropdown surface. */
  nothingFoundMessage?: React.ReactNode;
  withScrollArea: boolean;
  maxDropdownHeight: number;
  /** Whether the clear button may be shown. */
  canClear: boolean;
  /** Per-slot style sugar shared down to the parts. */
  styles?: SlotStyles<TreeSelectStyles>;
  /** Deprecated alias merged over the `clearButton` slot. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** Trigger props the sugar wrapper assembled (chrome, aria, handlers). */
  triggerProps?: Partial<TreeSelectInputProps> & {
    placeholder?: React.ReactNode;
    id?: string;
    ref?: React.Ref<TreeSelectRef>;
    clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  };
  // Event/behaviour handlers consumed by TreeSelect.Trigger / Node.
  onNodePress: (node: TreeNodeData) => void;
  onClear: () => void;
  onChangeText: React.ChangeEventHandler<HTMLInputElement>;
  onClick: React.MouseEventHandler<HTMLInputElement>;
}

const TreeSelectContext = React.createContext<TreeSelectContextValue | null>(null);

const useTreeSelectContext = (): TreeSelectContextValue => {
  const ctx = React.useContext(TreeSelectContext);
  if (!ctx) {
    throw new Error("TreeSelect compound components must be rendered inside <TreeSelect.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* TreeSelect.Root — the value / search / expansion state machine             */
/* -------------------------------------------------------------------------- */

export interface TreeSelectRootProps {
  /** `TreeSelect.Trigger` + `TreeSelect.Dropdown`. */
  children?: React.ReactNode;
  /** Hierarchical data rendered in the dropdown. */
  data: TreeNodeData[];
  /** Controlled selected node value. */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Called with the next value and its node (or `null`). */
  onChange?: (value: string | null, node: TreeNodeData | null) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Show a clear button when a value is selected. @default false */
  clearable?: boolean;
  /** Allow filtering nodes by typing. @default false */
  searchable?: boolean;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Allow deselecting by pressing the already-selected node again. @default true */
  allowDeselect?: boolean;
  /** Message shown when no node matches the search. */
  nothingFoundMessage?: React.ReactNode;
  /** Expand a node with children when its row is pressed. @default true */
  expandOnClick?: boolean;
  /** External tree controller from `useTree`; created internally when omitted. */
  tree?: TreeController;
  /** Control size. @default 'md' */
  size?: TreeSelectSize;
  /** Controlled dropdown opened state. */
  dropdownOpened?: boolean;
  /** Uncontrolled initial dropdown opened state. */
  defaultDropdownOpened?: boolean;
  /** Called when the dropdown opens. */
  onDropdownOpen?: () => void;
  /** Called when the dropdown closes. */
  onDropdownClose?: () => void;
  /** Max dropdown height in px before scrolling. @default 250 */
  maxDropdownHeight?: number;
  /** Wrap the dropdown tree in a `ScrollArea.Autosize`. @default true */
  withScrollArea?: boolean;
  /** Disable the control. */
  disabled?: boolean;
  /** Render the control read-only. */
  readOnly?: boolean;
  /** Per-slot style sugar — shared to the parts. */
  styles?: SlotStyles<TreeSelectStyles>;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /**
   * @deprecated Use `styles={{ clearButton: … }}` (or render `<TreeSelect.ClearButton>`
   * directly). Merged OVER the `clearButton` slot.
   */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /**
   * Trigger props assembled by the sugar `<TreeSelect>` wrapper (field chrome,
   * aria, event handlers, ref). Not part of the public composable API — when
   * composing by hand you render `<TreeSelect.Trigger>` with your own props.
   * @internal
   */
  __triggerProps?: TreeSelectContextValue["triggerProps"];
}

function TreeSelectRoot(props: TreeSelectRootProps) {
  const {
    children,
    data,
    value,
    defaultValue,
    onChange,
    onClear,
    clearable = false,
    searchable = false,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    allowDeselect = true,
    nothingFoundMessage,
    expandOnClick = true,
    tree,
    size = "md",
    dropdownOpened,
    defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
    maxDropdownHeight = 250,
    withScrollArea = true,
    disabled,
    readOnly,
    styles,
    comboboxProps,
    clearButtonProps,
    __triggerProps,
  } = props;

  const [_value, setValueState] = useUncontrolled<string | null>({
    value,
    defaultValue,
    finalValue: null,
  });

  const selectedNode = _value != null ? findTreeNode(_value, data) : null;

  const internalTree = useTree();
  const controller = tree ?? internalTree;

  const combobox = useCombobox({
    opened: dropdownOpened,
    defaultOpened: defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
  });

  const [search, setSearchState] = useUncontrolled<string>({
    value: searchValue,
    defaultValue: defaultSearchValue,
    finalValue: "",
  });
  const setSearch = React.useCallback(
    (next: string) => {
      setSearchState(next);
      onSearchChange?.(next);
    },
    [setSearchState, onSearchChange],
  );

  // Reset the search box when the dropdown closes (internal reset — bypass the
  // `onSearchChange` callback, matching `Select`'s close-sync effect). This MUST
  // stay an effect, not a render-time derivation: the field text must follow the
  // selection across external (controlled `value`) changes, and closing the
  // dropdown (blur) has to reset the query back to the selected label. It is
  // intentional state-mirrored-via-effect, not a removable anti-pattern.
  React.useEffect(() => {
    if (!combobox.opened) {
      setSearchState("");
    }
  }, [combobox.opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredData = React.useMemo(
    () => (searchable && search.trim() !== "" ? filterTreeData(data, search) : data),
    [data, searchable, search],
  );

  const setValue = React.useCallback(
    (next: string | null) => {
      setValueState(next);
      onChange?.(next, next != null ? findTreeNode(next, data) : null);
    },
    [setValueState, onChange, data],
  );

  const handleNodePress = React.useCallback(
    (node: TreeNodeData) => {
      if (disabled || readOnly) return;

      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const next = allowDeselect && node.value === _value ? null : node.value;
      setValue(next);
      if (hasChildren) {
        controller.toggleExpanded(node.value);
      } else {
        combobox.closeDropdown();
      }
    },
    [allowDeselect, _value, setValue, controller, combobox, disabled, readOnly],
  );

  const handleClear = React.useCallback(() => {
    setValue(null);
    setSearch("");
    onClear?.();
  }, [setValue, setSearch, onClear]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearch(event.currentTarget.value);
    combobox.openDropdown();
  };

  const handleClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
    if (searchable) {
      combobox.openDropdown();
    } else {
      combobox.toggleDropdown();
    }
    __triggerProps?.onClick?.(event);
  };

  const canClear = clearable && _value != null && !disabled && !readOnly;
  const inputValue = searchable && combobox.opened ? search : nodeLabelText(selectedNode);

  const ctx = React.useMemo<TreeSelectContextValue>(
    () => ({
      combobox,
      controller,
      size,
      disabled,
      readOnly,
      searchable,
      expandOnClick,
      value: _value,
      inputValue,
      filteredData,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      canClear,
      styles,
      clearButtonProps,
      triggerProps: __triggerProps,
      onNodePress: handleNodePress,
      onClear: handleClear,
      onChangeText: handleChange,
      onClick: handleClick,
    }),
    // handlers are recreated each render (they close over render-scoped state);
    // the context value is intentionally not stable, mirroring the original.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      combobox,
      controller,
      size,
      disabled,
      readOnly,
      searchable,
      expandOnClick,
      _value,
      inputValue,
      filteredData,
      nothingFoundMessage,
      withScrollArea,
      maxDropdownHeight,
      canClear,
      styles,
      clearButtonProps,
      __triggerProps,
    ],
  );

  const s = slotStyles<TreeSelectStyles>(styles, TREE_SELECT_SLOT_KEYS, "TreeSelect");

  return (
    <TreeSelectContext.Provider value={ctx}>
      <Combobox
        position="bottom"
        width="target"
        // Deprecated `comboboxProps` alias merged OVER the `root` slot sugar
        // ("explicit beats sugar").
        {...s.merge("root", comboboxProps)}
        store={combobox}
        size={size}
      >
        {children}
      </Combobox>
    </TreeSelectContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* TreeSelect.Trigger — the InputBase-as-combobox target                      */
/* -------------------------------------------------------------------------- */

export interface TreeSelectTriggerProps extends Partial<TreeSelectInputProps> {
  /** Single-element ref to the inner input. */
  ref?: React.Ref<TreeSelectRef>;
}

const TreeSelectTrigger = React.forwardRef<TreeSelectRef, TreeSelectTriggerProps>(
  function TreeSelectTrigger(props, ref) {
    const ctx = useTreeSelectContext();
    const s = slotStyles<TreeSelectStyles>(ctx.styles, TREE_SELECT_SLOT_KEYS, "TreeSelect");

    // The sugar `<TreeSelect>` wrapper funnels its chrome props + ref through
    // context so a composable caller (`<TreeSelect.Trigger placeholder=… />`) and
    // the sugar caller resolve to the same trigger. Explicit props on the part win
    // over the funneled ones, which in turn win over the `trigger` slot sugar.
    const funneled = ctx.triggerProps ?? {};
    const {
      placeholder: funneledPlaceholder,
      id: funneledId,
      ref: funneledRef,
      clearSectionMode: funneledClearSectionMode,
      ...funneledRest
    } = funneled;

    const {
      id = funneledId,
      placeholder = funneledPlaceholder,
      rightSection: funneledRightSection,
      rightSectionPointerEvents: funneledRightSectionPointerEvents,
      ...funneledChrome
    } = { ...funneledRest, ...props };

    const mergedRef = ref ?? funneledRef;

    // Pure composition of the clear button + chevron into the trigger's right
    // section — no longer riding InputBase's private `__clearSection`/
    // `__defaultRightSection` channel. `composeTriggerRightSection` owns the
    // `clearSectionMode` coexistence math.
    const clearButton = (
      <Combobox.ClearButton
        // Deprecated `clearButtonProps` merged OVER the `clearButton` slot sugar.
        {...s.merge("clearButton", ctx.clearButtonProps)}
        size={ctx.size}
        onClear={ctx.onClear}
      />
    );

    const rightSection = composeTriggerRightSection({
      rightSection: funneledRightSection,
      defaultSection: (
        <Combobox.Chevron opened={ctx.combobox.opened} size={ctx.size} {...s.get("chevron")} />
      ),
      clearSection: clearButton,
      clearable: ctx.canClear,
      mode: funneledClearSectionMode,
    });

    return (
      <Combobox.Target>
        <InputBase
          // `trigger` slot sugar is the LOWEST precedence.
          {...s.get("trigger")}
          {...funneledChrome}
          ref={mergedRef}
          id={id}
          size={ctx.size}
          disabled={ctx.disabled}
          placeholder={placeholder}
          value={ctx.inputValue}
          readOnly={ctx.readOnly || !ctx.searchable}
          pointer={!ctx.searchable}
          onChange={ctx.searchable ? ctx.onChangeText : undefined}
          onClick={ctx.onClick}
          rightSection={rightSection.node}
          rightSectionPointerEvents={
            rightSection.pointerEvents ?? funneledRightSectionPointerEvents
          }
        />
      </Combobox.Target>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* TreeSelect.Node — the default dropdown node row                            */
/* -------------------------------------------------------------------------- */

export interface TreeSelectNodePartProps extends Partial<TreeSelectNodeProps> {
  /** The `Tree` render payload for this node. */
  payload: RenderTreeNodePayload;
}

/**
 * Default node row. Renders `TreeSelect.NodeChevron` + `TreeSelect.NodeLabel` and
 * wires selection / expansion through the root context. Spread the `Tree`
 * `renderNode` payload onto it (`<TreeSelect.Node payload={payload} />`) when
 * composing a custom node renderer.
 */
function TreeSelectNode(props: TreeSelectNodePartProps) {
  const ctx = useTreeSelectContext();
  const s = slotStyles<TreeSelectStyles>(ctx.styles, TREE_SELECT_SLOT_KEYS, "TreeSelect");
  const { payload, ...rest } = props;
  const { node, expanded, hasChildren, elementProps } = payload;
  const selected = node.value === ctx.value;

  return (
    <NodeRow
      {...s.get("node")}
      {...elementProps}
      {...rest}
      selected={selected}
      aria-selected={selected}
      data-selected={selected || undefined}
      onPress={() => ctx.onNodePress(node)}
    >
      <NodeChevron {...s.get("nodeChevron")} expanded={hasChildren ? expanded : undefined}>
        {hasChildren ? "▶" : ""}
      </NodeChevron>
      <NodeLabel {...s.get("nodeLabel")} selected={selected}>
        {node.label}
      </NodeLabel>
    </NodeRow>
  );
}

/* -------------------------------------------------------------------------- */
/* TreeSelect.Tree — the dropdown body                                        */
/* -------------------------------------------------------------------------- */

export interface TreeSelectTreeProps extends Partial<
  Omit<TreeProps, "data" | "tree" | "renderNode">
> {
  /**
   * Custom node renderer. Defaults to `<TreeSelect.Node payload={payload} />`.
   * Receives the `Tree` render payload.
   */
  renderNode?: (payload: RenderTreeNodePayload) => React.ReactNode;
}

function TreeSelectTree(props: TreeSelectTreeProps) {
  const ctx = useTreeSelectContext();
  const s = slotStyles<TreeSelectStyles>(ctx.styles, TREE_SELECT_SLOT_KEYS, "TreeSelect");
  const { renderNode, ...rest } = props;

  const isEmpty = ctx.filteredData.length === 0;
  if (isEmpty) {
    return (
      <Combobox.Empty {...s.get("empty")}>
        {ctx.nothingFoundMessage ?? "Nothing found"}
      </Combobox.Empty>
    );
  }

  const treeNode = (
    <Tree
      // `tree` slot sugar UNDER explicit props.
      {...s.get("tree")}
      {...rest}
      data={ctx.filteredData}
      tree={ctx.controller}
      expandOnClick={ctx.expandOnClick}
      renderNode={renderNode ?? ((payload) => <TreeSelectNode payload={payload} />)}
    />
  );

  return ctx.withScrollArea ? (
    <ScrollArea.Autosize maxHeight={ctx.maxDropdownHeight}>{treeNode}</ScrollArea.Autosize>
  ) : (
    <Box maxHeight={ctx.maxDropdownHeight} overflow="hidden">
      {treeNode}
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* TreeSelect.Dropdown — the floating surface                                 */
/* -------------------------------------------------------------------------- */

export interface TreeSelectDropdownProps extends ComboboxDropdownProps {}

const TreeSelectDropdown = React.forwardRef<
  React.ComponentRef<typeof Combobox.Dropdown>,
  TreeSelectDropdownProps
>(function TreeSelectDropdown(props, ref) {
  const ctx = useTreeSelectContext();
  const s = slotStyles<TreeSelectStyles>(ctx.styles, TREE_SELECT_SLOT_KEYS, "TreeSelect");
  const { children, ...rest } = props;
  return (
    <Combobox.Dropdown ref={ref} {...s.get("dropdown")} {...rest}>
      {children ?? <TreeSelectTree />}
    </Combobox.Dropdown>
  );
});

/* -------------------------------------------------------------------------- */
/* Sugar wrapper — the backward-compatible <TreeSelect … /> prop API          */
/* -------------------------------------------------------------------------- */

export interface TreeSelectProps extends Omit<TreeSelectInputProps, "styles"> {
  /** Hierarchical data rendered in the dropdown. */
  data: TreeNodeData[];
  /** Controlled selected node value. */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Called with the next value and its node (or `null`). */
  onChange?: (value: string | null, node: TreeNodeData | null) => void;
  /** Called when the clear button is pressed. */
  onClear?: () => void;
  /** Show a clear button when a value is selected. @default false */
  clearable?: boolean;
  /** Props forwarded to the internal clear `Combobox.ClearButton`. */
  clearButtonProps?: Partial<ComboboxClearButtonProps>;
  /** How the clear button and right section coexist. @default 'both' */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";
  /** Allow filtering nodes by typing. @default false */
  searchable?: boolean;
  /** Controlled search value. */
  searchValue?: string;
  /** Uncontrolled initial search value. */
  defaultSearchValue?: string;
  /** Called when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Allow deselecting by pressing the already-selected node again. @default true */
  allowDeselect?: boolean;
  /** Message shown when no node matches the search. */
  nothingFoundMessage?: React.ReactNode;
  /** Expand a node with children when its row is pressed. @default true */
  expandOnClick?: boolean;
  /** External tree controller from `useTree`; created internally when omitted. */
  tree?: TreeController;
  /** Control size. @default 'md' */
  size?: TreeSelectSize;
  /** Controlled dropdown opened state. */
  dropdownOpened?: boolean;
  /** Uncontrolled initial dropdown opened state. */
  defaultDropdownOpened?: boolean;
  /** Called when the dropdown opens. */
  onDropdownOpen?: () => void;
  /** Called when the dropdown closes. */
  onDropdownClose?: () => void;
  /** Max dropdown height in px before scrolling. @default 250 */
  maxDropdownHeight?: number;
  /** Wrap the dropdown tree in a `ScrollArea.Autosize`. @default true */
  withScrollArea?: boolean;
  /** Props forwarded to the underlying `Combobox`. */
  comboboxProps?: Partial<ComboboxProps>;
  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<TreeSelectStyles>;
}

export type TreeSelectRef = React.ComponentRef<typeof InputBase>;

/**
 * Single-value tree select — mirrors Mantine's `TreeSelect` (fixed
 * `Value = string`), built on `Combobox` + `InputBase` with a `Tree` in the
 * dropdown. Clicking a leaf selects it and closes; clicking a branch expands it
 * (and selects it, keeping the dropdown open for further navigation). This prop
 * API is sugar that renders the composable parts (`TreeSelect.Root` /
 * `TreeSelect.Trigger` / `TreeSelect.Dropdown` / `TreeSelect.Tree`); it contains
 * no behavior the parts lack. Accent comes from the Tamagui `theme` prop + palette
 * ramp, never a Mantine `color` prop.
 *
 * DEFERRED (documented): multi-value / checkbox selection + pills (single-value
 * first pass, mirroring how `Select` preceded `MultiSelect`); web-only keyboard
 * navigation.
 */
const TreeSelectComponent = InputBase.styleable<TreeSelectProps>(function TreeSelect(props, ref) {
  const {
    // Field-chrome / trigger props (everything that is NOT a Root behavior prop).
    clearSectionMode,
    placeholder,
    id,
    disabled,
    readOnly,
    styles,

    // Root behavior props.
    data,
    value,
    defaultValue,
    onChange,
    onClear,
    clearable = false,
    clearButtonProps,
    searchable = false,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    allowDeselect = true,
    nothingFoundMessage,
    expandOnClick = true,
    tree,
    size = "md",
    dropdownOpened,
    defaultDropdownOpened,
    onDropdownOpen,
    onDropdownClose,
    maxDropdownHeight = 250,
    withScrollArea = true,
    comboboxProps,

    ...inputProps
  } = props;

  // The remaining chrome props are funneled to `TreeSelect.Trigger` via Root
  // context so the sugar path and the composable path converge on the same
  // trigger element.
  const triggerProps: TreeSelectContextValue["triggerProps"] = {
    ...inputProps,
    placeholder,
    id,
    // Forward ONLY the field-chrome slots to the trigger's `Input.Wrapper`; the
    // dropdown/node/etc. slots stay with the parts that consume them, so
    // `Input.Wrapper` never dev-warns about slots it doesn't own.
    styles: pick<TreeSelectStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS),
    ref,
    // Controls how the clear button coexists with the trigger's right section.
    clearSectionMode,
  };

  return (
    <TreeSelectRoot
      data={data}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onClear={onClear}
      clearable={clearable}
      clearButtonProps={clearButtonProps}
      searchable={searchable}
      searchValue={searchValue}
      defaultSearchValue={defaultSearchValue}
      onSearchChange={onSearchChange}
      allowDeselect={allowDeselect}
      nothingFoundMessage={nothingFoundMessage}
      expandOnClick={expandOnClick}
      tree={tree}
      size={size}
      dropdownOpened={dropdownOpened}
      defaultDropdownOpened={defaultDropdownOpened}
      onDropdownOpen={onDropdownOpen}
      onDropdownClose={onDropdownClose}
      maxDropdownHeight={maxDropdownHeight}
      withScrollArea={withScrollArea}
      disabled={disabled}
      readOnly={readOnly}
      styles={styles}
      comboboxProps={comboboxProps}
      __triggerProps={triggerProps}
    >
      <TreeSelectTrigger />
      <TreeSelectDropdown />
    </TreeSelectRoot>
  );
});

export const TreeSelect = withStaticProperties(TreeSelectComponent, {
  /** State machine: value / search / expansion + a11y. Renders `<Combobox>`. */
  Root: TreeSelectRoot,
  /** The field: `<Combobox.Target><InputBase/>`; owns `role="combobox"` aria. */
  Trigger: TreeSelectTrigger,
  /** The floating surface (wraps `Combobox.Dropdown`). */
  Dropdown: TreeSelectDropdown,
  /** The dropdown body — the `<Tree>` + scroll area + empty state. */
  Tree: TreeSelectTree,
  /** A dropdown node row (default `renderNode`). */
  Node: TreeSelectNode,
  /** The per-node expand/collapse chevron. */
  NodeChevron: NodeChevron,
  /** The per-node label. */
  NodeLabel: NodeLabel,
  /** Re-export of `Combobox.Empty`. */
  Empty: Combobox.Empty,
  /** Re-export of `Combobox.Chevron` (the field chevron). */
  Chevron: Combobox.Chevron,
  /** Re-export of `Combobox.ClearButton`. */
  ClearButton: Combobox.ClearButton,
});
