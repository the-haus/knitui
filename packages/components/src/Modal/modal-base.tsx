import * as React from "react";

import { AnimatePresence, isWeb, Theme, useThemeName } from "@knitui/core";
import { useFocusTrap } from "@knitui/hooks";

import { type BoxProps } from "../Box";
import type { CloseButtonProps } from "../CloseButton";
import { type MotionPreset, type MotionPresetName, useMotionPreset } from "../internal/motion";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Overlay, type OverlayProps } from "../Overlay";
import { Portal } from "../Portal";
import { ModalBaseInner } from "./modal-base-inner";

/**
 * Shared scaffolding for `Modal` and `Drawer` — mirrors Mantine's `ModalBase`.
 * Owns the cross-cutting overlay behaviour so both components only have to
 * describe how their content frame is positioned:
 *
 *  - portals the layer (the `Portal` re-applies the active `Theme` across the
 *    DOM boundary, so `$background`/ramp tokens keep resolving),
 *  - paints a full-cover `Overlay` scrim BEHIND the content (content frames carry
 *    `position:"relative", zIndex:1`; the scrim sits at `zIndex:0`), so a click on
 *    the empty area around the content hits the scrim and closes,
 *  - wires the web-only side effects: Escape to close, body scroll-lock, and
 *    return-focus on close.
 *
 * `trapFocus` traps keyboard focus within the content on web via the shared
 * `useFocusTrap` hook (no-op on native — there is no DOM focus model, the same
 * class of deferral as `Overlay`'s web-only `blur`/`gradient`). Both entrance AND
 * exit are animated: the whole layer is wrapped in `AnimatePresence`, which holds
 * it mounted through its exit before unmounting, so the scrim fade and the content
 * frame's `exitStyle` (supplied by the consumer) play on close. `keepMounted`
 * opts out (the node never leaves, so it only toggles `display`).
 */
/** Props every public overlay (`Modal`/`Drawer`) shares, mirroring Mantine names. */
export interface ModalBaseSharedProps {
  /** Controlled opened state. */
  opened: boolean;
  /** Called when the overlay requests to close (Escape, overlay click, close button). */
  onClose: () => void;
  /** Close when the user presses Escape (web). @default true */
  closeOnEscape?: boolean;
  /** Close when the user clicks the overlay scrim. @default true */
  closeOnClickOutside?: boolean;
  /** Lock body scroll while opened (web). @default true */
  lockScroll?: boolean;
  /** Return focus to the previously-focused element on close (web). @default true */
  returnFocus?: boolean;
  /**
   * Trap keyboard focus within the content while opened (web; no-op on native).
   * @default true
   */
  trapFocus?: boolean;
  /** Render inside a `Portal`. @default true */
  withinPortal?: boolean;
  /** Keep mounted while closed (toggles `display:"none"` instead of unmounting). @default false */
  keepMounted?: boolean;
  /** Render the overlay scrim. @default true */
  withOverlay?: boolean;
  /** Props forwarded to the underlying `Overlay` scrim. */
  overlayProps?: OverlayProps;
  /** Root `z-index`. @default 200 */
  zIndex?: number;
  /**
   * Enter/exit animation for the overlay scrim — a motion preset name, an inline
   * {@link MotionPreset}, or `false` to disable. @default "fade". Reduced motion is
   * always honoured. The content frame's own animation is supplied separately by the
   * consumer (`Modal`/`Drawer`) on its content frame; pass `false` here to keep the
   * scrim in lockstep when the consumer disables that.
   */
  overlayAnimation?: MotionPresetName | MotionPreset | false;
}

/* -------------------------------------------------------------------------- */
/* Shared per-slot styling (Pillar B)                                         */
/* -------------------------------------------------------------------------- */

/**
 * The named slots `Modal` and `Drawer` share via this chrome. The slot keys are
 * identical across both; only the per-slot part-prop *types* differ (a Modal's
 * content frame vs. a Drawer's), so {@link ModalChromeStyles} is generic over
 * those four part-prop types while the slot surface stays uniform.
 *
 * `overlay`/`closeButton` are low-precedence sugar: they layer UNDER the explicit
 * `overlayProps`/`closeButtonProps`, so the explicit per-part props win (the
 * "explicit beats sugar" rule, see `internal/styles.ts`). The remaining slots map
 * onto the content frame, header, title, and body parts.
 */
