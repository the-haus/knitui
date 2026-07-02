import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { fontSizeVariant, gapVariant, type SizeKey } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type ListSize = SizeKey;

/**
 * Shared down to every `List.Item` so item text scales with the list `size` and
 * items vertically center their marker with their label when `center` is set.
 * The list-level `icon` and ordered numbering are folded into each item's `icon`
 * prop by the `List` parent (see below), so they don't travel through context.
 */
const ListContext = createStyledContext<{ size: ListSize; center: boolean }>({
  size: "md",
  center: false,
});

/**
 * Vertical list — mirrors Mantine's `List` + `List.Item`. `type` switches the
 * semantic element (`<ul>`/`<ol>`) and the default marker (bullet vs. number);
 * `size` scales item text, `spacing` is the gap between items, `withPadding`
 * adds nesting indentation, `center` aligns each marker with its label, and
 * `icon` replaces the default marker for every item (overridable per item).
 *
 * Markers are rendered EXPLICITLY (a `•` bullet, a `1.` number, or the `icon`)
 * so they show on web AND native — Tamagui renders the `<ul>`/`<ol>` as a flex
 * container, so the browser's own list markers never double up. Color/theme is
 * inherited; the marker tints from the ramp. No Mantine `color` prop.
 */
const ListFrame = styled(Box, {
  name: "List",
  context: ListContext,
  flexDirection: "column",
  margin: 0,
  padding: 0,

  variants: {
    /** Gap between items. Token (`"$sm"`), CSS value, or number. @default 0 */
    spacing: gapVariant,
    /** Extra inline-start padding for nested lists. @default false */
    withPadding: {
      true: { paddingLeft: "$md" },
    },
  } as const,
});

const ListItemFrame = styled(Box, {
  name: "ListItem",
  context: ListContext,
  flexDirection: "row",
  gap: "$xs",

  variants: {
    /** Vertically center the marker with the label (else align to the top). */
    center: {
      true: { alignItems: "center" },
      false: { alignItems: "flex-start" },
    },
  } as const,
});

/** Leading marker (bullet / number / icon) — tinted from the ramp. */
const ListItemMarker = styled(Text, {
  name: "ListItemMarker",
  context: ListContext,
  userSelect: "none",
  color: "$color",
  variants: {
    size: fontSizeVariant,
  } as const,
});

/** The item's text content. Scales with the list `size`. */
const ListItemLabel = styled(Text, {
  name: "ListItemLabel",
  context: ListContext,
  flexShrink: 1,
  variants: {
    size: fontSizeVariant,
  } as const,
});

/**
 * Named style slots for `List.Item` (Pillar B / `internal/styles.ts`). Each key
 * maps to the props of the styled part it targets, so `styles={{ marker: { … } }}`
 * is sugar for `<List.Item.Marker … />`. The item frame is reached via top-level
 * props, so it has no slot.
 */
export interface ListItemStyles {
  /** Props for the leading marker (`List.Item.Marker`) — only when the marker is text. */
  marker?: GetProps<typeof ListItemMarker>;
  /** Props for the item label text (`List.Item.Label`). */
  label?: GetProps<typeof ListItemLabel>;
}

const LIST_ITEM_SLOT_KEYS = [
  "marker",
  "label",
] as const satisfies readonly (keyof ListItemStyles)[];

export interface ListItemProps extends GetProps<typeof ListItemFrame> {
  /**
   * Marker for this item — replaces the default bullet/number. Strings & numbers
   * render as themed marker text; a node (icon component) renders as-is. When
   * omitted, the parent `List` injects the default marker via this same prop.
   */
  icon?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<ListItemStyles>;
}

