import * as React from "react";

import { type GetProps, getTokenValue, styled, withStaticProperties } from "@knitui/core";
import { useMergedRef, useRadialMove, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import { HiddenInput } from "../internal/hidden-input";
import {
  focusRingStyle,
  type SizeKey,
  squareSizeVariantFallthrough,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type AngleSliderSize = SizeKey;
type TokenValueInput = Parameters<typeof getTokenValue>[0];

/** Default diameter resolves to the `$xxl` size token (64px). */
const DEFAULT_SIZE: AngleSliderSize = "xxl";

export interface AngleSliderMark {
  /** Angle (0–359) the mark sits at. */
  value: number;
  /** Optional label rendered outside the ring. */
  label?: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Wrap any degree value into the `[0, 360)` range. */
const normalizeAngle = (deg: number): number => {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
};

/** Snap a degree value to the nearest multiple of `step`, normalized to 0–359. */
const snapAngle = (deg: number, step: number): number => {
  const snapped = Math.round(deg / step) * step;
  return normalizeAngle(snapped) % 360;
};

/** Find the entry in `values` numerically closest to `target`. */
const findClosest = (target: number, values: number[]): number =>
  values.reduce(
    (closest, val) => (Math.abs(val - target) < Math.abs(closest - target) ? val : closest),
    values[0] ?? target,
  );

const resolveSize = (size: AngleSliderSize | number): number => {
  if (typeof size === "number") return size;
  const value = getTokenValue(`$${size}` as TokenValueInput, "size");
  return typeof value === "number" ? value : 64;
};

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const AngleSliderRoot = styled(Box, {
  name: "AngleSlider",
  position: "relative",
  borderRadius: 9999,
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
  backgroundColor: "$color3",
  ...webCursor("pointer"),

  variants: {
    disabled: {
      true: { opacity: 0.6, ...webCursor("default"), pointerEvents: "none" },
    },
    size: {
      ...squareSizeVariantFallthrough,
    },
  } as const,

  defaultVariants: { size: DEFAULT_SIZE },

  ...focusRingStyle,
});

const AngleSliderLabel = styled(Text, {
  name: "AngleSliderLabel",
  fontSize: "$xs",
  color: "$color",
  userSelect: "none",
  pointerEvents: "none",
});

/** Full-height bar rotated about the ring centre; the visible knob is its top. */
const AngleSliderThumb = styled(Box, {
  name: "AngleSliderThumb",
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 3,
  marginLeft: -1.5,
  left: "50%",
  alignItems: "center",
  pointerEvents: "none",
});

const AngleSliderThumbKnob = styled(Box, {
  name: "AngleSliderThumbKnob",
  position: "absolute",
  top: 0,
  width: 3,
  borderRadius: 2,
  backgroundColor: "$color11",
});

const AngleSliderMarks = styled(Box, {
  name: "AngleSliderMarks",
  position: "absolute",
  top: 1,
  left: 1,
  right: 1,
  bottom: 1,
  borderRadius: 9999,
  pointerEvents: "none",
});

const AngleSliderMark = styled(Box, {
  name: "AngleSliderMark",
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 2,
  marginLeft: -1,
  left: "50%",
  alignItems: "center",
});

const AngleSliderMarkTick = styled(Box, {
  name: "AngleSliderMarkTick",
  position: "absolute",
  width: 1,
  backgroundColor: "$color6",
});

const AngleSliderMarkLabel = styled(Text, {
  name: "AngleSliderMarkLabel",
  position: "absolute",
  fontSize: "$xs",
  color: "$color",
  textAlign: "center",
});

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the
 * AngleSlider part surface (the 8 statics below). Each key maps to the props of
 * the part it targets, so `styles={{ thumbKnob: { backgroundColor: "$red9" } }}`
 * is sugar for `<AngleSlider.ThumbKnob backgroundColor="$red9" />`.
 */
export interface AngleSliderStyles {
  /** Props for the ring root (`AngleSlider.Frame`). */
  frame?: GetProps<typeof AngleSliderRoot>;
  /** Props for the centre value label (`AngleSlider.Label`). */
  label?: GetProps<typeof AngleSliderLabel>;
  /** Props for the rotated thumb bar (`AngleSlider.Thumb`). */
  thumb?: GetProps<typeof AngleSliderThumb>;
  /** Props for the visible thumb knob (`AngleSlider.ThumbKnob`). */
  thumbKnob?: GetProps<typeof AngleSliderThumbKnob>;
  /** Props for the marks container (`AngleSlider.Marks`). */
  marks?: GetProps<typeof AngleSliderMarks>;
  /** Props for each rotated mark wrapper (`AngleSlider.Mark`). */
  mark?: GetProps<typeof AngleSliderMark>;
  /** Props for each mark tick (`AngleSlider.MarkTick`). */
  markTick?: GetProps<typeof AngleSliderMarkTick>;
  /** Props for each mark label (`AngleSlider.MarkLabel`). */
  markLabel?: GetProps<typeof AngleSliderMarkLabel>;
}

const ANGLE_SLIDER_SLOT_KEYS = [
  "frame",
  "label",
  "thumb",
  "thumbKnob",
  "marks",
  "mark",
  "markTick",
  "markLabel",
] as const satisfies readonly (keyof AngleSliderStyles)[];

/* -------------------------------------------------------------------------- */
/* AngleSlider                                                                */
/* -------------------------------------------------------------------------- */

export interface AngleSliderProps extends Omit<
  GetProps<typeof AngleSliderRoot>,
  "onChange" | "disabled" | "size"
> {
  /** Step between values. @default 1 */
  step?: number;
  /** Controlled value (0–359). */
  value?: number;
  /** Uncontrolled initial value. @default 0 */
  defaultValue?: number;
  /** Called on every value change while dragging / on key press. */
  onChange?: (value: number) => void;
  /** Called once the selection is finished (pointer up / key press). */
  onChangeEnd?: (value: number) => void;
  /** Called when a scrub gesture starts (pointer down). */
  onScrubStart?: () => void;
  /** Called when a scrub gesture ends (pointer up). */
  onScrubEnd?: () => void;
  /** Show the current value in the centre of the ring. @default true */
  withLabel?: boolean;
  /** Marks displayed around the ring. */
  marks?: AngleSliderMark[];
  /** Diameter of the slider. Token sizes use the `$size` scale; numbers are px. @default "xxl" */
  size?: AngleSliderSize | number;
  /** Length of the thumb knob in px. Derived from `size` by default. */
  thumbSize?: number;
  /** Format the centre label from the current value. */
  formatLabel?: (value: number) => React.ReactNode;
  /** Disable interactions. @default false */
  disabled?: boolean;
  /** Restrict selectable values to the `marks` array. @default false */
  restrictToMarks?: boolean;
  /** Hidden input `name`, for uncontrolled form submission. */
  name?: string;
  /** Accessible label for the slider thumb. */
  "aria-label"?: string;
  /** Tab index of the focusable thumb. */
  tabIndex?: number;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<AngleSliderStyles>;
}

const AngleSliderComponent = AngleSliderRoot.styleable<AngleSliderProps>(
  function AngleSlider(props, ref) {
    const {
      step = 1,
      value,
      defaultValue,
      onChange,
      onChangeEnd,
      onScrubStart,
      onScrubEnd,
      withLabel = true,
      marks,
      size = DEFAULT_SIZE,
      thumbSize,
      formatLabel,
      disabled = false,
      restrictToMarks = false,
      name,
      tabIndex,
      "aria-label": ariaLabel,
      styles,
      ...rest
    } = props;
    const resolvedSize = resolveSize(size);
    const s = slotStyles<AngleSliderStyles>(styles, ANGLE_SLIDER_SLOT_KEYS, "AngleSlider");

    const [currentValue, setValue] = useUncontrolled<number>({
      value,
      defaultValue,
      finalValue: 0,
      onChange,
    });

    // Mutable mirror of the snapping props read inside the (stable) `applyValue`,
    // so the radial-move handlers never close over stale values.
    const stateRef = React.useRef({ step, marks, restrictToMarks });
    stateRef.current = { step, marks, restrictToMarks };

    const resolvedThumbSize = thumbSize ?? resolvedSize / 5;
    const knobLength = Math.min(resolvedThumbSize, resolvedSize / 2);
    const markLabelOffset = -Math.round(resolvedSize / 3);
    const markLabelMinWidth = Math.round(resolvedSize / 3.5);

    const applyValue = React.useCallback(
      (deg: number) => {
        const { step: s, marks: m, restrictToMarks: r } = stateRef.current;
        let next = snapAngle(deg, s);
        if (r && Array.isArray(m) && m.length > 0) {
          next = findClosest(
            next,
            m.map((mark) => mark.value),
          );
        }
        setValue(next);
        return next;
      },
      [setValue],
    );

    // Radial dragging: pointer events on web, gesture-responder on native.
    const { ref: rootRef, rootProps } = useRadialMove(applyValue, {
      disabled,
      onChangeEnd,
      onScrubStart,
      onScrubEnd,
    });

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      const markValues = restrictToMarks && marks ? marks.map((m) => m.value) : null;
      let next = currentValue;

      const back = event.key === "ArrowLeft" || event.key === "ArrowDown";
      const forward = event.key === "ArrowRight" || event.key === "ArrowUp";

      if (back || forward) {
        event.preventDefault();
        if (markValues && markValues.length > 0) {
          const idx = markValues.indexOf(currentValue);
          if (idx !== -1) {
            next = back
              ? markValues[idx === 0 ? markValues.length - 1 : idx - 1]
              : markValues[idx === markValues.length - 1 ? 0 : idx + 1];
          } else {
            next = findClosest(currentValue, markValues);
          }
        } else {
          next = normalizeAngle(currentValue + (back ? -step : step));
        }
      } else if (event.key === "Home") {
        next = markValues && markValues.length > 0 ? markValues[0] : 0;
      } else if (event.key === "End") {
        next = markValues && markValues.length > 0 ? markValues[markValues.length - 1] : 359;
      } else {
        return;
      }

      setValue(next);
      onChangeEnd?.(next);
    };

    const labelNode = withLabel ? (formatLabel ? formatLabel(currentValue) : currentValue) : null;

    // `tabIndex` / `onKeyDown` are web focus props outside Tamagui's typed style
    // surface — narrowed via an `object` cast (no `any`), same as elsewhere.
    const focusProps: object = {
      tabIndex: tabIndex ?? (disabled ? -1 : 0),
      onKeyDown: handleKeyDown,
    };
    return (
      <AngleSliderRoot
        ref={useMergedRef(ref, rootRef)}
        size={size}
        disabled={disabled}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={currentValue}
        aria-disabled={disabled ? true : undefined}
        aria-label={ariaLabel}
        {...s.get("frame")}
        {...(rootProps as GetProps<typeof AngleSliderRoot>)}
        {...(focusProps as GetProps<typeof AngleSliderRoot>)}
        {...rest}
      >
        {marks && marks.length > 0 ? (
          <AngleSliderMarks {...s.get("marks")}>
            {marks.map((mark, index) => (
              <AngleSliderMark key={index} {...s.get("mark")} rotate={`${mark.value}deg`}>
                <AngleSliderMarkTick
                  top={resolvedThumbSize / 3}
                  height={resolvedThumbSize / 1.5}
                  {...s.get("markTick")}
                />
                {mark.label != null ? (
                  <AngleSliderMarkLabel
                    top={markLabelOffset}
                    minWidth={markLabelMinWidth}
                    rotate={`${360 - mark.value}deg`}
                    {...s.get("markLabel")}
                  >
                    {mark.label}
                  </AngleSliderMarkLabel>
                ) : null}
              </AngleSliderMark>
            ))}
          </AngleSliderMarks>
        ) : null}

        {labelNode != null ? (
          <AngleSliderLabel {...s.get("label")}>{labelNode}</AngleSliderLabel>
        ) : null}

        <AngleSliderThumb {...s.get("thumb")} rotate={`${currentValue}deg`}>
          <AngleSliderThumbKnob height={knobLength} {...s.get("thumbKnob")} />
        </AngleSliderThumb>

        <HiddenInput name={name} value={String(currentValue)} />
      </AngleSliderRoot>
    );
  },
);

export const AngleSlider = withStaticProperties(AngleSliderComponent, {
  Frame: AngleSliderRoot,
  Label: AngleSliderLabel,
  Thumb: AngleSliderThumb,
  ThumbKnob: AngleSliderThumbKnob,
  Marks: AngleSliderMarks,
  Mark: AngleSliderMark,
  MarkTick: AngleSliderMarkTick,
  MarkLabel: AngleSliderMarkLabel,
});

export type { AngleSliderSize };
