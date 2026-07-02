import * as React from "react";

import {
  type GetProps,
  isWeb,
  styled,
  type TamaguiElement,
  Theme,
  useThemeName,
  withStaticProperties,
} from "@knitui/core";
import { useDismissOnScroll, useId, useMergedRef, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import {
  arrow as arrowMiddleware,
  autoUpdate,
  flip,
  inline as inlineMiddleware,
  offset as offsetMiddleware,
  type Placement,
  shift,
  useFloating,
} from "../floating";
import {
  type ArrowPosition,
  FloatingArrow,
  type FloatingArrowProps,
  resolveRadiusPx,
} from "../internal/floating-arrow";
import { type FloatingOffset } from "../internal/floating-offset";
import { type MotionPresetName } from "../internal/motion";
import { useOverlayChrome } from "../internal/overlay-chrome";
import { radiusVariant, shadowVariant } from "../internal/style-props";
import { type SlotStyles } from "../internal/styles";
import { Portal } from "../Portal";
import { Text } from "../Text";
import {
  type OverlayTransitionConfig,
  useOverlayTransition,
} from "../Transition/use-overlay-transition";

/**
 * The appearance-only subset of {@link FloatingArrowProps} a consumer may style
 * via the `arrow` slot. The positioning-driven props (`placement`/`size`/`offset`/
 * `position`/`arrowX`/`arrowY`) stay internally controlled so the arrow keeps
 * pointing at the target.
 */
export type FloatingArrowStyle = Pick<
  FloatingArrowProps,
  "background" | "borderColor" | "borderWidth" | "radius"
>;

export type TooltipPosition = Placement;
/** Arrow alignment along the label edge. */
export type TooltipArrowPosition = ArrowPosition;
/** Main-axis gutter `number`, or a per-axis `{ mainAxis; crossAxis; alignmentAxis }` object. */
export type TooltipOffset = FloatingOffset;

/** Which hover/focus/touch interactions open the tooltip. */
export interface TooltipEvents {
  hover: boolean;
  focus: boolean;
  touch: boolean;
}

/* -------------------------------------------------------------------------- */
/* Styled label frame                                                         */
/* -------------------------------------------------------------------------- */

const TooltipLabelFrame = styled(Box, {
  name: "Tooltip",
  // `fixed` is web-only viewport positioning; React Native supports only
  // `absolute`/`relative`/`static`. Pick the platform-correct value (mirrors
  // Popover.Dropdown) so the label isn't laid out in normal flow on native.
  position: isWeb ? ("fixed" as const) : ("absolute" as const),
  backgroundColor: "$color9",
  paddingVertical: "$xxs",
  paddingHorizontal: "$xs",
  borderRadius: "$sm",
  role: "tooltip",

  variants: {
    radius: radiusVariant,
    // Optional elevation from the shared `shadowVariant` ladder (opt-in; no
    // shadow by default — threaded explicitly from `TooltipProps.shadow`).
    shadow: shadowVariant,
    multiline: {
      false: { maxWidth: 320 },
      true: {},
    },
  } as const,
});

const TooltipText = styled(Text, {
  name: "TooltipText",
  color: "$color1",
  fontSize: "$sm",
});

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

// `position` is the Tooltip's floating Placement, which collides with Box's CSS
// `position` style keyword — drop the inherited one (same fix as Indicator/Dialog).
type LabelFrameProps = Omit<GetProps<typeof TooltipLabelFrame>, "children" | "position">;

/** Props the `label`/`text` slots may carry (the inner `Tooltip.Text` element). */
export type TooltipTextStyle = GetProps<typeof TooltipText>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, using the canonical floating vocabulary. The label
 * frame is the floating `dropdown`; the `arrow` slot styles the pointer's
 * appearance (`Tooltip.Arrow`).
 *
 * `label` and `text` both target the inner `Tooltip.Text` element: `label` is the
 * conventional name for the text node, `text` is the more-specific alias and layers
 * OVER it (so `styles={{ text }}` wins where both are set). Resolved via the shared
 * {@link useOverlayChrome}.
 */
export interface TooltipStyles {
  /** Props spread onto the floating label frame (`Tooltip.Label`/`.Dropdown`). */
  dropdown?: LabelFrameProps;
  /** Props spread onto the inner text node (`Tooltip.Text`). */
  label?: TooltipTextStyle;
  /** Props spread onto the inner text node (`Tooltip.Text`); layers over `label`. */
  text?: TooltipTextStyle;
  /** Appearance props for the arrow (`Tooltip.Arrow`); positioning stays internal. */
  arrow?: FloatingArrowStyle;
}

const TOOLTIP_EXTRA_SLOT_KEYS = ["label", "text"] as const satisfies readonly (keyof TooltipStyles &
  string)[];

export interface TooltipProps extends LabelFrameProps {
  /** The floating label content. */
  label: React.ReactNode;
  /** Single target element that accepts a ref. */
  children: React.ReactElement;
  /** Placement relative to the target. @default 'top' */
  position?: TooltipPosition;
  /** Called with the RESOLVED placement whenever it changes (e.g. on flip/shift). */
  onPositionChange?: (position: TooltipPosition) => void;
  /**
   * Gap between target and label. A `number` is the main-axis gutter in px; an
   * object skids per axis (`{ mainAxis; crossAxis; alignmentAxis }`). @default 5
   */
  offset?: TooltipOffset;
  /** Delay before opening, in ms. */
  openDelay?: number;
  /** Delay before closing, in ms. @default 0 */
  closeDelay?: number;
  /** Controlled opened state. */
  opened?: boolean;
  /** Uncontrolled initial opened state. */
  defaultOpened?: boolean;
  /** Render a small arrow pointing at the target. @default false */
  withArrow?: boolean;
  /** Arrow square size in px. @default 4 */
  arrowSize?: number;
  /** Arrow distance from the start/end edge when `arrowPosition="side"`. @default 5 */
  arrowOffset?: number;
  /** Corner radius of the arrow's outward corner in px. @default 0 */
  arrowRadius?: number;
  /** Arrow alignment: centered, or pinned toward an aligned placement. @default 'side' */
  arrowPosition?: TooltipArrowPosition;
  /**
   * Position correctly around an inline/wrapping target (floating-ui `inline`
   * middleware). Works on web and native.
   * @default false
   */
  inline?: boolean;
  /** Allow the label to wrap onto multiple lines. @default false */
  multiline?: boolean;
  /**
   * Elevation — drop shadow for the label, from the shared `shadowVariant`
   * ladder (`xxs`→`xxl`). Opt-in; no shadow by default.
   */
  shadow?: keyof typeof shadowVariant;
  /** Render the label in a portal. @default true */
  withinPortal?: boolean;
  /** Keep the label mounted while closed (adds `display: none`). @default false */
  keepMounted?: boolean;
  /** Label `z-index`. @default 300 */
  zIndex?: number;
  /**
   * Enter/exit animation for the label — preset name (or custom style set),
   * `duration`, `exitDuration`, and `timingFunction`. Mirrors Mantine's
   * `transitionProps`; rides the shared `Transition` engine.
   * @default { transition: 'fade', duration: 150, timingFunction: 'ease-in-out' }
   */
  transitionProps?: OverlayTransitionConfig;
  /**
   * Motion preset for the label — the unified `animation` vocabulary shared with
   * Modal/Dialog/Drawer (e.g. `"fade"`, `"pop"`, `"scale"`). Sugar over
   * `transitionProps.transition`, which wins if both are set.
   */
  animation?: MotionPresetName;
  /** Disable the tooltip entirely (never opens). */
  disabled?: boolean;
  /** Which interactions open the tooltip. @default { hover: true, focus: false, touch: false } */
  events?: Partial<TooltipEvents>;
  /** Prop used to pass the ref into the target child. @default 'ref' */
  refProp?: string;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<TooltipStyles>;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/** Extra handlers Tamagui resolves at runtime but doesn't surface in its types. */
type InteractionProps = {
  onHoverIn?: (event: unknown) => void;
  onHoverOut?: (event: unknown) => void;
  onMouseEnter?: (event: unknown) => void;
  onMouseLeave?: (event: unknown) => void;
  onFocus?: (event: unknown) => void;
  onBlur?: (event: unknown) => void;
  onPress?: (event: unknown) => void;
  "aria-describedby"?: string;
};

/* -------------------------------------------------------------------------- */
/* Target context + clone helper                                              */
/* -------------------------------------------------------------------------- */

/**
 * Wiring the Root computes once and shares with whichever element ends up being
 * the target — either the bare child (inline-sugar form, auto-wrapped) or an
 * explicit `<Tooltip.Target>` the consumer composed. Keeping the open/close
 * timers and the floating reference setter in the Root means both paths build
 * the *identical* cloned target, so the part is pure sugar over the inline clone.
 */
interface TooltipTargetContextValue {
  /** Attach the floating positioner's reference ref to the target node. */
  setReferenceRef: (node: TamaguiElement | null) => void;
  /** Default prop name the ref is passed under (overridable per `Tooltip.Target`). */
  refProp: string;
  /** Resolved interaction events (hover/focus/touch). */
  resolvedEvents: TooltipEvents;
  /** Whether the label is currently open (drives `aria-describedby`). */
  open: boolean;
  /** Id linking target → label for `aria-describedby`. */
  tooltipId: string;
  /** Open after the optional `openDelay`. */
  show: () => void;
  /** Close after the optional `closeDelay`. */
  hide: () => void;
  /** Toggle (used by the `touch` event). */
  toggle: () => void;
}

const TooltipTargetContext = React.createContext<TooltipTargetContextValue | null>(null);

const useTooltipTargetContext = (): TooltipTargetContextValue => {
  const ctx = React.useContext(TooltipTargetContext);
  if (!ctx) {
    throw new Error("Tooltip.Target must be rendered inside <Tooltip>");
  }
  return ctx;
};

/**
 * Build the interaction handlers + `aria-describedby` to clone onto the target
 * child. Pure (no hooks) so the inline-sugar path and the `Tooltip.Target` part
 * produce byte-identical props — the part is sugar over the inline clone, not a
 * second implementation.
 */
function buildTargetHandlers(
  childProps: InteractionProps,
  ctx: TooltipTargetContextValue,
): InteractionProps {
  const { resolvedEvents, open, tooltipId, show, hide, toggle } = ctx;
  const handlers: InteractionProps = {};
  if (resolvedEvents.hover) {
    if (isWeb) {
      handlers.onMouseEnter = (e) => {
        childProps.onMouseEnter?.(e);
        childProps.onHoverIn?.(e);
        show();
      };
      handlers.onMouseLeave = (e) => {
        childProps.onMouseLeave?.(e);
        childProps.onHoverOut?.(e);
        hide();
      };
    } else {
      handlers.onHoverIn = (e) => {
        childProps.onHoverIn?.(e);
        show();
      };
      handlers.onHoverOut = (e) => {
        childProps.onHoverOut?.(e);
        hide();
      };
    }
  }
  if (resolvedEvents.focus) {
    handlers.onFocus = (e) => {
      childProps.onFocus?.(e);
      show();
    };
    handlers.onBlur = (e) => {
      childProps.onBlur?.(e);
      hide();
    };
  }
  if (resolvedEvents.touch) {
    handlers.onPress = (e) => {
      childProps.onPress?.(e);
      toggle();
    };
  }
  if (open) {
    handlers["aria-describedby"] = childProps["aria-describedby"]
      ? `${childProps["aria-describedby"]} ${tooltipId}`
      : tooltipId;
  }
  return handlers;
}

export interface TooltipTargetProps {
  /** Single element child that accepts a ref. */
  children: React.ReactElement;
  /** Prop name used to pass the ref into the child. Defaults to the Tooltip's `refProp`. */
  refProp?: string;
}

/**
 * Composable target part: `<Tooltip><Tooltip.Target><Button/></Tooltip.Target>…`.
 * Wires the floating reference ref + open/close handlers onto its single child,
 * exactly as the inline-sugar form (`<Tooltip label><Button/></Tooltip>`) does —
 * the Root auto-wraps a bare child in this same component, so both paths share
 * one implementation.
 */
function TooltipTarget({ children, refProp: refPropOverride }: TooltipTargetProps) {
  const ctx = useTooltipTargetContext();
  const refProp = refPropOverride ?? ctx.refProp;

  // Merge the floating reference setter with any ref the child already declares.
  const childRef = (children as { ref?: React.Ref<TamaguiElement> }).ref;
  const mergedRef = useMergedRef<TamaguiElement>(ctx.setReferenceRef, childRef);

  const child = children as React.ReactElement<InteractionProps>;
  const handlers = buildTargetHandlers(child.props, ctx);

  return React.cloneElement(child, {
    [refProp]: mergedRef,
    ...handlers,
  } as Partial<InteractionProps> & React.Attributes);
}

const TooltipBase = TooltipLabelFrame.styleable<TooltipProps>(function Tooltip(props, ref) {
  const {
    label,
    children,
    position = "top",
    onPositionChange,
    offset = 5,
    openDelay,
    closeDelay = 0,
    opened,
    defaultOpened,
    withArrow = false,
    arrowSize = 4,
    arrowOffset = 5,
    arrowRadius = 0,
    arrowPosition = "side",
    inline = false,
    multiline = false,
    withinPortal = true,
    keepMounted = false,
    zIndex = 300,
    disabled,
    events,
    refProp = "ref",
    radius,
    shadow,
    transitionProps,
    animation,
    styles,
    ...labelRest
  } = props;

  // Per-slot style sugar, distributed onto the parts below via the shared
  // floating-chrome resolver (canonical `dropdown`/`arrow` + Tooltip's
  // `label`/`text` extras).
  const s = useOverlayChrome<TooltipStyles>(styles, TOOLTIP_EXTRA_SLOT_KEYS, "Tooltip");

  const resolvedEvents = React.useMemo<TooltipEvents>(
    () => ({
      hover: events?.hover ?? true,
      focus: events?.focus ?? false,
      touch: events?.touch ?? false,
    }),
    [events?.hover, events?.focus, events?.touch],
  );

  const [isOpen, setOpen] = useUncontrolled<boolean>({
    value: opened,
    defaultValue: defaultOpened,
    finalValue: false,
  });

  const open = !disabled && isOpen;

  // `inline` improves positioning around an inline/wrapping target; the
  // middleware is available on both the web and native floating-ui layers.
  const middleware = [
    offsetMiddleware(offset),
    ...(inline ? [inlineMiddleware()] : []),
    flip(),
    shift({ padding: 5 }),
    // Runs after shift so the arrow coordinate tracks the target even when the
    // label was slid along the cross axis. `size` matches the rendered arrow
    // (the historical doubled convention — see the FloatingArrow render below);
    // `padding`/`cornerRadius` keep the arrow off the label's (rounded) corners.
    ...(withArrow
      ? [
          arrowMiddleware({
            size: arrowSize * 2,
            position: arrowPosition,
            offset: arrowOffset,
            padding: arrowOffset,
            // The label frame's default radius is `$sm` (see TooltipFrame).
            cornerRadius: resolveRadiusPx(radius),
          }),
        ]
      : []),
  ];

  const floating = useFloating({
    placement: position,
    strategy: "fixed",
    whileElementsMounted: open ? autoUpdate : undefined,
    middleware,
  });
  const { x, y, isPositioned, placement, update, middlewareData } = floating;
  const { setReference, setFloating } = floating.refs;
  // `setFloating` is typed for `HTMLElement` on web; the styled frame's ref is
  // `Ref<TamaguiElement>`. The frame renders a DOM node on web, so narrow to the
  // setter's own param type (mirrors Popover.Dropdown).
  const setFloatingRef = React.useCallback(
    (node: TamaguiElement | null) => {
      setFloating(node as Parameters<typeof setFloating>[0]);
    },
    [setFloating],
  );

  const themeName = useThemeName();
  // Enter/exit animation via the shared `Transition` engine (honours reduced
  // motion; label now also animates OUT before unmounting).
  const t = useOverlayTransition({ mounted: open, keepMounted, animation, ...transitionProps });
  const generatedId = useId();
  const tooltipId = labelRest.id ?? generatedId;
  const floatingRef = useMergedRef<TamaguiElement>(setFloatingRef, ref);

  // Surface the resolved placement (flipped/shifted away from `position` on
  // overflow). Fires only on an actual change — the ref is seeded with the initial
  // placement, so there's no spurious first run.
  const prevPlacement = React.useRef(placement);
  React.useEffect(() => {
    if (placement !== prevPlacement.current) {
      prevPlacement.current = placement;
      onPositionChange?.(placement);
    }
  }, [placement, onPositionChange]);

  // Native re-measure: `autoUpdate` is a no-op on native (see `Floating.native`),
  // so coords are only computed on demand. Recompute when the tooltip opens, once
  // the target + label Views have laid out (mirrors Popover.Dropdown).
  React.useEffect(() => {
    if (isWeb || !open) return;
    update();
  }, [open, update]);

  // Open/close with optional delays; timers cleared on unmount.
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearTimers = React.useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);
  React.useEffect(() => clearTimers, [clearTimers]);

  const show = React.useCallback(() => {
    clearTimers();
    if (openDelay) openTimer.current = setTimeout(() => setOpen(true), openDelay);
    else setOpen(true);
  }, [clearTimers, openDelay, setOpen]);

  const hide = React.useCallback(() => {
    clearTimers();
    if (closeDelay) closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
    else setOpen(false);
  }, [clearTimers, closeDelay, setOpen]);

  // Close on scroll (native); web follows scroll instead (no-op there).
  useDismissOnScroll(open, floating.refs.reference, hide);

  // floating-ui's web `setReference` is typed for DOM nodes; Tamagui refs carry
  // `TamaguiElement`. On web the mounted node is always the DOM element, so narrow
  // to the setter's own param type (mirrors Popover.Target).
  const setReferenceRef = React.useCallback(
    (node: TamaguiElement | null) => {
      setReference(node as Parameters<typeof setReference>[0]);
    },
    [setReference],
  );

  const toggle = React.useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

  // The target wiring is shared by both the inline-sugar child and an explicit
  // `<Tooltip.Target>` (see {@link TooltipTarget}); the Root owns the timers +
  // reference setter and hands them down via context so both paths clone the
  // exact same props.
  const targetCtx = React.useMemo<TooltipTargetContextValue>(
    () => ({
      setReferenceRef,
      refProp,
      resolvedEvents,
      open,
      tooltipId,
      show,
      hide,
      toggle,
    }),
    [setReferenceRef, refProp, resolvedEvents, open, tooltipId, show, hide, toggle],
  );

  // Detect whether the consumer composed an explicit `<Tooltip.Target>`. If so,
  // render it as-is (it wires itself from context); otherwise auto-wrap the bare
  // child so the inline-sugar form runs through the identical part.
  const isTargetPart =
    React.isValidElement(children) && children.type === (TooltipTarget as React.ElementType);
  const target = isTargetPart ? children : <TooltipTarget>{children}</TooltipTarget>;

  // Force the label invisible (NOT `display:none`, which measures 0×0 and would
  // deadlock the positioner) until the first measurement lands; after that the
  // transition owns opacity. `top`/`left` come from floating-ui and stay instant —
  // the transition only animates opacity/transform.
  const waitingForPosition = !isPositioned;
  const transitionStyle = waitingForPosition ? { ...t.style, opacity: 0 } : t.style;
  const dropdownSlot = s.get("dropdown");

  const labelNode = !t.rendered ? null : (
    <Portal hostName={withinPortal ? "root" : undefined}>
      <Theme name={themeName}>
        <TooltipLabelFrame
          ref={floatingRef}
          id={tooltipId}
          top={y}
          left={x}
          radius={radius}
          shadow={shadow}
          multiline={multiline}
          // `display:none` only once fully exited while kept mounted.
          display={t.hidden ? ("none" as const) : undefined}
          onLayout={isWeb ? undefined : (e) => update(e.nativeEvent.layout)}
          zIndex={zIndex}
          pointerEvents="none"
          {...t.animation}
          {...dropdownSlot}
          {...labelRest}
          // Engine style wins last (opacity/transform); slot/consumer styles merge
          // underneath (slot < consumer < transition).
          style={[dropdownSlot?.style, labelRest.style, transitionStyle]}
        >
          {/* `label` is the conventional text slot; `text` is the specific
                alias and layers OVER it ("explicit beats sugar"). */}
          <TooltipText {...s.get("label")} {...s.get("text")}>
            {label}
          </TooltipText>
          {withArrow ? (
            // Shared cross-platform arrow; `background="$color9"` matches the label
            // fill and `borderWidth={0}` keeps it solid/borderless. `size` keeps the
            // historical doubled convention so a default centered arrow is unchanged;
            // FloatingArrow rounds only the OUTWARD corner (closer to Mantine than the
            // old all-corners radius).
            <FloatingArrow
              placement={placement}
              size={arrowSize * 2}
              offset={arrowOffset}
              position={arrowPosition}
              radius={arrowRadius}
              background="$color9"
              borderWidth={0}
              arrowX={middlewareData.arrow?.x}
              arrowY={middlewareData.arrow?.y}
              // Appearance sugar overrides the defaults above; the slot type
              // (FloatingArrowStyle) excludes the positioning props, so internal
              // positioning can never be clobbered.
              {...s.get("arrow")}
            />
          ) : null}
        </TooltipLabelFrame>
      </Theme>
    </Portal>
  );

  return (
    <TooltipTargetContext.Provider value={targetCtx}>
      {target}
      {labelNode}
    </TooltipTargetContext.Provider>
  );
});

export const Tooltip = withStaticProperties(TooltipBase, {
  /** Composable target part; sugar over the inline-clone form. 1:1 with the wrapped child. */
  Target: TooltipTarget,
  Label: TooltipLabelFrame,
  /** Canonical floating-frame name (alias of `Tooltip.Label`); 1:1 with the `dropdown` slot. */
  Dropdown: TooltipLabelFrame,
  Text: TooltipText,
  /** The pointer arrow; 1:1 with the `arrow` slot. */
  Arrow: FloatingArrow,
});
