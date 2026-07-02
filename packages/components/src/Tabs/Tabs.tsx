import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useId, useUncontrolled } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { controlMetrics as M } from "../internal/control-metrics";
import { renderTextChild } from "../internal/render-text-child";
import {
  controlFontVariant,
  controlVariant,
  focusRingStyle,
  radiusVariant,
  type SizeKey,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type TabsVariant = "default" | "outline" | "pills";
export type TabsOrientation = "horizontal" | "vertical";
export type TabsSize = SizeKey;
/** Side the `Tabs.List` sits on when `orientation="vertical"`. */
export type TabsPlacement = "left" | "right";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface TabsContextValue {
  value: string | null;
  onChange: (val: string | null) => void;
  variant: TabsVariant;
  orientation: TabsOrientation;
  size: TabsSize;
  placement: TabsPlacement;
  inverted: boolean;
  keepMounted: boolean;
  allowTabDeactivation: boolean;
  activateTabWithKeyboard: boolean;
  loop: boolean;
  id: string;
}

const TabsContext = React.createContext<TabsContextValue>({
  value: null,
  onChange: () => {},
  variant: "default",
  orientation: "horizontal",
  size: "md",
  placement: "left",
  inverted: false,
  keepMounted: true,
  allowTabDeactivation: false,
  activateTabWithKeyboard: true,
  loop: true,
  id: "",
});

const TabsStyleContext = createStyledContext<{
  size: TabsSize;
  variant: TabsVariant;
  orientation: TabsOrientation;
}>({
  size: "md",
  variant: "default",
  orientation: "horizontal",
});

/**
 * Carries the uniform per-slot `styles` map (Pillar B / `internal/styles.ts`)
 * down to the generated parts. `Tabs.Tab`/`Tabs.Panel` are rendered by the
 * consumer (not cloned with arbitrary props), so the styled-context can't hold
 * the map — this plain React context distributes it so `<Tabs styles={{ tab }} />`
 * reaches every nested `Tabs.Tab`, `Tabs.List`, and `Tabs.Panel`.
 */
const TabsSlotStylesContext = React.createContext<SlotStyles<TabsStyles> | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* Tabs.List                                                                  */
/* -------------------------------------------------------------------------- */

const TabsListFrame = styled(Box, {
  name: "TabsList",
  context: TabsStyleContext,
  flexDirection: "row",
  flexWrap: "nowrap",
  overflow: "hidden",

  variants: {
    orientation: {
      horizontal: { flexDirection: "row" },
      vertical: { flexDirection: "column" },
    },
    size: {
      xxs: {},
      xs: {},
      sm: {},
      md: {},
      lg: {},
      xl: {},
      xxl: {},
    },
    variant: {
      default: {
        borderBottomWidth: 2,
        borderBottomColor: "$color4",
      },
      outline: {
        borderBottomWidth: 2,
        borderBottomColor: "$color4",
      },
      pills: {
        borderBottomWidth: 0,
        gap: "$xs",
        backgroundColor: "$color2",
        borderRadius: "$sm",
        padding: "$xs",
      },
    },
    grow: {
      true: {},
    },
  } as const,

  defaultVariants: { orientation: "horizontal", variant: "default", size: "md" },
});

type TabsListFrameProps = Omit<
  GetProps<typeof TabsListFrame>,
  "grow" | "orientation" | "size" | "variant"
>;

export interface TabsListProps extends TabsListFrameProps {
  /** Let tabs expand to fill the available width. @default false */
  grow?: boolean;
  /** Alignment of tabs. @default flex-start */
  justify?: BoxProps["justifyContent"];
  /** Tabs.Tab children. */
  children?: React.ReactNode;
}

const TabsList = TabsListFrame.styleable<TabsListProps>(function TabsList(props, ref) {
  const { children, grow, justify = "flex-start", ...rest } = props;
  const ctx = React.useContext(TabsContext);
  const s = useTabsSlots();

  // Roving tab order: the active tab — or the first enabled tab when none is
  // active — is the single tab-stop (`tabIndex: 0`); the rest get `-1` and are
  // reached with the arrow keys.
  const enabledValues: string[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const p = child.props as Partial<TabsTabProps>;
      if (p.value != null && !p.disabled) enabledValues.push(p.value);
    }
  });
  const rovingValue =
    ctx.value != null && enabledValues.includes(ctx.value) ? ctx.value : enabledValues[0];

  const mappedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const p = child.props as Partial<TabsTabProps>;
    const extra: { flex?: number; tabIndex?: number } = {};
    if (grow) extra.flex = 1;
    extra.tabIndex = p.value != null && p.value === rovingValue && !p.disabled ? 0 : -1;
    return React.cloneElement(child, extra as object);
  });

  // Arrow / Home / End navigation between enabled tabs. Web-only: native Views
  // never fire `keydown`, so the `document`/DOM references are never reached off-web.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const horizontal = ctx.orientation === "horizontal";
    const nextKey = horizontal ? "ArrowRight" : "ArrowDown";
    const prevKey = horizontal ? "ArrowLeft" : "ArrowUp";
    const { key } = event;
    if (key !== nextKey && key !== prevKey && key !== "Home" && key !== "End") return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'),
    ).filter((el) => el.getAttribute("aria-disabled") !== "true");
    if (tabs.length === 0) return;
    const current = tabs.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (key === "Home") next = 0;
    else if (key === "End") next = tabs.length - 1;
    else if (key === nextKey)
      next =
        current < 0
          ? 0
          : ctx.loop
            ? (current + 1) % tabs.length
            : Math.min(current + 1, tabs.length - 1);
    else
      next =
        current < 0
          ? tabs.length - 1
          : ctx.loop
            ? (current - 1 + tabs.length) % tabs.length
            : Math.max(current - 1, 0);
    event.preventDefault();
    const target = tabs[next];
    target.focus();
    if (ctx.activateTabWithKeyboard) target.click();
  };
  const keyboardProps: { onKeyDown: React.KeyboardEventHandler<HTMLElement> } = {
    onKeyDown: handleKeyDown,
  };

  // When `inverted`, the list sits after the panels, so its separator moves to
  // the TOP edge (default/outline variants) to keep meeting the panel.
  const invertedBorder: Partial<GetProps<typeof TabsListFrame>> =
    ctx.inverted && ctx.variant !== "pills"
      ? { borderBottomWidth: 0, borderTopWidth: 2, borderTopColor: "$color4" }
      : {};

  return (
    <TabsListFrame
      ref={ref}
      orientation={ctx.orientation}
      variant={ctx.variant}
      size={ctx.size}
      justifyContent={justify}
      // `list` slot sugar sits UNDER the explicit per-part props (`rest`), so an
      // inline prop on `<Tabs.List>` always wins ("explicit beats sugar").
      {...s.merge("list", rest)}
      {...invertedBorder}
      {...keyboardProps}
      role="tablist"
      aria-orientation={ctx.orientation}
    >
      {mappedChildren}
    </TabsListFrame>
  );
});

