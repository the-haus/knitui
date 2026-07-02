import * as React from "react";

import {
  type GetProps,
  getTokenValue,
  isWeb,
  type RadiusTokens,
  type SpaceTokens,
  styled,
  type TamaguiElement,
  Theme,
  useThemeName,
} from "@knitui/core";
import { useFocusTrap, useId, useMergedRef, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import {
  arrow as arrowMiddleware,
  autoUpdate,
  flip,
  limitShift,
  type Middleware,
  offset,
  type Placement,
  shift,
  type Strategy,
  useFloating,
} from "../floating";
import {
  type ArrowPosition,
  FloatingArrow,
  type FloatingArrowProps,
  resolveRadiusPx,
} from "../internal/floating-arrow";
import { type FloatingAxesOffsets, type FloatingOffset } from "../internal/floating-offset";
import { type MotionPresetName } from "../internal/motion";
import { useOverlayChrome } from "../internal/overlay-chrome";
import { shadowVariant } from "../internal/style-props";
import { type SlotStyles } from "../internal/styles";
import { type OverlayProps } from "../Overlay";
import { Portal } from "../Portal";
import {
  type OverlayTransitionConfig,
  useOverlayTransition,
} from "../Transition/use-overlay-transition";

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

export type PopoverPosition = Placement;
export type PopoverWidth = "target" | "max-content" | number;
export type PopoverArrowPosition = ArrowPosition;
export type PopoverAxisOffset = number | SpaceTokens;
export type PopoverArrowOffset = PopoverAxisOffset;
export interface PopoverAxesOffsets {
  /** Distance between the reference and dropdown. */
  mainAxis?: PopoverAxisOffset;
  /** Skidding along the alignment axis. */
  crossAxis?: PopoverAxisOffset;
  /** Skidding for aligned placements only (e.g. `top-start`). */
  alignmentAxis?: PopoverAxisOffset | null;
}
/** Main-axis space token/px gutter, or per-axis offset object. */
export type PopoverOffset = PopoverAxisOffset | PopoverAxesOffsets;

/** The vendored `useFloating` return — carries the typed reference/floating refs. */
export type FloatingReturn = ReturnType<typeof useFloating>;
type TokenValueInput = Parameters<typeof getTokenValue>[0];

const DEFAULT_OFFSET: SpaceTokens = "$xs";
/** Stable empty transition config so an unset `transitionProps` keeps context identity. */
const EMPTY_TRANSITION: OverlayTransitionConfig = {};
const DEFAULT_SHIFT_PADDING: SpaceTokens = "$xxs";
const DEFAULT_ARROW_OFFSET: SpaceTokens = "$xxs";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

export interface PopoverContextValue {
  opened: boolean;
  onClose: () => void;
  onToggle: () => void;
  /** The floating positioner (refs, coords, placement, middleware data). */
  floating: FloatingReturn;
  resolvedWidth: number | "max-content" | undefined;
  zIndex: number;
  withinPortal: boolean;
  keepMounted: boolean;
  /** Resolved enter/exit animation config for the dropdown. */
  transitionProps: OverlayTransitionConfig;
  /** Unified motion-preset name for the dropdown (sugar over `transitionProps.transition`). */
  animation?: MotionPresetName;
  radius?: RadiusTokens;
  shadow: keyof typeof shadowVariant;
  closeOnClickOutside: boolean;
  closeOnEscape: boolean;
  trapFocus: boolean;
  withOverlay: boolean;
  /** Resolved `overlay` slot merged UNDER the deprecated `overlayProps`. */
  overlayProps?: Partial<OverlayProps>;
  /** Resolved per-slot style sugar for the dropdown frame + arrow. */
  slots: {
    dropdown?: Partial<PopoverDropdownStyle>;
    arrow?: Partial<PopoverArrowStyle>;
  };
  onDismiss?: () => void;
  withRoles: boolean;
  /** Stable id linking target ↔ dropdown for ARIA wiring (when `withRoles`). */
  targetId: string;
  dropdownId: string;
  withArrow: boolean;
  arrowSize: number;
  arrowOffset: number;
  arrowRadius: number;
  arrowPosition: PopoverArrowPosition;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export const usePopoverContext = (): PopoverContextValue => {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) {
    throw new Error("Popover compound components must be rendered inside <Popover>");
  }
  return ctx;
};

/**
 * Build the `dismiss` callback shared by both platform dropdowns: it fires
 * `onClose` (every close) plus `onDismiss` (outside-press / Escape only —
 * distinct from the root's `onClose`, which also fires on programmatic closes).
 */
export const useDropdownDismiss = (ctx: PopoverContextValue): (() => void) => {
  const { onClose, onDismiss } = ctx;
  return React.useCallback(() => {
    onClose();
    onDismiss?.();
  }, [onClose, onDismiss]);
};

/* -------------------------------------------------------------------------- */
/* Styled dropdown frame                                                      */
/* -------------------------------------------------------------------------- */

export const PopoverDropdownFrame = styled(Box, {
  name: "PopoverDropdown",
  // `fixed` is viewport-relative positioning that only exists on web; React
  // Native supports `absolute`/`relative`/`static` only. The instance overrides
  // this with the platform-correct value (`fixed` on web, `absolute` on native).
  position: isWeb ? ("fixed" as const) : ("absolute" as const),
  backgroundColor: "$background",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$sm",

  variants: {
    hidden: { true: { display: "none" } },
    shadow: shadowVariant,
  } as const,
});

/* -------------------------------------------------------------------------- */
/* Per-slot styling (Pillar B)                                                */
/* -------------------------------------------------------------------------- */

/** Props the `dropdown` slot may carry (the dropdown frame, minus internals). */
export type PopoverDropdownStyle = Omit<GetProps<typeof PopoverDropdownFrame>, "children">;

/**
 * The appearance-only subset of {@link FloatingArrowProps} a consumer may style
 * via the `arrow` slot. The positioning-driven props (`placement`/`size`/`offset`/
 * `position`/`arrowX`/`arrowY`) stay internally controlled so the arrow keeps
 * pointing at the target.
 */
export type PopoverArrowStyle = Pick<
  FloatingArrowProps,
  "background" | "borderColor" | "borderWidth" | "radius"
>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `Popover`, using the
 * canonical floating vocabulary (`overlay`/`dropdown`/`arrow`).
 *
 * `overlay` is low-precedence sugar: it layers UNDER the explicit `overlayProps`,
 * so the deprecated alias wins (the "explicit beats sugar" rule). Resolved via the
 * shared {@link useOverlayChrome}.
 */
export interface PopoverStyles {
  /** Props spread onto the `Overlay` scrim (under the deprecated `overlayProps`). */
  overlay?: Partial<OverlayProps>;
  /** Props spread onto the dropdown frame (`Popover.Dropdown`). */
  dropdown?: PopoverDropdownStyle;
  /** Appearance props for the arrow; positioning stays internal. */
  arrow?: PopoverArrowStyle;
}

/* -------------------------------------------------------------------------- */
/* Popover root                                                               */
/* -------------------------------------------------------------------------- */

export interface PopoverProps {
  /** Target + dropdown. */
  children?: React.ReactNode;
  /** Controlled opened state. */
  opened?: boolean;
  /** Uncontrolled initial opened state. @default false */
  defaultOpened?: boolean;
  /** Called when the opened state changes (open + close). */
  onChange?: (opened: boolean) => void;
  /** Called when the dropdown opens. */
  onOpen?: () => void;
  /** Called when the dropdown closes. */
  onClose?: () => void;
  /** Dropdown placement relative to the target. @default 'bottom-start' */
  position?: PopoverPosition;
  /** Called with the RESOLVED placement whenever it changes (e.g. on flip/shift). */
  onPositionChange?: (position: PopoverPosition) => void;
  /**
   * Gap between target and dropdown. A space token or `number` sets the main-axis
   * gutter; object form skids per axis (`{ mainAxis; crossAxis; alignmentAxis }`).
   * @default '$xs'
   */
  offset?: PopoverOffset;
  /** Dropdown width; `'target'` matches the target width. @default 'max-content' */
  width?: PopoverWidth;
  /** Render the dropdown in a portal. @default true */
  withinPortal?: boolean;
  /** Keep the dropdown mounted while closed (adds `display: none`). @default false */
  keepMounted?: boolean;
  /** Dropdown `z-index`. @default 300 */
  zIndex?: number;
  /** Positioning strategy. @default 'fixed' */
  strategy?: Strategy;
  /** Dropdown border radius. */
  radius?: RadiusTokens;
  /** Dropdown shadow scale. @default 'md' */
  shadow?: keyof typeof shadowVariant;
  /** Skip rendering the dropdown entirely. */
  disabled?: boolean;
  /** Close the dropdown when a press lands outside it (web). @default true */
  closeOnClickOutside?: boolean;
  /** Close the dropdown when the `Escape` key is pressed (web). @default true */
  closeOnEscape?: boolean;
  /**
   * Trap keyboard focus within the dropdown while opened (web; no-op on native —
   * see `useFocusTrap`). @default false
   */
  trapFocus?: boolean;
  /** Return focus to the target when the dropdown closes (web). @default false */
  returnFocus?: boolean;
  /** Render a full-cover `Overlay` scrim behind the open dropdown. @default false */
  withOverlay?: boolean;
  /**
   * @deprecated Use `styles={{ overlay: … }}`. Kept as a backward-compatible alias
   * for the `Overlay` rendered when `withOverlay` is set; merged OVER the `overlay`
   * slot (explicit beats sugar).
   */
  overlayProps?: Partial<OverlayProps>;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<PopoverStyles>;
  /**
   * Called when the dropdown is dismissed by an outside-press or `Escape` —
   * distinct from `onClose`, which fires on every close (including programmatic /
   * controlled ones).
   */
  onDismiss?: () => void;
  /**
   * Wire ARIA roles between target and dropdown: the target gets
   * `aria-haspopup="dialog"` / `aria-expanded` / `aria-controls`, the dropdown gets
   * `role="dialog"` + `aria-labelledby`. Mantine defaults this to `true`, but its
   * composite components (`Menu`/`Select`/`Combobox`) pass `withRoles={false}` and
   * set their own roles — so we default to `false` and let a plain `Popover` opt in,
   * keeping those consumers (which build on `Popover`) unchanged. @default false
   */
  withRoles?: boolean;
  /**
   * Enter/exit animation for the dropdown — preset name (or custom style set),
   * `duration`, `exitDuration`, and `timingFunction`. Mirrors Mantine's
   * `transitionProps`; rides the shared `Transition` engine.
   * @default { transition: 'fade', duration: 150, timingFunction: 'ease-in-out' }
   */
  transitionProps?: OverlayTransitionConfig;
  /**
   * Motion preset for the dropdown — the unified `animation` vocabulary shared with
   * Modal/Dialog/Drawer (e.g. `"fade"`, `"pop"`, `"scale"`). Sugar over
   * `transitionProps.transition`, which wins if both are set.
   */
  animation?: MotionPresetName;
  /** Render an arrow pointing at the target. @default false */
  withArrow?: boolean;
  /** Arrow square edge length in px. @default 7 */
  arrowSize?: number;
  /** Arrow distance from the start/end edge when `arrowPosition="side"`. @default '$xxs' */
  arrowOffset?: PopoverArrowOffset;
  /** Corner radius of the arrow's outward corner in px. @default 0 */
  arrowRadius?: number;
  /** Arrow alignment: centered, or pinned toward an aligned placement. @default 'side' */
  arrowPosition?: PopoverArrowPosition;
}

/** Custom middleware: records the reference width so `width:'target'` can apply it. */
const referenceWidthMiddleware: Middleware = {
  name: "knituiReferenceWidth",
  fn({ rects }) {
    return { data: { width: rects.reference.width } };
  },
};

const resolveSpaceOffset = (value: SpaceTokens): number => {
  const resolved = getTokenValue(value as TokenValueInput, "space");
  return typeof resolved === "number" ? resolved : 0;
};

const resolveAxisOffset = (
  value: PopoverAxisOffset | null | undefined,
): number | null | undefined => {
  if (value == null || typeof value === "number") return value;
  // Anything else is a space token (`SpaceTokens` widens to include the token
  // `Variable`); resolve it to a px number.
  return resolveSpaceOffset(value);
};

const resolvePopoverOffset = (value: PopoverOffset): FloatingOffset => {
  if (typeof value !== "object" || value === null) return resolveAxisOffset(value) ?? 0;

  // A non-scalar offset is the per-axis object form. (`SpaceTokens` widens the
  // union to include the token `Variable`, also an object, but that's never
  // passed here — accessing the axis keys on one just yields `undefined`.)
  const axes = value as PopoverAxesOffsets;
  const resolved: FloatingAxesOffsets = {
    mainAxis: resolveAxisOffset(axes.mainAxis) ?? undefined,
    crossAxis: resolveAxisOffset(axes.crossAxis) ?? undefined,
    alignmentAxis: resolveAxisOffset(axes.alignmentAxis),
  };

  return resolved;
};

export function PopoverRoot(props: PopoverProps) {
  const {
    children,
    opened,
    defaultOpened,
    onChange,
    onOpen,
    onClose,
    onPositionChange,
    position = "bottom-start",
    offset: offsetValue = DEFAULT_OFFSET,
    width = "max-content",
    withinPortal = true,
    keepMounted = false,
    zIndex = 300,
    strategy = "fixed",
    radius,
    shadow = "md",
    disabled,
    closeOnClickOutside = true,
    closeOnEscape = true,
    trapFocus = false,
    returnFocus = false,
    withOverlay = false,
    overlayProps,
    transitionProps,
    animation,
    styles,
    onDismiss,
    withRoles = false,
    withArrow = false,
    arrowSize = 7,
    arrowOffset = DEFAULT_ARROW_OFFSET,
    arrowRadius = 0,
    arrowPosition = "side",
  } = props;

  // Per-slot style sugar, distributed via the shared floating-chrome resolver.
  // `overlayProps` (deprecated alias) wins over the `overlay` slot sugar.
  const s = useOverlayChrome<PopoverStyles>(styles, [], "Popover");
  const resolvedOverlayProps = s.merge("overlay", overlayProps);
  const dropdownSlot = s.get("dropdown");
  const arrowSlot = s.get("arrow");

  const uid = useId();
  const targetId = `${uid}-target`;
  const dropdownId = `${uid}-dropdown`;

  const [isOpen, setOpen] = useUncontrolled<boolean>({
    value: opened,
    defaultValue: defaultOpened,
    finalValue: false,
    onChange,
  });

  const resolvedArrowOffset = resolveAxisOffset(arrowOffset) ?? 0;

  const floating = useFloating({
    placement: position,
    strategy,
    whileElementsMounted: isOpen ? autoUpdate : undefined,
    middleware: [
      offset(resolvePopoverOffset(offsetValue)),
      flip(),
      shift({ padding: resolveSpaceOffset(DEFAULT_SHIFT_PADDING), limiter: limitShift() }),
      // Runs after shift so the arrow coordinate tracks the target even when the
      // dropdown was slid along the cross axis; `padding`/`cornerRadius` keep the
      // arrow off the dropdown's (rounded) corners.
      ...(withArrow
        ? [
            arrowMiddleware({
              size: arrowSize,
              position: arrowPosition,
              offset: resolvedArrowOffset,
              padding: resolvedArrowOffset,
              // The dropdown frame's default radius is `$sm` (see PopoverDropdownFrame).
              cornerRadius: resolveRadiusPx(radius),
            }),
          ]
        : []),
      referenceWidthMiddleware,
    ],
  });

  const close = React.useCallback(() => setOpen(false), [setOpen]);
  const toggle = React.useCallback(() => {
    if (disabled) return;
    setOpen(!isOpen);
  }, [disabled, isOpen, setOpen]);

  // Fire open/close side-effects on transitions only; on close, optionally return
  // focus to the target (web). `floating.refs.reference.current` is the mounted DOM
  // node on web — `instanceof HTMLElement` narrows the `ReferenceType` cast-free.
  const { reference } = floating.refs;
  const prevOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen !== prevOpen.current) {
      (isOpen ? onOpen : onClose)?.();
      // `returnFocus` is a web-only affordance: native has no DOM focus model and
      // `HTMLElement` is undefined under Hermes, so even *evaluating*
      // `instanceof HTMLElement` there throws a ReferenceError. Gate the whole
      // block on `isWeb` so the reference is never touched on native.
      if (isWeb && !isOpen && returnFocus) {
        const ref = reference.current;
        if (ref instanceof HTMLElement) ref.focus({ preventScroll: true });
      }
      prevOpen.current = isOpen;
    }
  }, [isOpen, onOpen, onClose, returnFocus, reference]);

  // Surface the resolved placement (floating-ui flips/shifts it away from the
  // requested `position` when it would overflow). Fires only on an actual change —
  // the ref is seeded with the initial placement, so there's no spurious first run.
  const { placement } = floating;
  const prevPlacement = React.useRef(placement);
  React.useEffect(() => {
    if (placement !== prevPlacement.current) {
      prevPlacement.current = placement;
      onPositionChange?.(placement);
    }
  }, [placement, onPositionChange]);

  const referenceWidth = (floating.middlewareData as { knituiReferenceWidth?: { width: number } })
    .knituiReferenceWidth?.width;

  const resolvedWidth =
    width === "target"
      ? referenceWidth
      : width === "max-content"
        ? // `"max-content"` is a web-only CSS keyword; a native `View` rejects it
          // (Yoga only accepts a number/percent). Leave the width unset on native
          // so the dropdown sizes to its content automatically.
          isWeb
          ? "max-content"
          : undefined
        : width;

  const value = React.useMemo<PopoverContextValue>(
    () => ({
      opened: !disabled && isOpen,
      onClose: close,
      onToggle: toggle,
      floating,
      resolvedWidth,
      zIndex,
      withinPortal,
      keepMounted,
      transitionProps: transitionProps ?? EMPTY_TRANSITION,
      animation,
      radius,
      shadow,
      closeOnClickOutside,
      closeOnEscape,
      trapFocus,
      withOverlay,
      overlayProps: resolvedOverlayProps,
      slots: { dropdown: dropdownSlot, arrow: arrowSlot },
      onDismiss,
      withRoles,
      targetId,
      dropdownId,
      withArrow,
      arrowSize,
      arrowOffset: resolvedArrowOffset,
      arrowRadius,
      arrowPosition,
    }),
    [
      disabled,
      isOpen,
      close,
      toggle,
      floating,
      resolvedWidth,
      zIndex,
      withinPortal,
      keepMounted,
      transitionProps,
      animation,
      radius,
      shadow,
      closeOnClickOutside,
      closeOnEscape,
      trapFocus,
      withOverlay,
      resolvedOverlayProps,
      dropdownSlot,
      arrowSlot,
      onDismiss,
      withRoles,
      targetId,
      dropdownId,
      withArrow,
      arrowSize,
      resolvedArrowOffset,
      arrowRadius,
      arrowPosition,
    ],
  );

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/* Target                                                                     */
/* -------------------------------------------------------------------------- */

