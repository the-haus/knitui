import * as React from "react";
import type { LayoutChangeEvent } from "react-native";

import { type TamaguiElement, withStaticProperties } from "@knitui/core";
import { useDismissOnScroll } from "@knitui/hooks";

import { dismissKeyboard } from "../internal/dismiss-keyboard";
import { Overlay } from "../Overlay";
import {
  type PopoverDropdownProps,
  PopoverDropdownView,
  PopoverRoot,
  PopoverTarget,
  useDropdownDismiss,
  usePopoverContext,
} from "./Popover.shared";

/**
 * Native responder claim for the dropdown frame. A tap that lands on a
 * non-interactive area of the dropdown (its padding/background, or a plain
 * `Text`) is not consumed by the frame itself — Tamagui only claims the
 * responder for components that carry real press handlers. On Android an
 * unconsumed touch is then dispatched to the next view *below* the dropdown,
 * which is the full-cover scrim rendered behind it, so the popover dismisses
 * mid-interaction. Claiming the responder here makes the dropdown swallow those
 * taps so they never reach the scrim. Nested pressables/ScrollViews are the
 * deeper touch target and are asked first, so they still receive their gestures;
 * claiming only on *start* (and allowing termination) lets a nested ScrollView
 * take the responder back to scroll.
 */
const claimResponder = (): boolean => true;

/* -------------------------------------------------------------------------- */
/* Native dropdown                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Native build of `Popover.Dropdown`. There is no DOM, so outside-press is caught
 * by a full-cover `Overlay` scrim rendered behind the dropdown, and the dropdown
 * is re-measured on layout (the floating engine's `autoUpdate` is a no-op on
 * native). The web build (`Popover.tsx`) uses `document` listeners instead; both
 * share the presentation in `PopoverDropdownView`.
 */
const PopoverDropdown = React.forwardRef<TamaguiElement, PopoverDropdownProps>(
  function PopoverDropdown(props, ref) {
    const ctx = usePopoverContext();
    const open = ctx.opened;
    const { refs, update } = ctx.floating;
    const { closeOnClickOutside } = ctx;
    const dismiss = useDropdownDismiss(ctx);

    // Close on scroll: the idiomatic behavior for an overlay anchored to a target
    // inside a ScrollView (there is no global scroll event on native, so this
    // polls the reference's window position — see `useDismissOnScroll`).
    useDismissOnScroll(open && closeOnClickOutside, refs.reference, dismiss);

    // Outside-press from the scrim: blur the focused input before closing. The
    // full-cover scrim swallows the tap, so a focus-driven trigger (e.g. a
    // searchable Select) would otherwise keep focus and never reopen on the next
    // tap. `dismissKeyboard` blurs the focused input; it's a no-op when nothing is
    // focused.
    const dismissFromScrim = React.useCallback(() => {
      dismissKeyboard();
      dismiss();
    }, [dismiss]);

    // Re-measure: `autoUpdate` is a no-op on native (see `floating/platform.native`),
    // so re-run `update()` when the dropdown opens, once the reference + floating
    // Views have laid out.
    React.useEffect(() => {
      if (!open) return;
      update();
    }, [open, update]);

    const onLayout = React.useCallback(
      (event: LayoutChangeEvent) => update(event.nativeEvent.layout),
      [update],
    );

    // Render the scrim for `withOverlay` (visible dimmer) or to catch the
    // outside-tap (`closeOnClickOutside`). When it exists only as a tap-catcher
    // it stays invisible (`backgroundOpacity={0}`); `overlayProps` can override.
    // A full-cover scrim necessarily blocks scroll-through while open — that's the
    // cost of tap-to-dismiss on native.
    const scrim =
      open && (ctx.withOverlay || closeOnClickOutside) ? (
        <Overlay
          // `fixed` (viewport-relative) is web-only; native uses a full-cover
          // absolute scrim inside the portal host.
          fixed={false}
          zIndex={ctx.zIndex - 1}
          backgroundOpacity={ctx.withOverlay ? undefined : 0}
          onPress={closeOnClickOutside ? dismissFromScrim : undefined}
          {...ctx.overlayProps}
        />
      ) : null;

    // `onLayout` reports the laid-out size so positioning re-runs when the content
    // resizes; the responder claim swallows taps so they don't fall through to the
    // scrim (see `claimResponder`).
    const frameProps = { onLayout, onStartShouldSetResponder: claimResponder };

    return <PopoverDropdownView ref={ref} scrim={scrim} frameProps={frameProps} {...props} />;
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
