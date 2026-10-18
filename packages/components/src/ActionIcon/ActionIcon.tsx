import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { controlIconSize } from "../internal/control-icon-size";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { gradientForVariant, type GradientValue, useGradient } from "../internal/gradient";
import { usePressScale } from "../internal/motion";
import {
  controlColorVariant,
  controlTextColorVariant,
  focusRingStyle,
  fontSizeVariant,
  pickVariants,
  pressScaleStyle,
  radiusVariant,
  type SizeKey,
  squareSizeRoundedVariant,
  webButtonOrLink,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Loader, type LoaderProps } from "../Loader";
import { Text } from "../Text";

type ActionIconSize = SizeKey;
type ActionIconVariant =
  "filled" | "light" | "outline" | "subtle" | "transparent" | "white" | "default" | "gradient";

const ActionIconContext = createStyledContext<{
  size: ActionIconSize;
  variant: ActionIconVariant;
}>({
  size: "md",
  variant: "filled",
});

/**
 * Square icon-only button — mirrors Mantine's `ActionIcon`. Closest sibling to
 * `Button`: same theme-driven palette ramp (`color1`…`color12`), same hover /
 * press clauses. `variant` chooses how the ramp applies, `size` sets the (square)
 * metrics, `radius` the rounding. Accent comes from the `theme` prop, never a
 * `color` prop. `loading` swaps the icon for a `Loader` and blocks interaction.
 */