/* -------------------------------------------------------------------------- */
/* Tabs.Tab                                                                   */
/* -------------------------------------------------------------------------- */

const TabTabFrame = styled(Box, {
  name: "TabsTab",
  context: TabsStyleContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  ...webCursor("pointer"),
  userSelect: "none",
  position: "relative",

  variants: {
    variant: {
      default: {
        backgroundColor: "transparent",
        marginBottom: -2,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
        hoverStyle: { backgroundColor: "$color2" },
        pressStyle: { backgroundColor: "$color3" },
      },
      outline: {
        backgroundColor: "transparent",
        marginBottom: -2,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: "transparent",
        borderTopLeftRadius: "$xs",
        borderTopRightRadius: "$xs",
        hoverStyle: { backgroundColor: "$color2" },
        pressStyle: { backgroundColor: "$color3" },
      },
      pills: {
        borderRadius: "$sm",
        backgroundColor: "transparent",
        hoverStyle: { backgroundColor: "$color3" },
        pressStyle: { backgroundColor: "$color4" },
      },
    },
    active: {
      true: {},
    },
    // Tab trigger derives height + paddingHorizontal from the shared
    // `controlVariant` (same row as a Button of the same key), with the gap
    // between label/sections from the same `controlMetrics` row, so a `xl`
    // Tabs strip is genuinely taller and matches a `xl` Button row.
    size: {
      xxs: { ...controlVariant.xxs, gap: M.xxs.gap },
      xs: { ...controlVariant.xs, gap: M.xs.gap },
      sm: { ...controlVariant.sm, gap: M.sm.gap },
      md: { ...controlVariant.md, gap: M.md.gap },
      lg: { ...controlVariant.lg, gap: M.lg.gap },
      xl: { ...controlVariant.xl, gap: M.xl.gap },
      xxl: { ...controlVariant.xxl, gap: M.xxl.gap },
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none" },
    },
  } as const,

  ...focusRingStyle,
  defaultVariants: { variant: "default", size: "md" },
});

