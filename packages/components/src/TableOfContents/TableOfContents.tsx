import * as React from "react";

import {
  createStyledContext,
  getLineHeight,
  type GetProps,
  resolveToken,
  type SpaceTokens,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import {
  type CssString,
  fontSizeOf,
  fontSizeVariant,
  radiusVariant,
  type SizeKey,
  tableVariant,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";
import { UnstyledButtonFrame } from "../UnstyledButton";

export type TableOfContentsVariant = "filled" | "light" | "none";
export type TableOfContentsSize = SizeKey;

/** A single heading entry. Mantine derives these from the DOM via scroll-spy;
 *  cross-platform we take them as data. */
export interface TableOfContentsItem {
  /** Heading text */
  value: string;
  /** Heading depth, 1–6 */
  depth: number;
  /** Optional stable key */
  id?: string;
}

type TableOfContentsDepthOffset = SpaceTokens | number;

const DEFAULT_DEPTH_OFFSET: SpaceTokens = "lg";
/** `type="button"`: not a styled() option, so it rides the JSX (never submits a form). */
const CONTROL_HOST_PROPS: { type: string } = { type: "button" };

/**
 * Shares `size` + active-item `variant` to the control frame/text via Tamagui's
 * styled context, so `<TableOfContents.Control>` and `<TableOfContents.Text>`
 * pick up the same metrics/active-styling whether the data sugar or a consumer
 * composes them.
 */
const TableOfContentsContext = createStyledContext<{
  size: TableOfContentsSize | number;
  variant: TableOfContentsVariant;
}>({
  size: "md",
  variant: "light",
});

const resolveSpace = (value: TableOfContentsDepthOffset): number => {
  if (typeof value === "number") return value;
  const tokenValue = resolveToken(value, "space");
  return typeof tokenValue === "number" ? tokenValue : 0;
};

const inlinePaddingToken = (size: TableOfContentsSize): SpaceTokens => {
  switch (size) {
    case "xxs":
      return "xs";
    case "xs":
      return "sm";
    case "sm":
      return "md";
    case "md":
      return "lg";
    case "lg":
    case "xl":
      return "xl";
    case "xxl":
      return "xxl";
  }
};

const resolveInlinePadding = (size: TableOfContentsSize | number): number =>
  typeof size === "number" ? Math.round(size * 0.7) : resolveSpace(inlinePaddingToken(size));

const TableOfContentsFrame = styled(Box, {
  displayName: "TableOfContents",
  role: "navigation",
  render: "nav",
  flexDirection: "column",
  gap: "xxs",
});

/** Control padding per size key; a raw number scales the padding off it. */
const tocControlSizeVariant = tableVariant(
  {
    xxs: { paddingVertical: "xxs", paddingRight: "xs" },
    xs: { paddingVertical: "xxs", paddingRight: "sm" },
    sm: { paddingVertical: "xs", paddingRight: "md" },
    md: { paddingVertical: "xs", paddingRight: "lg" },
    lg: { paddingVertical: "sm", paddingRight: "xl" },
    xl: { paddingVertical: "md", paddingRight: "xl" },
    xxl: { paddingVertical: "lg", paddingRight: "xxl" },
  },
  (value: number) => ({
    paddingVertical: Math.round(value * 0.45),
    paddingRight: Math.round(value * 0.7),
  }),
);

/* -------------------------------------------------------------------------- */
/* Styled control frame + text                                                */
/* -------------------------------------------------------------------------- */

const TocControlFrame = styled(UnstyledButtonFrame, {
  displayName: "TableOfContentsControl",
  context: TableOfContentsContext,
  flexDirection: "row",
  alignItems: "center",
  width: "100%",
  render: "button",
  // The resting `transparent` must be restated: a derived base REPLACES the
  // parent's whole `backgroundColor` program, so clauses alone left the `<button>`
  // with the UA's grey `buttonface` fill (light AND dark).
  backgroundColor: "transparent hover:color3 press:color4",

  variants: {
    size: tocControlSizeVariant,
    radius: radiusVariant,
    active: {
      true: {},
    },
    // The active-item fill, one static body per `variant` (the control passes
    // `activeFill={active ? variant : undefined}`), so the data sugar and a
    // hand-composed `<TableOfContents.Control active variant>` resolve
    // identically. `none` keeps the resting transparent fill.
    activeFill: {
      filled: { backgroundColor: "color9 hover:color10 press:color8" },
      light: { backgroundColor: "color4 hover:color5 press:color6" },
      none: {},
    },
  } as const,

  defaultVariants: { radius: "sm", size: "md", active: false },
});

type TocControlFrameProps = GetProps<typeof TocControlFrame>;

// A numeric size skips the font tokens, so pair it through the same ladder the
// tokens use (rather than a local ratio) or a custom size gets leading that
// doesn't match the equivalent token step. A CSS string passes through.
const tocTextSizeVariant = tableVariant(fontSizeVariant, (value: number | CssString) =>
  typeof value === "number"
    ? // v3: a numeric lineHeight is a ratio of the font size; an absolute
      // leading must be a px string.
      { fontSize: value, lineHeight: `${getLineHeight(value)}px` }
    : fontSizeOf(value),
);

const TocText = styled(Text, {
  displayName: "TableOfContentsText",
  context: TableOfContentsContext,
  color: "color11",

  variants: {
    size: tocTextSizeVariant,
    active: {
      true: { fontWeight: "600" },
      false: { fontWeight: "400" },
    },
    // Label text on the filled accent background.
    onAccent: {
      true: { color: "color1" },
    },
  } as const,

  defaultVariants: { size: "md", active: false },
});

/* -------------------------------------------------------------------------- */
/* Control part                                                               */
/* -------------------------------------------------------------------------- */

export interface TocControlProps extends Omit<TocControlFrameProps, "active" | "activeFill"> {
  /** Render the control in its active (current-heading) styling. */
  active?: boolean;
  /** Active-item styling. Falls back to the `variant` shared via context. */
  variant?: TableOfContentsVariant;
  /**
   * Props for the wrapped `TableOfContents.Text` when `children` is a string/number.
   * Carries the `text` slot down to the rendered label; no-op when `children` is
   * already an element (the consumer owns its own text part then).
   */
  textProps?: GetProps<typeof TocText>;
  children?: React.ReactNode;
}

/**
 * The exposed `TableOfContents.Control` part. Owns the string→`TableOfContents.Text`
 * wrapping (with active styling) so the `data` sugar and hand-composition converge
 * on this single part — the data path renders THROUGH `<TableOfContents.Control>`
 * rather than re-implementing its internals inline (Pillar D, the Pagination shape).
 */
const TocControl = styleable<TocControlProps>(
  TocControlFrame,
  function TableOfContentsControl(props, ref) {
    const ctx = TableOfContentsContext.useStyledContext();
    const {
      active = false,
      variant = ctx.variant,
      size = ctx.size,
      textProps,
      children,
      ...rest
    } = props;
    const content =
      typeof children === "string" || typeof children === "number" ? (
        <TocText
          size={size}
          active={active}
          onAccent={active && variant === "filled"}
          {...textProps}
        >
          {children}
        </TocText>
      ) : (
        children
      );

    return (
      <TocControlFrame
        ref={ref}
        size={size}
        active={active}
        activeFill={active ? variant : undefined}
        aria-current={active ? "true" : undefined}
        {...rest}
        {...CONTROL_HOST_PROPS}
      >
        {content}
      </TocControlFrame>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Slots                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ control: { borderColor: "red9" } }}`
 * is sugar for `<TableOfContents.Control borderColor="red9" />` on every heading.
 * `root` = the nav frame; `control` = each heading control; `text` = each heading
 * label. The dynamic `getControlProps` override layers OVER the `control` slot (the
 * "explicit beats sugar" rule).
 */
export interface TableOfContentsStyles {
  /** Props for the navigation frame (`.Frame`). */
  root?: GetProps<typeof TableOfContentsFrame>;
  /** Props for each heading control (`.Control`). */
  control?: Partial<TocControlProps>;
  /** Props for each heading label (`.Text`). */
  text?: GetProps<typeof TocText>;
}

const TABLE_OF_CONTENTS_SLOT_KEYS = [
  "root",
  "control",
  "text",
] as const satisfies readonly (keyof TableOfContentsStyles)[];

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export interface TableOfContentsProps extends Omit<
  GetProps<typeof TableOfContentsFrame>,
  "onChange" | "size"
> {
  /** Heading data to render */
  data?: TableOfContentsItem[];

  /** Alias for `data`, accepted for Mantine parity */
  initialData?: TableOfContentsItem[];

  /** Controlled index of the active heading */
  active?: number;

  /** Uncontrolled initial active index @default -1 */
  defaultActive?: number;

  /** Called with the index of the heading whose control was activated */
  onChange?: (index: number) => void;

  /** Active-item styling @default "light" */
  variant?: TableOfContentsVariant;

  /** Controls font-size and padding of all controls @default "md" */
  size?: TableOfContentsSize | number;

  /** Border radius of each control */
  radius?: TocControlFrameProps["radius"];

  /** Left padding added per depth level, as a space token or px number @default "lg" */
  depthOffset?: TableOfContentsDepthOffset;

  /** Minimum depth that starts receiving the offset @default 1 */
  minDepthToOffset?: number;

  /**
   * Per-control prop overrides, computed per heading from its active state + data.
   * The dynamic escape hatch over the `control` slot: it merges OVER `styles.control`
   * (the "explicit beats sugar" rule), so per-item props always win.
   */
  getControlProps?: (payload: {
    active: boolean;
    data: TableOfContentsItem;
  }) => Partial<TocControlProps>;

  /** Per-slot style sugar — props spread onto the matching parts. */
  styles?: SlotStyles<TableOfContentsStyles>;

  /** No-op cross-platform: the palette ramp already contrasts (parity only) */
  autoContrast?: boolean;
}

const TableOfContentsBase = styleable<TableOfContentsProps>(
  TableOfContentsFrame,
  function TableOfContents(props, ref) {
    const {
      data,
      initialData,
      active,
      defaultActive,
      onChange,
      variant = "light",
      size = "md",
      radius,
      depthOffset = DEFAULT_DEPTH_OFFSET,
      minDepthToOffset = 1,
      getControlProps,
      styles,
      autoContrast,
      ...rest
    } = props;

    void autoContrast;

    // Per-slot style sugar, distributed onto the parts below.
    const s = slotStyles<TableOfContentsStyles>(
      styles,
      TABLE_OF_CONTENTS_SLOT_KEYS,
      "TableOfContents",
    );

    const [activeIndex, setActiveIndex] = useUncontrolled<number>({
      value: active,
      defaultValue: defaultActive,
      finalValue: -1,
      onChange,
    });

    const items = data ?? initialData ?? [];
    const basePaddingLeft = resolveInlinePadding(size);
    const depthOffsetValue = resolveSpace(depthOffset);

    return (
      <TableOfContentsContext.Provider size={size} variant={variant}>
        <TableOfContentsFrame ref={ref} {...s.get("root")} {...rest}>
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const paddingLeft =
              basePaddingLeft + depthOffsetValue * Math.max(0, item.depth - minDepthToOffset);

            // The data path composes the exposed `TableOfContents.Control` part:
            // it owns the string→`TableOfContents.Text` wrapping + active styling,
            // so hand-composition and the `data` API render through the same part.
            // Precedence (low → high): `styles.control` < dynamic `getControlProps`.
            // `children` from either source overrides `item.value` (kept as the
            // text-wrapped content so the Control still themes it).
            const {
              children: controlChildren,
              textProps: controlTextProps,
              ...controlProps
            } = s.merge("control", getControlProps?.({ active: isActive, data: item }));
            // The `text` slot rides down to the wrapped label via `textProps`, with any
            // `control`-slot/`getControlProps` `textProps` layered OVER it (explicit beats sugar).
            const textProps = { ...s.get("text"), ...controlTextProps };
            return (
              <TocControl
                key={item.id ?? `${index}-${item.value}`}
                size={size}
                variant={variant}
                radius={radius}
                active={isActive}
                paddingLeft={paddingLeft}
                onPress={() => setActiveIndex(index)}
                textProps={textProps}
                {...controlProps}
              >
                {controlChildren ?? item.value}
              </TocControl>
            );
          })}
        </TableOfContentsFrame>
      </TableOfContentsContext.Provider>
    );
  },
);

export const TableOfContents = withStaticProperties(TableOfContentsBase, {
  Control: TocControl,
  Text: TocText,
  Frame: TableOfContentsFrame,
});
