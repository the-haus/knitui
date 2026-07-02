import * as React from "react";

import { type TamaguiElement, withStaticProperties } from "@knitui/core";

import { Overlay } from "../Overlay";
import {
  type PopoverDropdownProps,
  PopoverDropdownView,
  PopoverRoot,
  PopoverTarget,
  useDropdownDismiss,
  usePopoverContext,
} from "./Popover.shared";

/* -------------------------------------------------------------------------- */
/* Web dropdown                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Web build of `Popover.Dropdown`. Outside-press and `Escape` are handled with
 * `document` listeners — the scrim (rendered only for `withOverlay`) stays purely
 * visual. Metro resolves `Popover.native.tsx` for the native build, where a
 * full-cover scrim catches the outside-tap instead; both share the presentation
 * in `PopoverDropdownView`.
 */
const PopoverDropdown = React.forwardRef<TamaguiElement, PopoverDropdownProps>(
  function PopoverDropdown(props, ref) {
    const ctx = usePopoverContext();
    const open = ctx.opened;
    const { refs } = ctx.floating;
    const { closeOnClickOutside, closeOnEscape } = ctx;
    const dismiss = useDropdownDismiss(ctx);

    // Close on outside-press / Escape via document listeners. A dismissal here
    // fires `onDismiss` as well as `onClose` (see `useDropdownDismiss`).
    React.useEffect(() => {
      if (!open) return;
      if (!closeOnClickOutside && !closeOnEscape) return;

      const onPointerDown = (event: Event) => {
        const node = event.target as Node | null;
        const floatingEl = refs.floating.current as Element | null;
        const referenceEl = refs.reference.current as Element | null;
        if (
          node &&
          !(floatingEl && floatingEl.contains(node)) &&
          !(referenceEl && referenceEl.contains(node))
        ) {
          dismiss();
        }
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") dismiss();
      };

      if (closeOnClickOutside) document.addEventListener("pointerdown", onPointerDown);
      if (closeOnEscape) document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [open, dismiss, refs, closeOnClickOutside, closeOnEscape]);

    // Web scrim is purely visual — only rendered for an explicit `withOverlay`
    // (outside-press is the document listener above). `fixed` makes it
    // viewport-relative.
    const scrim =
      open && ctx.withOverlay ? (
        <Overlay fixed zIndex={ctx.zIndex - 1} {...ctx.overlayProps} />
      ) : null;

    return <PopoverDropdownView ref={ref} scrim={scrim} {...props} />;
  },
);

/* -------------------------------------------------------------------------- */
/* Compound export                                                            */
/* -------------------------------------------------------------------------- */

export const Popover = withStaticProperties(PopoverRoot, {
  Target: PopoverTarget,
  Dropdown: PopoverDropdown,
});

export type {
  PopoverArrowOffset,
  PopoverArrowPosition,
  PopoverArrowStyle,
  PopoverAxesOffsets,
  PopoverAxisOffset,
  PopoverDropdownProps,
  PopoverDropdownStyle,
  PopoverOffset,
  PopoverPosition,
  PopoverProps,
  PopoverStyles,
  PopoverTargetProps,
  PopoverWidth,
} from "./Popover.shared";