export interface PopoverTargetProps {
  /** Single element child that accepts a ref. */
  children: React.ReactElement;
  /** Prop name used to pass the ref into the child. @default 'ref' */
  refProp?: string;
  /**
   * Toggle the dropdown when the target is pressed. Set `false` when the consumer
   * drives open/close itself (e.g. the combobox family opens on focus/typing and
   * would otherwise double-fire). @default true
   */
  withPressToggle?: boolean;
  /**
   * Prop name to attach the positioning/measuring reference to, INSTEAD of merging
   * it into `refProp`. Use when the child's own `ref` points at an inner element
   * (e.g. `InputBase`'s `ref` → the bare `<input>`) but the dropdown should anchor
   * to and match the width of an outer wrapper exposed via this prop (e.g.
   * `rootRef` → the visible field frame). The child's own `ref` is left untouched —
   * without this, a `width:'target'` dropdown would measure the inner input and
   * render too narrow.
   */
  referenceRefProp?: string;
}

export function PopoverTarget({
  children,
  refProp = "ref",
  withPressToggle = true,
  referenceRefProp,
}: PopoverTargetProps) {
  const ctx = usePopoverContext();
  const { setReference } = ctx.floating.refs;
  const childRef = (children as { ref?: React.Ref<TamaguiElement> }).ref;
  // floating-ui's web `setReference` is typed for DOM nodes (`ReferenceType`),
  // while Tamagui refs carry `TamaguiElement` (`HTMLElement | View`). On web the
  // mounted node is always the DOM element, so narrow to the setter's own param
  // type when forwarding.
  const setReferenceRef = React.useCallback(
    (node: TamaguiElement | null) => {
      setReference(node as Parameters<typeof setReference>[0]);
    },
    [setReference],
  );
  const mergedRef = useMergedRef<TamaguiElement>(setReferenceRef, childRef);

  // ARIA roles linking target → dropdown (web; opt-in via `withRoles`). `role`/
  // `aria-*`/`id` resolve at runtime on the cloned child; typed precisely here.
  const roleProps: {
    id?: string;
    "aria-haspopup"?: "dialog";
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
  } = ctx.withRoles
    ? {
        id: ctx.targetId,
        "aria-haspopup": "dialog",
        "aria-expanded": ctx.opened,
        "aria-controls": ctx.dropdownId,
      }
    : {};

  const child = children as React.ReactElement<{ onPress?: (event: unknown) => void }>;
  const childOnPress = child.props.onPress;
  const handlePress = React.useCallback(
    (event: unknown) => {
      childOnPress?.(event);
      ctx.onToggle();
    },
    [childOnPress, ctx],
  );

  // Dedicated-reference mode: attach the positioning/measuring ref to a separate
  // prop (e.g. `rootRef` → the visible field frame) and leave the child's own
  // `ref` untouched, so the consumer's ref keeps pointing at the inner control
  // (e.g. the bare `<input>`) while the dropdown anchors to / matches the width of
  // the outer wrapper. `width:'target'` would otherwise measure the inner input.
  if (referenceRefProp) {
    const refProps = { [referenceRefProp]: setReferenceRef, ...roleProps };
    return React.cloneElement(
      children,
      (withPressToggle ? { ...refProps, onPress: handlePress } : refProps) as React.Attributes,
    );
  }

  // Ref-only mode: forward the reference ref without hijacking `onPress`. The
  // consumer (e.g. Combobox) wires open/close to the child's own events.
  if (!withPressToggle) {
    return React.cloneElement(children, {
      [refProp]: mergedRef,
      ...roleProps,
    } as React.Attributes);
  }

  // Toggle the dropdown when the target is pressed, preserving any `onPress` the
  // child already declares. This is what makes an uncontrolled `Popover` open on
  // click (and a controlled one drive its `onChange`) without the consumer having
  // to wire the toggle themselves — matching Mantine's `Popover.Target`.
  return React.cloneElement(child, {
    [refProp]: mergedRef,
    onPress: handlePress,
    ...roleProps,
  } as Partial<{ onPress?: (event: unknown) => void }> & React.Attributes);
}

