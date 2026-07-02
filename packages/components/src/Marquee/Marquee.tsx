import * as React from "react";

import { type GetProps, getTokenValue, isWeb, styled, withStaticProperties } from "@knitui/core";
import { useElementSize } from "@knitui/hooks";

import { Box } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { hoverProps } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { LoopView, useLoopingAnimation } from "../internal/use-looping-animation";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { Text } from "../Text";

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const orientationVariant = {
  orientation: {
    horizontal: { flexDirection: "row" },
    vertical: { flexDirection: "column" },
  },
} as const;

/** Clipping frame — repeated content scrolls inside it. */
const MarqueeRoot = styled(Box, {
  name: "Marquee",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  maxWidth: "100%",
  maxHeight: "100%",
  variants: orientationVariant,
  defaultVariants: { orientation: "horizontal" },
});

/** The translated track holding every repeated group. */
const MarqueeContent = styled(Box, {
  name: "MarqueeContent",
  variants: orientationVariant,
  defaultVariants: { orientation: "horizontal" },
});

/** One copy of the children, repeated `repeat` times for seamless scrolling. */
const MarqueeGroup = styled(Box, {
  name: "MarqueeGroup",
  flexShrink: 0,
  variants: orientationVariant,
  defaultVariants: { orientation: "horizontal" },
});

