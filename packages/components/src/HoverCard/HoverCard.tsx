import * as React from "react";

import {
  type GetProps,
  isWeb,
  type RadiusTokens,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { type Placement } from "../floating";
import {
  type ArrowPosition,
  FloatingArrow,
  type FloatingArrowProps,
} from "../internal/floating-arrow";
import { type FloatingOffset } from "../internal/floating-offset";
import { type MotionPresetName } from "../internal/motion";
import { useOverlayChrome } from "../internal/overlay-chrome";
import { hoverProps, shadowVariant } from "../internal/style-props";
import { type SlotStyles } from "../internal/styles";
import { type OverlayProps } from "../Overlay";
import { Popover, type PopoverProps } from "../Popover";
import { type OverlayTransitionConfig } from "../Transition/use-overlay-transition";

export type HoverCardPosition = Placement;
export type HoverCardWidth = "target" | "max-content" | number;
export type HoverCardArrowPosition = ArrowPosition;
/** Main-axis gutter `number`, or a per-axis `{ mainAxis; crossAxis; alignmentAxis }` object. */
export type HoverCardOffset = FloatingOffset;

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * HoverCard's reason to exist is its hover-intent open/close behaviour: the
 * positioning, width handling, overlay, arrow and dropdown chrome are all
 * delegated to `Popover` (HoverCard renders through `Popover.Target` /
 * `Popover.Dropdown`), so the context only carries the hover-intent callbacks
 * plus the `target` slot sugar HoverCard layers on top.
 */
interface HoverCardContextValue {
  /** Open after `openDelay`. */
  openDropdown: () => void;
  /** Close after `closeDelay`. */
  closeDropdown: () => void;
  /** Cancel a pending open/close (used when the pointer enters the dropdown). */
  cancel: () => void;
  /** Resolved `target` slot sugar — cloned onto the target child. */
  targetSlot?: GetProps<typeof Box>;
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null);

const useHoverCardContext = (): HoverCardContextValue => {
  const ctx = React.useContext(HoverCardContext);
  if (!ctx) {
    throw new Error("HoverCard compound components must be rendered inside <HoverCard>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* Styled dropdown frame                                                      */
/* -------------------------------------------------------------------------- */

const HoverCardDropdownFrame = styled(Box, {
  name: "HoverCardDropdown",
  // `fixed` is viewport-relative positioning that only exists on web; React
  // Native supports `absolute`/`relative`/`static` only. The instance mirrors
  // Popover/Tooltip and uses the platform-correct value.
  position: isWeb ? ("fixed" as const) : ("absolute" as const),
  padding: "$md",

  variants: {
    hidden: { true: { display: "none" } },
    shadow: shadowVariant,
  } as const,
});

/**
 * The appearance-only subset of {@link FloatingArrowProps} a consumer may style
 * via the `arrow` slot. The positioning-driven props stay internally controlled.
 */
export type FloatingArrowStyle = Pick<
  FloatingArrowProps,
  "background" | "borderColor" | "borderWidth" | "radius"
>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, using the canonical floating vocabulary.
 *
 * `overlay` is low-precedence sugar: it layers UNDER the explicit `overlayProps`,
 * so the explicit per-part props win (the "explicit beats sugar" rule).
 */
export interface HoverCardStyles {
  /** Props cloned onto the target child (`HoverCard.Target`'s element). */
  target?: GetProps<typeof Box>;
  /** Props spread onto the `Overlay` scrim (under `overlayProps`). */
  overlay?: Partial<OverlayProps>;
  /** Props spread onto the dropdown frame (`HoverCard.Dropdown`). */
  dropdown?: GetProps<typeof HoverCardDropdownFrame>;
  /** Appearance props for the arrow; positioning stays internal. */
  arrow?: FloatingArrowStyle;
}

/**
 * HoverCard-specific slot layered on the canonical floating vocabulary
 * (`overlay`/`dropdown`/`arrow`) by {@link useOverlayChrome}. The canonical three
 * are forwarded to `Popover`'s own `styles` map; only `target` is resolved here.
 */
const HOVERCARD_EXTRA_SLOT_KEYS = ["target"] as const satisfies readonly (keyof HoverCardStyles &
  string)[];

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export interface HoverCardProps {
  /** Target + dropdown. */
  children?: React.ReactNode;
  /** Initial opened state (HoverCard is hover-driven, not value-controlled). @default false */
  initiallyOpened?: boolean;
  /** Called when the dropdown opens. */
  onOpen?: () => void;
  /** Called when the dropdown closes. */
  onClose?: () => void;
  /** Delay before opening on hover, in ms. @default 0 */
  openDelay?: number;
  /** Delay before closing on leave, in ms. @default 150 */
  closeDelay?: number;
  /** Dropdown placement relative to the target. @default 'bottom' */
  position?: HoverCardPosition;
  /** Called with the RESOLVED placement whenever it changes (e.g. on flip/shift). */
  onPositionChange?: (position: HoverCardPosition) => void;
  /**
   * Gap between target and dropdown. A `number` is the main-axis gutter in px; an
   * object skids per axis (`{ mainAxis; crossAxis; alignmentAxis }`). @default 8
   */
  offset?: HoverCardOffset;
  /** Dropdown width; `'target'` matches the target width. @default 'max-content' */
  width?: HoverCardWidth;
  /** Render the dropdown in a portal. @default true */
  withinPortal?: boolean;
  /** Keep the dropdown mounted while closed (adds `display: none`). @default false */
  keepMounted?: boolean;
  /** Dropdown `z-index`. @default 300 */
  zIndex?: number;
  /** Dropdown border radius. */
  radius?: RadiusTokens;
  /** Dropdown shadow scale. @default 'md' */
  shadow?: keyof typeof shadowVariant;
  /** Disable the hover card (never opens). */
  disabled?: boolean;
  /** Render a full-cover `Overlay` scrim behind the open dropdown. @default false */
  withOverlay?: boolean;
  /**
   * Enter/exit animation for the dropdown — forwarded to the underlying `Popover`.
   * Mirrors Mantine's `transitionProps`.
   * @default { transition: 'fade', duration: 150, timingFunction: 'ease-in-out' }
   */
  transitionProps?: OverlayTransitionConfig;
  /**
   * Motion preset for the dropdown — the unified `animation` vocabulary shared with
   * Modal/Dialog/Drawer. Forwarded to the underlying `Popover`; sugar over
   * `transitionProps.transition`, which wins if both are set.
   */
  animation?: MotionPresetName;
  /**
   * @deprecated Use `styles={{ overlay: … }}`. Kept as a backward-compatible alias
   * merged OVER the `overlay` slot (explicit beats sugar).
   */
  overlayProps?: Partial<OverlayProps>;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<HoverCardStyles>;
  /** Render an arrow pointing at the target. @default false */
  withArrow?: boolean;
  /** Arrow square edge length in px. @default 7 */
  arrowSize?: number;
  /** Arrow distance from the start/end edge when `arrowPosition="side"`. @default 5 */
  arrowOffset?: number;
  /** Corner radius of the arrow's outward corner in px. @default 0 */
  arrowRadius?: number;
  /** Arrow alignment: centered, or pinned toward an aligned placement. @default 'side' */
  arrowPosition?: HoverCardArrowPosition;
}

function HoverCardRoot(props: HoverCardProps) {
  const {
    children,
    initiallyOpened = false,
    onOpen,
    onClose,
    onPositionChange,
    openDelay = 0,
    closeDelay = 150,
    position = "bottom",
    offset: offsetValue = 8,
    width = "max-content",
    withinPortal = true,
    keepMounted = false,
    zIndex = 300,
    radius,
    shadow = "md",
    disabled,
    withOverlay = false,
    overlayProps,
    transitionProps,
    animation,
    styles,
    withArrow = false,
    arrowSize = 7,
    arrowOffset = 5,
    arrowRadius = 0,
    arrowPosition = "side",
  } = props;

  // Per-slot style sugar. The canonical `overlay`/`dropdown`/`arrow` slots are
  // forwarded wholesale to `Popover`'s own `styles` map (Popover owns those
  // parts now); only the HoverCard-specific `target` extra is resolved here and
  // cloned onto the target child. `useOverlayChrome` still validates the whole
  // vocabulary so an unknown-slot typo warns.
  const s = useOverlayChrome<HoverCardStyles>(styles, HOVERCARD_EXTRA_SLOT_KEYS, "HoverCard");
  const targetSlot = s.get("target");

  const [isOpen, setOpen] = React.useState(initiallyOpened);

  const openTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = React.useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);
  React.useEffect(() => cancel, [cancel]);

  const openDropdown = React.useCallback(() => {
    if (disabled) return;
    cancel();
    if (openDelay) openTimer.current = setTimeout(() => setOpen(true), openDelay);
    else setOpen(true);
  }, [cancel, disabled, openDelay]);

  const closeDropdown = React.useCallback(() => {
    cancel();
    if (closeDelay) closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
    else setOpen(false);
  }, [cancel, closeDelay]);

  // Fire open/close side-effects on transitions only.
  const prevOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen !== prevOpen.current) {
      (isOpen ? onOpen : onClose)?.();
      prevOpen.current = isOpen;
    }
  }, [isOpen, onOpen, onClose]);

  const opened = !disabled && isOpen;

  const value = React.useMemo<HoverCardContextValue>(
    () => ({ openDropdown, closeDropdown, cancel, targetSlot }),
    [openDropdown, closeDropdown, cancel, targetSlot],
  );

  // The canonical chrome slots flow straight through to Popover's `styles` map
  // (Popover resolves them via the same `useOverlayChrome`), so `target` is the
  // only slot HoverCard consumes itself. Cast preserves the shared overlay/
  // dropdown/arrow shapes without re-declaring them.
  const popoverStyles = React.useMemo<PopoverProps["styles"] | undefined>(
    () =>
      styles
        ? {
            overlay: styles.overlay,
            dropdown: styles.dropdown,
            arrow: styles.arrow,
          }
        : undefined,
    [styles],
  );

  return (
    <HoverCardContext.Provider value={value}>
      <Popover
        // HoverCard is hover-driven: drive Popover as a controlled popover from
        // the hover-intent state above.
        opened={opened}
        position={position}
        onPositionChange={onPositionChange}
        offset={offsetValue}
        width={width}
        withinPortal={withinPortal}
        keepMounted={keepMounted}
        zIndex={zIndex}
        radius={radius}
        shadow={shadow}
        disabled={disabled}
        withOverlay={withOverlay}
        overlayProps={overlayProps}
        transitionProps={transitionProps}
        animation={animation}
        styles={popoverStyles}
        withArrow={withArrow}
        arrowSize={arrowSize}
        arrowOffset={arrowOffset}
        arrowRadius={arrowRadius}
        arrowPosition={arrowPosition}
        // HoverCard closes on hover-out, never on outside-press / Escape, so the
        // Popover's dismissal affordances (web document listeners + native
        // tap-catching scrim) must be disabled — otherwise the native scrim would
        // swallow the hover and the card would dismiss mid-interaction.
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        {children}
      </Popover>
    </HoverCardContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Target                                                                     */
/* -------------------------------------------------------------------------- */

export interface HoverCardTargetProps {
  /** Single element child that accepts a ref. */
  children: React.ReactElement;
  /** Prop name used to pass the ref into the child. @default 'ref' */
  refProp?: string;
}

type HoverHandlers = {
  onHoverIn?: (event: unknown) => void;
  onHoverOut?: (event: unknown) => void;
  onMouseEnter?: (event: unknown) => void;
  onMouseLeave?: (event: unknown) => void;
};

function HoverCardTarget({ children, refProp = "ref" }: HoverCardTargetProps) {
  const ctx = useHoverCardContext();

  const child = children as React.ReactElement<HoverHandlers>;
  const childProps = child.props;

  // Hover-intent handlers — HoverCard's reason to exist. Web uses mouse events,
  // native uses Tamagui's `onHoverIn`/`onHoverOut`.
  const handlers: HoverHandlers = isWeb
    ? {
        onMouseEnter: (e) => {
          childProps.onMouseEnter?.(e);
          childProps.onHoverIn?.(e);
          ctx.openDropdown();
        },
        onMouseLeave: (e) => {
          childProps.onMouseLeave?.(e);
          childProps.onHoverOut?.(e);
          ctx.closeDropdown();
        },
      }
    : {
        onHoverIn: (e) => {
          childProps.onHoverIn?.(e);
          ctx.openDropdown();
        },
        onHoverOut: (e) => {
          childProps.onHoverOut?.(e);
          ctx.closeDropdown();
        },
      };

  // Clone the child with the hover handlers + `target` slot sugar, then hand it to
  // `Popover.Target` (with `withPressToggle={false}` so it only attaches the
  // positioning reference ref, never a press toggle). The reference ref + width
  // handling all come from Popover's engine now.
  const hovered = React.cloneElement(child, {
    // `target` slot sugar layers UNDER the child's own props (the child's inline
    // props win — "explicit beats sugar").
    ...ctx.targetSlot,
    ...childProps,
    ...handlers,
  } as Partial<HoverHandlers> & React.Attributes);

  return (
    <Popover.Target refProp={refProp} withPressToggle={false}>
      {hovered}
    </Popover.Target>
  );
}

/* -------------------------------------------------------------------------- */
/* Dropdown                                                                   */
/* -------------------------------------------------------------------------- */

export interface HoverCardDropdownProps extends GetProps<typeof HoverCardDropdownFrame> {}

function HoverCardDropdown({ children, ...rest }: HoverCardDropdownProps) {
  const ctx = useHoverCardContext();

  // Compose Popover's dropdown for positioning, portal, theme re-application,
  // arrow rendering AND the enter/exit animation (driven by the `transitionProps`
  // HoverCard forwards to Popover). HoverCard layers only its own behaviour on
  // top: keep the card open while the pointer is over the dropdown.
  return (
    <Popover.Dropdown
      padding="$md"
      // Keep open while the pointer is over the dropdown.
      {...hoverProps({ onHoverIn: ctx.cancel, onHoverOut: ctx.closeDropdown })}
      {...rest}
    >
      {children}
    </Popover.Dropdown>
  );
}

/* -------------------------------------------------------------------------- */
/* Compound export                                                            */
/* -------------------------------------------------------------------------- */

export const HoverCard = withStaticProperties(HoverCardRoot, {
  Target: HoverCardTarget,
  Dropdown: HoverCardDropdown,
  /** The pointer arrow; 1:1 with the `arrow` slot. */
  Arrow: FloatingArrow,
});