/* -------------------------------------------------------------------------- */
/* Dropdown presentation (shared)                                             */
/* -------------------------------------------------------------------------- */

export interface PopoverDropdownProps extends GetProps<typeof PopoverDropdownFrame> {
  /** Hide the dropdown (e.g. when there are no options) without unmounting. */
  hidden?: boolean;
}

/** Props the platform variants feed into the shared {@link PopoverDropdownView}. */
export interface PopoverDropdownViewProps extends PopoverDropdownProps {
  /**
   * Platform scrim element rendered behind the dropdown inside the portal (or
   * `null`). The web variant only renders it for `withOverlay` (purely visual);
   * the native variant also renders an invisible one to catch the outside-tap.
   * The caller is responsible for gating it on `open`.
   */
  scrim?: React.ReactNode;
  /**
   * Extra props spread onto the dropdown frame — the native variant uses this for
   * its `onLayout` re-measure and the responder claim that stops taps inside the
   * dropdown from falling through to the scrim.
   */
  frameProps?: Partial<GetProps<typeof PopoverDropdownFrame>>;
}

/**
 * The platform-neutral dropdown render: positions the frame from the floating
 * engine, teleports it (optionally) into the portal host, re-applies the active
 * theme inside the portal, and draws the arrow. The two platform variants
 * (`Popover.tsx` / `Popover.native.tsx`) own only the close/dismiss wiring and
 * feed it a `scrim` + `frameProps`, so the presentation stays in one place.
 */
