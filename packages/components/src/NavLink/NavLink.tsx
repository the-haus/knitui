import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useKeyboardActions, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import { useReducedTransition } from "../internal/motion";
import { focusRingStyle, webCursor } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type NavLinkVariant = "filled" | "light" | "subtle";

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const NavLinkRoot = styled(Box, {
  name: "NavLink",
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: "$sm",
  paddingVertical: "$xs",
  borderRadius: "$xs",
  gap: "$xs",
  ...webCursor("pointer"),
  userSelect: "none",

  variants: {
    variant: {
      filled: {
        hoverStyle: { backgroundColor: "$color4" },
        pressStyle: { backgroundColor: "$color5" },
      },
      light: {
        hoverStyle: { backgroundColor: "$color3" },
        pressStyle: { backgroundColor: "$color4" },
      },
      subtle: {
        hoverStyle: { backgroundColor: "$color3" },
        pressStyle: { backgroundColor: "$color4" },
      },
    },
    active: {
      true: {},
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { variant: "light" },
  ...focusRingStyle,
});

const NavLinkBody = styled(Box, {
  name: "NavLinkBody",
  flex: 1,
  flexDirection: "column",
  justifyContent: "center",
});

const NavLinkLabel = styled(Text, {
  name: "NavLinkLabel",
  fontSize: "$sm",
  userSelect: "none",
  numberOfLines: 1,
});

const NavLinkDescription = styled(Text, {
  name: "NavLinkDescription",
  fontSize: "$xs",
  color: "$color",
  opacity: 0.65,
  userSelect: "none",
  numberOfLines: 2,
});

const NavLinkSection = styled(Box, {
  name: "NavLinkSection",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

/** The chevron indicator — rotates when the nav link is expanded. */
const NavLinkChevron = styled(Text, {
  name: "NavLinkChevron",
  fontSize: "$xs",
  color: "$color",
  userSelect: "none",
});

const NavLinkChildren = styled(Box, {
  name: "NavLinkChildren",
  flexDirection: "column",
  paddingLeft: "$lg",
});

/* -------------------------------------------------------------------------- */
/* NavLink                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ label: { color: "$red9" } }}` is
 * sugar for `<NavLink.Label color="$red9" />`. The `leftSection`/`rightSection`
 * keys both target the `NavLink.Section` part (the two positional sections share
 * one styled part); `chevron` targets the auto-chevron shown when children exist.
 */
export interface NavLinkStyles {
  /** Props for the outer wrapper that holds the row + nested children. */
  wrapper?: GetProps<typeof Box>;
  /** Props for the interactive row (`.Root`). */
  root?: GetProps<typeof NavLinkRoot>;
  /** Props for the label/description column (`.Body`). */
  body?: GetProps<typeof NavLinkBody>;
  /** Props for the label text (`.Label`). */
  label?: GetProps<typeof NavLinkLabel>;
  /** Props for the description text (`.Description`). */
  description?: GetProps<typeof NavLinkDescription>;
  /** Props for the left section wrapper (`.Section`). */
  leftSection?: GetProps<typeof NavLinkSection>;
  /** Props for the right section wrapper (`.Section`). */
  rightSection?: GetProps<typeof NavLinkSection>;
  /** Props for the auto-chevron (`.Chevron`) shown when children exist. */
  chevron?: GetProps<typeof NavLinkChevron>;
  /** Props for the nested-children container (`.Children`). */
  children?: GetProps<typeof NavLinkChildren>;
}

const NAVLINK_SLOT_KEYS = [
  "wrapper",
  "root",
  "body",
  "label",
  "description",
  "leftSection",
  "rightSection",
  "chevron",
  "children",
] as const satisfies readonly (keyof NavLinkStyles)[];

type NavLinkRootProps = Omit<
  GetProps<typeof NavLinkRoot>,
  | "variant"
  | "active"
  | "children"
  | "disabled"
  | "onChange"
  | "accessibilityLabel"
  | "accessibilityRole"
>;

export interface NavLinkProps extends NavLinkRootProps {
  /** Main link label. */
  label?: React.ReactNode;
  /** Description displayed below the label. */
  description?: React.ReactNode;
  /** Section on the left of the label. */
  leftSection?: React.ReactNode;
  /** Section on the right of the label (defaults to chevron when children exist). */
  rightSection?: React.ReactNode;
  /** Applies active styles. @default false */
  active?: boolean;
  /** Visual style. @default 'light' */
  variant?: NavLinkVariant;
  /** If set, label/description are truncated to a single line. @default false */
  noWrap?: boolean;
  /** Nested `NavLink` children. */
  children?: React.ReactNode;
  /** Controlled open state. */
  opened?: boolean;
  /** Uncontrolled initial open state. @default false */
  defaultOpened?: boolean;
  /** Called when open state changes. */
  onChange?: (opened: boolean) => void;
  /** Disables chevron rotation when expanded. @default false */
  disableRightSectionRotation?: boolean;
  /** Keep nested children mounted when collapsed. @default true */
  keepMounted?: boolean;
  /** Left indentation applied to nested children. @default '$lg' */
  childrenOffset?: GetProps<typeof NavLinkChildren>["paddingLeft"];
  /** Disables the link. @default false */
  disabled?: boolean;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<NavLinkStyles>;
}

const NavLinkComponent = NavLinkRoot.styleable<NavLinkProps>(function NavLink(props, ref) {
  const {
    label,
    description,
    leftSection,
    rightSection,
    active = false,
    variant = "light",
    noWrap = false,
    children,
    opened,
    defaultOpened = false,
    onChange,
    disableRightSectionRotation = false,
    keepMounted = true,
    childrenOffset = "$lg",
    disabled = false,
    onPress,
    styles,
    ...rest
  } = props;

  const s = slotStyles<NavLinkStyles>(styles, NAVLINK_SLOT_KEYS, "NavLink");

  const hasChildren = React.Children.count(children) > 0;
  const rightSectionTransition = useReducedTransition(disableRightSectionRotation ? null : "fast");

  const [isOpen, setOpen] = useUncontrolled<boolean>({
    value: opened,
    defaultValue: defaultOpened,
    finalValue: false,
    onChange,
  });

  const handlePress = React.useCallback(
    // Event is optional: a real press passes the gesture/click event through to
    // the consumer's `onPress`; keyboard activation (below) calls it with none.
    (e?: Parameters<NonNullable<typeof onPress>>[0]) => {
      if (disabled) return;
      if (hasChildren) setOpen(!isOpen);
      onPress?.(e as Parameters<NonNullable<typeof onPress>>[0]);
    },
    [disabled, hasChildren, setOpen, isOpen, onPress],
  );

  // NavLinkRoot is a plain `Box` (`<div role="link">`), which the browser won't
  // tab to — so its `focusRingStyle` outline would never fire. `useKeyboardActions`
  // makes it focusable + activatable on web (tabIndex + Space/Enter → onActivate)
  // and maps to accessibility actions on native; `disabled` drops it from the tab
  // order. See the focus contract in `internal/variant-colors.ts` (`FOCUS_RING`).
  const focusProps = useKeyboardActions({ onActivate: handlePress }, { disabled });

  // Active-variant inline styles
  const activeStyle: object = active
    ? variant === "filled"
      ? { backgroundColor: "$color9" }
      : variant === "light"
        ? { backgroundColor: "$color4" }
        : { backgroundColor: "transparent" }
    : {};

  return (
    <Box {...s.get("wrapper")}>
      <NavLinkRoot
        ref={ref}
        variant={variant}
        active={active}
        disabled={disabled}
        onPress={handlePress}
        // NavLinkRoot is a plain Box, so it owns link semantics by default.
        // Set before `...rest` so consumers can override for pure disclosures.
        role="link"
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-disabled={disabled || undefined}
        {...s.get("root")}
        {...(activeStyle as GetProps<typeof NavLinkRoot>)}
        {...rest}
        {...focusProps}
      >
        {leftSection ? (
          <NavLinkSection {...s.get("leftSection")}>{leftSection}</NavLinkSection>
        ) : null}

        <NavLinkBody {...s.get("body")}>
          {label != null ? (
            <NavLinkLabel
              {...s.merge("label", {
                numberOfLines: noWrap ? 1 : undefined,
                color: active && variant === "filled" ? "$color1" : "$color",
              })}
            >
              {label}
            </NavLinkLabel>
          ) : null}
          {description != null ? (
            <NavLinkDescription
              {...s.merge("description", { numberOfLines: noWrap ? 1 : undefined })}
            >
              {description}
            </NavLinkDescription>
          ) : null}
        </NavLinkBody>

        {hasChildren && rightSection == null ? (
          <NavLinkChevron
            {...s.merge("chevron", {
              rotate: !disableRightSectionRotation && isOpen ? "180deg" : "0deg",
              ...rightSectionTransition,
            })}
          >
            ▼
          </NavLinkChevron>
        ) : rightSection != null ? (
          <NavLinkSection {...s.get("rightSection")}>{rightSection}</NavLinkSection>
        ) : null}
      </NavLinkRoot>

      {hasChildren && (isOpen || keepMounted) ? (
        <NavLinkChildren
          {...s.merge("children", {
            paddingLeft: childrenOffset,
            display: isOpen ? "flex" : "none",
          })}
        >
          {children}
        </NavLinkChildren>
      ) : null}
    </Box>
  );
});

export const NavLink = withStaticProperties(NavLinkComponent, {
  Root: NavLinkRoot,
  Body: NavLinkBody,
  Label: NavLinkLabel,
  Description: NavLinkDescription,
  Section: NavLinkSection,
  Chevron: NavLinkChevron,
  Children: NavLinkChildren,
});
