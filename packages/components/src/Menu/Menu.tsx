import * as React from "react";

import {
  type GetProps,
  type RadiusTokens,
  styled,
  Theme,
  withStaticProperties,
} from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { useOverlayChrome } from "../internal/overlay-chrome";
import { renderTextChild } from "../internal/render-text-child";
import { focusRingStyle, hoverProps, type shadowVariant, webCursor } from "../internal/style-props";
import { type SlotStyles } from "../internal/styles";
import {
  Popover,
  type PopoverArrowPosition,
  type PopoverPosition,
  type PopoverWidth,
} from "../Popover";
import { Text } from "../Text";

export type MenuTrigger = "click" | "hover" | "click-hover";

/** Arrow alignment along the dropdown edge (forwarded to the inner `Popover`). */
export type MenuArrowPosition = PopoverArrowPosition;

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface MenuContextValue {
  opened: boolean;
  open: () => void;
  close: () => void;
  /** Open after `openDelay` (hover triggers); immediate for click. */
  openWithDelay: () => void;
  /** Close after `closeDelay` (hover triggers); immediate for click. */
  closeWithDelay: () => void;
  /** Cancel any pending hover open/close timer (e.g. before an immediate close). */
  clearTimer: () => void;
  closeOnItemClick: boolean;
  trigger: MenuTrigger;
  itemTabIndex: -1 | 0;
  /** Resolved per-slot style sugar, distributed onto the parts that read it. */
  slots: {
    dropdown?: GetProps<typeof MenuDropdownFrame>;
    item?: GetProps<typeof MenuItemFrame>;
    itemLabel?: GetProps<typeof MenuItemLabel>;
    itemSection?: GetProps<typeof MenuItemSection>;
    label?: GetProps<typeof MenuLabel>;
    divider?: GetProps<typeof MenuDivider>;
  };
}

const MenuContext = React.createContext<MenuContextValue | null>(null);

