import * as React from "react";

import { DURATIONS, type TamaguiElement } from "@knitui/core";

import { Box } from "../Box";
import type { CollapseBoxProps } from "./collapse-box.shared";
import { animateOnlyProps, timedTransition, transitionProps } from "./style-props";

export type { CollapseAxis, CollapseBoxProps } from "./collapse-box.shared";

/**
 * Web clip — stays on Tamagui's animation driver. Renders the {@link CollapseBoxProps.Frame}
 * with the size as a Tamagui prop plus the kit's `transition` + `animateOnly`, so
 * the driver emits the CSS height/width transition exactly as the components did
 * inline before. The animation props are applied AFTER the spread `rest` (slot
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

  const sizeProp = axis === "width" ? { width: size } : { height: size };
  const properties = animateOpacity ? [axis, "opacity"] : [axis];
  const transition = transitionProps(animate ? timedTransition(durationMs, timingFunction) : null);
  const animateOnly = animate ? animateOnlyProps(properties) : undefined;

  return (
    <FrameComp
      ref={ref}
      {...rest}
      {...sizeProp}
      opacity={animateOpacity ? opacity : undefined}
      {...animateOnly}
      {...transition}
    >
      {children}
    </FrameComp>
  );
});