/** String/number children wrapped as themed text for native-safe rendering. */
const MarqueeText = styled(Text, {
  name: "MarqueeText",
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type MarqueeOrientation = "horizontal" | "vertical";

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ group: { gap: "$lg" } }}` is sugar
 * for `<Marquee.Group gap="$lg" />`. The `group` slot applies to every repeated
 * copy; `text` applies to text children rendered via `Marquee.Text`.
 */
export interface MarqueeStyles {
  /** Props for the clipping frame (`Marquee.Frame`). */
  root?: GetProps<typeof MarqueeRoot>;
  /** Props for the translated track (`Marquee.Content`). */
  content?: GetProps<typeof MarqueeContent>;
  /** Props for each repeated group (`Marquee.Group`). */
  group?: GetProps<typeof MarqueeGroup>;
  /** Props for text children (`Marquee.Text`). */
  text?: GetProps<typeof MarqueeText>;
}

const MARQUEE_SLOT_KEYS = [
  "root",
  "content",
  "group",
  "text",
] as const satisfies readonly (keyof MarqueeStyles)[];

type MarqueeRootProps = Omit<GetProps<typeof MarqueeRoot>, "children">;

export interface MarqueeProps extends MarqueeRootProps {
  /** Reverse the scroll direction. @default false */
  reverse?: boolean;
  /** Pause the animation while hovered (web only; no-op on native). @default false */
  pauseOnHover?: boolean;
  /** Times the children are repeated inline for seamless scrolling. @default 4 */
  repeat?: number;
  /** Time in ms for the content to scroll by one full group. @default 100000 */
  duration?: number;
  /**
   * Show a gradient fade on the edges. Kept for Mantine API parity but currently
   * a no-op — a cross-platform linear-gradient primitive is not available.
   * @default true
   */
  fadeEdges?: boolean;
  /** Fade gradient color — deferred (see {@link MarqueeProps.fadeEdges}). */
  fadeEdgeColor?: string;
  /** Fade gradient size — deferred (see {@link MarqueeProps.fadeEdges}). */
  fadeEdgeSize?: string;
  /** Content to scroll. */
  children?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<MarqueeStyles>;
}

/** Resolve a spacing value (token or number) to a px number. */
function resolveSpacePx(value: number | string): number {
  if (typeof value === "number") return value;
  const resolved = getTokenValue(value as Parameters<typeof getTokenValue>[0], "space");
  return typeof resolved === "number" ? resolved : 0;
}

/* -------------------------------------------------------------------------- */
/* Marquee                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Continuously scrolling content — mirrors Mantine's `Marquee`. One group is
 * measured, then the shared `useLoopingAnimation` `shimmer` primitive slides the
 * track by exactly one group + gap on a seamless repeating loop — a compositor
 * `@keyframes` translate on web, a reanimated UI-thread loop on native, with no
 * `setInterval` and zero per-frame re-renders. The repeated copies hide the
 * snap-back. Respects reduced motion (the primitive renders a static frame);
 * `pauseOnHover` toggles the CSS animation play-state on web (a no-op on native).
 */
type HiddenProps = {
  "aria-hidden"?: true;
};

const MarqueeComponent = MarqueeRoot.styleable<MarqueeProps>(function Marquee(props, ref) {
  const {
    reverse = false,
    pauseOnHover = false,
    repeat = 4,
    duration = 100000,
    // Edge fade is deferred (no cross-platform gradient primitive); accepted for parity.
    fadeEdges: _fadeEdges,
    fadeEdgeColor: _fadeEdgeColor,
    fadeEdgeSize: _fadeEdgeSize,
    gap = "$md",
    orientation = "horizontal",
    children,
    styles,
    ...rest
  } = props;

  const s = slotStyles<MarqueeStyles>(styles, MARQUEE_SLOT_KEYS, "Marquee");

  const [paused, setPaused] = React.useState(false);
  const { ref: groupRef, rootProps, width, height } = useElementSize();

  const horizontal = orientation === "horizontal";
  const groupLen = horizontal ? width : height;
  const distance =
    groupLen + resolveSpacePx(typeof gap === "number" || typeof gap === "string" ? gap : 0);

  // One seamless slide = one group + gap; the repeated copies hide the snap-back.
  // Forward scroll translates negative (content moves toward the start edge);
  // `reverse` flips it. `0` until measured / when disabled keeps the track static.
  const travel = distance <= 0 || duration <= 0 ? 0 : reverse ? distance : -distance;
  const loop = useLoopingAnimation({
    kind: "shimmer",
    axis: horizontal ? "x" : "y",
    distance: travel,
    durationMs: duration,
  });

  // Pause-on-hover is a web affordance (CSS animation play-state); on native it is
  // a no-op, matching the prop's documented contract.
  const pausePlayState =
    isWeb && pauseOnHover ? { animationPlayState: paused ? "paused" : "running" } : null;

  const hover = pauseOnHover
    ? hoverProps({ onHoverIn: () => setPaused(true), onHoverOut: () => setPaused(false) })
    : {};

  // `renderTextChild` only forwards `children`, so pre-bind the `text` slot props
  // onto `MarqueeText` via a stable, memoized wrapper before handing it off.
  const MarqueeTextSlot = useSlotTextWrapper(MarqueeText, s.get("text"));
  const renderedChildren = renderTextChild(children, MarqueeTextSlot);

  const groupProps = s.get("group");
  const groups = Array.from({ length: Math.max(1, repeat) }, (_, i) => {
    const hiddenProps: HiddenProps = i === 0 ? {} : { "aria-hidden": true };

    return (
      <MarqueeGroup
        key={i}
        {...groupProps}
        orientation={orientation}
        gap={gap}
        {...hiddenProps}
        {...(i === 0 ? { ref: groupRef, ...rootProps } : null)}
      >
        {renderedChildren}
      </MarqueeGroup>
    );
  });

  return (
    <MarqueeRoot ref={ref} orientation={orientation} {...hover} {...s.get("root")} {...rest}>
      {/* LoopView (Box on web / Animated.View on native) carries the animated
          translate; its flexDirection lets the non-shrinking track overflow the
          clip so the repeated copies scroll past. */}
      <LoopView
        style={[{ flexDirection: horizontal ? "row" : "column" }, loop.style, pausePlayState]}
      >
        <MarqueeContent {...s.get("content")} orientation={orientation} gap={gap} flexShrink={0}>
          {groups}
        </MarqueeContent>
      </LoopView>
    </MarqueeRoot>
  );
});

export const Marquee = withStaticProperties(MarqueeComponent, {
  Frame: MarqueeRoot,
  Content: MarqueeContent,
  Group: MarqueeGroup,
  Text: MarqueeText,
});
