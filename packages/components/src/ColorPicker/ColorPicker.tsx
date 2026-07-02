import * as React from "react";

import { type GetProps, getTokenValue, isWeb, styled, withStaticProperties } from "@knitui/core";
import {
  clampMovePosition,
  type MovePosition,
  useDidUpdate,
  useMove,
  useUncontrolled,
} from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { ColorSwatch, type ColorSwatchProps } from "../ColorSwatch";
import {
  type ColorFormat,
  convertHsvaTo,
  type HsvaColor,
  isColorValid,
  luminance,
  parseColor,
  round,
} from "../internal/color";
import { controlMetrics } from "../internal/control-metrics";
import {
  focusRingStyle,
  type SizeKey,
  squareSizeVariant,
  webCursor,
  webCursorStyle,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text, type TextProps } from "../Text";

export type { ColorFormat, HsvaColor } from "../internal/color";
export type ColorPickerFormat = ColorFormat;
export type ColorPickerSize = SizeKey;

/* -------------------------------------------------------------------------- */
/* Size metrics                                                               */
/* -------------------------------------------------------------------------- */

type PickerGeometry = {
  saturationHeight: number;
  width: number;
};

type SizeToken = `$${ColorPickerSize}`;
type TokenValueInput = Parameters<typeof getTokenValue>[0];

const SWATCH_GAP_PX = 4;
const MIN_SWATCH_SIZE = 16;

/**
 * The OUTER container side resolves from the shared `squareSizeVariant` — i.e.
 * the canonical `controlMetrics[key].height` token — so the picker lines up with
 * the rest of the `$size` scale instead of carrying a parallel px ladder. The
 * saturation canvas + hue slider stay genuinely custom geometry (they exceed the
 * 64px `$size` max), but they're now DERIVED from that resolved square side via a
 * fixed multiplier per axis rather than hand-rolled px constants.
 */
const WIDTH_MULTIPLIER = 6;
const SATURATION_MULTIPLIER = 3;

const resolveSquareSide = (size: ColorPickerSize): number => {
  const value = getTokenValue(squareSizeVariant[size].height as TokenValueInput, "size");
  return typeof value === "number"
    ? value
    : getTokenValue(controlMetrics.md.height as TokenValueInput, "size");
};

const getPickerGeometry = (size: ColorPickerSize): PickerGeometry => {
  const side = resolveSquareSide(size);
  return {
    width: side * WIDTH_MULTIPLIER,
    saturationHeight: side * SATURATION_MULTIPLIER,
  };
};

const toSizeToken = (size: ColorPickerSize): SizeToken => `$${size}`;

// The drag handle is a small fixed dot with its OWN scale — NOT the `$size`
// control/icon scale (`squareSizeVariant` made it 40px at md). The hue/alpha
// track is a thin full-width pill the same height as the thumb, so the round
// handle sits neatly inside it. `getThumbOffset` centres the thumb on native and
// stays exactly half of THUMB_SIZE.
const THUMB_SIZE = { xxs: 14, xs: 16, sm: 18, md: 20, lg: 24, xl: 28, xxl: 32 } as const;

const thumbSizeVariant = {
  xxs: { width: THUMB_SIZE.xxs, height: THUMB_SIZE.xxs },
  xs: { width: THUMB_SIZE.xs, height: THUMB_SIZE.xs },
  sm: { width: THUMB_SIZE.sm, height: THUMB_SIZE.sm },
  md: { width: THUMB_SIZE.md, height: THUMB_SIZE.md },
  lg: { width: THUMB_SIZE.lg, height: THUMB_SIZE.lg },
  xl: { width: THUMB_SIZE.xl, height: THUMB_SIZE.xl },
  xxl: { width: THUMB_SIZE.xxl, height: THUMB_SIZE.xxl },
} as const;

const sliderTrackVariant = {
  xxs: { height: THUMB_SIZE.xxs },
  xs: { height: THUMB_SIZE.xs },
  sm: { height: THUMB_SIZE.sm },
  md: { height: THUMB_SIZE.md },
  lg: { height: THUMB_SIZE.lg },
  xl: { height: THUMB_SIZE.xl },
  xxl: { height: THUMB_SIZE.xxl },
} as const;