const ListItemBase = ListItemFrame.styleable<ListItemProps>(function ListItem(props, ref) {
  const { children, icon, styles, ...rest } = props;

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<ListItemStyles>(styles, LIST_ITEM_SLOT_KEYS, "List.Item");

  // A text/number marker is themed via `ListItemMarker` (and takes the `marker`
  // slot); a node marker (icon component) renders as-is and is the consumer's to
  // style, so the slot doesn't apply to it.
  const marker =
    typeof icon === "string" || typeof icon === "number" ? (
      <ListItemMarker {...s.get("marker")}>{icon}</ListItemMarker>
    ) : (
      icon
    );

  // `renderTextChild` only forwards `children`, so pre-bind the `label` slot
  // props onto `ListItemLabel` via a closure wrapper before handing it off.
  const labelProps = s.get("label");
  const LabelText = ({ children: labelChildren }: { children: React.ReactNode }) => (
    <ListItemLabel {...labelProps}>{labelChildren}</ListItemLabel>
  );

  return (
    <ListItemFrame ref={ref} {...rest} render="li">
      {icon != null ? marker : null}
      {renderTextChild(children, LabelText)}
    </ListItemFrame>
  );
});

const ListItem = withStaticProperties(ListItemBase, {
  Marker: ListItemMarker,
  Label: ListItemLabel,
});

type ListFrameProps = Omit<GetProps<typeof ListFrame>, "center" | "children" | "size" | "type">;

export interface ListProps extends ListFrameProps {
  /** `List.Item` children. */
  children?: React.ReactNode;
  /** Semantic element + default marker style. @default 'unordered' */
  type?: "ordered" | "unordered";
  /** Controls item `font-size` / `line-height`. @default 'md' */
  size?: ListSize;
  /** Marker for every item; overridden by an item's own `icon`. */
  icon?: React.ReactNode;
  /**
   * Custom default marker per item — receives the 1-based item order (after
   * `start`/`reversed` are applied) and returns the marker node. An escape hatch
   * over the built-in bullet/number; an item's own `icon` and the list-level
   * `icon` (when set) still win. Strings/numbers returned render as themed marker
   * text; nodes render as-is.
   */
  renderMarker?: (order: number) => React.ReactNode;
  /** Vertically center each item's marker with its label. @default false */
  center?: boolean;
  /** Starting value for ordered numbering. @default 1 */
  start?: number;
  /** Reverse ordered numbering (counts down). @default false */
  reversed?: boolean;
  /**
   * CSS `list-style-type` — accepted for Mantine parity and forwarded on web.
   * Markers are rendered explicitly, so this is cosmetic on web and a no-op on
   * native; narrowed locally rather than widened to `any`.
   */
  listStyleType?: string;
}

const ListComponent = ListFrame.styleable<ListProps>(function List(props, ref) {
  const {
    children,
    type = "unordered",
    size = "md",
    icon,
    center = false,
    start = 1,
    reversed = false,
    listStyleType,
    renderMarker,
    ...rest
  } = props;

  const ordered = type === "ordered";
  const items = React.Children.toArray(children);
  const total = items.length;

  // Inject each item's default marker via its public `icon` prop (an item's own
  // `icon` wins). Ordered lists get an explicit number so they read on native
  // too; a list-level `icon` replaces the marker entirely, as in Mantine.
  let position = 0;
  const rendered = items.map((child, index) => {
    if (!React.isValidElement<ListItemProps>(child)) {
      return child;
    }
    const i = position++;
    if (child.props.icon != null) {
      return React.cloneElement(child, { key: index });
    }
    const number = reversed ? start + total - 1 - i : start + i;
    const defaultMarker: React.ReactNode =
      icon != null ? icon : renderMarker ? renderMarker(number) : ordered ? `${number}.` : "•";
    return React.cloneElement(child, { key: index, icon: defaultMarker });
  });

  // `listStyleType` is web-only and not in Box's style-prop types; spread a
  // precise object so the excess-property check doesn't fire (no `any`).
  const styleProps: { listStyleType?: string } = listStyleType != null ? { listStyleType } : {};

  return (
    <ListContext.Provider size={size} center={center}>
      <ListFrame ref={ref} {...rest} {...styleProps} render={ordered ? "ol" : "ul"}>
        {rendered}
      </ListFrame>
    </ListContext.Provider>
  );
});

export const List = withStaticProperties(ListComponent, {
  Item: ListItem,
  Frame: ListFrame,
});