export const MODAL_CHROME_SLOTS = [
  "overlay",
  "content",
  "header",
  "title",
  "body",
  "closeButton",
] as const satisfies readonly (keyof ModalChromeStyles<unknown, unknown, unknown, unknown>)[];

/**
 * Generic `styles` map for the shared modal/drawer chrome. `Content`/`Header`/
 * `Title`/`Body` are the consuming component's own part-prop types so the slot
 * values stay precisely typed per platform/component.
 */
export interface ModalChromeStyles<Content, Header, Title, Body> {
  /** Props spread onto the `Overlay` scrim (under `overlayProps`). */
  overlay?: OverlayProps;
  /** Props spread onto the content frame (`.Content`). */
  content?: Content;
  /** Props spread onto the header (`.Header`). */
  header?: Header;
  /** Props spread onto the title (`.Title`). */
  title?: Title;
  /** Props spread onto the body (`.Body`). */
  body?: Body;
  /** Props spread onto the close button (under `closeButtonProps`). */
  closeButton?: CloseButtonProps;
}

/**
 * Resolved per-slot getter for the shared modal/drawer chrome. Each value is a
 * PARTIAL of the part's props (the accessor's shape — see {@link SlotValue}), so
 * the slot stays an optional override that's spread onto the part.
 */
export interface ModalChromeSlots<Content, Header, Title, Body> {
  overlay: Partial<NonNullable<OverlayProps>> | undefined;
  content: Partial<NonNullable<Content>> | undefined;
  header: Partial<NonNullable<Header>> | undefined;
  title: Partial<NonNullable<Title>> | undefined;
  body: Partial<NonNullable<Body>> | undefined;
  /** Resolved close-button slot. */
  closeButton: Partial<NonNullable<CloseButtonProps>> | undefined;
}

/**
 * Resolve a component's `styles` map into one props object per chrome slot
 * (DRY across `Modal`/`Drawer`). Dev-warns on unknown slot keys via
 * {@link slotStyles}; returns `undefined` for slots the caller omitted.
 */
export function resolveModalChromeSlots<Content, Header, Title, Body>(
  styles: SlotStyles<ModalChromeStyles<Content, Header, Title, Body>> | undefined,
  displayName: string,
): ModalChromeSlots<Content, Header, Title, Body> {
  const s = slotStyles(styles, MODAL_CHROME_SLOTS, displayName);
  return {
    overlay: s.get("overlay"),
    content: s.get("content"),
    header: s.get("header"),
    title: s.get("title"),
    body: s.get("body"),
    closeButton: s.get("closeButton"),
  };
}

export interface ModalBaseProps extends ModalBaseSharedProps {
  /** Content frame(s) positioned within the full-cover layer. */
  children?: React.ReactNode;
  /** Flex direction of the positioning layer. @default "column" */
  direction?: BoxProps["flexDirection"];
  /** Cross-axis alignment of the content within the layer. */
  align?: BoxProps["alignItems"];
  /** Main-axis alignment of the content within the layer. */
  justify?: BoxProps["justifyContent"];
  /** Padding around the content (viewport offset). */
  padding?: BoxProps["padding"];
  /** Vertical viewport offset; layers over `padding` on the top/bottom axis when set. */
  paddingVertical?: BoxProps["paddingVertical"];
  /** Horizontal viewport offset; layers over `padding` on the left/right axis when set. */
  paddingHorizontal?: BoxProps["paddingHorizontal"];
}

