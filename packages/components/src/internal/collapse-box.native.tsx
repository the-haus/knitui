import * as React from "react";
import { View as RNView } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { DURATIONS, resolveCssEasingPoints, type TamaguiElement } from "@knitui/core";

import { Box } from "../Box";
import type { CollapseBoxProps } from "./collapse-box.shared";

export type { CollapseAxis, CollapseBoxProps } from "./collapse-box.shared";

/** Static clip style for the animated inner view (kept out of the worklet). */
const CLIP_STYLE = { overflow: "hidden" } as const;

/**
 * Pins the measured content OUT of the clip's flow, anchored at the start corner.
 * `onLayout` on absolutely-positioned content reports its NATURAL size, decoupled
 * from the clip's animated main-axis size — RN/Fabric otherwise reports the
 * *clipped* height for in-flow content (an `overflow: hidden` parent at `height: 0`
 * measures its child as `0`, so the natural size is never learned and a panel that
 * opens from a collapsed state stays stuck shut). Only `top`/`left` are pinned (not
 * `right`/`bottom`) so the content keeps its intrinsic cross-axis size for the
 * measurement even before the clip has been given a cross dimension.
 */
const CONTENT_PIN_STYLE = { position: "absolute", top: 0, left: 0 } as const;

/**
 * Resolve a CSS `transition-timing-function` to the matching reanimated easing, so
 * the native clip tracks the web (CSS) transition. The control points come from the
 * shared {@link resolveCssEasingPoints} table — the SAME source the reanimated
 * driver (`animations.native.ts`) reads — so keyword curves and an arbitrary
 * `cubic-bezier(...)` render identically across the driver and this clip.
 */
const cssEasingToReanimated = (timingFunction: string) => {
  const points = resolveCssEasingPoints(timingFunction);
  return points === "linear" ? Easing.linear : Easing.bezier(...points);
};

/**
 * Native clip — drives the height/width animation with reanimated directly instead
 * of routing the layout prop through Tamagui's reanimated driver, which animates
 * `height`/`width` with visible jank. The static styling + `borderRadius` clip live
 * on the outer {@link CollapseBoxProps.Frame}; the animated `Animated.View` nested
 * inside it clips the natural-size content to the animated size, off the UI thread.
 */
export const CollapseBox = React.forwardRef<TamaguiElement, CollapseBoxProps>(function CollapseBox(
  {
    size,
    crossSize,
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

  // Consumers pass numeric `0`/`1`; coerce defensively (the prop type is widened
  // to Tamagui's opacity for spread compatibility).
  const targetOpacity = typeof opacity === "number" ? opacity : 1;

  const sizeSV = useSharedValue(size ?? 0);
  // `auto` (no constraint) for the first paint of already-expanded content,
  // where there is no previous frame to animate from.
  const autoSV = useSharedValue(size === undefined);
  const opacitySV = useSharedValue(targetOpacity);
  // The first concrete size snaps; only later changes animate, so content that
  // mounts open doesn't play an entry animation.
  const settled = React.useRef(false);

  // Whether the content is pinned OUT of flow. This MUST flip on the same timeline
  // as `autoSV` (the worklet's height source), so it lives in React state flipped
  // inside the size effect below — NOT a render-derived `size === undefined`.
  //
  // The bug it avoids: when an already-expanded panel learns its size for the
  // first time (`size` goes `undefined` → measured), a render-derived pin flips to
  // absolute SYNCHRONOUSLY at commit, but `autoSV` only flips later in the effect.
  // For one frame the content is absolute (out of flow) while the clip height is
  // still `auto` → an `overflow:hidden` view with no in-flow child measures to 0,
  // so the panel collapses to 0 and snaps back — a visible flicker on every
  // mounts-open / controlled / `defaultValue`-open Accordion panel. Keeping the pin
  // in flow until the effect has set a concrete height closes that gap: the content
  // supplies the auto height for the in-between frame instead of collapsing.
  //
  // Initialised to `size !== undefined` so a panel that mounts CLOSED (size `0`,
  // not `undefined`) is pinned from the first render — its content must measure its
  // natural size out of the collapsed clip (the original stuck-shut fix).
  const [pinned, setPinned] = React.useState(size !== undefined);

  const easing = React.useMemo(() => cssEasingToReanimated(timingFunction), [timingFunction]);

  React.useEffect(() => {
    if (size === undefined) {
      autoSV.value = true;
      setPinned(false);
      return;
    }
    autoSV.value = false;
    const shouldAnimate = animate && settled.current;
    sizeSV.value = shouldAnimate ? withTiming(size, { duration: durationMs, easing }) : size;
    settled.current = true;
    setPinned(true);
  }, [size, animate, durationMs, easing, sizeSV, autoSV]);

  React.useEffect(() => {
    const shouldAnimate = animate && settled.current;
    opacitySV.value = shouldAnimate
      ? withTiming(targetOpacity, { duration: durationMs, easing })
      : targetOpacity;
  }, [targetOpacity, animate, durationMs, easing, opacitySV]);

  const animatedStyle = useAnimatedStyle(() => {
    const o = animateOpacity ? opacitySV.value : 1;
    const measure = autoSV.value ? undefined : sizeSV.value;
    return axis === "width" ? { width: measure, opacity: o } : { height: measure, opacity: o };
  });

  // While the content is in flow (`!pinned`) it sizes the clip itself, so the
  // first measurement can be read; once pinned out of flow it can no longer supply
  // the clip's CROSS-axis size, so the clip carries the measured cross size — auto
  // until that's known. `pinned` is effect-synced with `autoSV` (see above), so the
  // pin and the worklet's height source never disagree for a frame.
  const cross = pinned && typeof crossSize === "number" && crossSize > 0 ? crossSize : undefined;
  const crossStyle = axis === "width" ? { height: cross } : { width: cross };

  return (
    <FrameComp ref={ref} overflow="hidden" {...rest}>
      <Animated.View style={[CLIP_STYLE, crossStyle, animatedStyle]}>
        <RNView style={pinned ? CONTENT_PIN_STYLE : undefined}>{children}</RNView>
      </Animated.View>
    </FrameComp>
  );
});
