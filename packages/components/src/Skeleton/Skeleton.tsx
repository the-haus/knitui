import * as React from "react";

import { DURATIONS, type GetProps, styled } from "@knitui/core";
import { useReducedMotion } from "@knitui/hooks";

import { Box } from "../Box";
import { radiusVariant } from "../internal/style-props";
import { asLoopHost, useLoopingAnimation } from "../internal/use-looping-animation";
import { asRevealHost, type RevealPulseMotion, useRevealPulse } from "../internal/use-reveal-pulse";

/**
 * Placeholder block shown while content loads — mirrors Mantine's `Skeleton`.
 * `visible` (default true) toggles between the gray placeholder and the real
 * children; `circle` forces an equal-sided round block; `radius` rounds the
 * corners; `animate` (default true) drives a soft opacity pulse. `width`/`height`
 * pass straight through as inherited `Box` style props — they are intentionally
 * NOT redeclared as variants (avoids the style-prop name-collision class of bug).
 */
const SkeletonFrame = styled(Box, {
  name: "Skeleton",
  backgroundColor: "$color4",
  overflow: "hidden",

  variants: {
    radius: radiusVariant,
    /** Equal-sided round block; pair with an explicit `height` (mirrors width). */
    circle: {
      true: { borderRadius: 9999 },
    },
  } as const,

  defaultVariants: { radius: "sm" },
});

// The placeholder pulses its OWN opacity (background included), so the loop's
// `style` must land on this frame. On native that style is a reanimated animated
// style, which a plain Tamagui frame can't host — `asLoopHost` promotes it to a
// reanimated `Animated.*` view (identity on web, where the loop is plain CSS).
const SkeletonLoopFrame = asLoopHost(SkeletonFrame);

/** Precise web a11y prop objects; spread to dodge excess-property checks. */
const busyProps = (busy: boolean): { "aria-busy"?: boolean } => ({ "aria-busy": busy });
const hiddenProps = (): { "aria-hidden"?: boolean } => ({ "aria-hidden": true });

type SkeletonStyle = Pick<GetProps<typeof Box>, "width" | "height">;

export interface SkeletonProps extends GetProps<typeof SkeletonFrame> {
  /** When false, renders `children` normally with no placeholder. @default true */
  visible?: boolean;
  /** Force an equal-sided round block (mirrors `height` onto `width`). @default false */
  circle?: boolean;
  /** Soft opacity pulse while visible. @default true */
  animate?: boolean;
}

/**
 * Set by {@link SkeletonGroup}: the group owns the animation and the busy
 * announcement, so a `Skeleton` inside one schedules no loop of its own and
 * hides itself from assistive tech (the group is the one busy region).
 */
const SkeletonGroupContext = React.createContext(false);

export const Skeleton = SkeletonFrame.styleable<SkeletonProps>(function Skeleton(props, ref) {
  const {
    visible = true,
    circle = false,
    animate = true,
    radius,
    width,
    height,
    children,
    ...rest
  } = props;

  // Continuous opacity throb driven by the shared looping primitive — a
  // compositor `@keyframes` (web) / reanimated UI-thread loop (native) with no
  // `setInterval` and no per-frame re-render. The hook runs unconditionally so
  // hook order stays stable; its style is only spread when actually pulsing.
  // Reduced motion is handled inside the hook (it returns a static, animation-
  // free frame), so no separate `reduced` branch is needed here.
  const reduced = useReducedMotion();
  const grouped = React.useContext(SkeletonGroupContext);
  const pulsing = animate && !reduced && visible && !grouped;
  const loop = useLoopingAnimation({
    kind: "pulse",
    durationMs: DURATIONS.ambient,
    minOpacity: 0.45,
    // Never schedule the loop for a skeleton that isn't pulsing (`animate={false}`,
    // or already resolved to its real content): a live loop is a permanent
    // compositor/UI-thread animation, and skeletons are rendered by the dozen.
    enabled: pulsing,
  });

  // When not visible, render children as-is (a transparent pass-through wrapper).
  if (!visible) {
    const passthrough: SkeletonStyle = { width, height };
    return (
      <Box ref={ref} {...passthrough} {...busyProps(false)} {...rest}>
        {children}
      </Box>
    );
  }

  // A circle with only a height mirrors it onto width so it stays equal-sided.
  const resolvedWidth = circle && width == null ? height : width;
  const dims: SkeletonStyle = { width: resolvedWidth, height };

  return (
    <SkeletonLoopFrame
      ref={ref}
      circle={circle}
      radius={radius}
      {...dims}
      // The looping pulse runs only while animating; otherwise the placeholder
      // is static. `loop` is `{ style }` — spread it as the host `style` object
      // (the hook's compositor/UI-thread driver lives there, not in Tamagui
      // style props). The frame is an `asLoopHost` reanimated view on native so
      // that animated `style` has a valid host.
      {...(pulsing ? loop : null)}
      {...(grouped ? hiddenProps() : busyProps(true))}
      {...rest}
    >
      {/* Children preserve intrinsic size but stay hidden behind the placeholder. */}
      <Box opacity={0} {...hiddenProps()}>
        {children}
      </Box>
    </SkeletonLoopFrame>
  );
});

// ── SkeletonGroup ────────────────────────────────────────────────────────────

const SkeletonGroupFrame = asRevealHost(Box);

/** Precise web a11y props for the group's busy region; spread to dodge excess-property checks. */
const groupA11y = (
  label: string,
): { "aria-busy"?: boolean; "aria-label"?: string; role?: "progressbar" } => ({
  "aria-busy": true,
  "aria-label": label,
  role: "progressbar",
});

export interface SkeletonGroupProps extends GetProps<typeof Box>, RevealPulseMotion {
  /** Accessible name of the busy region. @default "Loading" */
  label?: string;
}

/**
 * A loading SILHOUETTE: a layout of `Skeleton` blocks animated as ONE.
 *
 * Every `Skeleton` inside stops scheduling its own pulse (a screen of 20 blocks
 * was 20 compositor animations on web and 20 `withRepeat` worklets on native),
 * and the group runs a single reveal-then-pulse on itself instead:
 *
 *   • HOLD invisible for `delayMs` (default 150) — a load that finishes inside
 *     it swaps straight to content, so a fast response never strobes grey;
 *   • FADE in over `fadeMs`;
 *   • PULSE the whole silhouette in phase.
 *
 * It is a plain `Box` otherwise (layout props pass through), and it is the one
 * `aria-busy` region — grouped blocks are hidden from assistive tech. Reduced
 * motion keeps the hold and drops the fade and pulse.
 *
 *   <SkeletonGroup flex={1} gap="$md">
 *     <Skeleton height={220} radius={0} />
 *     <Skeleton width="60%" height={20} />
 *   </SkeletonGroup>
 */
export const SkeletonGroup = React.forwardRef<React.ComponentRef<typeof Box>, SkeletonGroupProps>(
  function SkeletonGroup(props, ref) {
    const {
      delayMs,
      fadeMs,
      durationMs,
      minOpacity,
      pulse,
      label = "Loading",
      children,
      ...rest
    } = props;
    const reveal = useRevealPulse({ delayMs, fadeMs, durationMs, minOpacity, pulse });
    return (
      <SkeletonGroupContext.Provider value>
        <SkeletonGroupFrame ref={ref} {...groupA11y(label)} {...rest} {...reveal}>
          {children}
        </SkeletonGroupFrame>
      </SkeletonGroupContext.Provider>
    );
  },
);
