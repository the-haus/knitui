import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  getTokenValue,
  type SpaceTokens,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import {
  fontSizePassthroughVariant,
  fontSizeVariant,
  radiusVariant,
  type SizeKey,
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

const DEFAULT_DEPTH_OFFSET: SpaceTokens = "$lg";
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
  const tokenValue = getTokenValue(value as Parameters<typeof getTokenValue>[0], "space");
  return typeof tokenValue === "number" ? tokenValue : 0;
};

const inlinePaddingToken = (size: TableOfContentsSize): SpaceTokens => {
  switch (size) {
    case "xxs":
      return "$xs";
    case "xs":
      return "$sm";
    case "sm":
      return "$md";
    case "md":
      return "$lg";
    case "lg":
    case "xl":
      return "$xl";
    case "xxl":
      return "$xxl";
  }
};

const resolveInlinePadding = (size: TableOfContentsSize | number): number =>
  typeof size === "number" ? Math.round(size * 0.7) : resolveSpace(inlinePaddingToken(size));

const TableOfContentsFrame = styled(Box, {
  name: "TableOfContents",
  role: "navigation",
  flexDirection: "column",
  gap: "$xxs",
});

/* -------------------------------------------------------------------------- */
/* Styled control frame + text                                                */
/* -------------------------------------------------------------------------- */

const TocControlFrame = styled(UnstyledButtonFrame, {
  name: "TableOfContentsControl",
  context: TableOfContentsContext,
  flexDirection: "row",
  alignItems: "center",
  width: "100%",
  hoverStyle: { backgroundColor: "$color3" },
  pressStyle: { backgroundColor: "$color4" },

  variants: {
    size: {
      xxs: { paddingVertical: "$xxs", paddingRight: "$xs" },
      xs: { paddingVertical: "$xxs", paddingRight: "$sm" },
      sm: { paddingVertical: "$xs", paddingRight: "$md" },
      md: { paddingVertical: "$xs", paddingRight: "$lg" },
      lg: { paddingVertical: "$sm", paddingRight: "$xl" },
      xl: { paddingVertical: "$md", paddingRight: "$xl" },
      xxl: { paddingVertical: "$lg", paddingRight: "$xxl" },
      ":number": (value: number) => ({
        paddingVertical: Math.round(value * 0.45),
        paddingRight: Math.round(value * 0.7),
      }),
    },
    radius: radiusVariant,
    // Active-item fill, keyed off the shared `variant` so the data sugar and a
    // hand-composed `<TableOfContents.Control active variant>` resolve identically.
    active: {
      true: {},
      false: { backgroundColor: "transparent" },
    },
  } as const,

  defaultVariants: { radius: "$sm", size: "md", active: false },
});

type TocControlFrameProps = GetProps<typeof TocControlFrame>;

const TocText = styled(Text, {
  name: "TableOfContentsText",
  context: TableOfContentsContext,
  color: "$color11",

  variants: {
    size: {
      ...fontSizeVariant,
      ...fontSizePassthroughVariant,
      ":number": (value: number) => ({
        fontSize: value,
        lineHeight: Math.round(value * 1.4),
      }),
    },
    active: {
      true: { fontWeight: "600" },
      false: { fontWeight: "400" },
    },
  } as const,

  defaultVariants: { size: "md", active: false },
});

/* -------------------------------------------------------------------------- */
/* Control part                                                               */
/* -------------------------------------------------------------------------- */

/** Resolve the active-item fill for the control frame from `variant`/`active`. */
const activeFrameStyle = (
  variant: TableOfContentsVariant,
  active: boolean,
): Pick<TocControlFrameProps, "backgroundColor"> => {
  if (!active || variant === "none") return { backgroundColor: "transparent" };
  return { backgroundColor: variant === "filled" ? "$color9" : "$color4" };
};

/** Resolve the active-item text color from `variant`/`active`. */
const controlTextColor = (
  variant: TableOfContentsVariant,
  active: boolean,
): GetProps<typeof TocText>["color"] => {
  if (!active) return "$color11";
  if (variant === "filled") return "$color1";
  return "$color11";
};

export interface TocControlProps extends Omit<TocControlFrameProps, "active"> {
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
const TocControl = TocControlFrame.styleable<TocControlProps>(
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
          color={controlTextColor(variant, active)}
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
        aria-current={active ? "true" : undefined}
        {...activeFrameStyle(variant, active)}
        {...rest}
        render="button"
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
 * of the styled part it targets, so `styles={{ control: { borderColor: "$red9" } }}`
 * is sugar for `<TableOfContents.Control borderColor="$red9" />` on every heading.
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

  /** Left padding added per depth level, as a space token or px number @default "$lg" */
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

const TableOfContentsBase = TableOfContentsFrame.styleable<TableOfContentsProps>(
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
        <TableOfContentsFrame ref={ref} {...s.get("root")} {...rest} render="nav">
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