const getThumbOffset = (size: ColorPickerSize): number => Math.round(THUMB_SIZE[size] / 2);

/** Percentage offset narrowed to the exact Box style-prop type (no `any`). */
const pct = (n: number): BoxProps["left"] => `${n * 100}%` as BoxProps["left"];

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const PickerWrapper = styled(Box, {
  name: "ColorPicker",
  flexDirection: "column",
  gap: "$sm",

  variants: {
    fullWidth: { true: { width: "100%" } },
  } as const,
});

const SaturationFrame = styled(Box, {
  name: "ColorPickerSaturation",
  position: "relative",
  borderRadius: "$sm",
  overflow: "hidden",
  userSelect: "none",
  ...webCursor("crosshair"),
  ...focusRingStyle,
});

const SliderFrame = styled(Box, {
  name: "ColorPickerSlider",
  position: "relative",
  borderRadius: 9999,
  overflow: "hidden",
  userSelect: "none",
  ...webCursor("pointer"),
  ...focusRingStyle,

  variants: {
    size: sliderTrackVariant,
  } as const,
});

const ThumbDot = styled(Box, {
  name: "ColorPickerThumb",
  position: "absolute",
  borderRadius: 9999,
  borderWidth: 2,
  borderColor: "$white",
  pointerEvents: "none",
  boxShadow: "0px 1px 2px 0px $dropShadowColor",

  variants: {
    size: thumbSizeVariant,
  } as const,
});