const TabLabel = styled(Text, {
  name: "TabsTabLabel",
  context: TabsStyleContext,
  fontWeight: "500",
  userSelect: "none",
  numberOfLines: 1,

  variants: {
    active: {
      true: { fontWeight: "600", color: "$color11" },
      false: { color: "$color" },
    },
    variant: {
      default: {},
      outline: {},
      pills: {},
    },
    // Balanced control-text font (clamped at the bottom two steps) so the tab
    // label stays proportional to the trigger height across the scale.
    size: {
      ...controlFontVariant,
    },
  } as const,
  defaultVariants: { active: false, size: "md" },
});

const TabSection = styled(Box, {
  name: "TabsTabSection",
  alignItems: "center",
  justifyContent: "center",
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ tab: { backgroundColor: "$red4" } }}`
 * is sugar for an inline prop on every `Tabs.Tab`. Distributed via
 * `TabsSlotStylesContext` so it reaches the consumer-rendered parts.
 */
export interface TabsStyles {
  /** Props for the `Tabs.List` row (`.List`). */
  list?: TabsListProps;
  /** Props for each `Tabs.Tab` trigger (`.Tab`) — its stylable frame surface.
   * `active`/`disabled`/`size`/`variant` are state/context-driven and `value`/
   * `children` are the part's own, so the sugar targets the frame like siblings. */
  tab?: Omit<GetProps<typeof TabTabFrame>, "active" | "disabled" | "size" | "variant">;
  /** Props for the label text inside each tab (`.Tab` label). */
  label?: GetProps<typeof TabLabel>;
  /** Props for the left/right section wrapper inside each tab (`.Section`). */
  section?: GetProps<typeof TabSection>;
  /** Props for each `Tabs.Panel` (`.Panel`) — its stylable frame surface;
   * `value`/`children` are the part's own (identity + content). */
  panel?: GetProps<typeof TabsPanelFrame>;
}

const TABS_SLOT_KEYS = [
  "list",
  "tab",
  "label",
  "section",
  "panel",
] as const satisfies readonly (keyof TabsStyles)[];

const useTabsSlots = () =>
  slotStyles<TabsStyles>(React.useContext(TabsSlotStylesContext), TABS_SLOT_KEYS, "Tabs");

export interface TabsTabProps extends Omit<
  GetProps<typeof TabTabFrame>,
  "active" | "disabled" | "size" | "variant"
> {
  /** Value that identifies this tab (must match the associated `Tabs.Panel`). */
  value: string;
  /** Label text or node. */
  children?: React.ReactNode;
  /** Content on the left of the label. */
  leftSection?: React.ReactNode;
  /** Content on the right of the label. */
  rightSection?: React.ReactNode;
  /** Disables this tab. @default false */
  disabled?: boolean;
}

const TabsTab = TabTabFrame.styleable<TabsTabProps>(function TabsTab(props, ref) {
  const { value, children, leftSection, rightSection, disabled, ...rest } = props;
  const ctx = React.useContext(TabsContext);
  const s = useTabsSlots();
  const isActive = ctx.value === value;
  const panelId = `${ctx.id}-panel-${value}`;
  const tabId = `${ctx.id}-tab-${value}`;

  const handlePress = React.useCallback(() => {
    if (disabled) return;
    if (ctx.allowTabDeactivation && isActive) {
      ctx.onChange(null);
    } else {
      ctx.onChange(value);
    }
  }, [disabled, ctx, isActive, value]);

  // When `inverted`, the underline indicator (default variant only) moves to the
  // TOP edge so it still meets the panel that now sits above the list.
  const flipEdge = ctx.inverted && ctx.variant === "default";

  // Base-edge override for the flipped underline.
  const edgeStyle: Partial<GetProps<typeof TabTabFrame>> = flipEdge
    ? {
        marginBottom: 0,
        marginTop: -2,
        borderBottomWidth: 0,
        borderTopWidth: 2,
        borderTopColor: "transparent",
      }
    : {};

  // Active accent styles applied inline (variant-specific)
  const activeStyle: Partial<GetProps<typeof TabTabFrame>> =
    ctx.variant === "pills"
      ? isActive
        ? {
            backgroundColor: "$background",
            boxShadow: "0px 1px 2px 0px $dropShadowColor",
          }
        : {}
      : isActive
        ? flipEdge
          ? { borderTopColor: "$color9", borderTopWidth: 2 }
          : { borderBottomColor: "$color9", borderBottomWidth: 2 }
        : {};

  const labelSlot = s.get("label");
  const LabelWrapper = React.useCallback(
    (labelProps: { children: React.ReactNode }) => (
      <TabLabel active={isActive} variant={ctx.variant} size={ctx.size} {...labelSlot}>
        {labelProps.children}
      </TabLabel>
    ),
    [ctx.size, ctx.variant, isActive, labelSlot],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handlePress();
    },
    [handlePress],
  );
  const keyboardProps: { onKeyDown: React.KeyboardEventHandler<HTMLElement> } = {
    onKeyDown: handleKeyDown,
  };

  return (
    <TabTabFrame
      ref={ref}
      variant={ctx.variant}
      size={ctx.size}
      active={isActive}
      disabled={disabled}
      onPress={handlePress}
      {...edgeStyle}
      {...activeStyle}
      // `tab` slot sugar sits UNDER the explicit per-part props (`rest`), so an
      // inline prop on `<Tabs.Tab>` always wins ("explicit beats sugar").
      {...s.merge("tab", rest)}
      role="tab"
      id={tabId}
      aria-selected={isActive}
      aria-disabled={disabled || undefined}
      aria-controls={panelId}
      {...keyboardProps}
    >
      {leftSection ? <TabSection {...s.get("section")}>{leftSection}</TabSection> : null}
      {renderTextChild(children, LabelWrapper)}
      {rightSection ? <TabSection {...s.get("section")}>{rightSection}</TabSection> : null}
    </TabTabFrame>
  );
});

/* -------------------------------------------------------------------------- */
/* Tabs.Panel                                                                 */
/* -------------------------------------------------------------------------- */

const TabsPanelFrame = styled(Box, {
  name: "TabsPanel",
  flex: 1,
});

export interface TabsPanelProps extends GetProps<typeof TabsPanelFrame> {
  /** Value that must match a `Tabs.Tab`'s value. */
  value: string;
  /** Panel content. */
  children?: React.ReactNode;
  /** Force-keep panel mounted even when inactive. */
  keepMounted?: boolean;
}

const TabsPanel = TabsPanelFrame.styleable<TabsPanelProps>(function TabsPanel(props, ref) {
  const { value, children, keepMounted: keepMountedProp, ...rest } = props;
  const ctx = React.useContext(TabsContext);
  const s = useTabsSlots();

  const isActive = ctx.value === value;
  const shouldMount = isActive || (keepMountedProp ?? ctx.keepMounted);
  const tabId = `${ctx.id}-tab-${value}`;
  const panelId = `${ctx.id}-panel-${value}`;

  if (!shouldMount) return null;

  return (
    <TabsPanelFrame
      ref={ref}
      display={isActive ? "flex" : "none"}
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      // `panel` slot sugar sits UNDER the explicit per-part props (`rest`).
      {...s.merge("panel", rest)}
    >
      {renderTextChild(children, Text)}
    </TabsPanelFrame>
  );
});

/* -------------------------------------------------------------------------- */
/* Tabs (root)                                                                */
/* -------------------------------------------------------------------------- */

const TabsFrame = styled(Box, {
  name: "Tabs",
  context: TabsStyleContext,
  flexDirection: "column",

  variants: {
    orientation: {
      horizontal: { flexDirection: "column" },
      vertical: { flexDirection: "row" },
    },
    variant: {
      default: {},
      outline: {},
      pills: {},
    },
    size: {
      xxs: {},
      xs: {},
      sm: {},
      md: {},
      lg: {},
      xl: {},
      xxl: {},
    },
    radius: radiusVariant,
  } as const,

  defaultVariants: { orientation: "horizontal", variant: "default", size: "md" },
});

export interface TabsProps extends Omit<
  GetProps<typeof TabsFrame>,
  "orientation" | "onChange" | "size" | "variant"
> {
  /** Controlled active tab value. */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Called when the active tab changes. */
  onChange?: (value: string | null) => void;
  /** Tab visual style. @default 'default' */
  variant?: TabsVariant;
  /** Layout axis. @default 'horizontal' */
  orientation?: TabsOrientation;
  /** Tab size. @default 'md' */
  size?: TabsSize;
  /** Side the `Tabs.List` sits on when `orientation="vertical"`. @default 'left' */
  placement?: TabsPlacement;
  /** Render the `Tabs.List` AFTER the panels (tabs below). @default false */
  inverted?: boolean;
  /** `Tabs.List` + `Tabs.Panel` children. */
  children?: React.ReactNode;
  /** Keep inactive panels mounted (hidden). @default true */
  keepMounted?: boolean;
  /** Allow clicking an active tab to deactivate it. @default false */
  allowTabDeactivation?: boolean;
  /**
   * When an arrow key focuses a tab, also activate it. `false` = manual
   * activation (focus moves, selection follows on Enter/Space). Web-only.
   * @default true
   */
  activateTabWithKeyboard?: boolean;
  /**
   * When `true`, Arrow-key roving focus wraps at the ends (last → first,
   * first → last); when `false`, it clamps at the ends (Home/End still jump).
   * Web-only. @default true
   */
  loop?: boolean;
  /** Base id for a11y ids. Auto-generated if omitted. */
  id?: string;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts.
   * Slots: `list` / `tab` / `label` / `section` / `panel`. Distributed through
   * context so it reaches every nested `Tabs.Tab`/`Tabs.Panel`. Explicit inline
   * props on a composed part always win.
   */
  styles?: SlotStyles<TabsStyles>;
}

const TabsComponent = TabsFrame.styleable<TabsProps>(function Tabs(props, ref) {
  const {
    value,
    defaultValue,
    onChange,
    variant = "default",
    orientation = "horizontal",
    size = "md",
    placement = "left",
    inverted = false,
    keepMounted = true,
    allowTabDeactivation = false,
    activateTabWithKeyboard = true,
    loop = true,
    id,
    styles,
    children,
    ...rest
  } = props;

  const autoId = useId(id);

  const [currentValue, setCurrentValue] = useUncontrolled<string | null>({
    value,
    defaultValue,
    finalValue: null,
    onChange,
  });

  const ctx = React.useMemo<TabsContextValue>(
    () => ({
      value: currentValue,
      onChange: setCurrentValue,
      variant,
      orientation,
      size,
      placement,
      inverted,
      keepMounted,
      allowTabDeactivation,
      activateTabWithKeyboard,
      loop,
      id: autoId,
    }),
    [
      currentValue,
      setCurrentValue,
      variant,
      orientation,
      size,
      placement,
      inverted,
      keepMounted,
      allowTabDeactivation,
      activateTabWithKeyboard,
      loop,
      autoId,
    ],
  );

  // Root flex direction resolves orientation + placement (vertical) / inverted
  // (horizontal). Explicit prop wins over the `orientation` variant's direction.
  const flexDirection =
    orientation === "vertical"
      ? placement === "right"
        ? "row-reverse"
        : "row"
      : inverted
        ? "column-reverse"
        : "column";

  return (
    <TabsContext.Provider value={ctx}>
      <TabsSlotStylesContext.Provider value={styles}>
        <TabsFrame
          ref={ref}
          orientation={orientation}
          variant={variant}
          size={size}
          flexDirection={flexDirection}
          {...rest}
        >
          {children}
        </TabsFrame>
      </TabsSlotStylesContext.Provider>
    </TabsContext.Provider>
  );
});

export const Tabs = withStaticProperties(TabsComponent, {
  List: TabsList,
  Tab: TabsTab,
  Section: TabSection,
  Panel: TabsPanel,
});
