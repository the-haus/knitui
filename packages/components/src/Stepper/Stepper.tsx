import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { IconCheck } from "@knitui/icons";

import { Box } from "../Box";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { renderTextChild } from "../internal/render-text-child";
import {
  controlFontVariant,
  focusRingStyle,
  radiusVariant,
  type SizeKey,
  squareSizeVariant,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { Loader } from "../Loader";
import { Text } from "../Text";

export type StepperSize = SizeKey;
export type StepperOrientation = "horizontal" | "vertical";
export type StepperIconPosition = "left" | "right";
/**
 * Visual mode of the Stepper. `"stepper"` (default) is the numbered-bubble flow
 * with a content panel for the active step; `"timeline"` folds in the former
 * `Timeline` look — filled-dot bullets, inline per-step content, and optional
 * dashed/dotted connector lines — and works in BOTH orientations.
 */
export type StepperVariant = "stepper" | "timeline";
/** Connector line style for the `"timeline"` variant. @default "solid" */
export type StepperLineVariant = "solid" | "dashed" | "dotted";
type StepState = "stepInactive" | "stepProgress" | "stepCompleted";

/**
 * Render-function form accepted by a step's `icon`/`completedIcon`/`progressIcon`/
 * `label`/`description` (Mantine parity — `StepFragmentComponent`). Called with the
 * step's 0-based index so the fragment can vary per step.
 */
export type StepFragmentComponent = React.FC<{ step: number }>;

/**
 * Resolve a step fragment: if it is a render function, call it with `{ step }`;
 * otherwise pass the node through unchanged. `React.ReactNode` excludes plain
 * functions, so the `typeof` guard narrows to `StepFragmentComponent` with no cast.
 */
function renderStepFragment(
  fragment: React.ReactNode | StepFragmentComponent,
  step: number,
): React.ReactNode {
  if (typeof fragment === "function") {
    const Fragment = fragment;
    return <Fragment step={step} />;
  }
  return fragment;
}

const BUBBLE_BORDER_WIDTH = 2;
const CIRCULAR_RADIUS = 9999;

/**
 * Connector line thickness per size key — scales off the SAME key as the step
 * bubble (square) and label (font) so the whole composite grows as one unit
 * instead of leaving a hairline 2px line beside a large `xl` bubble. Applied to
 * the cross-axis (`height` horizontal / `width` vertical) at render time.
 */
const CONNECTOR_THICKNESS: Record<StepperSize, number> = {
  xxs: 2,
  xs: 2,
  sm: 2,
  md: 2,
  lg: 3,
  xl: 4,
  xxl: 4,
};

const StepperContext = createStyledContext<{
  size: StepperSize;
  orientation: StepperOrientation;
  iconPosition: StepperIconPosition;
  variant: StepperVariant;
}>({
  size: "md",
  orientation: "horizontal",
  iconPosition: "left",
  variant: "stepper",
});

/**
 * Carries the `styles` slot map from `Stepper` down to every `Stepper.Step`. The
 * styled context can only hold the variant config (`size`/`orientation`/
 * `iconPosition`), so the arbitrary per-slot props ride this parallel React
 * context — distributed onto each step's bubble/label/description parts so slot
 * styling survives the per-step `cloneElement` injection.
 */
const StepperStylesContext = React.createContext<SlotStyles<StepperStyles> | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* Step                                                                       */
/* -------------------------------------------------------------------------- */

const StepFrame = styled(Box, {
  name: "StepperStep",
  context: StepperContext,
  flexDirection: "row",
  alignItems: "center",
  gap: "$sm",

  variants: {
    orientation: {
      horizontal: {},
      vertical: {},
    },
    iconPosition: {
      left: { flexDirection: "row" },
      right: { flexDirection: "row-reverse" },
    },
    clickable: {
      true: {
        ...webCursor("pointer"),
        ...focusRingStyle,
      },
      false: { ...webCursor("default") },
    },
  } as const,

  defaultVariants: { orientation: "horizontal", iconPosition: "left", clickable: false },
});

const StepBubble = styled(Box, {
  name: "StepperBubble",
  context: StepperContext,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: BUBBLE_BORDER_WIDTH,
  borderColor: "$color4",
  backgroundColor: "transparent",
  borderRadius: CIRCULAR_RADIUS,

  variants: {
    size: {
      ...squareSizeVariant,
    },
    state: {
      stepInactive: { borderColor: "$color5", backgroundColor: "$color2" },
      stepProgress: { borderColor: "$color9", backgroundColor: "transparent" },
      stepCompleted: { borderColor: "$color9", backgroundColor: "$color9" },
    },
    radius: radiusVariant,
  } as const,

  defaultVariants: { size: "md", state: "stepInactive" },
});

const StepBubbleText = styled(Text, {
  name: "StepperBubbleText",
  context: StepperContext,
  fontWeight: "600",
  userSelect: "none",

  variants: {
    size: {
      ...controlFontVariant,
    },
    state: {
      stepInactive: { color: "$color11" },
      stepProgress: { color: "$color11" },
      stepCompleted: { color: "$color1" },
    },
  } as const,

  defaultVariants: { size: "md", state: "stepInactive" },
});

const StepBody = styled(Box, {
  name: "StepperBody",
  context: StepperContext,
  flexDirection: "column",
  variants: {
    iconPosition: {
      left: { alignItems: "flex-start" },
      right: { alignItems: "flex-end" },
    },
  } as const,
  defaultVariants: { iconPosition: "left" },
});

const StepLabel = styled(Text, {
  name: "StepperLabel",
  context: StepperContext,
  fontWeight: "600",
  color: "$color12",
  variants: {
    size: {
      ...controlFontVariant,
    },
  } as const,
  defaultVariants: { size: "md" },
});

const StepDescription = styled(Text, {
  name: "StepperDescription",
  context: StepperContext,
  color: "$color11",
  variants: {
    size: {
      ...controlFontVariant,
    },
  } as const,
  defaultVariants: { size: "md" },
});

/**
 * Inline step body content — only rendered in the `"timeline"` variant, where a
 * step's `children` appear next to/under the bullet (mirroring the former
 * `Timeline.Item` content) instead of in the active-step content panel.
 */
const StepContent = styled(Text, {
  name: "StepperContent",
  context: StepperContext,
  color: "$color11",
  variants: {
    size: {
      ...controlFontVariant,
    },
  } as const,
  defaultVariants: { size: "md" },
});

/* -------------------------------------------------------------------------- */
/* Slots                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ label: { color: "$red9" } }}` is
 * sugar for `<Stepper.Step.Label color="$red9" />`. Declared on `Stepper` and
 * threaded to every `Stepper.Step` (and the connector/steps row) via
 * `StepperStylesContext`.
 */
export interface StepperStyles {
  /** Props for the steps row (`.Steps`). */
  steps?: GetProps<typeof StepperSteps>;
  /** Props for each step row (`.Step`). */
  step?: StepperStepFrameProps;
  /** Props for each step's icon bubble (`Step.Bubble`). */
  bubble?: GetProps<typeof StepBubble>;
  /** Props for the index/check text inside the bubble (`Step.BubbleText`). */
  bubbleText?: GetProps<typeof StepBubbleText>;
  /** Props for each step's label text (`Step.Label`). */
  label?: GetProps<typeof StepLabel>;
  /** Props for each step's description text (`Step.Description`). */
  description?: GetProps<typeof StepDescription>;
  /** Props for each step's inline content text in the `"timeline"` variant (`Step.Content`). */
  content?: GetProps<typeof StepContent>;
  /** Props for the connector line between steps (`.Connector`). */
  connector?: GetProps<typeof StepConnector>;
}

const STEPPER_SLOT_KEYS = [
  "steps",
  "step",
  "bubble",
  "bubbleText",
  "label",
  "description",
  "content",
  "connector",
] as const satisfies readonly (keyof StepperStyles)[];

type StepperStepFrameProps = Omit<GetProps<typeof StepFrame>, "children" | "onPress">;

export interface StepperStepProps extends StepperStepFrameProps {
  /** Step label rendered next to the icon. Accepts a render fn `({ step }) => node`. */
  label?: React.ReactNode | StepFragmentComponent;
  /** Step description rendered below the label. Accepts a render fn `({ step }) => node`. */
  description?: React.ReactNode | StepFragmentComponent;
  /** Custom step icon (defaults to the 1-based index). Accepts a render fn `({ step }) => node`. */
  icon?: React.ReactNode | StepFragmentComponent;
  /** Icon shown when the step is completed (defaults to a check). Accepts a render fn `({ step }) => node`. */
  completedIcon?: React.ReactNode | StepFragmentComponent;
  /** Icon shown while the step is in progress. Accepts a render fn `({ step }) => node`. */
  progressIcon?: React.ReactNode | StepFragmentComponent;
  /** Render the icon bubble. @default true */
  withIcon?: boolean;
  /** Show a spinner in the bubble. */
  loading?: boolean;
  /** Bubble border radius (threaded from `Stepper`). */
  radius?: GetProps<typeof StepBubble>["radius"];
  /**
   * Connector-line style toward the next step. Only honoured in the `"timeline"`
   * variant (the `"stepper"` connector is always solid). @default "solid"
   */
  lineVariant?: StepperLineVariant;
  /**
   * Step content. In the `"stepper"` variant it's rendered in the active-step
   * content panel; in the `"timeline"` variant it's rendered inline beneath the
   * label (the former `Timeline.Item` body).
   */
  children?: React.ReactNode;
  /** Allow this step to be selected (overrides `allowNextStepsSelect`). */
  allowStepSelect?: boolean;
  /* ---- injected by Stepper ---- */
  /** @internal 0-based index, injected by `Stepper`. */
  step?: number;
  /** @internal step state, injected by `Stepper`. */
  state?: StepState;
  /** @internal whether the step is pressable, injected by `Stepper`. */
  allowStepClick?: boolean;
  /** @internal bubble diameter override, injected by `Stepper`. */
  iconSize?: GetProps<typeof StepBubble>["size"];
  /** @internal whether this is the active step, injected by `Stepper`. */
  active?: boolean;
  /** @internal press handler injected by `Stepper`. */
  onPress?: (event: unknown) => void;
}

/**
 * Resolve the `ControlIconProvider` size for a step bubble's icon content. The
 * bubble diameter is driven by either the per-step `iconSize` override (a size
 * key, or a raw px diameter) or, when unset, the Stepper's `size` key. A size
 * key flows straight to the icon ladder; a raw diameter is scaled to ~60% so the
 * icon reads as a glyph inside the circle rather than filling it edge-to-edge.
 */
function resolveBubbleIconSize(
  iconSize: GetProps<typeof StepBubble>["size"] | undefined,
  size: StepperSize,
): SizeKey | number {
  if (typeof iconSize === "number") return Math.round(iconSize * 0.6);
  if (typeof iconSize === "string") return iconSize;
  return size;
}

const StepperStep = StepFrame.styleable<StepperStepProps>(function StepperStep(props, ref) {
  const {
    label,
    description,
    icon,
    completedIcon,
    progressIcon,
    withIcon = true,
    loading,
    radius,
    iconSize,
    state = "stepInactive",
    step = 0,
    allowStepClick,
    active,
    allowStepSelect: _allowStepSelect,
    // Consumed by `Stepper` itself (connector styling), not the step — drop it so
    // it never leaks onto the `StepFrame` host element via `...rest`.
    lineVariant: _lineVariant,
    children,
    ...rest
  } = props;

  const styles = React.useContext(StepperStylesContext);
  const s = slotStyles<StepperStyles>(styles, STEPPER_SLOT_KEYS, "Stepper");
  const { size, variant } = StepperContext.useStyledContext();
  const timeline = variant === "timeline";

  // Bind the `content` slot onto the inline-content text element so string
  // children pick up the slot sugar; element children pass through untouched.
  const ContentWrapper = useSlotTextWrapper(StepContent, s.get("content"));

  const bubbleSizeProps: Pick<GetProps<typeof StepBubble>, "size"> | undefined =
    iconSize == null ? undefined : { size: iconSize };

  // In the timeline variant the bubble is a filled dot: solid `$color9` once the
  // step is reached (progress OR completed), an open `$background` ring before
  // it. This mirrors the former `Timeline` bullet and overrides the `state`
  // variant's stepper colours.
  const timelineBubbleColors: Pick<
    GetProps<typeof StepBubble>,
    "backgroundColor" | "borderColor"
  > = timeline
    ? {
        backgroundColor: state === "stepInactive" ? "$background" : "$color9",
        borderColor: state === "stepInactive" ? "$color5" : "$color9",
      }
    : {};

  // Icon size for any `@knitui/icons` content in the bubble (default check or a
  // consumer-supplied step icon), scaled off the bubble diameter so it grows
  // with `size`/`iconSize`.
  const bubbleIconSize = resolveBubbleIconSize(iconSize, size);
  // Bubble foreground: the completed bubble is a FILLED `$color9` circle, so its
  // glyph takes the contrast `$color1`; the inactive/progress bubbles are
  // open/light, so their glyph takes the muted `$color11` (matching the index text).
  const bubbleIconColor = state === "stepCompleted" ? "$color1" : "$color11";

  // Resolve the render-function form (`StepFragmentComponent`) of each fragment with
  // the step's 0-based index; plain nodes (and `undefined`) pass through unchanged so
  // the `??` fallbacks below still behave exactly as before.
  const resolvedIcon = renderStepFragment(icon, step);
  const resolvedCompletedIcon = renderStepFragment(completedIcon, step);
  const resolvedProgressIcon = renderStepFragment(progressIcon, step);
  const resolvedLabel = renderStepFragment(label, step);
  const resolvedDescription = renderStepFragment(description, step);

  const bubbleTextSugar = s.get("bubbleText");
  // Timeline bubbles default to a plain dot — only a consumer-supplied bullet
  // (`icon`) shows inside them, never the auto index/check the stepper uses.
  const stateIcon = timeline
    ? resolvedIcon
    : state === "stepCompleted"
      ? (resolvedCompletedIcon ?? <IconCheck />)
      : state === "stepProgress"
        ? (resolvedProgressIcon ??
          resolvedIcon ?? (
            <StepBubbleText state={state} {...bubbleTextSugar}>
              {step + 1}
            </StepBubbleText>
          ))
        : (resolvedIcon ?? (
            <StepBubbleText state={state} {...bubbleTextSugar}>
              {step + 1}
            </StepBubbleText>
          ));

  return (
    <StepFrame
      ref={ref}
      {...s.get("step")}
      {...rest}
      clickable={!!allowStepClick}
      role={allowStepClick ? "button" : undefined}
      aria-current={active ? "step" : undefined}
      tabIndex={allowStepClick ? 0 : undefined}
    >
      {withIcon ? (
        <StepBubble
          {...s.merge("bubble", { state, radius, ...bubbleSizeProps, ...timelineBubbleColors })}
        >
          {loading ? (
            <Loader size="xs" type="oval" />
          ) : stateIcon ? (
            // Auto-size + color any `@knitui/icons` glyph in the bubble — the default
            // completed check AND consumer-supplied step icons — to the bubble.
            <ControlIconProvider size={bubbleIconSize} color={bubbleIconColor}>
              {stateIcon}
            </ControlIconProvider>
          ) : null}
        </StepBubble>
      ) : null}
      {resolvedLabel || resolvedDescription || (timeline && children != null) ? (
        <StepBody>
          {resolvedLabel ? <StepLabel {...s.get("label")}>{resolvedLabel}</StepLabel> : null}
          {resolvedDescription ? (
            <StepDescription {...s.get("description")}>{resolvedDescription}</StepDescription>
          ) : null}
          {/* Timeline variant renders the step's content inline beneath the label
              (the former `Timeline.Item` body); the stepper variant routes it to
              the active-step content panel instead. */}
          {timeline && children != null ? renderTextChild(children, ContentWrapper) : null}
        </StepBody>
      ) : null}
    </StepFrame>
  );
});

/* -------------------------------------------------------------------------- */
/* Completed                                                                  */
/* -------------------------------------------------------------------------- */

export interface StepperCompletedProps {
  /** Content rendered when `active` is past the last step. */
  children?: React.ReactNode;
}

/** Marker component — `Stepper` reads its `children`; it renders nothing itself. */
function StepperCompleted(_props: StepperCompletedProps): React.ReactElement | null {
  return null;
}

/* -------------------------------------------------------------------------- */
/* Connector                                                                  */
/* -------------------------------------------------------------------------- */

const StepConnector = styled(Box, {
  name: "StepperConnector",
  backgroundColor: "$color4",
  variants: {
    orientation: {
      // Cross-axis thickness (`height` horizontal / `width` vertical) is injected
      // at render time from the size-scaled `CONNECTOR_THICKNESS` ladder.
      horizontal: {
        flex: 1,
        marginHorizontal: "$xs",
        alignSelf: "center",
      },
      vertical: { marginVertical: "$xs" },
    },
    active: {
      true: { backgroundColor: "$color9" },
    },
  } as const,
  defaultVariants: { orientation: "horizontal" },
});

function getVerticalConnectorMarginLeft(
  size: StepperSize,
  iconSize: GetProps<typeof StepBubble>["size"] | undefined,
): GetProps<typeof StepConnector>["marginLeft"] {
  if (typeof iconSize === "number") {
    return iconSize / 2 - CONNECTOR_THICKNESS[size] / 2;
  }

  switch (size) {
    case "xxs":
    case "xs":
      return "$xs";
    case "sm":
      return "$sm";
    case "md":
      return "$md";
    case "lg":
    case "xl":
      return "$lg";
    case "xxl":
      return "$xl";
  }
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

const StepperRootFrame = styled(Box, {
  name: "Stepper",
  flexDirection: "column",
  gap: "$md",
});

const StepperSteps = styled(Box, {
  name: "StepperSteps",
  variants: {
    orientation: {
      horizontal: { flexDirection: "row", alignItems: "flex-start" },
      vertical: { flexDirection: "column", gap: "$sm" },
    },
  } as const,
  defaultVariants: { orientation: "horizontal" },
});

type StepperRootFrameProps = Omit<GetProps<typeof StepperRootFrame>, "children" | "size">;

export interface StepperProps extends StepperRootFrameProps {
  /** Index of the active step. */
  active: number;
  /** Called with the 0-based index of a clicked, selectable step. */
  onStepClick?: (index: number) => void;
  /** `Stepper.Step` / `Stepper.Completed` children. */
  children: React.ReactNode;
  /** Default icon for every step (overridable per step). Accepts a render fn `({ step }) => node`. */
  icon?: React.ReactNode | StepFragmentComponent;
  /** Default completed icon for every step. Accepts a render fn `({ step }) => node`. */
  completedIcon?: React.ReactNode | StepFragmentComponent;
  /** Default progress icon for every step. Accepts a render fn `({ step }) => node`. */
  progressIcon?: React.ReactNode | StepFragmentComponent;
  /** Element size. @default 'md' */
  size?: StepperSize;
  /** Bubble border radius. @default circular */
  radius?: GetProps<typeof StepBubble>["radius"];
  /** Orientation. @default 'horizontal' */
  orientation?: StepperOrientation;
  /**
   * Visual variant. `"stepper"` (default) shows numbered bubbles + an active-step
   * content panel; `"timeline"` shows the former `Timeline` look — filled-dot
   * bullets with each step's content inline — and supports both orientations.
   * @default 'stepper'
   */
  variant?: StepperVariant;
  /** Icon/bullet position relative to the body (the former Timeline `align`). @default 'left' */
  iconPosition?: StepperIconPosition;
  /** Allow selecting steps after the current one. @default true */
  allowNextStepsSelect?: boolean;
  /**
   * Count the active progression from the LAST step instead of the first, so the
   * bottom/end step completes first (former Timeline `reverseActive`). @default false
   */
  reverseActive?: boolean;
  /** Override the step-bubble diameter (independent of `size`). */
  iconSize?: GetProps<typeof StepBubble>["size"];
  /** Padding around the active step's content. @default '$md' */
  contentPadding?: GetProps<typeof Box>["padding"];
  /** Wrap the horizontal steps row when it overflows. Ignored when vertical. @default true */
  wrap?: boolean;
  /**
   * Keep every step's content mounted instead of only the active step's. When
   * `true`, all step bodies stay in the tree — the active one (or `Stepper.Completed`
   * past the last step) is shown, the rest are hidden with `display:"none"` — so their
   * React state survives navigation (e.g. uncontrolled inputs keep their value). When
   * `false` (default) only the active/completed content is mounted, so leaving a step
   * unmounts it and resets its state. Mantine uses React-19 `Activity`; the kit has no
   * such primitive, so it toggles `display` (cross-platform on web + native, preserving
   * the mounted subtree). @default false
   */
  keepMounted?: boolean;
  /** Per-slot style sugar — props spread onto every step's parts + the connector. */
  styles?: SlotStyles<StepperStyles>;
}

const StepperRoot = StepperRootFrame.styleable<StepperProps>(function Stepper(props, ref) {
  const {
    active,
    onStepClick,
    children,
    icon,
    completedIcon,
    progressIcon,
    size = "md",
    radius,
    orientation = "horizontal",
    variant = "stepper",
    iconPosition = "left",
    allowNextStepsSelect = true,
    reverseActive = false,
    iconSize,
    contentPadding = "$md",
    wrap = true,
    keepMounted = false,
    styles,
    ...rest
  } = props;

  const s = slotStyles<StepperStyles>(styles, STEPPER_SLOT_KEYS, "Stepper");
  const timeline = variant === "timeline";

  const childArray = React.Children.toArray(children).filter(React.isValidElement);
  const steps = childArray.filter(
    (child): child is React.ReactElement<StepperStepProps> => child.type === StepperStep,
  );
  const completed = childArray.find(
    (child): child is React.ReactElement<StepperCompletedProps> => child.type === StepperCompleted,
  );

  const lastIndex = steps.length - 1;
  const verticalConnectorMarginLeft = getVerticalConnectorMarginLeft(size, iconSize);
  const connectorThickness = CONNECTOR_THICKNESS[size];

  // Resolve a step's state. `reverseActive` mirrors the index so the LAST step
  // completes first (Timeline parity); otherwise the index is used as-is.
  const stepStateAt = (index: number): StepState => {
    const ei = reverseActive ? lastIndex - index : index;
    return active === ei ? "stepProgress" : active > ei ? "stepCompleted" : "stepInactive";
  };

  const rendered: React.ReactNode[] = [];
  steps.forEach((child, index) => {
    const state = stepStateAt(index);

    const selectable =
      typeof onStepClick === "function" &&
      (typeof child.props.allowStepSelect === "boolean"
        ? child.props.allowStepSelect
        : state === "stepCompleted" || allowNextStepsSelect);

    rendered.push(
      React.cloneElement(child, {
        key: `step-${index}`,
        step: index,
        state,
        active: state === "stepProgress",
        icon: child.props.icon ?? icon,
        completedIcon: child.props.completedIcon ?? completedIcon,
        progressIcon: child.props.progressIcon ?? progressIcon,
        radius,
        iconSize,
        allowStepClick: selectable,
        onPress: selectable ? () => onStepClick?.(index) : undefined,
      }),
    );

    if (index !== lastIndex) {
      // A connector is "active" when BOTH steps it bridges have been reached
      // (progress/completed). This reproduces the old `index < active` rule for
      // forward progression and also reads correctly under `reverseActive`.
      const connectorActive =
        stepStateAt(index) !== "stepInactive" && stepStateAt(index + 1) !== "stepInactive";
      // Timeline connectors honour the source step's `lineVariant`; stepper
      // connectors are always solid filled bars.
      const lineVariant = (timeline && child.props.lineVariant) || "solid";
      const dashed = lineVariant !== "solid";
      const lineColor = connectorActive ? "$color9" : "$color4";

      // A dashed/dotted line is drawn as a border (a filled box can't be dashed),
      // so swap the filled bar for a zero-thickness box with a styled border on
      // the line's long axis.
      const dashedProps: GetProps<typeof StepConnector> = !dashed
        ? {}
        : orientation === "vertical"
          ? {
              backgroundColor: "transparent",
              width: 0,
              borderLeftWidth: connectorThickness,
              borderStyle: lineVariant,
              borderColor: lineColor,
            }
          : {
              backgroundColor: "transparent",
              height: 0,
              borderTopWidth: connectorThickness,
              borderStyle: lineVariant,
              borderColor: lineColor,
            };

      rendered.push(
        <StepConnector
          key={`connector-${index}`}
          {...s.merge("connector", {
            orientation,
            active: connectorActive,
            // Cross-axis thickness scales off `size`: `height` for the horizontal
            // line, `width` for the vertical one (whose length stays `$sm`).
            height: orientation === "vertical" ? "$sm" : connectorThickness,
            width: orientation === "vertical" ? connectorThickness : undefined,
            marginLeft: orientation === "vertical" ? verticalConnectorMarginLeft : undefined,
            ...dashedProps,
          })}
        />,
      );
    }
  });

  const showCompleted = active > lastIndex;
  const content = showCompleted ? completed?.props.children : steps[active]?.props.children;

  // `keepMounted` renders EVERY step's content (+ the completed content) up front,
  // hiding the inactive ones with `display:"none"` so their React state is preserved
  // across navigation (the kit's cross-platform stand-in for Mantine's React-19
  // `Activity`). The default path mounts only the active/completed content, as before.
  // The timeline variant has NO content panel — each step renders its content
  // inline beside the bullet — so it skips this section entirely.
  const contentSection = timeline ? null : keepMounted ? (
    <>
      {steps.map((child, index) => (
        <Box
          key={`content-${index}`}
          padding={contentPadding}
          display={active === index ? "flex" : "none"}
        >
          {child.props.children}
        </Box>
      ))}
      {completed ? (
        <Box padding={contentPadding} display={showCompleted ? "flex" : "none"}>
          {completed.props.children}
        </Box>
      ) : null}
    </>
  ) : content ? (
    <Box padding={contentPadding}>{content}</Box>
  ) : null;

  return (
    <StepperContext.Provider
      size={size}
      orientation={orientation}
      iconPosition={iconPosition}
      variant={variant}
    >
      <StepperStylesContext.Provider value={styles}>
        <StepperRootFrame ref={ref} {...rest}>
          <StepperSteps
            {...s.merge("steps", {
              orientation,
              flexWrap: wrap && orientation === "horizontal" ? "wrap" : "nowrap",
            })}
          >
            {rendered}
          </StepperSteps>
          {contentSection}
        </StepperRootFrame>
      </StepperStylesContext.Provider>
    </StepperContext.Provider>
  );
});

/**
 * `Stepper.Step` with its styled sub-parts exposed for slot⇄part parity, so each
 * step-level `StepperStyles` key maps 1:1 to a reachable part
 * (`Stepper.Step.Label`, etc.).
 */
const StepperStepWithParts = withStaticProperties(StepperStep, {
  Bubble: StepBubble,
  BubbleText: StepBubbleText,
  Body: StepBody,
  Label: StepLabel,
  Description: StepDescription,
  Content: StepContent,
});

export const Stepper = withStaticProperties(StepperRoot, {
  Step: StepperStepWithParts,
  Completed: StepperCompleted,
  Steps: StepperSteps,
  Connector: StepConnector,
});