const SwatchRow = styled(Box, {
  name: "ColorPickerSwatches",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "$xxs",
});

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`), keyed 1:1 with the
 * ColorPicker part surface. Each key maps to the props of the part it targets, so
 * `styles={{ saturation: { borderRadius: "$lg" } }}` is sugar for
 * `<ColorPicker.Saturation borderRadius="$lg" />`.
 */
export interface ColorPickerStyles {
  /** Props for the outer wrapper (`ColorPicker.Frame` → `PickerWrapper`). */
  root?: GetProps<typeof PickerWrapper>;
  /** Props for the saturation area frame (`ColorPicker.Saturation`). */
  saturation?: GetProps<typeof SaturationFrame>;
  /** Props for the hue slider track (`ColorPicker.HueSlider`). */
  hueSlider?: GetProps<typeof SliderFrame>;
  /** Props for the alpha slider track (`ColorPicker.AlphaSlider`). */
  alphaSlider?: GetProps<typeof SliderFrame>;
  /** Props for every drag handle (the saturation + slider thumbs). */
  thumb?: GetProps<typeof ThumbDot>;
  /** Props for the alpha preview swatch (`ColorPicker.Preview`). */
  preview?: Partial<ColorSwatchProps>;
  /** Props for the swatch grid container (`ColorPicker.Swatches`). */
  swatches?: GetProps<typeof SwatchRow>;
  /** Props for each predefined swatch (`ColorPicker.Swatch`). */
  swatch?: Partial<ColorSwatchProps>;
}

const COLOR_PICKER_SLOT_KEYS = [
  "root",
  "saturation",
  "hueSlider",
  "alphaSlider",
  "thumb",
  "preview",
  "swatches",
  "swatch",
] as const satisfies readonly (keyof ColorPickerStyles)[];

/* -------------------------------------------------------------------------- */
/* Root context                                                               */
/* -------------------------------------------------------------------------- */

interface ColorPickerContextValue {
  /** The current committed value string (in `format`). */
  value: string;
  /** The decomposed HSVA color the sub-controls drive. */
  parsed: HsvaColor;
  size: ColorPickerSize;
  format: ColorPickerFormat;
  focusable: boolean;
  /** Whether the active `format` renders an alpha channel. */
  withAlpha: boolean;
  /** Derived width/height geometry for the picker areas. */
  geometry: PickerGeometry;
  swatchesPerRow: number;
  saturationLabel?: string;
  hueLabel?: string;
  alphaLabel?: string;
  /** Per-slot style sugar shared down to the parts. */
  styles?: SlotStyles<ColorPickerStyles>;
  /** Apply a partial HSVA change (every drag/keyboard step). */
  onPartChange: (color: Partial<HsvaColor>) => void;
  /** Commit a finished saturation drag (`s`/`v`). */
  onSaturationChangeEnd: (color: Partial<HsvaColor>) => void;
  /** Commit a finished hue drag. */
  onHueChangeEnd: (h: number) => void;
  /** Commit a finished alpha drag. */
  onAlphaChangeEnd: (a: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  /** Select a predefined swatch. */
  onSwatchSelect: (color: string) => void;
}

const ColorPickerContext = React.createContext<ColorPickerContextValue | null>(null);

const useColorPickerContext = (): ColorPickerContextValue => {
  const ctx = React.useContext(ColorPickerContext);
  if (!ctx) {
    throw new Error("ColorPicker compound components must be rendered inside <ColorPicker.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* Saturation                                                                 */
/* -------------------------------------------------------------------------- */

export interface ColorPickerSaturationProps extends GetProps<typeof SaturationFrame> {
  /** Props merged onto the drag-handle dot (under the `thumb` slot). */
  thumbProps?: GetProps<typeof ThumbDot>;
}

function ColorPickerSaturation(props: ColorPickerSaturationProps) {
  const ctx = useColorPickerContext();
  const s = slotStyles<ColorPickerStyles>(ctx.styles, COLOR_PICKER_SLOT_KEYS, "ColorPicker");
  const { thumbProps, ...rest } = props;

  const { parsed: value, value: color, size, focusable, saturationLabel, geometry } = ctx;
  const { onPartChange: onChange, onSaturationChangeEnd, onScrubStart, onScrubEnd } = ctx;

  const [position, setPosition] = React.useState<MovePosition>({
    x: value.s / 100,
    y: 1 - value.v / 100,
  });
  const positionRef = React.useRef(position);

  const { ref, rootProps } = useMove(
    ({ x, y }) => {
      positionRef.current = { x, y };
      onChange({ s: Math.round(x * 100), v: Math.round((1 - y) * 100) });
    },
    {
      onScrubStart,
      onScrubEnd: () => {
        const { x, y } = positionRef.current;
        onSaturationChangeEnd({ s: Math.round(x * 100), v: Math.round((1 - y) * 100) });
        onScrubEnd();
      },
    },
  );

  React.useEffect(() => {
    setPosition({ x: value.s / 100, y: 1 - value.v / 100 });
  }, [value.s, value.v]);

  const nudge = (next: MovePosition) => {
    const clamped = clampMovePosition(next);
    onChange({ s: Math.round(clamped.x * 100), v: Math.round((1 - clamped.y) * 100) });
    onSaturationChangeEnd({ s: Math.round(clamped.x * 100), v: Math.round((1 - clamped.y) * 100) });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const { x, y } = position;
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        nudge({ x, y: y - 0.05 });
        break;
      case "ArrowDown":
        event.preventDefault();
        nudge({ x, y: y + 0.05 });
        break;
      case "ArrowRight":
        event.preventDefault();
        nudge({ x: x + 0.05, y });
        break;
      case "ArrowLeft":
        event.preventDefault();
        nudge({ x: x - 0.05, y });
        break;
      default:
        break;
    }
  };

  const hueBase: BoxProps["backgroundColor"] =
    `hsl(${value.h}, 100%, 50%)` as BoxProps["backgroundColor"];
  const whiteGrad = { backgroundImage: "linear-gradient(90deg, #fff, transparent)" };
  const blackGrad = { backgroundImage: "linear-gradient(0deg, #000, transparent)" };
  const focusProps: Pick<GetProps<typeof SaturationFrame>, "onKeyDown" | "tabIndex"> = {
    tabIndex: focusable ? 0 : -1,
    onKeyDown: handleKeyDown,
  };
  const thumbWebStyle: GetProps<typeof ThumbDot>["style"] = isWeb
    ? { transform: "translate(-50%, -50%)" }
    : undefined;
  const thumbOffset = isWeb ? undefined : -getThumbOffset(size);

  return (
    <SaturationFrame
      ref={ref}
      height={geometry.saturationHeight}
      role="slider"
      aria-label={saturationLabel}
      aria-valuenow={Math.round(value.v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={convertHsvaTo("rgba", value)}
      {...(rootProps as GetProps<typeof SaturationFrame>)}
      {...focusProps}
      // `saturation` slot sugar is the LOWEST precedence; explicit props win.
      {...s.merge("saturation", rest)}
    >
      <Box position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor={hueBase} />
      <Box position="absolute" top={0} left={0} right={0} bottom={0} {...whiteGrad} />
      <Box position="absolute" top={0} left={0} right={0} bottom={0} {...blackGrad} />
      <ThumbDot
        size={size}
        left={pct(position.x)}
        top={pct(position.y)}
        marginLeft={thumbOffset}
        marginTop={thumbOffset}
        style={thumbWebStyle}
        backgroundColor={color as BoxProps["backgroundColor"]}
        // `thumb` slot under the deprecated `thumbProps` alias.
        {...s.merge("thumb", thumbProps)}
      />
    </SaturationFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* ColorSlider (hue + alpha) — shared engine for the two exposed parts        */
/* -------------------------------------------------------------------------- */

interface ColorSliderEngineProps {
  value: number;
  maxValue: number;
  round: boolean;
  baseColor: BoxProps["backgroundColor"];
  overlays: {
    backgroundImage: BoxProps["backgroundImage"];
  }[];
  thumbColor: string;
  size: ColorPickerSize;
  focusable: boolean;
  "aria-label"?: string;
  /** Slot key whose sugar lands on this track (`hueSlider` | `alphaSlider`). */
  slot: "hueSlider" | "alphaSlider";
  styles?: SlotStyles<ColorPickerStyles>;
  /** Props merged onto the track frame (under the slot sugar). */
  frameProps?: GetProps<typeof SliderFrame>;
  /** Props merged onto the drag-handle dot (under the `thumb` slot). */
  thumbProps?: GetProps<typeof ThumbDot>;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}

function ColorSlider(props: ColorSliderEngineProps) {
  const { value, maxValue, baseColor, overlays, thumbColor, size, focusable } = props;
  const { onChange, onChangeEnd, onScrubStart, onScrubEnd, slot, styles, frameProps, thumbProps } =
    props;
  const round_ = props.round;
  const ariaLabel = props["aria-label"];

  const s = slotStyles<ColorPickerStyles>(styles, COLOR_PICKER_SLOT_KEYS, "ColorPicker");

  const [position, setPosition] = React.useState<MovePosition>({ x: value / maxValue, y: 0 });
  const positionRef = React.useRef(position);

  const getValue = (x: number) => (round_ ? Math.round(x * maxValue) : x * maxValue);

  const { ref, rootProps } = useMove(
    ({ x, y }) => {
      positionRef.current = { x, y };
      onChange(getValue(x));
    },
    {
      onScrubStart,
      onScrubEnd: () => {
        onChangeEnd(getValue(positionRef.current.x));
        onScrubEnd();
      },
    },
  );

  React.useEffect(() => {
    setPosition({ x: value / maxValue, y: 0 });
  }, [value, maxValue]);

  const nudge = (x: number) => {
    const clamped = clampMovePosition({ x, y: 0 });
    onChange(getValue(clamped.x));
    onChangeEnd(getValue(clamped.x));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudge(position.x + 0.05);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudge(position.x - 0.05);
    }
  };

  const focusProps: Pick<GetProps<typeof SliderFrame>, "onKeyDown" | "tabIndex"> = {
    tabIndex: focusable ? 0 : -1,
    onKeyDown: handleKeyDown,
  };
  const thumbWebStyle: GetProps<typeof ThumbDot>["style"] = isWeb
    ? { transform: "translate(-50%, -50%)" }
    : undefined;
  const thumbOffset = isWeb ? undefined : -getThumbOffset(size);

  return (
    <SliderFrame
      ref={ref}
      size={size}
      backgroundColor={baseColor}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={maxValue}
      {...(rootProps as GetProps<typeof SliderFrame>)}
      {...focusProps}
      // slot sugar (`hueSlider`/`alphaSlider`) UNDER explicit frame props.
      {...s.merge(slot, frameProps)}
    >
      {overlays.map((overlay, index) => (
        <Box key={index} position="absolute" top={0} left={0} right={0} bottom={0} {...overlay} />
      ))}
      <ThumbDot
        size={size}
        left={pct(position.x)}
        top="50%"
        marginLeft={thumbOffset}
        marginTop={thumbOffset}
        style={thumbWebStyle}
        backgroundColor={thumbColor as BoxProps["backgroundColor"]}
        {...s.merge("thumb", thumbProps)}
      />
    </SliderFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* ColorPicker.HueSlider / .AlphaSlider                                       */
/* -------------------------------------------------------------------------- */

export interface ColorPickerHueSliderProps extends GetProps<typeof SliderFrame> {
  /** Props merged onto the drag-handle dot (under the `thumb` slot). */
  thumbProps?: GetProps<typeof ThumbDot>;
}

function ColorPickerHueSlider(props: ColorPickerHueSliderProps) {
  const ctx = useColorPickerContext();
  const { thumbProps, ...rest } = props;
  return (
    <ColorSlider
      value={ctx.parsed.h}
      maxValue={360}
      round
      baseColor="$color3"
      overlays={[
        {
          backgroundImage:
            "linear-gradient(to right,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(170,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))",
        },
      ]}
      thumbColor={`hsl(${ctx.parsed.h}, 100%, 50%)`}
      size={ctx.size}
      focusable={ctx.focusable}
      aria-label={ctx.hueLabel}
      slot="hueSlider"
      styles={ctx.styles}
      frameProps={rest}
      thumbProps={thumbProps}
      onChange={(h) => ctx.onPartChange({ h })}
      onChangeEnd={ctx.onHueChangeEnd}
      onScrubStart={ctx.onScrubStart}
      onScrubEnd={ctx.onScrubEnd}
    />
  );
}

export interface ColorPickerAlphaSliderProps extends GetProps<typeof SliderFrame> {
  /** Props merged onto the drag-handle dot (under the `thumb` slot). */
  thumbProps?: GetProps<typeof ThumbDot>;
}

function ColorPickerAlphaSlider(props: ColorPickerAlphaSliderProps) {
  const ctx = useColorPickerContext();
  const { thumbProps, ...rest } = props;
  return (
    <ColorSlider
      value={ctx.parsed.a}
      maxValue={1}
      round={false}
      baseColor="#ffffff"
      overlays={[
        {
          backgroundImage: `linear-gradient(90deg, transparent, ${convertHsvaTo("hex", ctx.parsed)})`,
        },
      ]}
      thumbColor={convertHsvaTo("hex", ctx.parsed)}
      size={ctx.size}
      focusable={ctx.focusable}
      aria-label={ctx.alphaLabel}
      slot="alphaSlider"
      styles={ctx.styles}
      frameProps={rest}
      thumbProps={thumbProps}
      onChange={(a) => ctx.onPartChange({ a: round(a, 2) })}
      onChangeEnd={(a) => ctx.onAlphaChangeEnd(round(a, 2))}
      onScrubStart={ctx.onScrubStart}
      onScrubEnd={ctx.onScrubEnd}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* ColorPicker.Preview — alpha-format preview swatch                          */
/* -------------------------------------------------------------------------- */

export interface ColorPickerPreviewProps extends Partial<ColorSwatchProps> {}

function ColorPickerPreview(props: ColorPickerPreviewProps) {
  const ctx = useColorPickerContext();
  const s = slotStyles<ColorPickerStyles>(ctx.styles, COLOR_PICKER_SLOT_KEYS, "ColorPicker");
  return (
    <ColorSwatch
      color={ctx.value}
      size={toSizeToken(ctx.size)}
      radius="$sm"
      {...s.merge("preview", props)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* ColorPicker.Swatch / .Swatches — the predefined swatch grid                */
/* -------------------------------------------------------------------------- */

export interface ColorPickerSwatchProps extends Partial<ColorSwatchProps> {
  /** The swatch color value (selecting it commits this color). */
  color: string;
  /** Explicit pixel side; defaults to the auto-computed grid cell. */
  size?: ColorSwatchProps["size"];
}

function ColorPickerSwatch(props: ColorPickerSwatchProps) {
  const ctx = useColorPickerContext();
  const s = slotStyles<ColorPickerStyles>(ctx.styles, COLOR_PICKER_SLOT_KEYS, "ColorPicker");
  const { color, size, children, ...rest } = props;

  const autoSize = Math.max(
    MIN_SWATCH_SIZE,
    Math.round(
      (ctx.geometry.width - (ctx.swatchesPerRow - 1) * SWATCH_GAP_PX) / ctx.swatchesPerRow,
    ),
  );
  const swatchSize = size ?? autoSize;
  const selected = ctx.value === color;
  const checkColor = (luminance(color) < 0.5 ? "#fff" : "#000") as TextProps["color"];
  const numericSize = typeof swatchSize === "number" ? swatchSize : autoSize;

  return (
    <ColorSwatch
      color={color}
      size={swatchSize}
      radius="$sm"
      style={webCursorStyle("pointer")}
      aria-label={color}
      role="button"
      onPress={() => ctx.onSwatchSelect(color)}
      {...s.merge("swatch", rest)}
    >
      {children ??
        (selected ? (
          <Text color={checkColor} fontSize={Math.round(numericSize * 0.5)} fontWeight="700">
            ✓
          </Text>
        ) : null)}
    </ColorSwatch>
  );
}

export interface ColorPickerSwatchesProps extends GetProps<typeof SwatchRow> {
  /** Predefined colors; rendered as `ColorPicker.Swatch` children when omitted no-op. */
  swatches?: string[];
}

function ColorPickerSwatches(props: ColorPickerSwatchesProps) {
  const ctx = useColorPickerContext();
  const s = slotStyles<ColorPickerStyles>(ctx.styles, COLOR_PICKER_SLOT_KEYS, "ColorPicker");
  const { swatches, children, ...rest } = props;

  // Explicit children replace the data-driven grid (the composable path).
  const content =
    children ??
    (Array.isArray(swatches) && swatches.length > 0
      ? swatches.map((swatch, index) => (
          <ColorPickerSwatch key={`${swatch}-${index}`} color={swatch} />
        ))
      : null);

  if (content == null) return null;

  return <SwatchRow {...s.merge("swatches", rest)}>{content}</SwatchRow>;
}

/* -------------------------------------------------------------------------- */
/* ColorPicker.Root — the value / HSVA / format state machine                */
/* -------------------------------------------------------------------------- */

export interface ColorPickerRootProps extends Omit<
  GetProps<typeof PickerWrapper>,
  "onChange" | "size"
> {
  /** Controlled value (any valid CSS color string). */
  value?: string;
  /** Uncontrolled initial value. @default '#FFFFFF' */
  defaultValue?: string;
  /** Called on every value change while dragging / typing. */
  onChange?: (value: string) => void;
  /** Called once a slider drag / keyboard change finishes. */
  onChangeEnd?: (value: string) => void;
  /** Output color format. `hexa`/`rgba`/`hsla` render the alpha slider. @default 'hex' */
  format?: ColorPickerFormat;
  /** Number of swatches per row (drives the auto swatch cell size). @default 7 */
  swatchesPerRow?: number;
  /** Component size. @default 'md' */
  size?: ColorPickerSize;
  /** Take 100% of the container width. @default false */
  fullWidth?: boolean;
  /** Whether slider thumbs are keyboard-focusable. @default true */
  focusable?: boolean;
  /** Saturation area `aria-label`. */
  saturationLabel?: string;
  /** Hue slider `aria-label`. */
  hueLabel?: string;
  /** Alpha slider `aria-label`. */
  alphaLabel?: string;
  /** Called when a swatch is clicked. */
  onColorSwatchClick?: (color: string) => void;
  /** Hidden input `name`, for uncontrolled form submission (web). */
  name?: string;
  /** Per-slot style sugar — shared to the parts. */
  styles?: SlotStyles<ColorPickerStyles>;
  /** `ColorPicker.Saturation` / `.HueSlider` / `.Swatches` etc. */
  children?: React.ReactNode;
}

const ColorPickerRoot = React.forwardRef<
  React.ComponentRef<typeof PickerWrapper>,
  ColorPickerRootProps
>(function ColorPickerRoot(props, ref) {
  const {
    value,
    defaultValue,
    onChange,
    onChangeEnd,
    format = "hex",
    swatchesPerRow = 7,
    size = "md",
    fullWidth = false,
    focusable = true,
    saturationLabel,
    hueLabel,
    alphaLabel,
    onColorSwatchClick,
    name,
    styles,
    children,
    ...rest
  } = props;

  const [_value, setValue] = useUncontrolled<string>({
    value,
    defaultValue,
    finalValue: "#FFFFFF",
    onChange,
  });

  const [parsed, setParsed] = React.useState<HsvaColor>(() => parseColor(_value));
  const parsedRef = React.useRef(parsed);
  parsedRef.current = parsed;
  const formatRef = React.useRef<ColorFormat>(format);
  const scrubbingRef = React.useRef(false);

  const withAlpha = format === "hexa" || format === "rgba" || format === "hsla";

  const handleChange = React.useCallback((color: Partial<HsvaColor>) => {
    const next = { ...parsedRef.current, ...color };
    parsedRef.current = next;
    setParsed(next);
    setValue(convertHsvaTo(formatRef.current, next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScrubbing = React.useCallback(() => {
    scrubbingRef.current = true;
  }, []);
  const stopScrubbing = React.useCallback(() => {
    scrubbingRef.current = false;
  }, []);

  useDidUpdate(() => {
    if (typeof value === "string" && isColorValid(value) && !scrubbingRef.current) {
      const next = parseColor(value);
      parsedRef.current = next;
      setParsed(next);
    }
  }, [value]);

  useDidUpdate(() => {
    formatRef.current = format;
    setValue(convertHsvaTo(format, parsedRef.current));
  }, [format]);

  // Memoize on `size` — `getPickerGeometry` returns a fresh object, and `geometry`
  // is a dependency of the context memo below; recomputing it every render would
  // defeat that memo and re-provide a new context value on every parent render.
  const geometry = React.useMemo(() => getPickerGeometry(size), [size]);

  const hiddenInputProps:
    | { name: string; readOnly: true; type: "hidden"; value: string }
    | undefined =
    isWeb && name ? { type: "hidden", name, value: _value, readOnly: true } : undefined;

  const onSaturationChangeEnd = React.useCallback(
    ({ s, v }: Partial<HsvaColor>) =>
      onChangeEnd?.(
        convertHsvaTo(formatRef.current, {
          ...parsedRef.current,
          s: s ?? parsedRef.current.s,
          v: v ?? parsedRef.current.v,
        }),
      ),
    [onChangeEnd],
  );

  const onHueChangeEnd = React.useCallback(
    (h: number) => onChangeEnd?.(convertHsvaTo(formatRef.current, { ...parsedRef.current, h })),
    [onChangeEnd],
  );

  const onAlphaChangeEnd = React.useCallback(
    (a: number) => onChangeEnd?.(convertHsvaTo(formatRef.current, { ...parsedRef.current, a })),
    [onChangeEnd],
  );

  const onSwatchSelect = React.useCallback(
    (color: string) => {
      setValue(color);
      if (!scrubbingRef.current) {
        const next = parseColor(color);
        parsedRef.current = next;
        setParsed(next);
      }
      onColorSwatchClick?.(color);
      onChangeEnd?.(convertHsvaTo(formatRef.current, parseColor(color)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onColorSwatchClick, onChangeEnd],
  );

  const ctx = React.useMemo<ColorPickerContextValue>(
    () => ({
      value: _value,
      parsed,
      size,
      format,
      focusable,
      withAlpha,
      geometry,
      swatchesPerRow,
      saturationLabel,
      hueLabel,
      alphaLabel,
      styles,
      onPartChange: handleChange,
      onSaturationChangeEnd,
      onHueChangeEnd,
      onAlphaChangeEnd,
      onScrubStart: startScrubbing,
      onScrubEnd: stopScrubbing,
      onSwatchSelect,
    }),
    [
      _value,
      parsed,
      size,
      format,
      focusable,
      withAlpha,
      geometry,
      swatchesPerRow,
      saturationLabel,
      hueLabel,
      alphaLabel,
      styles,
      handleChange,
      onSaturationChangeEnd,
      onHueChangeEnd,
      onAlphaChangeEnd,
      startScrubbing,
      stopScrubbing,
      onSwatchSelect,
    ],
  );

  const s = slotStyles<ColorPickerStyles>(styles, COLOR_PICKER_SLOT_KEYS, "ColorPicker");

  return (
    <ColorPickerContext.Provider value={ctx}>
      <PickerWrapper
        ref={ref}
        width={fullWidth ? undefined : geometry.width}
        fullWidth={fullWidth}
        {...s.merge("root", rest)}
      >
        {children}
        {hiddenInputProps ? <Box render="input" {...hiddenInputProps} /> : null}
      </PickerWrapper>
    </ColorPickerContext.Provider>
  );
});

/* -------------------------------------------------------------------------- */
/* Sugar wrapper — the backward-compatible <ColorPicker … /> prop API         */
/* -------------------------------------------------------------------------- */

export interface ColorPickerProps extends ColorPickerRootProps {
  /** If `false`, only the swatches are displayed. @default true */
  withPicker?: boolean;
  /** Predefined colors shown as a swatch grid below the picker. */
  swatches?: string[];
}

/**
 * `ColorPicker` — mirrors Mantine's `ColorPicker`. A draggable saturation area +
 * hue slider (+ alpha slider/preview for alpha formats) and an optional swatch
 * grid, all driven by the shared `internal/color` math and the cross-platform
 * `useMove` (pointer drag on web, gesture-responder on native). Accent comes from
 * the Tamagui `theme` prop + palette ramp, never a Mantine `color` prop.
 *
 * This prop API is sugar that renders the composable parts (`ColorPicker.Root`,
 * `.Saturation`, `.HueSlider`, `.AlphaSlider`, `.Preview`, `.Swatches`); it
 * contains no behaviour the parts lack. The `internal/color` math + `useMove`
 * are the engine.
 *
 * The saturation/hue/alpha gradient backgrounds are rendered with web-only CSS
 * `backgroundImage` (the `Overlay`/`isWeb` pattern); on native the areas fall back
 * to a solid hue / track color (documented parity gap — no cross-platform
 * gradient primitive). Dragging still works on both platforms.
 */
const ColorPickerComponent = React.forwardRef<
  React.ComponentRef<typeof PickerWrapper>,
  ColorPickerProps
>(function ColorPicker(props, ref) {
  const { withPicker = true, swatches, ...rootProps } = props;

  return (
    <ColorPickerRoot ref={ref} {...rootProps}>
      {withPicker ? (
        <>
          <ColorPickerSaturation />
          <Box flexDirection="row" alignItems="center" gap="$sm">
            <Box flex={1} flexDirection="column" gap="$xs">
              <ColorPickerHueSlider />
              <ColorPickerAlphaSliderConditional />
            </Box>
            <ColorPickerPreviewConditional />
          </Box>
        </>
      ) : null}
      <ColorPickerSwatches swatches={swatches} />
    </ColorPickerRoot>
  );
});

/**
 * The alpha slider + preview only render for alpha formats. They read
 * `withAlpha` from context so the sugar wrapper keeps the same conditional shape
 * the original component had, without lifting `withAlpha` back out of the engine.
 */
function ColorPickerAlphaSliderConditional() {
  const ctx = useColorPickerContext();
  return ctx.withAlpha ? <ColorPickerAlphaSlider /> : null;
}

function ColorPickerPreviewConditional() {
  const ctx = useColorPickerContext();
  return ctx.withAlpha ? <ColorPickerPreview /> : null;
}

export const ColorPicker = withStaticProperties(ColorPickerComponent, {
  /** State machine: value / HSVA / format + geometry context. Renders `PickerWrapper`. */
  Root: ColorPickerRoot,
  /** The outer wrapper styled frame. */
  Frame: PickerWrapper,
  /** The draggable saturation/value area. */
  Saturation: ColorPickerSaturation,
  /** The hue slider track. */
  HueSlider: ColorPickerHueSlider,
  /** The alpha slider track (only meaningful for alpha formats). */
  AlphaSlider: ColorPickerAlphaSlider,
  /** The alpha-format preview swatch. */
  Preview: ColorPickerPreview,
  /** The predefined swatch grid container. */
  Swatches: ColorPickerSwatches,
  /** A single predefined swatch (commits its color on press). */
  Swatch: ColorPickerSwatch,
});
