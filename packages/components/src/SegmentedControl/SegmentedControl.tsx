import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { HiddenInput } from "../internal/hidden-input";
import { useReducedTransition } from "../internal/motion";
import {
  animateOnlyProps,
  controlFontVariant,
  controlVariant,
  focusRingStyle,
  radiusVariant,
  shadowVariant,
  type SizeKey,
  timedTransition,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type SegmentedControlSize = SizeKey;
type SegmentedControlOrientation = "horizontal" | "vertical";

/** A single option — either a bare string or `{ value, label, disabled }`. */
export interface SegmentedControlItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

const SegmentedControlContext = createStyledContext<{
  size: SegmentedControlSize;
  orientation: SegmentedControlOrientation;
}>({
  size: "md",
  orientation: "horizontal",
});

/**
 * Mirrors Mantine's `SegmentedControl` — a single-select row (or column) of
 * mutually-exclusive options. The active option sits on a raised `$background`
 * indicator that slides animatedly over a `$color3` track. Accent comes from
 * the active theme's palette ramp via the `theme` prop, never a Mantine `color`
 * prop.
 */
const SegmentedControlRoot = styled(Box, {
  name: "SegmentedControl",
  context: SegmentedControlContext,
  backgroundColor: "$color3",
  alignSelf: "flex-start",
  position: "relative",

  variants: {
    orientation: {
      horizontal: { flexDirection: "row" },
      vertical: { flexDirection: "column" },
    },
    size: {
      xxs: { padding: "$xxs", borderRadius: "$xs" },
      xs: { padding: "$xxs", borderRadius: "$sm" },
      sm: { padding: "$xxs", borderRadius: "$sm" },
      md: { padding: "$xxs", borderRadius: "$md" },
      lg: { padding: "$xxs", borderRadius: "$md" },
      xl: { padding: "$xxs", borderRadius: "$lg" },
      xxl: { padding: "$xxs", borderRadius: "$lg" },
    },
    radius: radiusVariant,
    shadow: shadowVariant,
    fullWidth: {
      true: { alignSelf: "stretch", width: "100%" },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { orientation: "horizontal", size: "md" },
});

/** Border-radius tokens matching each size's control variant, for the control + floating indicator. */
const INDICATOR_RADIUS = {
  xxs: "$xxs",
  xs: "$xs",
  sm: "$xs",
  md: "$sm",
  lg: "$sm",
  xl: "$md",
  xxl: "$md",
} as const satisfies Record<SegmentedControlSize, string>;

/** One pressable segment. Background is transparent — the floating indicator handles the active look. */
const SegmentedControlControl = styled(Box, {
  name: "SegmentedControlControl",
  context: SegmentedControlContext,
  alignItems: "center",
  justifyContent: "center",
  ...webCursor("pointer"),
  userSelect: "none",
  backgroundColor: "transparent",
  zIndex: 1,
  ...focusRingStyle,

  variants: {
    size: {
      xxs: { ...controlVariant.xxs, borderRadius: INDICATOR_RADIUS.xxs },
      xs: { ...controlVariant.xs, borderRadius: INDICATOR_RADIUS.xs },
      sm: { ...controlVariant.sm, borderRadius: INDICATOR_RADIUS.sm },
      md: { ...controlVariant.md, borderRadius: INDICATOR_RADIUS.md },
      lg: { ...controlVariant.lg, borderRadius: INDICATOR_RADIUS.lg },
      xl: { ...controlVariant.xl, borderRadius: INDICATOR_RADIUS.xl },
      xxl: { ...controlVariant.xxl, borderRadius: INDICATOR_RADIUS.xxl },
    },
    active: {
      // Keep variant for API/type parity — visual is handled by the floating indicator.
      true: {},
      false: {
        hoverStyle: { backgroundColor: "$color4" },
      },
    },
    grow: {
      true: { flex: 1 },
    },
    itemDisabled: {
      true: { opacity: 0.45, pointerEvents: "none", ...webCursor("default") },
    },
  } as const,

  defaultVariants: { size: "md" },
});

const SegmentedControlLabel = styled(Text, {
  name: "SegmentedControlLabel",
  context: SegmentedControlContext,
  fontWeight: "500",
  userSelect: "none",
  numberOfLines: 1,

  variants: {
    size: {
      ...controlFontVariant,
    },
    active: {
      true: { color: "$color12" },
      false: { color: "$color11" },
    },
  } as const,
});

/**
 * Slot → part-props map for SegmentedControl's uniform `styles` prop (Pillar B /
 * `internal/styles.ts`). Each key resolves to props spread onto the matching
 * styled part, so `styles={{ root, control, label }}` is thin sugar over the
 * composable parts (`SegmentedControl.Root` / `.Control` / `.Label`).
 */
export interface SegmentedControlSlots {
  /** The outer `SegmentedControlRoot` track. */
  root: Partial<GetProps<typeof SegmentedControlRoot>>;
  /** Each pressable `SegmentedControlControl` segment. */
  control: Partial<GetProps<typeof SegmentedControlControl>>;
  /** The `SegmentedControlLabel` text inside each segment. */
  label: Partial<GetProps<typeof SegmentedControlLabel>>;
}

export const SEGMENTED_CONTROL_SLOTS = [
  "root",
  "control",
  "label",
] as const satisfies readonly (keyof SegmentedControlSlots)[];

export interface SegmentedControlProps extends Omit<
  GetProps<typeof SegmentedControlRoot>,
  "children" | "disabled" | "fullWidth" | "onChange" | "orientation" | "size"
> {
  /** Options to render — bare strings or `{ value, label, disabled }`. */
  data: (string | SegmentedControlItem)[];
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called when the selected value changes. */
  onChange?: (value: string) => void;
  /** Visual size. @default "md" */
  size?: SegmentedControlSize;
  /** Layout direction. @default "horizontal" */
  orientation?: SegmentedControlOrientation;
  /** Stretch to fill the parent's width. @default false */
  fullWidth?: boolean;
  /** Disable the whole control. */
  disabled?: boolean;
  /** Prevent changing the value (still selectable for display). */
  readOnly?: boolean;
  /** Draw thin separators between items. @default true */
  withItemsBorders?: boolean;
  /** Accessibility group name (parity). */
  name?: string;
  /** Accepted for API parity; ramp already contrasts, so this is a no-op. */
  autoContrast?: boolean;
  /** Indicator slide duration in ms. @default 200 */
  transitionDuration?: number;
  /** Indicator slide easing (`"ease"`, `"linear"`, `"ease-in-out"`, …). @default "ease" */
  transitionTimingFunction?: string;
  /**
   * Uniform per-slot style passthrough — sugar over the parts. Slots: `root` /
   * `control` / `label`. Lowest precedence: explicit props on the parts win.
   */
  styles?: SlotStyles<SegmentedControlSlots>;
}

interface ItemLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SegmentedControlHiddenInputProps {
  name?: string;
  value: string;
  disabled?: boolean;
}

const normalize = (item: string | SegmentedControlItem): SegmentedControlItem =>
  typeof item === "string" ? { value: item, label: item } : item;

function SegmentedControlHiddenInput(props: SegmentedControlHiddenInputProps) {
  const { name, value, disabled } = props;
  return <HiddenInput name={name} value={value} disabled={disabled} />;
}

const SegmentedControlBase = SegmentedControlRoot.styleable<SegmentedControlProps>(
  function SegmentedControl(props, ref) {
    const {
      data,
      value,
      defaultValue,
      onChange,
      size = "md",
      orientation = "horizontal",
      fullWidth = false,
      disabled = false,
      readOnly = false,
      withItemsBorders = true,
      name,
      autoContrast: _autoContrast,
      transitionDuration = 200,
      transitionTimingFunction = "ease",
      styles,
      ...rest
    } = props;

    const indicatorTransition = useReducedTransition(
      timedTransition(transitionDuration, transitionTimingFunction),
    );

    const s = slotStyles<SegmentedControlSlots>(
      styles,
      SEGMENTED_CONTROL_SLOTS,
      "SegmentedControl",
    );

    const items = React.useMemo(() => data.map(normalize), [data]);
    const [current, setValue] = useUncontrolled<string>({
      value,
      defaultValue,
      finalValue: items[0]?.value ?? "",
      onChange,
    });

    /** Stores the measured layout of every item keyed by value. */
    const layoutsRef = React.useRef<Record<string, ItemLayout>>({});

    /** The layout of the currently active item — drives the floating indicator position. */
    const [activeLayout, setActiveLayout] = React.useState<ItemLayout | null>(null);

    /** When the active value changes, slide the indicator to the new item's position. */
    React.useEffect(() => {
      const layout = layoutsRef.current[current];
      if (layout) setActiveLayout(layout);
    }, [current]);

    const enabledValues = React.useMemo(
      () => items.filter((item) => !item.disabled).map((item) => item.value),
      [items],
    );
    const rovingValue = enabledValues.includes(current) ? current : enabledValues[0];

    const handlePress = (item: SegmentedControlItem) => {
      if (readOnly || disabled || item.disabled) return;
      if (item.value !== current) setValue(item.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled || readOnly || enabledValues.length === 0) return;
      const horizontal = orientation === "horizontal";
      const nextKey = horizontal ? "ArrowRight" : "ArrowDown";
      const prevKey = horizontal ? "ArrowLeft" : "ArrowUp";
      const { key } = event;
      if (key === " " || key === "Enter") {
        event.preventDefault();
        const radios = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'),
        );
        const focusedIndex = radios.indexOf(event.target as HTMLElement);
        const focusedItem = focusedIndex >= 0 ? items[focusedIndex] : undefined;
        if (focusedItem) handlePress(focusedItem);
        return;
      }
      if (key !== nextKey && key !== prevKey && key !== "Home" && key !== "End") return;

      event.preventDefault();
      const currentIndex = Math.max(0, enabledValues.indexOf(current));
      let nextIndex: number;
      if (key === "Home") nextIndex = 0;
      else if (key === "End") nextIndex = enabledValues.length - 1;
      else if (key === nextKey) nextIndex = (currentIndex + 1) % enabledValues.length;
      else nextIndex = (currentIndex - 1 + enabledValues.length) % enabledValues.length;

      const nextValue = enabledValues[nextIndex];
      const nextItem = items.find((item) => item.value === nextValue);
      if (nextItem) {
        handlePress(nextItem);
        const radios = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]'),
        ).filter((radio) => radio.getAttribute("aria-disabled") !== "true");
        radios[nextIndex]?.focus();
      }
    };

    const keyboardProps: object = { onKeyDown: handleKeyDown };
    const sepColor: BoxProps["backgroundColor"] = "$color5";

    return (
      <SegmentedControlRoot
        ref={ref}
        size={size}
        orientation={orientation}
        fullWidth={fullWidth}
        disabled={disabled}
        role="radiogroup"
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        {...keyboardProps}
        {...s.get("root")}
        {...rest}
      >
        <SegmentedControlHiddenInput name={name} value={current} disabled={disabled} />

        {/* Floating animated indicator — rendered first so it sits below item content.
            The slide animates the layout props left/top/width/height (deferred the
            transform-based slide: segments may differ in size, so a scaleX/scaleY
            slide would distort the indicator's border-radius + shadow and regress the
            look — kept the layout animation, scoped via animateOnly). Honors the
            component's transitionDuration/transitionTimingFunction; null when reduced
            motion is requested so the indicator snaps to position. */}
        {activeLayout ? (
          <Box
            position="absolute"
            left={activeLayout.x}
            top={activeLayout.y}
            width={activeLayout.width}
            height={activeLayout.height}
            backgroundColor="$background"
            borderRadius={INDICATOR_RADIUS[size]}
            boxShadow="0px 1px 4px 0px $dropShadowColor"
            {...indicatorTransition}
            {...animateOnlyProps(["left", "top", "width", "height"])}
            zIndex={0}
            pointerEvents="none"
          />
        ) : null}

        {items.map((item, index) => {
          const active = item.value === current;
          const prevActive = index > 0 && items[index - 1]?.value === current;
          const showSeparator = withItemsBorders && index > 0 && !active && !prevActive;
          return (
            <React.Fragment key={item.value}>
              {showSeparator ? (
                <Box
                  backgroundColor={sepColor}
                  alignSelf="center"
                  zIndex={1}
                  {...(orientation === "horizontal"
                    ? { width: 1, height: "60%" }
                    : { height: 1, width: "60%" })}
                />
              ) : null}
              <SegmentedControlControl
                size={size}
                active={active}
                grow={fullWidth}
                itemDisabled={item.disabled}
                role="radio"
                aria-checked={active}
                aria-disabled={disabled || item.disabled || undefined}
                tabIndex={!disabled && !item.disabled && item.value === rovingValue ? 0 : -1}
                {...s.get("control")}
                onPress={() => handlePress(item)}
                onLayout={(e) => {
                  const { x, y, width, height } = e.nativeEvent.layout;
                  layoutsRef.current[item.value] = { x, y, width, height };
                  if (item.value === current) {
                    setActiveLayout({ x, y, width, height });
                  }
                }}
              >
                {typeof item.label === "string" || typeof item.label === "number" ? (
                  <SegmentedControlLabel size={size} active={active} {...s.get("label")}>
                    {item.label}
                  </SegmentedControlLabel>
                ) : (
                  item.label
                )}
              </SegmentedControlControl>
            </React.Fragment>
          );
        })}
      </SegmentedControlRoot>
    );
  },
);

export const SegmentedControl = withStaticProperties(SegmentedControlBase, {
  Root: SegmentedControlRoot,
  Control: SegmentedControlControl,
  Label: SegmentedControlLabel,
});

export type { SegmentedControlOrientation, SegmentedControlSize };