const useMenuContext = (): MenuContextValue => {
  const ctx = React.useContext(MenuContext);
  if (!ctx) {
    throw new Error("Menu compound components must be rendered inside <Menu>");
  }
  return ctx;
};

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ item: { … } }}` is sugar for
 * `<Menu.Item … />`. Uses the canonical vocabulary (`dropdown`/`item`) plus the
 * Menu-specific `label`/`divider` parts.
 */
export interface MenuStyles {
  /** Props spread onto the dropdown frame (`Menu.Dropdown`). */
  dropdown?: GetProps<typeof MenuDropdownFrame>;
  /** Props spread onto every item frame (`Menu.Item`). */
  item?: GetProps<typeof MenuItemFrame>;
  /** Props spread onto every item's label text node. */
  itemLabel?: GetProps<typeof MenuItemLabel>;
  /** Props spread onto every item's left/right section wrappers. */
  itemSection?: GetProps<typeof MenuItemSection>;
  /** Props spread onto every label (`Menu.Label`). */
  label?: GetProps<typeof MenuLabel>;
  /** Props spread onto every divider (`Menu.Divider`). */
  divider?: GetProps<typeof MenuDivider>;
}

/**
 * Menu-specific slots layered on the canonical floating vocabulary by
 * {@link useOverlayChrome}. (`dropdown` is canonical; the rest are extras.)
 */
const MENU_EXTRA_SLOT_KEYS = [
  "item",
  "itemLabel",
  "itemSection",
  "label",
  "divider",
] as const satisfies readonly (keyof MenuStyles & string)[];

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export interface MenuProps {
  /** `Menu.Target` + `Menu.Dropdown`. */
  children?: React.ReactNode;
  /** Controlled opened state. */
  opened?: boolean;
  /** Uncontrolled initial opened state. @default false */
  defaultOpened?: boolean;
  /** Called when the opened state changes. */
  onChange?: (opened: boolean) => void;
  /** Called when the menu opens. */
  onOpen?: () => void;
  /** Called when the menu closes. */
  onClose?: () => void;
  /** Close the menu when an item is pressed. @default true */
  closeOnItemClick?: boolean;
  /** Close on `Escape` (web). @default true */
  closeOnEscape?: boolean;
  /** Close on outside press (web). @default true */
  closeOnClickOutside?: boolean;
  /** Event that opens the menu. @default 'click' */
  trigger?: MenuTrigger;
  /** Open delay in ms for hover triggers. @default 0 */
  openDelay?: number;
  /** Close delay in ms for hover triggers. @default 100 */
  closeDelay?: number;
  /** `tabIndex` set on every item; `0` enables Tab navigation. @default -1 */
  menuItemTabIndex?: -1 | 0;
  /** Dropdown placement. @default 'bottom-start' */
  position?: PopoverPosition;
  /** Gap between target and dropdown in px. @default 8 */
  offset?: number;
  /** Dropdown width; `'target'` matches the target. @default 'max-content' */
  width?: PopoverWidth;
  /** Render the dropdown in a portal. @default true */
  withinPortal?: boolean;
  /** Keep the dropdown mounted while closed. @default false */
  keepMounted?: boolean;
  /** Dropdown `z-index`. @default 300 */
  zIndex?: number;
  /** Dropdown border radius. */
  radius?: RadiusTokens;
  /** Dropdown shadow scale. @default 'md' */
  shadow?: keyof typeof shadowVariant;
  /** Skip rendering the dropdown entirely. */
  disabled?: boolean;
  /** Render an arrow pointing at the target. @default false */
  withArrow?: boolean;
  /** Arrow square edge length in px. @default 7 */
  arrowSize?: number;
  /** Arrow distance from the start/end edge when `arrowPosition="side"`. @default 5 */
  arrowOffset?: number;
  /** Corner radius of the arrow's outward corner in px. @default 0 */
  arrowRadius?: number;
  /** Arrow alignment: centered, or pinned toward an aligned placement. @default 'side' */
  arrowPosition?: MenuArrowPosition;
  /** Accent theme applied to the menu subtree (trigger + dropdown). */
  theme?: React.ComponentProps<typeof Theme>["name"];
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<MenuStyles>;
}

function MenuRoot(props: MenuProps) {
  const {
    children,
    opened,
    defaultOpened,
    onChange,
    onOpen,
    onClose,
    closeOnItemClick = true,
    closeOnEscape = true,
    closeOnClickOutside = true,
    trigger = "click",
    openDelay = 0,
    closeDelay = 100,
    menuItemTabIndex = -1,
    position = "bottom-start",
    offset = 8,
    width = "max-content",
    withinPortal = true,
    keepMounted = false,
    zIndex = 300,
    radius,
    shadow = "md",
    disabled,
    withArrow = false,
    arrowSize = 7,
    arrowOffset = 5,
    arrowRadius = 0,
    arrowPosition = "side",
    theme,
    styles,
  } = props;

  // Per-slot style sugar, distributed onto the parts via context, using the shared
  // floating-chrome resolver (canonical `dropdown` + Menu's item/label extras).
  const s = useOverlayChrome<MenuStyles>(styles, MENU_EXTRA_SLOT_KEYS, "Menu");
  const dropdownSlot = s.get("dropdown");
  const itemSlot = s.get("item");
  const itemLabelSlot = s.get("itemLabel");
  const itemSectionSlot = s.get("itemSection");
  const labelSlot = s.get("label");
  const dividerSlot = s.get("divider");

  const [isOpen, setOpen] = useUncontrolled<boolean>({
    value: opened,
    defaultValue: defaultOpened,
    finalValue: false,
    onChange,
  });

  // Fire open/close side-effects on transitions only.
  const prevOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen !== prevOpen.current) {
      (isOpen ? onOpen : onClose)?.();
      prevOpen.current = isOpen;
    }
  }, [isOpen, onOpen, onClose]);

  const open = React.useCallback(() => setOpen(true), [setOpen]);
  const close = React.useCallback(() => setOpen(false), [setOpen]);

  // Delayed open/close for hover triggers. A single timer is enough since open
  // and close are mutually exclusive intents.
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  React.useEffect(() => clearTimer, [clearTimer]);

  const openWithDelay = React.useCallback(() => {
    clearTimer();
    if (openDelay > 0) {
      timer.current = setTimeout(open, openDelay);
    } else {
      open();
    }
  }, [clearTimer, openDelay, open]);

  const closeWithDelay = React.useCallback(() => {
    clearTimer();
    if (closeDelay > 0) {
      timer.current = setTimeout(close, closeDelay);
    } else {
      close();
    }
  }, [clearTimer, closeDelay, close]);

  const value = React.useMemo<MenuContextValue>(
    () => ({
      opened: isOpen,
      open,
      close,
      openWithDelay,
      closeWithDelay,
      clearTimer,
      closeOnItemClick,
      trigger,
      itemTabIndex: menuItemTabIndex,
      slots: {
        dropdown: dropdownSlot,
        item: itemSlot,
        itemLabel: itemLabelSlot,
        itemSection: itemSectionSlot,
        label: labelSlot,
        divider: dividerSlot,
      },
    }),
    [
      isOpen,
      open,
      close,
      openWithDelay,
      closeWithDelay,
      clearTimer,
      closeOnItemClick,
      trigger,
      menuItemTabIndex,
      dropdownSlot,
      itemSlot,
      itemLabelSlot,
      itemSectionSlot,
      labelSlot,
      dividerSlot,
    ],
  );

  const popover = (
    <Popover
      opened={isOpen}
      onChange={setOpen}
      position={position}
      offset={offset}
      width={width}
      withinPortal={withinPortal}
      keepMounted={keepMounted}
      zIndex={zIndex}
      radius={radius}
      shadow={shadow}
      disabled={disabled}
      closeOnEscape={closeOnEscape}
      closeOnClickOutside={closeOnClickOutside}
      withArrow={withArrow}
      arrowSize={arrowSize}
      arrowOffset={arrowOffset}
      arrowRadius={arrowRadius}
      arrowPosition={arrowPosition}
    >
      {children}
    </Popover>
  );

  return (
    <MenuContext.Provider value={value}>
      {theme ? <Theme name={theme}>{popover}</Theme> : popover}
    </MenuContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Target                                                                     */
/* -------------------------------------------------------------------------- */

export interface MenuTargetProps {
  /** Single element child that accepts a ref. */
  children: React.ReactElement;
  /** Prop name used to pass the ref into the child. @default 'ref' */
  refProp?: string;
}

type HoverHandlers = { onHoverIn?: () => void; onHoverOut?: () => void };

function MenuTarget({ children, refProp = "ref" }: MenuTargetProps) {
  const ctx = useMenuContext();
  const hover = ctx.trigger === "hover" || ctx.trigger === "click-hover";

  // For hover triggers, open/close on pointer enter/leave (web; no-op on
  // native — there the press-toggle from Popover.Target drives it). Press always
  // toggles via Popover.Target, which keeps the menu keyboard/touch accessible.
  // Compose with the child's own hover handlers (mirrors Tooltip's
  // `buildTargetHandlers`) so a consumer's `onHoverIn`/`onHoverOut` isn't dropped.
  const childProps = children.props as HoverHandlers;
  const withHover = hover
    ? React.cloneElement(
        children,
        hoverProps({
          onHoverIn: () => {
            childProps.onHoverIn?.();
            ctx.openWithDelay();
          },
          onHoverOut: () => {
            childProps.onHoverOut?.();
            ctx.closeWithDelay();
          },
        }) as Partial<HoverHandlers> & React.Attributes,
      )
    : children;

  return <Popover.Target refProp={refProp}>{withHover}</Popover.Target>;
}

/* -------------------------------------------------------------------------- */
/* Dropdown                                                                   */
/* -------------------------------------------------------------------------- */

const MenuDropdownFrame = styled(Box, {
  name: "MenuDropdown",
  flexDirection: "column",
  paddingVertical: "$xs",
  paddingHorizontal: "$xs",
  minWidth: 180,
  gap: "$xxs",
});

export interface MenuDropdownProps extends GetProps<typeof MenuDropdownFrame> {}

const MenuDropdown = MenuDropdownFrame.styleable<MenuDropdownProps>(
  function MenuDropdown(props, ref) {
    const { children, ...rest } = props;
    const ctx = useMenuContext();
    const hover = ctx.trigger === "hover" || ctx.trigger === "click-hover";

    // Keep the menu open while the pointer is inside the dropdown (hover triggers).
    const hoverHandlers = hover
      ? hoverProps({ onHoverIn: ctx.open, onHoverOut: ctx.closeWithDelay })
      : undefined;

    return (
      // The floating frame contributes no padding of its own (`padding={0}`); the
      // visible padding lives on the inner `MenuDropdownFrame`, which carries the
      // `dropdown` slot — so `styles={{ dropdown: { padding } }}` reaches it and the
      // hardcoded outer `padding={0}` is no longer the only word on the menu's
      // padding (it was previously unreachable from `styles`).
      <Popover.Dropdown padding={0}>
        {/* `dropdown` slot sugar layers UNDER the explicit inline `...rest` props. */}
        <MenuDropdownFrame
          ref={ref}
          {...hoverHandlers}
          {...ctx.slots.dropdown}
          {...rest}
          role="menu"
        >
          {children}
        </MenuDropdownFrame>
      </Popover.Dropdown>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */

const MenuItemFrame = styled(Box, {
  name: "MenuItem",
  role: "menuitem",
  flexDirection: "row",
  alignItems: "center",
  gap: "$sm",
  paddingVertical: "$xs",
  paddingHorizontal: "$sm",
  borderRadius: "$xs",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color4" },
  pressStyle: { backgroundColor: "$color5" },
  ...focusRingStyle,

  variants: {
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
        ...webCursor("default"),
        hoverStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { disabled: false },
});

const MenuItemLabel = styled(Text, {
  name: "MenuItemLabel",
  flex: 1,
  fontSize: "$sm",
  color: "$color12",
  userSelect: "none",
});

const MenuItemSection = styled(Box, {
  name: "MenuItemSection",
  alignItems: "center",
  justifyContent: "center",
});

type MenuItemFrameProps = Omit<GetProps<typeof MenuItemFrame>, "children" | "disabled" | "onPress">;

export interface MenuItemProps extends MenuItemFrameProps {
  /** Item label. */
  children?: React.ReactNode;
  /** Section displayed before the label. */
  leftSection?: React.ReactNode;
  /** Section displayed after the label. */
  rightSection?: React.ReactNode;
  /** Disable the item. */
  disabled?: boolean;
  /** Override the menu's `closeOnItemClick` for this item. */
  closeMenuOnClick?: boolean;
  /** Press handler. */
  onPress?: (event: unknown) => void;
}

const MenuItemComponent = MenuItemFrame.styleable<MenuItemProps>(function MenuItem(props, ref) {
  const ctx = useMenuContext();
  const { children, leftSection, rightSection, disabled, closeMenuOnClick, onPress, ...rest } =
    props;

  const handlePress = React.useCallback(
    (event: unknown) => {
      if (disabled) return;
      onPress?.(event);
      const shouldClose =
        typeof closeMenuOnClick === "boolean" ? closeMenuOnClick : ctx.closeOnItemClick;
      if (shouldClose) {
        // Cancel any pending hover open/close timer first, so a fast item click
        // can't leave a stale timer that fires a second close after this one.
        ctx.clearTimer();
        ctx.close();
      }
    },
    [disabled, onPress, closeMenuOnClick, ctx],
  );

  // Bind the `itemLabel` slot onto the text wrapper so `renderTextChild` (which
  // only passes `children`) carries the sugar onto the auto-wrapped label text.
  const itemLabelSlot = ctx.slots.itemLabel;
  const LabelWrapper = React.useMemo(
    () =>
      function MenuItemLabelSlot(labelProps: { children: React.ReactNode }) {
        return <MenuItemLabel {...itemLabelSlot} {...labelProps} />;
      },
    [itemLabelSlot],
  );

  const sectionSlot = ctx.slots.itemSection;

  return (
    <MenuItemFrame
      ref={ref}
      // `item` slot sugar layers UNDER the explicit inline `...rest` props.
      {...ctx.slots.item}
      {...rest}
      role="menuitem"
      disabled={!!disabled}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : ctx.itemTabIndex}
      onPress={handlePress}
    >
      {/* Menu items are subtle/text-colored: any `@knitui/icons` icon in a section
          auto-sizes to the `$sm` label font and takes the label's `$color12`
          foreground (an explicit `color` here overrides the `subtle` variant fg). */}
      {leftSection ? (
        <MenuItemSection {...sectionSlot}>
          <ControlIconProvider size="sm" variant="subtle" color="$color12">
            {leftSection}
          </ControlIconProvider>
        </MenuItemSection>
      ) : null}
      {renderTextChild(children, LabelWrapper)}
      {rightSection ? (
        <MenuItemSection {...sectionSlot}>
          <ControlIconProvider size="sm" variant="subtle" color="$color12">
            {rightSection}
          </ControlIconProvider>
        </MenuItemSection>
      ) : null}
    </MenuItemFrame>
  );
});

/* -------------------------------------------------------------------------- */
/* Label + Divider                                                            */
/* -------------------------------------------------------------------------- */

const MenuLabel = styled(Text, {
  name: "MenuLabel",
  paddingVertical: "$xs",
  paddingHorizontal: "$sm",
  fontSize: "$xs",
  fontWeight: "600",
  color: "$color11",
  userSelect: "none",
});

export type MenuLabelProps = GetProps<typeof MenuLabel>;

// Wrap the styled frame so the `label` slot sugar (carried on context) reaches it;
// the inline `...rest` props win over the slot ("explicit beats sugar").
const MenuLabelComponent = MenuLabel.styleable<MenuLabelProps>(function MenuLabelSlot(props, ref) {
  const ctx = useMenuContext();
  return <MenuLabel ref={ref} {...ctx.slots.label} {...props} />;
});

const MenuDivider = styled(Box, {
  name: "MenuDivider",
  height: 1,
  marginVertical: "$xs",
  marginHorizontal: "$0",
  backgroundColor: "$borderColor",
});

export type MenuDividerProps = GetProps<typeof MenuDivider>;

// Wrap the styled frame so the `divider` slot sugar (carried on context) reaches it.
const MenuDividerComponent = MenuDivider.styleable<MenuDividerProps>(
  function MenuDividerSlot(props, ref) {
    const ctx = useMenuContext();
    return <MenuDivider ref={ref} {...ctx.slots.divider} {...props} />;
  },
);

/* -------------------------------------------------------------------------- */
/* Compound export                                                            */
/* -------------------------------------------------------------------------- */

export const Menu = withStaticProperties(MenuRoot, {
  Target: MenuTarget,
  Dropdown: MenuDropdown,
  Item: MenuItemComponent,
  Label: MenuLabelComponent,
  Divider: MenuDividerComponent,
});
