import * as React from "react";

import { DURATIONS, type TamaguiElement } from "@knitui/core";

import { Box } from "../Box";
import type { CollapseBoxProps } from "./collapse-box.shared";
import { timedTransition } from "./style-props";

export type { CollapseAxis, CollapseBoxProps } from "./collapse-box.shared";

/**
 * Web clip — stays on Tamagui's animation driver. Renders the {@link CollapseBoxProps.Frame}
 * with the size as a Tamagui prop plus a v3 `transition={{ duration, easing,
 * properties }}` scoped to the animated axis (+ opacity), so the driver emits
 * exactly one CSS height/width transition with the caller's EXACT easing curve. The animation props are applied AFTER the spread `rest` (slot
 * styles / a11y / user props) so a slot can't accidentally clobber the size or
 * transition; an explicit `opacity` still wins over a slot's.
 */
export const CollapseBox = React.forwardRef<TamaguiElement, CollapseBoxProps>(function CollapseBox(
  {
    size,
    // Native-only: the web clip is in-flow and sizes to its content, so the
    // measured cross size isn't needed here. Destructured to keep it off the DOM.
    crossSize: _crossSize,
    axis = "height",
    animate = true,
    durationMs = DURATIONS.base,
    timingFunction = "ease",
    opacity = 1,
    animateOpacity = false,
    Frame,
    children,
    ...rest
  },
  ref,
) {
  const FrameComp: React.ElementType = Frame ?? Box;

  // Conditional: an explicit `height={undefined}` (size unset = "auto") would claim
  // the call-site slot and clear a Frame's own height (docs/v3/conventions.md §11).
  const sizeProp =
    size === undefined ? null : axis === "width" ? { width: size } : { height: size };
  const transition = animate
    ? timedTransition(durationMs, timingFunction, animateOpacity ? `${axis}, opacity` : axis)
    : null;

  return (
    <FrameComp
      ref={ref}
      {...rest}
      {...sizeProp}
      // Only when fading: in Tamagui 3.0.18 an explicit `opacity={undefined}` still
      // claims the call-site slot and CLEARS a Frame's own opacity.
      {...(animateOpacity ? { opacity } : null)}
      transition={transition}
    >
      {children}
    </FrameComp>
  );
});