export function ModalBase(props: ModalBaseProps) {
  const {
    opened,
    onClose,
    closeOnEscape = true,
    closeOnClickOutside = true,
    lockScroll = true,
    returnFocus = true,
    trapFocus = true,
    withinPortal = true,
    keepMounted = false,
    withOverlay = true,
    overlayProps,
    zIndex = 200,
    overlayAnimation = "fade",
    children,
    direction = "column",
    align,
    justify,
    padding,
    paddingVertical,
    paddingHorizontal,
  } = props;

  // Captured at the trigger's position in the tree so teleported content keeps
  // the active theme across the portal boundary (on web the content's DOM moves
  // into the root host, losing any nested `<Theme>` ancestor's class).
  const themeName = useThemeName();

  // Trap keyboard focus within the content while opened; the returned ref
  // attaches to the positioning layer. `useFocusTrap` is itself a no-op on
  // native (there is no DOM focus model there).
  const trapRef = useFocusTrap(opened && trapFocus);

  // Scrim fade, resolved through the shared motion system (reduced-motion-safe,
  // honours the global MotionConfig). Spread onto the `Overlay` below; the content
  // frame carries its own motion via `children`.
  const overlayMotion = useMotionPreset(overlayAnimation);

  // Read the volatile props through refs so the side-effect hooks below depend
  // ONLY on the `opened` transition. `onClose` is typically an inline arrow (new
  // identity every parent render); keeping it out of the deps stops the effects
  // re-subscribing — and, critically, stops the return-focus cleanup firing on
  // every render and yanking focus out of the modal mid-interaction.
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const returnFocusRef = React.useRef(returnFocus);
  returnFocusRef.current = returnFocus;

  // Return-focus: capture the element focused at open time (the trigger) on the
  // opening edge DURING render — the focus trap (an effect) moves focus into the
  // modal before any effect of ours could run, so an effect-time capture would
  // grab an in-modal node instead. This is the sanctioned "store info from a
  // previous render" ref pattern; it is idempotent under StrictMode's double
  // render. Inert on native (no `document`).
  const wasOpenedRef = React.useRef(false);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  if (opened && !wasOpenedRef.current && typeof document !== "undefined") {
    previouslyFocusedRef.current = returnFocus
      ? (document.activeElement as HTMLElement | null)
      : null;
  }
  wasOpenedRef.current = opened;

  // Restore focus to that element once, on close/unmount — not on every
  // re-render (which is why the volatile props are read through refs above).
  React.useEffect(() => {
    if (!opened) return;
    return () => {
      if (returnFocusRef.current) previouslyFocusedRef.current?.focus?.();
    };
  }, [opened]);

  // The remaining web-only overlay side effects — Escape-to-close and body
  // scroll-lock. Inert on native (no keydown stream or body element). Escape is
  // ignored when a descendant already handled it (`defaultPrevented`), e.g. a
  // nested Select closing its own dropdown.
  React.useEffect(() => {
    if (!opened || typeof document === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) onCloseRef.current();
    };
    if (closeOnEscape) document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    return () => {
      if (closeOnEscape) document.removeEventListener("keydown", onKeyDown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
    };
  }, [opened, closeOnEscape, lockScroll]);

  // The full-cover positioning layer: scrim + the consumer's content frame. The
  // `display` toggle only matters on the `keepMounted` path (where the node never
  // leaves the tree); on the default path the layer is only rendered while open.
  const layer = (
    <Theme name={themeName}>
      <ModalBaseInner
        ref={trapRef}
        position={isWeb ? "fixed" : "absolute"}
        zIndex={zIndex}
        display={keepMounted && !opened ? "none" : "flex"}
        // The teleport host is `pointer-events: none`; `box-none` lets the
        // scrim + content inside it receive events while the container's own
        // box never swallows clicks meant for the page behind a closed layer.
        pointerEvents="box-none"
        flexDirection={direction}
        alignItems={align}
        justifyContent={justify}
        padding={padding}
        paddingVertical={paddingVertical}
        paddingHorizontal={paddingHorizontal}
      >
        {withOverlay ? (
          <Overlay
            zIndex={0}
            onPress={closeOnClickOutside ? onClose : undefined}
            {...overlayMotion}
            {...overlayProps}
          />
        ) : null}
        {children}
      </ModalBaseInner>
    </Theme>
  );

  // `keepMounted` stays in the tree and toggles `display` — entrance animates but
  // there is no exit (the node never leaves), mirroring `Dialog`/`Popover`.
  if (keepMounted) {
    return <Portal hostName={withinPortal ? "root" : undefined}>{layer}</Portal>;
  }

  // Default: `AnimatePresence` holds the whole layer (scrim + content) in the tree
  // through its EXIT animation, then unmounts it. The keyed `Portal` child becoming
  // `null` on close is what triggers the exit; the scrim's `overlayMotion` and the
  // content frame's `exitStyle` both play. `AnimatePresence` sits OUTSIDE the
  // `Portal` so the parent/child relationship its presence protocol relies on
  // survives the teleport re-parent (the same constraint `Dialog` documents).
  return (
    <AnimatePresence>
      {opened ? (
        <Portal key="modal-layer" hostName={withinPortal ? "root" : undefined}>
          {layer}
        </Portal>
      ) : null}
    </AnimatePresence>
  );
}