export const PopoverDropdownView = PopoverDropdownFrame.styleable<PopoverDropdownViewProps>(
  function PopoverDropdownView({ hidden, children, scrim, frameProps, ...rest }, ref) {
    const ctx = usePopoverContext();
    const open = ctx.opened;
    const { refs, x, y, isPositioned, placement, middlewareData } = ctx.floating;
    const { setFloating } = refs;
    // `setFloating` is typed for `HTMLElement` on web; the styled frame's ref is
    // `Ref<TamaguiElement>` (`HTMLElement | View`). The frame renders a DOM node on
    // web, so narrow to the setter's own param type when forwarding.
    const setFloatingRef = React.useCallback(
      (node: TamaguiElement | null) => {
        setFloating(node as Parameters<typeof setFloating>[0]);
      },
      [setFloating],
    );
    // Trap keyboard focus within the dropdown while opened (web; native no-op — see
    // `useFocusTrap`). Merge the trap ref with the floating positioner ref.
    const trapRef = useFocusTrap(open && ctx.trapFocus);
    const dropdownRef = useMergedRef<TamaguiElement>(setFloatingRef, trapRef, ref);

    // ARIA roles linking dropdown ← target (opt-in via `withRoles`). `role`/`id`/
    // `aria-*` are typed on the styled frame (cf. `Menu` `role="menu"`).
    const roleProps: { role?: "dialog"; id?: string; "aria-labelledby"?: string } = ctx.withRoles
      ? { role: "dialog", id: ctx.dropdownId, "aria-labelledby": ctx.targetId }
      : {};

    // Re-apply the active theme inside the portal: portaling to `document.body`
    // moves the dropdown out of the theme's DOM ancestor on web, so its CSS theme
    // variables ($background/$color/…) would otherwise resolve to the root theme.
    // (Mirrors `@tamagui/portal` wrapping its portal in `<TamaguiRoot theme={…}>`.)
    const themeName = useThemeName();
    // Enter/exit animation via the shared `Transition` engine. It owns the lazy
    // mount/unmount (so the dropdown now animates OUT before unmounting, not just
    // in) and honours reduced motion (duration collapses to 0). Positioning,
    // measurement, and the portal stay owned here.
    const t = useOverlayTransition({
      mounted: open,
      keepMounted: ctx.keepMounted,
      animation: ctx.animation,
      ...ctx.transitionProps,
    });
    // Hide the dropdown until it has been positioned (both platforms — the custom
    // floating engine reports `isPositioned` on native too). This avoids a flash
    // at the un-positioned origin (top-left) before the first measurement; it
    // overrides the transition's opacity until the first measurement lands, after
    // which the transition owns opacity again.
    const waitingForPosition = !isPositioned;

    if (!t.rendered) return null;

    // The transition style wins on opacity/transform; consumer/slot styles apply
    // underneath. `top`/`left` come from floating-ui as props and stay instant —
    // the transition only animates the keys in `animateOnly` (native) / the inline
    // `transitionProperty` (web), never position.
    const { style: restStyle, ...frameRest } = rest;
    const transitionStyle = waitingForPosition ? { ...t.style, opacity: 0 } : t.style;

    return (
      <Portal hostName={ctx.withinPortal ? "root" : undefined}>
        <Theme name={themeName}>
          {/* Keep the scrim and the dropdown frame as direct siblings (rather
              than hoisting the scrim above `<Theme>`) so their z-indices compare
              directly on native, where `zIndex` is strictly sibling-relative: the
              frame carries `ctx.zIndex` and the scrim sits one below it
              (`ctx.zIndex - 1`), so the dropdown paints — and receives touches —
              above the scrim. On web the scrim is fixed-position and the order is
              irrelevant. */}
          {scrim}
          <PopoverDropdownFrame
            ref={dropdownRef}
            hidden={hidden || t.hidden}
            top={y}
            left={x}
            width={ctx.resolvedWidth}
            // The teleport host is `pointer-events: none` so its full-screen box
            // never swallows page clicks — re-enable events on the dropdown itself
            // so it stays interactive (disabled while pre-measuring and while it
            // animates out, when it's no longer `open`).
            pointerEvents={open && !waitingForPosition ? "auto" : "none"}
            zIndex={ctx.zIndex}
            shadow={ctx.shadow}
            borderRadius={ctx.radius}
            {...roleProps}
            // `dropdown` slot sugar layers UNDER the explicit `frameProps`/`rest`.
            {...ctx.slots.dropdown}
            {...frameProps}
            {...frameRest}
            // Engine animation props (native) + the computed enter/exit style win
            // last so positioning stays instant and consumer styles can't clobber
            // the transition. Styles merge left→right: slot < consumer < transition.
            {...t.animation}
            style={[ctx.slots.dropdown?.style, restStyle, transitionStyle]}
          >
            {children}
            {ctx.withArrow ? (
              <FloatingArrow
                placement={placement}
                size={ctx.arrowSize}
                offset={ctx.arrowOffset}
                position={ctx.arrowPosition}
                radius={ctx.arrowRadius}
                background="$background"
                arrowX={middlewareData.arrow?.x}
                arrowY={middlewareData.arrow?.y}
                // Appearance sugar overrides the defaults above; the slot type
                // (PopoverArrowStyle) excludes the positioning props, so internal
                // positioning can never be clobbered.
                {...ctx.slots.arrow}
              />
            ) : null}
          </PopoverDropdownFrame>
        </Theme>
      </Portal>
    );
  },
);
