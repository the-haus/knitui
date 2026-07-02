import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useKeyboardActions, useUncontrolled } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { resolveSizePx } from "../internal/control-metrics";
import { HiddenInput } from "../internal/hidden-input";
import { clamp } from "../internal/number-utils";
import {
  focusRingStyle,
  fontSizeVariant,
  hoverProps,
  type SizeKey,
  squareSizeVariantFallthrough,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type RatingTokenSize = SizeKey;
type RatingSize = RatingTokenSize | number;

const RatingContext = createStyledContext<{ size: RatingTokenSize }>({
  size: "sm",
});

/** Round `value` to the nearest multiple of `to` (Mantine's `roundValueTo`). */
function roundValueTo(value: number, to: number): number {
  const rounded = Math.round(value / to) * to;
  const precision = `${to}`.split(".")[1]?.length ?? 0;
  return Number(rounded.toFixed(precision));
}

const RatingRoot = styled(Box, {
  name: "Rating",
  context: RatingContext,
  flexDirection: "row",
  alignItems: "center",

  variants: {
    size: {
      xxs: { gap: "$xxs" },
      xs: { gap: "$xxs" },
      sm: { gap: "$xxs" },
      md: { gap: "$xs" },
      lg: { gap: "$xs" },
      xl: { gap: "$sm" },
      xxl: { gap: "$sm" },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { size: "sm" },
});

const RatingSymbolFrame = styled(Box, {
  name: "RatingSymbol",
  context: RatingContext,
  position: "relative",

  variants: {
    size: {
      ...squareSizeVariantFallthrough,
    },
  } as const,
});

const RatingGlyph = styled(Text, {
  name: "RatingGlyph",
  context: RatingContext,
  userSelect: "none",

  variants: {
    size: {
      ...fontSizeVariant,
      ":number": (value: number) => ({ fontSize: value, lineHeight: value }),
    },
  } as const,
});

const RatingSegmentFrame = styled(Box, {
  name: "RatingSegment",
  position: "absolute",
  top: 0,
  height: "100%",
  ...webCursor("pointer"),
  ...focusRingStyle,

  variants: {
    disabled: {
      true: { pointerEvents: "none", ...webCursor("default") },
    },
  } as const,
});

type RatingSymbol = React.ReactNode | ((value: number) => React.ReactNode);

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ symbol: { … } }}` is sugar for
 * `<Rating.Symbol … />`. The `symbol` slot applies to every symbol frame and the
 * `segment` slot to every interactive sub-segment overlay.
 */
export interface RatingStyles {
  /** Props for the row container (`Rating.Root`). */
  root?: GetProps<typeof RatingRoot>;
  /** Props for each symbol frame (`Rating.Symbol`). */
  symbol?: GetProps<typeof RatingSymbolFrame>;
  /** Props for each interactive sub-segment overlay (`Rating.Segment`). */
  segment?: Omit<GetProps<typeof RatingSegmentFrame>, "children">;
}

const RATING_SLOT_KEYS = [
  "root",
  "symbol",
  "segment",
] as const satisfies readonly (keyof RatingStyles)[];

export interface RatingProps extends Omit<
  GetProps<typeof RatingRoot>,
  "onChange" | "children" | "size"
> {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled initial value. */
  defaultValue?: number;
  /** Called when the value changes. */
  onChange?: (value: number) => void;
  /** Number of symbols. @default 5 */
  count?: number;
  /** Sub-divisions per symbol (2 = half-stars). @default 1 */
  fractions?: number;
  /** Symbol size key or custom pixel size. @default "sm" */
  size?: RatingSize;
  /** Prevent user interaction. @default false */
  readOnly?: boolean;
  /** Clicking the current value clears it to 0. @default true */
  allowClear?: boolean;
  /** Highlight only the selected symbol, not all up to it. @default false */
  highlightSelectedOnly?: boolean;
  /** Symbol shown for the unfilled part. Node or `(value) => node`. */
  emptySymbol?: RatingSymbol;
  /** Symbol shown for the filled part. Node or `(value) => node`. */
  fullSymbol?: RatingSymbol;
  /** Generate the `aria-label` for each symbol. @default String(value) */
  getSymbolLabel?: (value: number) => string;
  /** Called as the pointer moves over symbols; receives `-1` on leave. */
  onHover?: (value: number) => void;
  /** Hidden input name for web form submission. */
  name?: string;
  /** Associated form id for the hidden input. */
  form?: string;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<RatingStyles>;
}

const resolveSymbol = (symbol: RatingSymbol, value: number): React.ReactNode =>
  typeof symbol === "function" ? symbol(value) : symbol;

interface RatingSegmentProps extends Omit<
  GetProps<typeof RatingSegmentFrame>,
  "children" | "onPress"
> {
  value: number;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: (value: number) => void;
  onHover: (value: number) => void;
}

const RatingSegment = RatingSegmentFrame.styleable<RatingSegmentProps>(
  function RatingSegment(props, ref) {
    const { value, label, checked, disabled, onSelect, onHover, ...rest } = props;

    const activate = React.useCallback(() => {
      if (disabled) return;
      onSelect(value);
    }, [disabled, onSelect, value]);

    const handleHover = React.useCallback(() => {
      if (disabled) return;
      onHover(value);
    }, [disabled, onHover, value]);

    const focusProps = useKeyboardActions({ onActivate: activate }, { disabled });

    return (
      <RatingSegmentFrame
        ref={ref}
        disabled={disabled}
        {...rest}
        role="radio"
        aria-label={label}
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        onPress={activate}
        {...focusProps}
        {...hoverProps({ onHoverIn: handleHover })}
      />
    );
  },
);

interface RatingHiddenInputProps {
  name?: string;
  form?: string;
  value: number;
  disabled?: boolean;
}

function RatingHiddenInput(props: RatingHiddenInputProps) {
  const { name, form, value, disabled } = props;
  return <HiddenInput name={name} form={form} disabled={disabled} value={`${value}`} />;
}

/**
 * Mirrors Mantine's `Rating` — `count` symbols, each divisible into `fractions`,
 * with hover preview, read-only and clearable modes. The filled accent comes from
 * the active theme's palette ramp (`$color9`) via the `theme` prop, never a
 * Mantine `color` prop.
 *
 * Fractional fill is done by overlaying a width-clipped "full" symbol over the
 * "empty" one — no SVG, cross-platform. Hover preview uses web pointer events;
 * on native, pressing a segment still selects its value.
 */
const RatingBase = RatingRoot.styleable<RatingProps>(function Rating(props, ref) {
  const {
    value,
    defaultValue,
    onChange,
    count = 5,
    fractions = 1,
    size = "sm",
    readOnly = false,
    allowClear = true,
    highlightSelectedOnly = false,
    emptySymbol,
    fullSymbol,
    getSymbolLabel = (v) => `${v}`,
    onHover,
    name,
    form,
    disabled,
    role: _role,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    styles,
    ...rest
  } = props;

  const s = slotStyles<RatingStyles>(styles, RATING_SLOT_KEYS, "Rating");

  const [current, setValue] = useUncontrolled<number>({
    value,
    defaultValue,
    finalValue: 0,
    onChange,
  });
  const [hovered, setHovered] = React.useState(-1);

  const contextSize = typeof size === "number" ? "sm" : size;
  // Resolve the size key (or custom number) to a single pixel value and drive BOTH
  // the square symbol frame and the glyph's fontSize from it. They previously read
  // two different scales — the frame the `size` scale (md=40) and the glyph the
  // `font` scale (md=18) — so the star rendered at roughly half its frame and the
  // fractional-fill clip (a % of the frame) no longer lined up with the glyph.
  const symbolSize = resolveSizePx(size);
  const stepCount = Math.max(1, Math.floor(fractions));
  const decimalUnit = 1 / stepCount;
  const displayValue = hovered >= 0 ? hovered : current;

  const setHover = React.useCallback(
    (next: number) => {
      if (readOnly || disabled) return;
      if (next !== hovered) {
        setHovered(next);
        onHover?.(next);
      }
    },
    [disabled, hovered, onHover, readOnly],
  );

  const handleLeave = React.useCallback(() => {
    if (hovered !== -1) {
      setHovered(-1);
      onHover?.(-1);
    }
  }, [hovered, onHover]);

  const select = React.useCallback(
    (next: number) => {
      if (readOnly || disabled) return;
      const rounded = roundValueTo(next, decimalUnit);
      setValue(allowClear && rounded === current ? 0 : rounded);
    },
    [allowClear, current, decimalUnit, disabled, readOnly, setValue],
  );

  // Fill fraction (0..1) for symbol `index` (0-based) given the active value.
  const fillFor = (index: number): number => {
    if (highlightSelectedOnly) {
      return Math.ceil(displayValue) === index + 1 ? clamp(displayValue - index, 0, 1) : 0;
    }
    return clamp(displayValue - index, 0, 1);
  };

  const widthPct = (frac: number): BoxProps["width"] => `${frac * 100}%` as BoxProps["width"];
  const leftPct = (n: number): BoxProps["left"] => `${n * 100}%` as BoxProps["left"];

  return (
    <RatingRoot
      ref={ref}
      size={contextSize}
      disabled={disabled}
      {...hoverProps({ onHoverOut: handleLeave })}
      {...s.get("root")}
      {...rest}
      role="radiogroup"
      aria-label={ariaLabel ?? (ariaLabelledBy == null ? "Rating" : undefined)}
      aria-labelledby={ariaLabelledBy}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
    >
      <RatingHiddenInput name={name} form={form} value={current} disabled={disabled} />
      {Array.from({ length: count }, (_unused, index) => {
        const fullValue = index + 1;
        const frac = fillFor(index);
        const empty = resolveSymbol(emptySymbol, fullValue) ?? (
          <RatingGlyph size={symbolSize} color="$color6">
            ★
          </RatingGlyph>
        );
        const full = resolveSymbol(fullSymbol, fullValue) ?? (
          <RatingGlyph size={symbolSize} color="$color9">
            ★
          </RatingGlyph>
        );

        return (
          <RatingSymbolFrame key={index} {...s.get("symbol")} size={symbolSize}>
            {empty}
            {frac > 0 ? (
              <Box
                position="absolute"
                top={0}
                left={0}
                height="100%"
                width={widthPct(frac)}
                overflow="hidden"
              >
                <RatingSymbolFrame size={symbolSize}>{full}</RatingSymbolFrame>
              </Box>
            ) : null}

            {!readOnly
              ? Array.from({ length: stepCount }, (_seg, k) => {
                  const segValue = index + (k + 1) * decimalUnit;
                  const rounded = roundValueTo(segValue, decimalUnit);
                  return (
                    <RatingSegment
                      key={k}
                      {...s.get("segment")}
                      left={leftPct(k / stepCount)}
                      width={widthPct(1 / stepCount)}
                      value={segValue}
                      label={getSymbolLabel(rounded)}
                      checked={current === rounded}
                      disabled={disabled}
                      onSelect={select}
                      onHover={setHover}
                    />
                  );
                })
              : null}
          </RatingSymbolFrame>
        );
      })}
    </RatingRoot>
  );
});

export const Rating = withStaticProperties(RatingBase, {
  Root: RatingRoot,
  Symbol: RatingSymbolFrame,
  Glyph: RatingGlyph,
  Segment: RatingSegment,
});

export type { RatingSize };
