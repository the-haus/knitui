import * as React from "react";

import { type GetProps, isWeb, styled, withStaticProperties } from "@knitui/core";
import { useMove, useUncontrolled } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { HiddenInput } from "../internal/hidden-input";
import { clamp } from "../internal/number-utils";
import {
  focusRingStyle,
  hoverProps,
  radiusVariant,
  type SizeKey,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

/* -------------------------------------------------------------------------- */
/* Types & metrics                                                            */
/* -------------------------------------------------------------------------- */

export type SliderSize = SizeKey;
export type SliderOrientation = "horizontal" | "vertical";

export interface SliderMark {
  /** Position of the mark on the value scale. */
  value: number;
  /** Optional label rendered under (horizontal) / beside (vertical) the mark. */
  label?: React.ReactNode;
}

const DEFAULT_SIZE: SliderSize = "md";
/** Default main-axis length of a vertical slider (px). */
const VERTICAL_LENGTH = 160;
// A slider is a THIN track with a moderate round thumb — neither belongs on the
// `$size` (16–64) control/icon scale (which made both ≈40px at md). The thumb's
// position/margins and the track's centring offset are computed in JS layout math
// (e.g. `marginLeft: -knob.px / 2`), which needs the raw pixel NUMBER — a style
// variant object can't be read as a number. So these stay as local geometry maps,
// kept in lockstep with the shared style variants that are the source of truth:
// `sliderTrackVariant` / `sliderThumbVariant` in internal/style-props.ts.
const SLIDER_TRACK = { xxs: 3, xs: 4, sm: 5, md: 6, lg: 8, xl: 10, xxl: 12 } as const;
const SLIDER_THUMB = { xxs: 12, xs: 14, sm: 16, md: 20, lg: 24, xl: 28, xxl: 32 } as const;

interface SliderDimension {
  value: BoxProps["width"];
  px: number;
}

const resolveTrackSize = (size: SliderSize | number): SliderDimension =>
  typeof size === "number"
    ? { value: size, px: size }
    : { value: SLIDER_TRACK[size], px: SLIDER_TRACK[size] };

const resolveThumbSize = (
  size: SliderSize | number,
  thumbSize?: number | string,
): SliderDimension => {
  if (thumbSize != null) {
    // Mantine accepts `number | string` (it feeds the value through `rem()`); our
    // thumb geometry needs a concrete pixel number, so parse numeric strings
    // (e.g. `"28"` / `"28px"`) and ignore anything non-numeric.
    const px = typeof thumbSize === "number" ? thumbSize : parseFloat(thumbSize);
    if (!Number.isNaN(px)) {
      return { value: px, px };
    }
  }
  return typeof size === "number"
    ? { value: size + 12, px: size + 12 }
    : { value: SLIDER_THUMB[size], px: SLIDER_THUMB[size] };
};

/* -------------------------------------------------------------------------- */
/* Pure value helpers                                                         */
/* -------------------------------------------------------------------------- */

/** Snap a raw value to the step grid anchored at `min`, fixing float drift. */
const roundToStep = (value: number, min: number, step: number): number => {
  if (step <= 0) return value;
  const steps = Math.round((value - min) / step);
  const next = min + steps * step;
  const decimals = (String(step).split(".")[1] ?? "").length;
  return decimals ? parseFloat(next.toFixed(decimals)) : next;
};

/** Significant decimals implied by `step` (mirrors Mantine's `getPrecision`). */
const getPrecisionFromStep = (step: number): number => {
  if (!step) return 0;
  const split = step.toString().split(".");
  return split.length > 1 ? split[1].length : 0;
};

/** Round to `precision` decimals, leaving non-finite values untouched. */
const applyPrecision = (value: number, precision: number): number =>
  Number.isFinite(value) ? parseFloat(value.toFixed(precision)) : value;

interface ScaleConfig {
  min: number;
  max: number;
  step: number;
  precision: number;
  marks?: SliderMark[];
  restrictToMarks?: boolean;
}

/** Convert a normalized `[0,1]` position to a snapped, clamped, precision value. */
const posToValue = (pos: number, cfg: ScaleConfig): number => {
  const raw = clamp(cfg.min + pos * (cfg.max - cfg.min), cfg.min, cfg.max);
  if (cfg.restrictToMarks && cfg.marks && cfg.marks.length > 0) {
    return cfg.marks.reduce(
      (closest, m) => (Math.abs(m.value - raw) < Math.abs(closest - raw) ? m.value : closest),
      cfg.marks[0].value,
    );
  }
  return applyPrecision(
    clamp(roundToStep(raw, cfg.min, cfg.step), cfg.min, cfg.max),
    cfg.precision,
  );
};

/** Convert a value to a `0–100` percentage along the track. */
const valueToPct = (value: number, min: number, max: number): number =>
  max === min ? 0 : clamp(((value - min) / (max - min)) * 100, 0, 100);

const pct = (n: number): BoxProps["width"] => `${n}%` as BoxProps["width"];

type SliderAriaRangeProps = {
  role: "slider";
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  "aria-valuenow"?: number;
  "aria-valuetext"?: string;
};

const canUseNativeAccessibilityValue = (min: number, max: number, now: number): boolean =>
  Number.isInteger(min) && Number.isInteger(max) && Number.isInteger(now);

const sliderAriaRangeProps = (
  min: number,
  max: number,
  now: number,
  valueText?: string,
): SliderAriaRangeProps => {
  if (isWeb || canUseNativeAccessibilityValue(min, max, now)) {
    return {
      role: "slider",
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": now,
      "aria-valuetext": valueText,
    };
  }

  return {
    role: "slider",
    "aria-valuetext": valueText ?? String(now),
  };
};

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const SliderRoot = styled(Box, {
  name: "Slider",
  position: "relative",
  userSelect: "none",

  variants: {
    orientation: {
      horizontal: { width: "100%" },
      vertical: { alignSelf: "flex-start" },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { orientation: "horizontal" },
});

/** The pointer hit-area; carries the `useMove` ref. */
const SliderTrackContainer = styled(Box, {
  name: "SliderTrackContainer",
  position: "relative",
  ...webCursor("pointer"),

  variants: {
    orientation: {
      horizontal: { width: "100%", justifyContent: "center" },
      vertical: { alignItems: "center" },
    },
  } as const,
});

/** The thin bar background. Its thickness maps to the cross-axis dimension
 * (`height` when horizontal, `width` when vertical) and is applied inline from
 * the raw `SLIDER_TRACK` number alongside the matching centring offset — the
 * shared `sliderTrackVariant` (which only sets `height`) can't express the
 * vertical axis, so the local number map is the geometry source here. */
const SliderTrack = styled(Box, {
  name: "SliderTrack",
  position: "absolute",
  backgroundColor: "$color3",
  variants: { radius: radiusVariant } as const,
  defaultVariants: { radius: "xl" },
});

/** The filled portion of the track. */
const SliderBar = styled(Box, {
  name: "SliderBar",
  position: "absolute",
  backgroundColor: "$color9",
  variants: { radius: radiusVariant } as const,
  defaultVariants: { radius: "xl" },
});

const SliderThumb = styled(Box, {
  name: "SliderThumb",
  position: "absolute",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "$color1",
  borderWidth: 2,
  borderColor: "$color9",
  borderRadius: 9999,
  ...webCursor("pointer"),
  hoverStyle: { borderColor: "$color10" },
  ...focusRingStyle,
});

const SliderMarkDot = styled(Box, {
  name: "SliderMarkDot",
  position: "absolute",
  width: 6,
  height: 6,
  borderRadius: 9999,
  borderWidth: 2,
  borderColor: "$color3",
  backgroundColor: "$background",
  pointerEvents: "none",

  variants: {
    filled: {
      true: { borderColor: "$color9" },
    },
  } as const,
});

const SliderMarkLabel = styled(Text, {
  name: "SliderMarkLabel",
  position: "absolute",
  fontSize: "$xs",
  color: "$color11",
  textAlign: "center",
  pointerEvents: "none",
  userSelect: "none",
});

/** Half-width of the value-bubble's measuring box (see `SliderLabelAnchor`). */
const LABEL_ANCHOR_HALF = 100;

/**
 * Centring/measuring box for the value bubble. The bubble can't live in the
 * thumb's own ~20px box: both Yoga (native) and react-native-web wrap text to
 * the containing block's width, so a multi-digit value would wrap one character
 * per line. Instead this anchor gives a wide (`200px`) measuring area centred
 * over the thumb (`left: 50%` + a known `marginLeft`, so no percentage
 * `translateX` that RN can't express), and `alignItems: center` centres the
 * content-sized bubble within it. `pointerEvents: none` + empty body make the
 * extra width invisible and inert.
 */
const SliderLabelAnchor = styled(Box, {
  name: "SliderLabelAnchor",
  position: "absolute",
  bottom: "100%",
  left: "50%",
  width: LABEL_ANCHOR_HALF * 2,
  marginLeft: -LABEL_ANCHOR_HALF,
  marginBottom: 6,
  alignItems: "center",
  pointerEvents: "none",
});

const SliderLabelBubble = styled(Text, {
  name: "SliderLabelBubble",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: "$sm",
  backgroundColor: "$color9",
  color: "$color1",
  fontSize: "$xs",
  pointerEvents: "none",
  // Force a single line cross-platform. Safe here (unlike inside the thumb)
  // because the anchor is wide, so RNW's implied `maxWidth: 100%` never bites.
  numberOfLines: 1,
});

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the Slider
 * part surface. Each key maps to the props of the part it targets, so
 * `styles={{ thumb: { backgroundColor: "$red9" } }}` is sugar for
 * `<Slider.Thumb backgroundColor="$red9" />`. Shared by `Slider` and `RangeSlider`.
 */
export interface SliderStyles {
  /** Props for the outer relative root (`Slider.Root`). */
  root?: GetProps<typeof SliderRoot>;
  /** Props for the pointer hit-area carrying the move ref (`Slider.TrackContainer`). */
  trackContainer?: GetProps<typeof SliderTrackContainer>;
  /** Props for the thin bar background (`Slider.Track`). */
  track?: GetProps<typeof SliderTrack>;
  /** Props for the filled portion of the track (`Slider.Bar`). */
  bar?: GetProps<typeof SliderBar>;
  /** Props for the draggable thumb(s) (`Slider.Thumb`). */
  thumb?: GetProps<typeof SliderThumb>;
  /** Props for each mark dot (`Slider.Mark`). */
  mark?: GetProps<typeof SliderMarkDot>;
  /** Props for each mark label (`Slider.MarkLabel`). */
  markLabel?: GetProps<typeof SliderMarkLabel>;
  /** Props for the value-bubble centring anchor (`Slider.LabelAnchor`). */
  labelAnchor?: GetProps<typeof SliderLabelAnchor>;
  /** Props for the value-bubble text (`Slider.Label`). */
  label?: GetProps<typeof SliderLabelBubble>;
}

const SLIDER_SLOT_KEYS = [
  "root",
  "trackContainer",
  "track",
  "bar",
  "thumb",
  "mark",
  "markLabel",
  "labelAnchor",
  "label",
] as const satisfies readonly (keyof SliderStyles)[];

/* -------------------------------------------------------------------------- */
/* Shared prop surface                                                        */
/* -------------------------------------------------------------------------- */

interface SliderSharedProps {
  /** Minimum value. @default 0 */
  min?: number;
  /** Maximum value. @default 100 */
  max?: number;
  /** Step between values. @default 1 */
  step?: number;
  /** Track/thumb size — a `$size` scale key (`xxs`–`xxl`) or a px number. @default 'md' */
  size?: SliderSize | number;
  /** Border radius of the track/bar. @default 'xl' */
  radius?: string | number;
  /** Marks rendered along the track. */
  marks?: SliderMark[];
  /** Restrict selectable values to the `marks` array. @default false */
  restrictToMarks?: boolean;
  /** Disable interaction. @default false */
  disabled?: boolean;
  /** Invert which side of the track is filled. @default false */
  inverted?: boolean;
  /** Layout axis. @default 'horizontal' */
  orientation?: SliderOrientation;
  /** Always show the value label, not just while dragging/hovering. @default false */
  labelAlwaysOn?: boolean;
  /** Show the value label on hover (web). @default true */
  showLabelOnHover?: boolean;
  /**
   * Diameter of the thumb. Derived from `size` by default. Accepts a `number`
   * (px) or a numeric string (`"28"` / `"28px"`) for Mantine parity; non-numeric
   * strings fall back to the `size`-derived default.
   */
  thumbSize?: number | string;
  /** Transform the displayed value (e.g. exponential scale) for label/aria. @default identity */
  scale?: (value: number) => number;
  /** Format/replace the value label. Pass `null` to hide it. @default identity */
  label?: React.ReactNode | ((value: number) => React.ReactNode) | null;
  /**
   * Selectable value range, overriding `[min, max]` for geometry, selection and
   * aria bounds. @default `[min, max]`
   */
  domain?: [number, number];
  /** Significant decimals to round emitted values to. @default derived from `step` */
  precision?: number;
  /** Thumb `aria-valuetext`; a function receives the scaled value. */
  thumbValueText?: string | ((value: number) => string);
  /**
   * @deprecated Use `styles={{ thumb: … }}` (or render `<Slider.Thumb>` directly).
   * Cross-platform thumb-part props, merged OVER the `thumb` slot sugar.
   */
  thumbProps?: GetProps<typeof SliderThumb>;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<SliderStyles>;
}

const defaultScale = (v: number): number => v;
const defaultLabel = (v: number): React.ReactNode => v;

/** Resolve the `thumbValueText` prop into an `aria-valuetext` string (or undefined). */
const renderValueText = (
  thumbValueText: SliderSharedProps["thumbValueText"],
  scaledValue: number,
): string | undefined =>
  typeof thumbValueText === "function" ? thumbValueText(scaledValue) : thumbValueText;

/** Resolve the `label` prop into a renderable node (or null when hidden). */
const renderLabel = (label: SliderSharedProps["label"], scaledValue: number): React.ReactNode => {
  if (label === null) return null;
  if (typeof label === "function") return label(scaledValue);
  if (label === undefined) return defaultLabel(scaledValue);
  return label;
};

/* -------------------------------------------------------------------------- */
/* Slider (single value)                                                      */
/* -------------------------------------------------------------------------- */

export interface SliderProps
  extends
    Omit<GetProps<typeof SliderRoot>, "onChange" | "disabled" | "size" | "orientation" | "scale">,
    SliderSharedProps {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled initial value. @default `min` */
  defaultValue?: number;
  /** Called on every value change while dragging / on key press. */
  onChange?: (value: number) => void;
  /** Called once the selection is finished (pointer up / key press). */
  onChangeEnd?: (value: number) => void;
  /** Hidden input `name`, for uncontrolled form submission (web). */
  name?: string;
  /** Accessible label for the thumb. */
  thumbLabel?: string;
  /** Content rendered inside the thumb. */
  thumbChildren?: React.ReactNode;
  /**
   * Value at which the filled bar starts; the bar then extends from this point
   * toward the thumb. Ignored when `inverted` is set.
   */
  startPointValue?: number;
  /** Props forwarded to the hidden form input (web). */
  hiddenInputProps?: React.ComponentProps<"input">;
}

/**
 * `Slider` — capture a single numeric value within a range by dragging a thumb.
 * Mirrors Mantine's `Slider` public API, built on our cross-platform `useMove`
 * (web pointer events + native gesture responder). Accent comes from the theme
 * ramp (filled bar `$color9`); recolor via the `theme` prop, never a `color` prop.
 *
 * Supports `domain`, `precision`, `startPointValue`, `thumbValueText`, and
 * `thumbProps`/`hiddenInputProps` passthrough. Still deferred (documented):
 * `labelTransitionProps` — wants the `Transition` component wired into the bubble.
 */
const SliderComponent = SliderRoot.styleable<SliderProps>(function Slider(props, ref) {
  const {
    min = 0,
    max = 100,
    step = 1,
    size = DEFAULT_SIZE,
    radius = "xl",
    marks,
    restrictToMarks = false,
    disabled = false,
    inverted = false,
    orientation = "horizontal",
    labelAlwaysOn = false,
    showLabelOnHover = true,
    thumbSize,
    scale = defaultScale,
    label,
    domain,
    precision: precisionProp,
    thumbValueText,
    thumbProps,
    startPointValue,
    hiddenInputProps,
    styles,
    value,
    defaultValue,
    onChange,
    onChangeEnd,
    name,
    thumbLabel,
    thumbChildren,
    ...rest
  } = props;

  const s = slotStyles<SliderStyles>(styles, SLIDER_SLOT_KEYS, "Slider");

  // `domain` overrides `[min, max]` for geometry, selection and aria bounds.
  const [dMin, dMax] = domain ?? [min, max];
  const precision = precisionProp ?? getPrecisionFromStep(step);

  const [current, setValue] = useUncontrolled<number>({
    value,
    defaultValue,
    finalValue: dMin,
    onChange,
  });

  const [active, setActive] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const stateRef = React.useRef({
    min: dMin,
    max: dMax,
    step,
    precision,
    marks,
    restrictToMarks,
    orientation,
    disabled,
    setValue,
  });
  stateRef.current = {
    min: dMin,
    max: dMax,
    step,
    precision,
    marks,
    restrictToMarks,
    orientation,
    disabled,
    setValue,
  };

  // Latest value mirror so `onChangeEnd` (fired from the move hook) is current.
  const currentRef = React.useRef(current);
  currentRef.current = current;

  const onMove = React.useCallback((position: { x: number; y: number }) => {
    const s = stateRef.current;
    if (s.disabled) return;
    const pos = s.orientation === "vertical" ? 1 - position.y : position.x;
    s.setValue(posToValue(pos, s));
  }, []);

  const { ref: moveRef, rootProps } = useMove(onMove, {
    onScrubStart: () => setActive(true),
    onScrubEnd: () => {
      setActive(false);
      onChangeEnd?.(currentRef.current);
    },
  });

  const trackSize = resolveTrackSize(size);
  const knob = resolveThumbSize(size, thumbSize);
  const vertical = orientation === "vertical";
  const position = valueToPct(current, dMin, dMax);

  const stepValue = (delta: number, commit: boolean): void => {
    if (disabled) return;
    const next = applyPrecision(
      clamp(roundToStep(current + delta, dMin, step), dMin, dMax),
      precision,
    );
    setValue(next);
    if (commit) onChangeEnd?.(next);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        stepValue(step, true);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        stepValue(-step, true);
        break;
      case "PageUp":
        event.preventDefault();
        stepValue(step * 10, true);
        break;
      case "PageDown":
        event.preventDefault();
        stepValue(-step * 10, true);
        break;
      case "Home":
        event.preventDefault();
        setValue(dMin);
        onChangeEnd?.(dMin);
        break;
      case "End":
        event.preventDefault();
        setValue(dMax);
        onChangeEnd?.(dMax);
        break;
      default:
    }
  };

  const showLabel = !disabled && (labelAlwaysOn || active || (showLabelOnHover && hovered));
  const labelNode = renderLabel(label, scale(current));
  const ariaRangeProps = sliderAriaRangeProps(
    dMin,
    dMax,
    current,
    renderValueText(thumbValueText, scale(current)),
  );

  // Optional bar start-point (the bar grows out from this value toward the thumb).
  const startPct =
    typeof startPointValue === "number" && !inverted
      ? valueToPct(startPointValue, dMin, dMax)
      : null;

  // Track-fill geometry (cross-platform percentages).
  const fill: Partial<BoxProps> =
    startPct !== null
      ? (() => {
          const lo = Math.min(startPct, position);
          const span = Math.abs(position - startPct);
          return vertical
            ? { left: 0, right: 0, bottom: pct(lo), height: pct(span) }
            : { top: 0, bottom: 0, left: pct(lo), width: pct(span) };
        })()
      : vertical
        ? inverted
          ? { left: 0, right: 0, top: 0, height: pct(100 - position) }
          : { left: 0, right: 0, bottom: 0, height: pct(position) }
        : inverted
          ? { top: 0, bottom: 0, right: 0, width: pct(100 - position) }
          : { top: 0, bottom: 0, left: 0, width: pct(position) };

  const trackBase: Partial<BoxProps> = vertical
    ? { top: 0, bottom: 0, left: "50%", width: trackSize.value, marginLeft: -trackSize.px / 2 }
    : { left: 0, right: 0, top: "50%", height: trackSize.value, marginTop: -trackSize.px / 2 };

  const thumbPos: Partial<BoxProps> = vertical
    ? { bottom: pct(position), left: "50%", marginLeft: -knob.px / 2, marginBottom: -knob.px / 2 }
    : { left: pct(position), top: "50%", marginLeft: -knob.px / 2, marginTop: -knob.px / 2 };

  // `tabIndex`/`onKeyDown` are web focus props outside Tamagui's typed surface;
  // narrow via an `object` local (no `any`), as `AngleSlider` does.
  const focusProps: object = { tabIndex: disabled ? -1 : 0, onKeyDown };
  // Deprecated `thumbProps` merged OVER the `thumb` slot sugar ("explicit beats sugar").
  const extraThumb = s.merge("thumb", thumbProps);
  const hoverHandlers = hoverProps({
    onHoverIn: () => setHovered(true),
    onHoverOut: () => setHovered(false),
  });
  return (
    <SliderRoot
      ref={ref}
      orientation={orientation}
      disabled={disabled}
      paddingVertical={vertical ? 0 : knob.px / 2}
      paddingHorizontal={vertical ? knob.px / 2 : 0}
      {...s.get("root")}
      {...rest}
    >
      <SliderTrackContainer
        ref={moveRef}
        orientation={orientation}
        height={vertical ? VERTICAL_LENGTH : knob.value}
        width={vertical ? knob.value : "100%"}
        {...s.get("trackContainer")}
        {...(rootProps as GetProps<typeof SliderTrackContainer>)}
        {...(hoverHandlers as GetProps<typeof SliderTrackContainer>)}
      >
        <SliderTrack
          radius={radius}
          {...s.get("track")}
          {...(trackBase as GetProps<typeof SliderTrack>)}
        >
          <SliderBar radius={radius} {...s.get("bar")} {...(fill as GetProps<typeof SliderBar>)} />
        </SliderTrack>

        {marks?.map((mark, index) => {
          const markPct = valueToPct(mark.value, dMin, dMax);
          const filled = mark.value <= current;
          const dotPos: Partial<BoxProps> = vertical
            ? { bottom: pct(markPct), left: "50%", marginLeft: -3, marginBottom: -3 }
            : { left: pct(markPct), top: "50%", marginLeft: -3, marginTop: -3 };
          const labelPos: Partial<BoxProps> = vertical
            ? { left: "100%", bottom: pct(markPct), marginLeft: 8, marginBottom: -8 }
            : { top: "100%", left: pct(markPct), marginTop: 8, marginLeft: -12, minWidth: 24 };
          return (
            <React.Fragment key={index}>
              <SliderMarkDot
                filled={filled}
                {...s.get("mark")}
                {...(dotPos as GetProps<typeof SliderMarkDot>)}
              />
              {mark.label != null ? (
                <SliderMarkLabel
                  {...s.get("markLabel")}
                  {...(labelPos as GetProps<typeof SliderMarkLabel>)}
                >
                  {mark.label}
                </SliderMarkLabel>
              ) : null}
            </React.Fragment>
          );
        })}

        <SliderThumb
          width={knob.value}
          height={knob.value}
          aria-label={thumbLabel}
          aria-orientation={orientation}
          aria-disabled={disabled || undefined}
          {...(ariaRangeProps as GetProps<typeof SliderThumb>)}
          {...(thumbPos as GetProps<typeof SliderThumb>)}
          {...(focusProps as GetProps<typeof SliderThumb>)}
          {...extraThumb}
        >
          {showLabel && labelNode != null ? (
            <SliderLabelAnchor {...s.get("labelAnchor")}>
              <SliderLabelBubble {...s.get("label")}>{labelNode}</SliderLabelBubble>
            </SliderLabelAnchor>
          ) : null}
          {thumbChildren}
        </SliderThumb>
      </SliderTrackContainer>

      <HiddenInput name={name} value={String(current)} extraProps={hiddenInputProps} />
    </SliderRoot>
  );
});

/* -------------------------------------------------------------------------- */
/* RangeSlider (two values)                                                   */
/* -------------------------------------------------------------------------- */

export type RangeSliderValue = [number, number];

interface RangeConstraint {
  min: number;
  max: number;
  minRange: number;
  maxRange: number;
  pushOnOverlap: boolean;
  precision: number;
}

/**
 * Enforce the `minRange`/`maxRange` invariants after moving the `changed` thumb.
 * With `pushOnOverlap` the OTHER thumb is shoved to keep the distance; otherwise
 * the moved thumb is reverted to its previous value (`prev`). Precision-rounded.
 */
const constrainRange = (
  draft: RangeSliderValue,
  changed: 0 | 1,
  prev: RangeSliderValue,
  c: RangeConstraint,
): RangeSliderValue => {
  let [a, b] = draft;
  if (changed === 0) {
    a = clamp(a, c.min, c.max);
    if (a > b - c.minRange) {
      if (c.pushOnOverlap) b = Math.min(a + c.minRange, c.max);
      else a = prev[0];
    }
    if (b - a > c.maxRange) {
      if (c.pushOnOverlap) b = Math.min(a + c.maxRange, c.max);
      else a = prev[0];
    }
  } else {
    b = clamp(b, c.min, c.max);
    if (b < a + c.minRange) {
      if (c.pushOnOverlap) a = Math.max(b - c.minRange, c.min);
      else b = prev[1];
    }
    if (b - a > c.maxRange) {
      if (c.pushOnOverlap) a = Math.max(b - c.maxRange, c.min);
      else b = prev[1];
    }
  }
  return [applyPrecision(a, c.precision), applyPrecision(b, c.precision)];
};

export interface RangeSliderProps
  extends
    Omit<GetProps<typeof SliderRoot>, "onChange" | "disabled" | "size" | "orientation" | "scale">,
    SliderSharedProps {
  /** Controlled `[start, end]` value. */
  value?: RangeSliderValue;
  /** Uncontrolled initial `[start, end]` value. @default `[min, max]` */
  defaultValue?: RangeSliderValue;
  /** Called on every change while dragging / on key press. */
  onChange?: (value: RangeSliderValue) => void;
  /** Called once the selection is finished. */
  onChangeEnd?: (value: RangeSliderValue) => void;
  /** Minimum distance between the two thumbs. @default 10 */
  minRange?: number;
  /** Maximum distance between the two thumbs. @default Infinity */
  maxRange?: number;
  /** Push the other thumb instead of blocking when the two would overlap. @default true */
  pushOnOverlap?: boolean;
  /** Accessible labels for the two thumbs. */
  thumbLabel?: string;
}

/**
 * `RangeSlider` — capture a `[start, end]` range with two thumbs. Mirrors
 * Mantine's `RangeSlider`; shares the `Slider` styled parts, value helpers and
 * `useMove` driver. The nearer thumb grabs the drag; `minRange`/`maxRange` keep the
 * two thumbs apart/together, and `pushOnOverlap` (default) shoves the far thumb on
 * collision instead of blocking. Shares `Slider`'s `domain`/`precision`/
 * `thumbValueText`/`thumbProps`. Deferred: `labelTransitionProps`.
 */
const RangeSliderComponent = SliderRoot.styleable<RangeSliderProps>(
  function RangeSlider(props, ref) {
    const {
      min = 0,
      max = 100,
      step = 1,
      size = DEFAULT_SIZE,
      radius = "xl",
      marks,
      restrictToMarks = false,
      disabled = false,
      orientation = "horizontal",
      labelAlwaysOn = false,
      showLabelOnHover = true,
      thumbSize,
      scale = defaultScale,
      label,
      domain,
      precision: precisionProp,
      thumbValueText,
      thumbProps,
      styles,
      minRange = 10,
      maxRange = Infinity,
      pushOnOverlap = true,
      value,
      defaultValue,
      onChange,
      onChangeEnd,
      thumbLabel,
      // `inverted` is meaningless for a two-thumb fill; ignore for parity.
      inverted: _inverted,
      ...rest
    } = props;

    const s = slotStyles<SliderStyles>(styles, SLIDER_SLOT_KEYS, "RangeSlider");

    // `domain` overrides `[min, max]` for geometry, selection and aria bounds.
    const [dMin, dMax] = domain ?? [min, max];
    const precision = precisionProp ?? getPrecisionFromStep(step);

    const [current, setValue] = useUncontrolled<RangeSliderValue>({
      value,
      defaultValue,
      finalValue: [dMin, dMax],
      onChange,
    });

    const [active, setActive] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const activeThumb = React.useRef<0 | 1 | null>(null);

    const stateRef = React.useRef({
      min: dMin,
      max: dMax,
      step,
      precision,
      marks,
      restrictToMarks,
      orientation,
      disabled,
      minRange,
      maxRange,
      pushOnOverlap,
      value: current,
      setValue,
    });
    stateRef.current = {
      min: dMin,
      max: dMax,
      step,
      precision,
      marks,
      restrictToMarks,
      orientation,
      disabled,
      minRange,
      maxRange,
      pushOnOverlap,
      value: current,
      setValue,
    };

    const onMove = React.useCallback((position: { x: number; y: number }) => {
      const s = stateRef.current;
      if (s.disabled) return;
      const pos = s.orientation === "vertical" ? 1 - position.y : position.x;
      const raw = posToValue(pos, s);
      const [a, b] = s.value;
      if (activeThumb.current === null) {
        activeThumb.current = Math.abs(raw - a) <= Math.abs(raw - b) ? 0 : 1;
      }
      const idx = activeThumb.current;
      const draft: RangeSliderValue = idx === 0 ? [raw, b] : [a, raw];
      s.setValue(constrainRange(draft, idx, s.value, s));
    }, []);

    const { ref: moveRef, rootProps } = useMove(onMove, {
      onScrubStart: () => {
        activeThumb.current = null;
        setActive(true);
      },
      onScrubEnd: () => {
        activeThumb.current = null;
        setActive(false);
        onChangeEnd?.(stateRef.current.value);
      },
    });

    const trackSize = resolveTrackSize(size);
    const knob = resolveThumbSize(size, thumbSize);
    const vertical = orientation === "vertical";
    const [valA, valB] = current;
    const pctA = valueToPct(valA, dMin, dMax);
    const pctB = valueToPct(valB, dMin, dMax);

    const stepThumb = (index: 0 | 1, delta: number): void => {
      if (disabled) return;
      const [a, b] = current;
      const target = roundToStep((index === 0 ? a : b) + delta, dMin, step);
      const draft: RangeSliderValue = index === 0 ? [target, b] : [a, target];
      const next = constrainRange(draft, index, current, {
        min: dMin,
        max: dMax,
        minRange,
        maxRange,
        pushOnOverlap,
        precision,
      });
      setValue(next);
      onChangeEnd?.(next);
    };

    const makeKeyDown =
      (index: 0 | 1) =>
      (event: React.KeyboardEvent<HTMLElement>): void => {
        switch (event.key) {
          case "ArrowRight":
          case "ArrowUp":
            event.preventDefault();
            stepThumb(index, step);
            break;
          case "ArrowLeft":
          case "ArrowDown":
            event.preventDefault();
            stepThumb(index, -step);
            break;
          case "PageUp":
            event.preventDefault();
            stepThumb(index, step * 10);
            break;
          case "PageDown":
            event.preventDefault();
            stepThumb(index, -step * 10);
            break;
          default:
        }
      };

    const showLabel = !disabled && (labelAlwaysOn || active || (showLabelOnHover && hovered));

    const trackBase: Partial<BoxProps> = vertical
      ? { top: 0, bottom: 0, left: "50%", width: trackSize.value, marginLeft: -trackSize.px / 2 }
      : { left: 0, right: 0, top: "50%", height: trackSize.value, marginTop: -trackSize.px / 2 };

    const fill: Partial<BoxProps> = vertical
      ? { left: 0, right: 0, bottom: pct(pctA), height: pct(pctB - pctA) }
      : { top: 0, bottom: 0, left: pct(pctA), width: pct(pctB - pctA) };

    const hoverHandlers = hoverProps({
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
    });

    // Deprecated `thumbProps` merged OVER the `thumb` slot sugar ("explicit beats sugar").
    const extraThumb = s.merge("thumb", thumbProps);

    const renderThumb = (index: 0 | 1, val: number, position: number): React.ReactNode => {
      const thumbPos: Partial<BoxProps> = vertical
        ? {
            bottom: pct(position),
            left: "50%",
            marginLeft: -knob.px / 2,
            marginBottom: -knob.px / 2,
          }
        : { left: pct(position), top: "50%", marginLeft: -knob.px / 2, marginTop: -knob.px / 2 };
      const focusProps: object = { tabIndex: disabled ? -1 : 0, onKeyDown: makeKeyDown(index) };
      const labelNode = renderLabel(label, scale(val));
      const ariaRangeProps = sliderAriaRangeProps(
        dMin,
        dMax,
        val,
        renderValueText(thumbValueText, scale(val)),
      );
      return (
        <SliderThumb
          width={knob.value}
          height={knob.value}
          aria-label={thumbLabel}
          aria-orientation={orientation}
          aria-disabled={disabled || undefined}
          {...(ariaRangeProps as GetProps<typeof SliderThumb>)}
          {...(thumbPos as GetProps<typeof SliderThumb>)}
          {...(focusProps as GetProps<typeof SliderThumb>)}
          {...extraThumb}
        >
          {showLabel && labelNode != null ? (
            <SliderLabelAnchor {...s.get("labelAnchor")}>
              <SliderLabelBubble {...s.get("label")}>{labelNode}</SliderLabelBubble>
            </SliderLabelAnchor>
          ) : null}
        </SliderThumb>
      );
    };

    return (
      <SliderRoot
        ref={ref}
        orientation={orientation}
        disabled={disabled}
        paddingVertical={vertical ? 0 : knob.px / 2}
        paddingHorizontal={vertical ? knob.px / 2 : 0}
        {...s.get("root")}
        {...rest}
      >
        <SliderTrackContainer
          ref={moveRef}
          orientation={orientation}
          height={vertical ? VERTICAL_LENGTH : knob.value}
          width={vertical ? knob.value : "100%"}
          {...s.get("trackContainer")}
          {...(rootProps as GetProps<typeof SliderTrackContainer>)}
          {...(hoverHandlers as GetProps<typeof SliderTrackContainer>)}
        >
          <SliderTrack
            radius={radius}
            {...s.get("track")}
            {...(trackBase as GetProps<typeof SliderTrack>)}
          >
            <SliderBar
              radius={radius}
              {...s.get("bar")}
              {...(fill as GetProps<typeof SliderBar>)}
            />
          </SliderTrack>

          {marks?.map((mark, index) => {
            const markPct = valueToPct(mark.value, dMin, dMax);
            const filled = mark.value >= valA && mark.value <= valB;
            const dotPos: Partial<BoxProps> = vertical
              ? { bottom: pct(markPct), left: "50%", marginLeft: -3, marginBottom: -3 }
              : { left: pct(markPct), top: "50%", marginLeft: -3, marginTop: -3 };
            const labelPos: Partial<BoxProps> = vertical
              ? { left: "100%", bottom: pct(markPct), marginLeft: 8, marginBottom: -8 }
              : { top: "100%", left: pct(markPct), marginTop: 8, marginLeft: -12, minWidth: 24 };
            return (
              <React.Fragment key={index}>
                <SliderMarkDot
                  filled={filled}
                  {...s.get("mark")}
                  {...(dotPos as GetProps<typeof SliderMarkDot>)}
                />
                {mark.label != null ? (
                  <SliderMarkLabel
                    {...s.get("markLabel")}
                    {...(labelPos as GetProps<typeof SliderMarkLabel>)}
                  >
                    {mark.label}
                  </SliderMarkLabel>
                ) : null}
              </React.Fragment>
            );
          })}

          {renderThumb(0, valA, pctA)}
          {renderThumb(1, valB, pctB)}
        </SliderTrackContainer>
      </SliderRoot>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Public surfaces — sugar wrappers + composable parts                        */
/* -------------------------------------------------------------------------- */

/**
 * The styled parts exposed by both `Slider` and `RangeSlider`. `Root`/`Track`/
 * `Bar`/`Thumb`/`Mark`/`MarkLabel`/`Label` are the public composable surface; the
 * `<Slider … />` prop API is sugar that renders exactly these parts. `MarkDot` is
 * an alias of `Mark`, `TrackContainer`/`LabelAnchor` cover the remaining internals.
 */
const SLIDER_PARTS = {
  /** Outer relative root box. */
  Root: SliderRoot,
  /** Pointer hit-area carrying the `useMove` ref. */
  TrackContainer: SliderTrackContainer,
  /** The thin bar background. */
  Track: SliderTrack,
  /** The filled portion of the track. */
  Bar: SliderBar,
  /** The draggable thumb. */
  Thumb: SliderThumb,
  /** A single mark dot. */
  Mark: SliderMarkDot,
  /** A single mark dot (verbose alias of `Mark`). */
  MarkDot: SliderMarkDot,
  /** A mark's optional label. */
  MarkLabel: SliderMarkLabel,
  /** Centring/measuring box for the value bubble. */
  LabelAnchor: SliderLabelAnchor,
  /** The value-bubble text. */
  Label: SliderLabelBubble,
} as const;

export const Slider = withStaticProperties(SliderComponent, SLIDER_PARTS);

export const RangeSlider = withStaticProperties(RangeSliderComponent, SLIDER_PARTS);
