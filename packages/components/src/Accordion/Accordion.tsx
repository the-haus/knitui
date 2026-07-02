import * as React from "react";

import { DURATIONS, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useId, useKeyboardActions, useUncontrolled } from "@knitui/hooks";
import { IconChevronDown } from "@knitui/icons";

import { Box, type BoxProps } from "../Box";
import { Collapse } from "../Collapse";
import { controlMetrics as M } from "../internal/control-metrics";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { useReducedTransition } from "../internal/motion";
import {
  controlFontVariant,
  controlVariant,
  focusRingStyle,
  radiusVariant,
  type SizeKey,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type AccordionVariant = "default" | "contained" | "filled" | "separated";
export type AccordionChevronPosition = "left" | "right";
export type AccordionHeadingOrder = 2 | 3 | 4 | 5 | 6;
export type AccordionSize = SizeKey;

/**
 * Default chevron icon size (px) per accordion `size` key — tuned a touch below
 * the header label so the chevron reads as a quiet affordance rather than a
 * second glyph. Deliberately NOT the `CONTROL_ICON_SIZE` ladder (those px are
 * sized for in-control leading icons, ~1.1–1.2× the font — too heavy for a
 * trailing chevron), so the bespoke table is kept and fed straight to
 * `IconChevronDown`'s `size`. Used only when neither `chevron` nor
 * `chevronIconSize` is set by the consumer.
 */
const CHEVRON_GLYPH_SIZE: Record<AccordionSize, number> = {
  xxs: 10,
  xs: 12,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
};

type AccordionValue<Multiple extends boolean> = Multiple extends true ? string[] : string | null;

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface AccordionContextValue {
  isItemActive: (value: string) => boolean;
  onChange: (value: string) => void;
  variant: AccordionVariant;
  size: AccordionSize;
  radius: string | number;
  chevronPosition: AccordionChevronPosition;
  chevron: React.ReactNode;
  /** Size of the chevron container (`'auto'` = no fixed slot). */
  chevronSize: number | string;
  /** Size of the default chevron glyph; ignored when a custom `chevron` is set. */
  chevronIconSize: number | string | undefined;
  disableChevronRotation: boolean;
  keepMounted: boolean;
  transitionDuration: number;
  transitionTimingFunction: string;
  /** Heading level for `Accordion.Control` (`role="heading"` + `aria-level`). */
  order?: AccordionHeadingOrder;
}

const AccordionContext = React.createContext<AccordionContextValue>({
  isItemActive: () => false,
  onChange: () => {},
  variant: "default",
  size: "md",
  radius: "md",
  chevronPosition: "right",
  chevron: null,
  chevronSize: "auto",
  chevronIconSize: undefined,
  disableChevronRotation: false,
  keepMounted: true,
  transitionDuration: 200,
  transitionTimingFunction: "ease",
  order: undefined,
});

interface AccordionItemContextValue {
  value: string;
  isActive: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue>({
  value: "",
  isActive: false,
});

/**
 * Carries the uniform per-slot `styles` map (Pillar B / `internal/styles.ts`)
 * down to the generated parts. `Accordion.Item`/`.Control`/`.Panel` are rendered
 * by the consumer, so the styled-context can't hold the map — this plain React
 * context distributes it so `<Accordion styles={{ control }} />` reaches every
 * nested part. Explicit inline props on a composed part always win.
 */
const AccordionSlotStylesContext = React.createContext<SlotStyles<AccordionStyles> | undefined>(
  undefined,
);

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const AccordionRoot = styled(Box, {
  name: "Accordion",
  flexDirection: "column",

  variants: {
    variant: {
      default: {},
      contained: {
        borderWidth: 1,
        borderColor: "$borderColor",
        borderRadius: "$md",
        overflow: "hidden",
      },
      filled: { backgroundColor: "$color2", borderRadius: "$md", overflow: "hidden" },
      separated: { gap: "$xs" },
    },
    radius: radiusVariant,
  } as const,
  defaultVariants: { variant: "default" },
});

const AccordionItemFrame = styled(Box, {
  name: "AccordionItem",
  flexDirection: "column",
  overflow: "hidden",

  variants: {
    variant: {
      default: { borderBottomWidth: 1, borderBottomColor: "$borderColor" },
      contained: { borderBottomWidth: 1, borderBottomColor: "$borderColor" },
      filled: {},
      separated: {
        borderWidth: 1,
        borderColor: "$borderColor",
        borderRadius: "$sm",
        overflow: "hidden",
      },
    },
    active: { true: {} },
  } as const,
  defaultVariants: { variant: "default" },
});

const AccordionControlFrame = styled(Box, {
  name: "AccordionControl",
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: "$sm",
  ...webCursor("pointer"),
  userSelect: "none",

  variants: {
    // Header `paddingHorizontal` + `minHeight` + `gap` derive from the shared
    // `controlMetrics` row so a larger `size` accordion gets a taller, roomier
    // header that matches a control of the same key.
    size: {
      xxs: { ...controlVariant.xxs, height: undefined, minHeight: M.xxs.height, gap: M.xxs.gap },
      xs: { ...controlVariant.xs, height: undefined, minHeight: M.xs.height, gap: M.xs.gap },
      sm: { ...controlVariant.sm, height: undefined, minHeight: M.sm.height, gap: M.sm.gap },
      md: { ...controlVariant.md, height: undefined, minHeight: M.md.height, gap: M.md.gap },
      lg: { ...controlVariant.lg, height: undefined, minHeight: M.lg.height, gap: M.lg.gap },
      xl: { ...controlVariant.xl, height: undefined, minHeight: M.xl.height, gap: M.xl.gap },
      xxl: { ...controlVariant.xxl, height: undefined, minHeight: M.xxl.height, gap: M.xxl.gap },
    },
    variant: {
      default: {
        hoverStyle: { backgroundColor: "$color2" },
        pressStyle: { backgroundColor: "$color3" },
      },
      contained: {
        hoverStyle: { backgroundColor: "$color2" },
        pressStyle: { backgroundColor: "$color3" },
      },
      filled: {
        hoverStyle: { backgroundColor: "$color3" },
        pressStyle: { backgroundColor: "$color4" },
      },
      separated: {
        hoverStyle: { backgroundColor: "$color2" },
        pressStyle: { backgroundColor: "$color3" },
      },
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none" },
    },
  } as const,

  ...focusRingStyle,
  defaultVariants: { variant: "default", size: "md" },
});

const AccordionChevronIcon = styled(Box, {
  name: "AccordionChevronIcon",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export interface AccordionChevronProps {
  /** Icon size in px. @default 14 (the kit's chevron default) */
  size?: number | string;
}

/**
 * Standalone default chevron — usable as `Accordion.Chevron` (Mantine parity).
 * Renders the `@knitui/icons` down chevron, colored to the control text (`$color`)
 * via `ControlIconProvider` so it tracks the active theme cross-platform. The
 * size flows straight to the icon (it is already a px value, not a size key).
 */
function AccordionChevron({ size = 14 }: AccordionChevronProps): React.ReactElement {
  return (
    <ControlIconProvider color="$color">
      <IconChevronDown size={size} />
    </ControlIconProvider>
  );
}

const AccordionLabel = styled(Text, {
  name: "AccordionLabel",
  flex: 1,
  fontWeight: "500",
  color: "$color",
  userSelect: "none",

  variants: {
    // Header label font scales off the same `size` key as the header (balanced
    // control-font ladder, clamped at the bottom two steps).
    size: {
      ...controlFontVariant,
    },
  } as const,
  defaultVariants: { size: "md" },
});

const AccordionPanelFrame = styled(Box, {
  name: "AccordionPanel",
  paddingHorizontal: "$md",
  paddingVertical: "$sm",
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ control: { … } }}` is sugar for an
 * inline prop on every `Accordion.Control`. Distributed via
 * `AccordionSlotStylesContext` so it reaches the consumer-rendered parts.
 */
export interface AccordionStyles {
  /** Props for the `Accordion` root (`.Root`). */
  root?: GetProps<typeof AccordionRoot>;
  /** Props for each `Accordion.Item` (`.Item`) — its stylable frame surface.
   * `variant` is context-driven; `value`/`children` are the part's own (identity
   * + content), so the sugar targets the frame like the sibling slots do. */
  item?: Omit<GetProps<typeof AccordionItemFrame>, "variant">;
  /** Props for each `Accordion.Control` header (`.Control`). */
  control?: AccordionControlProps;
  /** Props for the label text inside each control (`.Label`). */
  label?: GetProps<typeof AccordionLabel>;
  /** Props for the chevron container wrapping the glyph (`.Chevron`). */
  chevron?: GetProps<typeof AccordionChevronIcon>;
  /** Props for each `Accordion.Panel` (`.Panel`). */
  panel?: AccordionPanelProps;
}

const ACCORDION_SLOT_KEYS = [
  "root",
  "item",
  "control",
  "label",
  "chevron",
  "panel",
] as const satisfies readonly (keyof AccordionStyles)[];

const useAccordionSlots = () =>
  slotStyles<AccordionStyles>(
    React.useContext(AccordionSlotStylesContext),
    ACCORDION_SLOT_KEYS,
    "Accordion",
  );

/* -------------------------------------------------------------------------- */
/* Accordion.Item                                                             */
/* -------------------------------------------------------------------------- */

export interface AccordionItemProps extends Omit<GetProps<typeof AccordionItemFrame>, "variant"> {
  /** Value that uniquely identifies this item within its `Accordion`. */
  value: string;
  /** Content: `Accordion.Control` + `Accordion.Panel`. */
  children?: React.ReactNode;
}

const AccordionItem = AccordionItemFrame.styleable<AccordionItemProps>(
  function AccordionItem(props, ref) {
    const { value, children, ...rest } = props;
    const ctx = React.useContext(AccordionContext);
    const s = useAccordionSlots();
    const isActive = ctx.isItemActive(value);

    return (
      <AccordionItemContext.Provider value={{ value, isActive }}>
        <AccordionItemFrame
          ref={ref}
          variant={ctx.variant}
          active={isActive}
          // `item` slot sugar sits UNDER the explicit per-part props (`rest`).
          {...s.merge("item", rest)}
        >
          {children}
        </AccordionItemFrame>
      </AccordionItemContext.Provider>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Accordion.Control                                                          */
/* -------------------------------------------------------------------------- */

export interface AccordionControlProps extends Omit<
  GetProps<typeof AccordionControlFrame>,
  "variant"
> {
  /** Icon displayed to the left of the label. */
  icon?: React.ReactNode;
  /** Disables this control. @default false */
  disabled?: boolean;
  /** Label content. */
  children?: React.ReactNode;
}

const AccordionControl = AccordionControlFrame.styleable<AccordionControlProps>(
  function AccordionControl(props, ref) {
    const { icon, disabled, children, ...rest } = props;
    const ctx = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);
    const s = useAccordionSlots();

    const shouldRotateChevron = !ctx.disableChevronRotation;
    const chevronTransition = useReducedTransition(shouldRotateChevron ? "fast" : null);

    const handlePress = React.useCallback(() => {
      if (!disabled) ctx.onChange(item.value);
    }, [disabled, ctx, item.value]);

    // AccordionControlFrame is a plain `Box` (`<div role="button">`), so without
    // this it can't take keyboard focus and its `focusRingStyle` outline never
    // fires. `useKeyboardActions` makes it focusable + activatable on web and maps
    // to accessibility actions on native (see `FOCUS_RING` in variant-colors.ts).
    const focusProps = useKeyboardActions({ onActivate: handlePress }, { disabled });

    const chevronContent = (
      <AccordionChevronIcon
        // `chevron` slot sugar sits UNDER the explicit rotation/transition props.
        {...s.get("chevron")}
        rotate={shouldRotateChevron && item.isActive ? "180deg" : "0deg"}
        {...chevronTransition}
      >
        {ctx.chevron ?? (
          <AccordionChevron size={ctx.chevronIconSize ?? CHEVRON_GLYPH_SIZE[ctx.size]} />
        )}
      </AccordionChevronIcon>
    );

    // `chevronSize` gives every chevron (custom or default) a fixed centered slot;
    // `'auto'` keeps the chevron at its intrinsic size (unchanged behaviour).
    const chevron =
      ctx.chevronSize === "auto" ? (
        chevronContent
      ) : (
        <Box
          width={ctx.chevronSize as BoxProps["width"]}
          height={ctx.chevronSize as BoxProps["height"]}
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {chevronContent}
        </Box>
      );

    const control = (
      <AccordionControlFrame
        ref={ref}
        variant={ctx.variant}
        size={ctx.size}
        disabled={disabled}
        onPress={handlePress}
        role="button"
        aria-expanded={item.isActive}
        // `control` slot sugar sits UNDER the explicit per-part props (`rest`).
        {...s.merge("control", rest)}
        {...focusProps}
      >
        {ctx.chevronPosition === "left" ? chevron : null}
        {/* A leading `@knitui/icons` icon auto-sizes to the header `size` and takes
            the control text color (`$color`), matching the label beside it. */}
        {icon ? (
          <Box>
            <ControlIconProvider size={ctx.size} color="$color">
              {icon}
            </ControlIconProvider>
          </Box>
        ) : null}
        <AccordionLabel size={ctx.size} {...s.get("label")}>
          {children}
        </AccordionLabel>
        {ctx.chevronPosition === "right" ? chevron : null}
      </AccordionControlFrame>
    );

    // When `order` is set, expose the control at a real WAI-ARIA heading level
    // (Mantine's `<h{order} role="heading" aria-level>`); the pressable button
    // stays inside. Without `order`, render the control as-is (additive).
    return ctx.order != null ? (
      <Box role="heading" aria-level={ctx.order}>
        {control}
      </Box>
    ) : (
      control
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Accordion.Panel                                                            */
/* -------------------------------------------------------------------------- */

export interface AccordionPanelProps extends GetProps<typeof AccordionPanelFrame> {
  /** Panel content. */
  children?: React.ReactNode;
}

const AccordionPanel = AccordionPanelFrame.styleable<AccordionPanelProps>(
  function AccordionPanel(props, ref) {
    const { children, ...rest } = props;
    const ctx = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);
    const s = useAccordionSlots();

    return (
      <Collapse
        expanded={item.isActive}
        keepMounted={ctx.keepMounted}
        transitionDuration={ctx.transitionDuration}
        transitionTimingFunction={ctx.transitionTimingFunction}
      >
        <AccordionPanelFrame
          ref={ref}
          role="region"
          aria-hidden={!item.isActive}
          // `panel` slot sugar sits UNDER the explicit per-part props (`rest`).
          {...s.merge("panel", rest)}
        >
          {children}
        </AccordionPanelFrame>
      </Collapse>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Accordion (root)                                                           */
/* -------------------------------------------------------------------------- */

export interface AccordionProps<Multiple extends boolean = false> extends Omit<
  GetProps<typeof AccordionRoot>,
  "variant" | "onChange"
> {
  /** Allow multiple items open simultaneously. @default false */
  multiple?: Multiple;
  /** Controlled value. */
  value?: AccordionValue<Multiple>;
  /** Uncontrolled initial value. */
  defaultValue?: AccordionValue<Multiple>;
  /** Called when value changes. */
  onChange?: (value: AccordionValue<Multiple>) => void;
  /** Visual style. @default 'default' */
  variant?: AccordionVariant;
  /**
   * Control size — scales the header `paddingHorizontal`/`minHeight`, the label
   * font, and the default chevron glyph off the shared `controlMetrics` row.
   * @default 'md'
   */
  size?: AccordionSize;
  /** Corner rounding. @default 'md' */
  radius?: string | number;
  /** Custom chevron icon. */
  chevron?: React.ReactNode;
  /** Position of the chevron. @default 'right' */
  chevronPosition?: AccordionChevronPosition;
  /** Size of the chevron container — gives every chevron a fixed centered slot. @default 'auto' */
  chevronSize?: number | string;
  /**
   * Size of the default chevron glyph; ignored when a custom `chevron` is set.
   * When unset the glyph keeps the kit's default size (14px) — a deliberate
   * divergence from Mantine's 16 so a plain `<Accordion>` is pixel-identical.
   */
  chevronIconSize?: number | string;
  /** Disable the default chevron rotation animation. @default false */
  disableChevronRotation?: boolean;
  /** Keep inactive panels mounted (hidden). @default true */
  keepMounted?: boolean;
  /** Panel expand/collapse transition duration in ms. @default 200 */
  transitionDuration?: number;
  /** Panel expand/collapse transition timing function. @default 'ease' */
  transitionTimingFunction?: string;
  /**
   * Heading level at which `Accordion.Control` is announced — renders the control
   * inside `role="heading"` + `aria-level={order}`. When unset, the control has no
   * heading semantics (a plain pressable). @default undefined
   */
  order?: AccordionHeadingOrder;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts.
   * Slots: `root` / `item` / `control` / `label` / `chevron` / `panel`.
   * Distributed through context so it reaches every nested part. Explicit inline
   * props on a composed part always win.
   */
  styles?: SlotStyles<AccordionStyles>;
  /** `Accordion.Item` children. */
  children?: React.ReactNode;
}

function AccordionComponent<Multiple extends boolean = false>(
  props: AccordionProps<Multiple>,
): React.ReactElement {
  const {
    multiple,
    value,
    defaultValue,
    onChange,
    variant = "default",
    size = "md",
    radius = "md",
    chevron,
    chevronPosition = "right",
    chevronSize = "auto",
    chevronIconSize,
    disableChevronRotation = false,
    keepMounted = true,
    transitionDuration = DURATIONS.base,
    transitionTimingFunction = "ease",
    order,
    styles,
    children,
    ...rest
  } = props;

  const _id = useId();

  // Internal state for multiple vs single
  const [internalValue, setInternalValue] = useUncontrolled<AccordionValue<Multiple>>({
    value,
    defaultValue,
    finalValue: (multiple ? [] : null) as AccordionValue<Multiple>,
    onChange,
  });

  const isItemActive = React.useCallback(
    (val: string): boolean => {
      if (multiple) {
        return Array.isArray(internalValue) && internalValue.includes(val);
      }
      return internalValue === val;
    },
    [internalValue, multiple],
  );

  const handleChange = React.useCallback(
    (val: string) => {
      if (multiple) {
        const current = (Array.isArray(internalValue) ? internalValue : []) as string[];
        const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
        setInternalValue(next as AccordionValue<Multiple>);
      } else {
        const next = internalValue === val ? null : val;
        setInternalValue(next as AccordionValue<Multiple>);
      }
    },
    [internalValue, multiple, setInternalValue],
  );

  const ctx = React.useMemo<AccordionContextValue>(
    () => ({
      isItemActive,
      onChange: handleChange,
      variant,
      size,
      radius,
      chevronPosition,
      chevron: chevron ?? null,
      chevronSize,
      chevronIconSize,
      disableChevronRotation,
      keepMounted,
      transitionDuration,
      transitionTimingFunction,
      order,
    }),
    [
      isItemActive,
      handleChange,
      variant,
      size,
      radius,
      chevronPosition,
      chevron,
      chevronSize,
      chevronIconSize,
      disableChevronRotation,
      keepMounted,
      transitionDuration,
      transitionTimingFunction,
      order,
    ],
  );

  const rootSlot = (styles?.root ?? {}) as GetProps<typeof AccordionRoot>;

  return (
    <AccordionContext.Provider value={ctx}>
      <AccordionSlotStylesContext.Provider value={styles}>
        <AccordionRoot
          // `root` slot sugar sits UNDER the controlled + explicit per-part props.
          {...rootSlot}
          variant={variant}
          radius={typeof radius === "string" ? radius : undefined}
          borderRadius={typeof radius === "number" ? radius : undefined}
          {...(rest as GetProps<typeof AccordionRoot>)}
        >
          {children}
        </AccordionRoot>
      </AccordionSlotStylesContext.Provider>
    </AccordionContext.Provider>
  );
}

export const Accordion = withStaticProperties(
  AccordionComponent as typeof AccordionComponent & {
    Item: typeof AccordionItem;
    Control: typeof AccordionControl;
    Label: typeof AccordionLabel;
    Panel: typeof AccordionPanel;
    Chevron: typeof AccordionChevron;
  },
  {
    Item: AccordionItem,
    Control: AccordionControl,
    Label: AccordionLabel,
    Panel: AccordionPanel,
    Chevron: AccordionChevron,
  },
);
