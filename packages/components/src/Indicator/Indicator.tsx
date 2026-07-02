import * as React from "react";

import {
  DURATIONS,
  type GetProps,
  getTokenValue,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { useMotionPreset } from "../internal/motion";
import { radiusVariant, type SizeKey, squareSizeVariantFallthrough } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { asLoopHost, useLoopingAnimation } from "../internal/use-looping-animation";
import { Text } from "../Text";

export type IndicatorSize = SizeKey;
type IndicatorOffsetToken = "0" | IndicatorSize;
type IndicatorOffset = number | IndicatorOffsetToken | `$${IndicatorOffsetToken}`;
type IndicatorOffsetObject = { x: IndicatorOffset; y: IndicatorOffset };
type TokenValueInput = Parameters<typeof getTokenValue>[0];

const DEFAULT_SIZE: IndicatorSize = "xxs";
const SIZE_KEYS = new Set<IndicatorSize>(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"]);

/**
 * How many pixels the dot pokes past the anchored edge. The dot sits at the
 * corner where it's defined (flush with the target) and only sticks out by this
 * small fixed amount — not centered on the anchor line, not pushed outside.
 */
const OVERLAP_PX = 2;

/** Corner / edge the indicator is anchored to, relative to its target. */
export type IndicatorPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "middle-start"
  | "middle-center"
  | "middle-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";

/**
 * Overlays a small dot or label badge on a corner/edge of its children —
 * mirrors Mantine's `Indicator`. Accent comes from the `theme` prop + palette
 * ramp (`$color9` fill, `$color1` contrast text), never a Mantine `color` prop.
 * `position`/`offset`/`size`/`radius`/`withBorder`/`disabled`/`inline`/`label`/
 * `processing` mirror Mantine's surface. On anchored edges the dot sits at the
 * corner where it's defined and pokes out a few pixels past it (not centered on
 * the corner); positioning uses edge/percentage insets + pixel nudges so it
 * works on web AND native (no web-only `%` transforms).
 */
const IndicatorContainer = styled(Box, {
  name: "Indicator",
  position: "relative",
  // Hug the wrapped content so the dot anchors to the child's box, not the row.
  alignSelf: "flex-start",

  variants: {
    /** Web inline-block-ish flow vs. block. Both hug content cross-platform. */
    inline: {
      true: { display: "inline-flex" },
      false: { display: "flex" },
    },
  } as const,

  defaultVariants: { inline: false },
});

const IndicatorDot = styled(Box, {
  name: "IndicatorDot",
  position: "absolute",
  zIndex: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "$color9",
  borderRadius: 999,
  borderWidth: 0,
  borderColor: "$background",
  variants: {
    radius: radiusVariant,
    /** Pad into a pill once there's a label to show. */
    withLabel: {
      true: { width: "auto", paddingHorizontal: "$xxs" },
    },
    /** Ring in the page background so the dot reads against the target. */
    withBorder: {
      true: { borderWidth: 2 },
    },
    /** Hidden, but children still render. */
    disabled: {
      true: { display: "none" },
    },
    size: {
      ...squareSizeVariantFallthrough,
    },
  } as const,

  defaultVariants: { size: DEFAULT_SIZE },
});

/**
 * The positioned wrapper that anchors the dot to its corner AND carries the
 * processing pulse. The loop's opacity animation must ride on its OWN node, kept
 * apart from the dot's Tamagui `entrance` driver — driving both reanimated systems
 * on a single node clashes (`Invalid value passed to shareableViewDescriptors`).
 * `asLoopHost` makes this a reanimated host on native (identity on web); the opacity
 * composes down onto the dot, so the whole badge throbs. It stays a Tamagui `Box`
 * (not the raw `LoopView`) so the `$token` inset/offset values still resolve.
 */
const IndicatorAnchor = asLoopHost(Box);

const IndicatorLabel = styled(Text, {
  name: "IndicatorLabel",
  color: "$color1",
  fontSize: "$xxs",
  fontWeight: "700",
  lineHeight: "$xxs",
  numberOfLines: 1,
  userSelect: "none",
});

/** Insets + centering nudges the dot is positioned with. */
type DotInset = Pick<
  BoxProps,
  "top" | "bottom" | "left" | "right" | "marginTop" | "marginBottom" | "marginLeft" | "marginRight"
>;

/**
 * Resolve a `position` + `offset` to concrete insets. On each anchored edge the
 * dot sits flush at the corner where it's defined (its edge on the anchor line,
 * via the `offset` inset) and pokes out past it by a small fixed
 * {@link OVERLAP_PX} nudge — exactly like a tiny outward offset. Centered axes
 * use a `50%` inset with a half-size nudge so the dot stays centered on that
 * axis (which needs the size resolved to pixels; it falls back to `0`).
 */
function resolveInset(
  position: IndicatorPosition,
  size: IndicatorSize | number | (string & {}),
  offsetX: IndicatorOffset,
  offsetY: IndicatorOffset,
): DotInset {
  const numericSize = resolveNumericSize(size);
  const half = numericSize == null ? 0 : -numericSize / 2;
  const [vertical, horizontal] = position.split("-");
  const inset: DotInset = {};

  if (vertical === "top") {
    inset.top = resolveOffset(offsetY);
    inset.marginTop = -OVERLAP_PX;
  } else if (vertical === "bottom") {
    inset.bottom = resolveOffset(offsetY);
    inset.marginBottom = -OVERLAP_PX;
  } else {
    inset.top = "50%";
    inset.marginTop = half;
  }

  if (horizontal === "start") {
    inset.left = resolveOffset(offsetX);
    inset.marginLeft = -OVERLAP_PX;
  } else if (horizontal === "end") {
    inset.right = resolveOffset(offsetX);
    inset.marginRight = -OVERLAP_PX;
  } else {
    inset.left = "50%";
    inset.marginLeft = half;
  }

  return inset;
}

function resolveNumericSize(size: IndicatorSize | number | (string & {})): number | null {
  if (typeof size === "number") return size;
  if (!SIZE_KEYS.has(size as IndicatorSize)) return null;
  const value = getTokenValue(`$${size}` as TokenValueInput, "size");
  return typeof value === "number" ? value : null;
}

function resolveOffset(offset: IndicatorOffset): BoxProps["top"] {
  if (typeof offset === "number") return offset;
  if (offset.startsWith("$")) return offset as BoxProps["top"];
  return `$${offset}` as BoxProps["top"];
}

function isOffsetObject(offset: IndicatorProps["offset"]): offset is IndicatorOffsetObject {
  return typeof offset === "object" && offset != null;
}

/**
 * Named slots for {@link IndicatorStyles} (Pillar B / `internal/styles.ts`).
 * Gives prop-API callers (who pass `label`/`size`/… rather than composing the
 * parts) a handle on the dot and label. Each key maps to the props of the styled
 * part it targets — `styles={{ dot: { backgroundColor: "$red9" } }}` is sugar for
 * `<Indicator.Dot backgroundColor="$red9" />`.
 */
export interface IndicatorStyles {
  /** Props spread onto the container that wraps the children (`.Frame`). */
  root?: GetProps<typeof IndicatorContainer>;
  /** Props spread onto the dot / pill badge (`.Dot`). */
  dot?: GetProps<typeof IndicatorDot>;
  /** Props spread onto the label text inside the badge (`.Label`). */
  label?: GetProps<typeof IndicatorLabel>;
}

const INDICATOR_SLOT_KEYS = [
  "root",
  "dot",
  "label",
] as const satisfies readonly (keyof IndicatorStyles)[];

// `position` is redefined as a corner/edge anchor, so it's omitted from the
// inherited Box style props (whose `position` is the CSS `relative`/`absolute`
// keyword — fixed internally to `relative`) to avoid a type clash.
export interface IndicatorProps extends Omit<
  GetProps<typeof IndicatorContainer>,
  "position" | "radius" | "size" | "zIndex"
> {
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<IndicatorStyles>;
  /** Anchor corner/edge relative to the target. @default 'top-end' */
  position?: IndicatorPosition;
  /** Space-token or pixel nudge from the anchored edge(s). Object form sets each axis. @default 0 */
  offset?: IndicatorOffset | IndicatorOffsetObject;
  /** Dot/badge width and height. Standard keys resolve against the size scale. @default 'xxs' */
  size?: IndicatorSize | number | (string & {});
  /** Rounding of the dot/badge. Token, CSS value, or number. @default round */
  radius?: number | string;
  /** Content inside the indicator (turns the dot into a pill badge). */
  label?: React.ReactNode;
  /** Adds a `$background` ring so the dot separates from the target. */
  withBorder?: boolean;
  /** Hide the indicator while still rendering children. */
  disabled?: boolean;
  /** Animate the dot with a continuous opacity pulse (plus a scale-in entrance). @default false */
  processing?: boolean;
  /** Maximum numeric label; larger values render as `{maxValue}+`. */
  maxValue?: number;
  /** Render the indicator when the label is `0`. @default true */
  showZero?: boolean;
  /** z-index of the indicator dot/badge. @default 1 */
  zIndex?: number;
  /**
   * Accepted for Mantine parity. Text already contrasts the accent fill via the
   * ramp (`$color1` on `$color9`), so this is effectively always on.
   */
  autoContrast?: boolean;
}

const IndicatorBase = IndicatorContainer.styleable<IndicatorProps>(function Indicator(props, ref) {
  const {
    children,
    position = "top-end",
    offset = 0,
    size = DEFAULT_SIZE,
    radius,
    label,
    withBorder,
    disabled,
    processing,
    maxValue,
    showZero = true,
    zIndex = 1,
    autoContrast,
    styles,
    ...rest
  } = props;
  void autoContrast; // contrast comes from the ramp ($color1 on $color9).

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<IndicatorStyles>(styles, INDICATOR_SLOT_KEYS, "Indicator");

  // Continuous opacity throb driven by the shared looping primitive — a
  // compositor `@keyframes` (web) / reanimated UI-thread loop (native) with no
  // `setInterval` and no per-frame re-render. The hook runs unconditionally so
  // hook order stays stable; its style is only spread when `processing`. Reduced
  // motion is handled inside the hook (it returns a static, animation-free frame).
  const loop = useLoopingAnimation({
    kind: "pulse",
    durationMs: DURATIONS.ambient,
    minOpacity: 0.45,
  });
  // One-shot scale-in entrance for the processing dot, via the shared `scale`
  // preset (`{ opacity: 0, scale: 0 }` + easing). `false` when not processing →
  // inert. Reduced motion is honoured inside the hook.
  const entrance = useMotionPreset(processing ? "scale" : false);

  const offsetX = isOffsetObject(offset) ? offset.x : offset;
  const offsetY = isOffsetObject(offset) ? offset.y : offset;
  const inset = resolveInset(position, size, offsetX, offsetY);

  const hasLabel = label != null && label !== "";
  const hideZero = !showZero && (label === 0 || label === "0");
  const formattedLabel =
    maxValue !== undefined && typeof label === "number" && label > maxValue
      ? `${maxValue}+`
      : label;

  return (
    <IndicatorContainer ref={ref} {...s.get("root")} {...rest}>
      {!hideZero ? (
        // The anchor owns the absolute placement + the processing pulse; the dot
        // sits in its flow (`position: relative`) carrying the appearance + the
        // one-shot scale-in `entrance`. Splitting the two keeps the reanimated loop
        // off the Tamagui-driven dot (see `IndicatorAnchor`). The pulse's opacity
        // composes onto the dot, so the geometry is identical to a single node.
        <IndicatorAnchor
          position="absolute"
          zIndex={zIndex}
          {...inset}
          {...(processing ? loop : null)}
        >
          <IndicatorDot
            // Slot sugar spreads UNDER the engine's computed state props below, so
            // explicit always wins ("explicit beats sugar").
            {...s.get("dot")}
            aria-hidden={hasLabel ? undefined : true}
            disabled={disabled}
            withBorder={withBorder}
            withLabel={hasLabel}
            radius={radius}
            size={size}
            // Sit in the anchor's flow — the anchor owns the absolute corner
            // placement, so the dot drops its styled `position: absolute`.
            position="relative"
            // `size` and `withLabel` both set `width`; `size` (the fixed square)
            // would otherwise win and clip a multi-character label. Force `auto`
            // when labelled so the pill grows to its text — `minWidth`/`height`
            // from `size` still keep a bare dot circular.
            width={hasLabel ? "auto" : undefined}
            // The one-shot scale-in entrance is a Tamagui `enterStyle` transition,
            // safe on this node now that the reanimated loop lives on the anchor.
            {...entrance}
          >
            {hasLabel ? (
              typeof formattedLabel === "string" || typeof formattedLabel === "number" ? (
                <IndicatorLabel {...s.get("label")}>{formattedLabel}</IndicatorLabel>
              ) : (
                formattedLabel
              )
            ) : null}
          </IndicatorDot>
        </IndicatorAnchor>
      ) : null}
      {children}
    </IndicatorContainer>
  );
});

export const Indicator = withStaticProperties(IndicatorBase, {
  Dot: IndicatorDot,
  Frame: IndicatorContainer,
  Label: IndicatorLabel,
});