const ActionIconFrame = styled(Box, {
  displayName: "ActionIcon",
  context: ActionIconContext,
  role: "button",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "transparent",
  ...webCursor("pointer"),
  // Tactile press-dip — composes with the per-variant `press:` colour below and
  // eases via the `usePressScale()` props applied on render (reduced-motion aware).
  ...pressScaleStyle,
  // Keyboard-focus ring (web) — variant-independent, so it lives on the base and
  // every variant shows the same focus-visible outline (same as Button).
  ...focusRingStyle,

  variants: {
    // Frame fill + hover/press clauses from the shared `variant-colors` ladder (same as
    // Button). `transparent` is overridden to ActionIcon's quieter behavior — a
    // fully transparent hover and no press — preserving its existing look.
    variant: {
      ...controlColorVariant,
      transparent: {
        backgroundColor: "transparent hover:transparent",
      },
    },
    size: squareSizeRoundedVariant,
    radius: radiusVariant,
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { variant: "filled", size: "md" },
});

const ActionIconText = styled(Text, {
  displayName: "ActionIconText",
  context: ActionIconContext,
  userSelect: "none",
  lineHeight: 0,
  variants: {
    // Glyph color per variant — the shared emphasis ladder, restricted to ActionIcon's set.
    variant: {
      ...pickVariants(controlTextColorVariant, [
        "filled",
        "light",
        "outline",
        "subtle",
        "transparent",
        "white",
        "default",
        "gradient",
      ]),
    },
    size: {
      ...fontSizeVariant,
    },
  } as const,
});

/**
 * `ActionIcon.Group` — visually attached row/column of action icons. Children
 * sit flush (`gap: 0`); `orientation` switches the main axis. `borderWidth`
 * controls the shared border between items (mirrors Mantine's `--ai-border-width`).
 */
const ActionIconGroupFrame = styled(Box, {
  displayName: "ActionIconGroup",
  role: "group",
  flexDirection: "row",
  alignSelf: "flex-start",
  gap: 0,
  variants: {
    orientation: {
      horizontal: { flexDirection: "row" },
      vertical: { flexDirection: "column" },
    },
  } as const,
  defaultVariants: { orientation: "horizontal" },
});

/**
 * Inner-edge radius stripping per child position, as module constants. Only the
 * corners that change are SET: v3 treats an explicit `undefined` style prop as
 * "clear the variant value" (conventions §5), so outer corners are absent and
 * keep the child's own radius. The overlap margin depends on `borderWidth`, so
 * it is added separately (and pre-baked for the default `1`).
 */
const EDGE_RADIUS = {
  horizontal: {
    only: {},
    first: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
    middle: {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    last: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  },
  vertical: {
    only: {},
    first: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    middle: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    last: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  },
} as const;

type GroupOrientation = keyof typeof EDGE_RADIUS;
type EdgePosition = keyof (typeof EDGE_RADIUS)["horizontal"];

const edgePosition = (index: number, lastIndex: number): EdgePosition =>
  lastIndex === 0 ? "only" : index === 0 ? "first" : index === lastIndex ? "last" : "middle";

const overlapProp = (orientation: GroupOrientation) =>
  orientation === "horizontal" ? "marginLeft" : "marginTop";

/** The default-`borderWidth` (1) edges, fully pre-built. */
const EDGE_DEFAULT = {
  horizontal: {
    only: EDGE_RADIUS.horizontal.only,
    first: EDGE_RADIUS.horizontal.first,
    middle: { ...EDGE_RADIUS.horizontal.middle, marginLeft: -1 },
    last: { ...EDGE_RADIUS.horizontal.last, marginLeft: -1 },
  },
  vertical: {
    only: EDGE_RADIUS.vertical.only,
    first: EDGE_RADIUS.vertical.first,
    middle: { ...EDGE_RADIUS.vertical.middle, marginTop: -1 },
    last: { ...EDGE_RADIUS.vertical.last, marginTop: -1 },
  },
} as const;

const edgeStyle = (orientation: GroupOrientation, position: EdgePosition, borderWidth: number) => {
  if (borderWidth === 1) return EDGE_DEFAULT[orientation][position];
  const overlap =
    position === "middle" || position === "last"
      ? { [overlapProp(orientation)]: -borderWidth }
      : null;
  return { ...EDGE_RADIUS[orientation][position], ...overlap, borderWidth };
};

export interface ActionIconGroupProps extends Omit<
  GetProps<typeof ActionIconGroupFrame>,
  "orientation"
> {
  /** Main axis. A single key: it also picks the edge-stripping. */
  orientation?: GroupOrientation;
  /** Width of the dividing borders between icons. Default `1`. */
  borderWidth?: number;
}

const ActionIconGroup = styleable<ActionIconGroupProps>(
  ActionIconGroupFrame,
  function ActionIconGroup(props, ref) {
    const { children, orientation = "horizontal", borderWidth = 1, ...rest } = props;
    const items = React.Children.toArray(children).filter(Boolean);
    const lastIndex = items.length - 1;

    return (
      <ActionIconGroupFrame ref={ref} orientation={orientation} {...rest}>
        {items.map((child, i) => {
          if (!React.isValidElement(child)) return child;
          const edge = edgeStyle(orientation, edgePosition(i, lastIndex), borderWidth);
          return React.cloneElement(child, { key: i, ...edge });
        })}
      </ActionIconGroupFrame>
    );
  },
);

/**
 * `ActionIcon.GroupSection` — a non-interactive segment within an
 * `ActionIcon.Group`. Useful for decorative labels or separators between icons.
 * Gets the same edge-stripping as action icons from the group's child iteration.
 */
const ActionIconGroupSection = styled(Box, {
  displayName: "ActionIconGroupSection",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "borderColor",
  backgroundColor: "background",
  variants: {
    size: {
      xxs: { width: "xxs", height: "xxs", borderRadius: "xs" },
      xs: { width: "xs", height: "xs", borderRadius: "xs" },
      sm: { width: "sm", height: "sm", borderRadius: "sm" },
      md: { width: "md", height: "md", borderRadius: "sm" },
      lg: { width: "lg", height: "lg", borderRadius: "md" },
      xl: { width: "xl", height: "xl", borderRadius: "md" },
      xxl: { width: "xxl", height: "xxl", borderRadius: "lg" },
    },
  } as const,
  defaultVariants: { size: "md" },
});

export type ActionIconGroupSectionProps = GetProps<typeof ActionIconGroupSection>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the
 * props of the styled part it targets. Canonical vocabulary: `icon` (the glyph
 * `Text` wrapper around string children) / `loader` (the `loading` spinner).
 */
export interface ActionIconStyles {
  /** Props for the glyph text wrapper around string children (`.Text`). */
  icon?: GetProps<typeof ActionIconText>;
  /** Props for the `Loader` rendered while `loading` (`.Loader`). */
  loader?: Partial<LoaderProps>;
}

const ACTION_ICON_SLOT_KEYS = [
  "icon",
  "loader",
] as const satisfies readonly (keyof ActionIconStyles)[];

/**
 * `size` / `variant` are narrowed to single values (no v3 clause programs): the
 * render reads them as DATA (loader size, `ControlIconProvider`).
 */
export interface ActionIconProps extends Omit<
  GetProps<typeof ActionIconFrame>,
  "size" | "variant" | "disabled"
> {
  /** Size key, or a raw square edge (px number / CSS length). */
  size?: ActionIconSize | number | (string & {});
  variant?: ActionIconVariant;
  disabled?: boolean;
  /**
   * Destination — renders a real `<a href>` (`role="link"`) on web; ignored on
   * native and while disabled/loading. See `Button`'s `href`.
   */
  href?: string;
  /** If set, a `Loader` is shown instead of the icon and interaction is blocked. */
  loading?: boolean;
  /**
   * @deprecated Use `styles={{ loader: … }}` instead. Kept as a backward-compatible
   * alias; when both are set the explicit `loaderProps` wins (explicit beats sugar).
   */
  loaderProps?: Partial<LoaderProps>;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<ActionIconStyles>;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `colorN` ramp names or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

const ActionIconComponent = styleable<ActionIconProps>(
  ActionIconFrame,
  function ActionIcon(props, ref) {
    const {
      children,
      loading,
      disabled,
      loaderProps,
      styles,
      gradient,
      href,
      variant = "filled",
      size = "md",
      ...rest
    } = props;
    const isDisabled = !!(disabled || loading);
    // Gradient fill (only when `variant="gradient"`): web paints a CSS
    // `backgroundImage`; native renders the `layer` (an SVG fill) behind content.
    const grad = useGradient(gradientForVariant(variant, gradient));
    // Reduced-motion-aware press easing (neutralises the base dip when reduced).
    const press = usePressScale();

    // Per-slot style sugar, distributed onto the parts below. `loaderProps` is a
    // deprecated alias that wins over the `loader` slot (explicit beats sugar).
    const s = slotStyles<ActionIconStyles>(styles, ACTION_ICON_SLOT_KEYS, "ActionIcon");

    return (
      <ActionIconFrame
        ref={ref}
        variant={variant}
        size={size}
        disabled={isDisabled}
        {...press}
        {...grad.frameProps}
        {...rest}
        aria-disabled={isDisabled || undefined}
        // Real focusable `<button>` on web so the `:focus-visible` outline fires —
        // or a real `<a href>` when the control navigates (`href`).
        {...webButtonOrLink(isDisabled ? undefined : href)}
      >
        {grad.layer}
        {loading ? (
          <Loader
            size={controlIconSize(size)}
            type="oval"
            theme="gray"
            {...s.merge("loader", loaderProps)}
          />
        ) : typeof children === "string" ? (
          <ActionIconText {...s.get("icon")}>{children}</ActionIconText>
        ) : (
          // Node children ARE the icon — publish icon context so a bare
          // `@knitui/icons` icon auto-sizes/colors to the action icon.
          <ControlIconProvider size={size} variant={variant}>
            {children}
          </ControlIconProvider>
        )}
      </ActionIconFrame>
    );
  },
);

export const ActionIcon = withStaticProperties(ActionIconComponent, {
  // The `icon` slot targets `.Text`; the `loader` slot targets `Loader`.
  Text: ActionIconText,
  Loader,
  Frame: ActionIconFrame,
  Group: ActionIconGroup,
  GroupSection: ActionIconGroupSection,
});

export type { ActionIconSize, ActionIconVariant };
