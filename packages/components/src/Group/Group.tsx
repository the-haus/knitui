import * as React from "react";

import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import { alignVariant, justifyVariant, wrapVariant } from "../internal/style-props";

/**
 * Horizontal flex group — mirrors Mantine's `Group`. `gap`/`align`/`justify`/
 * `wrap` carry Mantine's names. `grow` makes every child share the row equally;
 * `preventGrowOverflow` (default true) caps each child to an equal fraction so a
 * single wide child can't push the others out.
 */
const GroupFrame = styled(Box, {
  name: "Group",
  flexDirection: "row",
  gap: "$md",
  variants: {
    align: alignVariant,
    justify: justifyVariant,
    wrap: wrapVariant,
  } as const,
  defaultVariants: { align: "center", justify: "flex-start", wrap: "wrap" },
});

type GroupFrameProps = Omit<GetProps<typeof GroupFrame>, "grow">;

/**
 * Flex sizing applied to each child under `grow`. Kept to concrete `number`/
 * `string` values (not the wider `BoxProps` prop types, which admit `null` and
 * animated nodes) so it's assignable to all three targets at once: a `BoxProps`
 * prop spread, React Native's `ViewStyle`, and the web's `CSSProperties` — which
 * lets us route it three different ways depending on the child (see
 * `withGrowStyle`).
 */
type GrowStyle = {
  flexGrow: number;
  flexShrink: number;
  flexBasis: number;
  minWidth: number;
  maxWidth?: string;
};

/** A React element rendered by a string tag — i.e. a web DOM host element. */
type HostElementWithStyle = React.ReactElement<{ style?: React.CSSProperties }, string>;

const isHostElement = (
  child: React.ReactElement<{ style?: unknown }>,
): child is HostElementWithStyle => typeof child.type === "string";

/**
 * Tamagui's `styled()` stamps a `staticConfig` onto the component it returns;
 * raw RN host components (`View`/`Text`/`Image`) and web DOM tags don't have
 * one. That's how we tell a Tamagui child apart from a plain host child.
 */
const isTamaguiComponent = (child: React.ReactElement): boolean =>
  child.type != null &&
  (typeof child.type === "object" || typeof child.type === "function") &&
  "staticConfig" in (child.type as object);

/**
 * Clone `child` with the `grow` sizing applied the way that child expects it:
 *
 * - Tamagui components resolve `flexGrow`/`flexBasis`/`maxWidth`/… through their
 *   own variant + atomic-CSS pipeline, so they take the sizing as **props**.
 *   Routing it through `style` instead would bypass that pipeline (and leak
 *   inline styles on web). cloneElement merges props, last write wins, so this
 *   also overrides any width the child set on itself.
 * - Web DOM elements take a plain `style` object (they reject style arrays).
 * - Raw RN host components read layout only from `style`, and accept an array
 *   where later entries win.
 */
function withGrowStyle(
  child: React.ReactElement<{ style?: unknown }>,
  grow: GrowStyle,
  key: React.Key,
): React.ReactElement {
  if (isTamaguiComponent(child)) {
    return React.cloneElement(child, { key, ...grow } as object);
  }

  if (isHostElement(child)) {
    return React.cloneElement(child, { key, style: { ...child.props.style, ...grow } });
  }

  const prev = child.props.style;
  const style = prev == null ? grow : Array.isArray(prev) ? [...prev, grow] : [prev, grow];
  return React.cloneElement(child, { key, style } as object);
}

export interface GroupProps extends GroupFrameProps {
  /** Each child grows to fill the row equally. */
  grow?: boolean;
  /** Cap each grown child to an equal fraction of the row. Default `true`. */
  preventGrowOverflow?: boolean;
}

export const Group = GroupFrame.styleable<GroupProps>(function Group(props, ref) {
  const { children, grow = false, preventGrowOverflow = true, ...rest } = props;

  if (!grow) {
    return (
      <GroupFrame ref={ref} {...rest}>
        {children}
      </GroupFrame>
    );
  }

  const items = React.Children.toArray(children).filter(Boolean);
  const growStyle: GrowStyle = {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    ...(preventGrowOverflow ? { maxWidth: `${100 / Math.max(items.length, 1)}%` } : {}),
  };

  return (
    <GroupFrame ref={ref} {...rest}>
      {items.map((child, i) =>
        React.isValidElement<{ style?: unknown }>(child)
          ? withGrowStyle(child, growStyle, i)
          : child,
      )}
    </GroupFrame>
  );
});
