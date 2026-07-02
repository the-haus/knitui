import * as React from "react";

import {
  createStyledContext,
  DURATIONS,
  type GetProps,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { resolveSizePx } from "../internal/control-metrics";
import { heightVariant, type SizeKey, squareSizeVariantFallthrough } from "../internal/style-props";
import { LoopView, useLoopingAnimation } from "../internal/use-looping-animation";

type LoaderSize = SizeKey;
type LoaderType = "oval" | "dots" | "bars";

const DEFAULT_SIZE: LoaderSize = "md";

const LoaderContext = createStyledContext<{ size: LoaderSize | number }>({
  size: DEFAULT_SIZE,
});

/** Ring stroke derived from the resolved frame diameter — ONE formula for both the
 * keyed and `:number` cases, so the stroke is never a second hand-tuned px map. */
const ringBorderWidth = (diameter: number) => Math.max(2, Math.round(diameter / 10));

/**
 * Multi-type loading indicator — mirrors Mantine's `Loader` (`oval` | `dots` |
 * `bars`). Accent comes from the active theme's ramp (`$color9`) via the `theme`
 * prop, never a `color` prop. Motion is driven cross-platform by the shared
 * looping primitive (`useLoopingAnimation`): a compositor `@keyframes` loop on
 * web / a reanimated UI-thread loop on native — no `setInterval`, no per-frame
 * re-render. (Sibling `Spinner` stays as the simple pulsing dot; `Loader` is the
 * Mantine-named multi-type variant.)
 */
const LoaderFrame = styled(Box, {
  name: "Loader",
  context: LoaderContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",

  variants: {
    size: heightVariant,
  } as const,

  defaultVariants: { size: DEFAULT_SIZE },
});

// The ring diameter is the frame height (the `$xxs…$xxl` size tokens are the same
// heights `heightVariant` uses), so width/height come straight from the size scale
// as TOKENS — no module-load resolution. The stroke is DERIVED from the resolved
// diameter at render (see `LoaderRing`), flowing from the same single height scale
// rather than a second hardcoded ladder.
const LoaderRingFrame = styled(Box, {
  name: "LoaderRing",
  context: LoaderContext,
  borderRadius: 9999,
  borderColor: "$color5",
  borderTopColor: "$color9",
  borderRightColor: "$color9",

  variants: {
    size: squareSizeVariantFallthrough,
  } as const,

  defaultVariants: { size: DEFAULT_SIZE },
});

/**
 * Rotating ring rendition (`oval`). A track ring with two accent-coloured arcs. The
 * stroke is resolved from the size at RENDER (`ringBorderWidth(resolveSizePx(size))`)
 * so it scales with the diameter via the token system, never a build-time px map.
 */
const LoaderRing = LoaderRingFrame.styleable(function LoaderRing(props, ref) {
  const { size = DEFAULT_SIZE, ...rest } = props;
  return (
    <LoaderRingFrame
      ref={ref}
      size={size}
      borderWidth={ringBorderWidth(resolveSizePx(size as LoaderSize | number))}
      {...rest}
    />
  );
});

/** Single dot/bar element — each pulses its opacity on a staggered loop. */
const LoaderDot = styled(Box, {
  name: "LoaderDot",
  borderRadius: 9999,
  backgroundColor: "$color9",
});

const LoaderBar = styled(Box, {
  name: "LoaderBar",
  borderRadius: "$xs",
  backgroundColor: "$color9",
});

type LoaderFrameProps = Omit<GetProps<typeof LoaderFrame>, "aria-label" | "role" | "size" | "type">;

export interface LoaderProps extends LoaderFrameProps {
  /** Loader rendition. @default "oval" */
  type?: LoaderType;
  /** Size key (`xxs`–`xxl`) or an explicit pixel value. @default "md" */
  size?: LoaderSize | number;
  /** Accessible label read by screen readers. @default "Loading" */
  "aria-label"?: string;
  /** Semantic progress role. @default "progressbar" */
  role?: "progressbar";
}

type LoaderAriaProps = {
  role: "progressbar";
  "aria-label": string;
};

const STEPS = [0, 1, 2] as const;

// A single shared loop can't express the old `tick % 3` 3-phase chase, so each
// dot/bar gets its OWN pulse loop. The durations are slightly staggered (base
// ±~12%) so the three elements drift out of sync — a continuous walk rather than
// a lockstep throb, faithful to the original sequential fade. Reduced motion is
// handled inside the hook (it returns a static, animation-free frame).
const PULSE_MS = [560, 640, 720] as const;

const LoaderComponent = LoaderFrame.styleable<LoaderProps>(function Loader(props, ref) {
  const {
    type = "oval",
    size = DEFAULT_SIZE,
    "aria-label": ariaLabel,
    role = "progressbar",
    ...rest
  } = props;
  const px = resolveSizePx(size);
  const ariaProps: LoaderAriaProps = {
    role,
    "aria-label": ariaLabel ?? "Loading",
  };

  // Loops are declared unconditionally (stable hook order across `type` changes);
  // only the active rendition's loop drives its `LoopView` below. The hooks honour the
  // user's reduced-motion preference internally — they return a static first
  // frame with no animation and no timer — so the loader stays accessible (the
  // `progressbar` role + label are always present) without any motion churn.
  const spin = useLoopingAnimation({ kind: "spin", durationMs: DURATIONS.loop });
  const pulse0 = useLoopingAnimation({ kind: "pulse", durationMs: PULSE_MS[0], minOpacity: 0.3 });
  const pulse1 = useLoopingAnimation({ kind: "pulse", durationMs: PULSE_MS[1], minOpacity: 0.3 });
  const pulse2 = useLoopingAnimation({ kind: "pulse", durationMs: PULSE_MS[2], minOpacity: 0.3 });
  const pulses = [pulse0, pulse1, pulse2] as const;

  // The animated `style` must ride on `LoopView` — a `Box` on web (forwards the
  // inline `animation*` block to the DOM) but an `Animated.View` on native (the
  // only host a reanimated `useAnimatedStyle` worklet can drive). Spreading the
  // reanimated style straight onto a plain Tamagui `Box` is a no-op on web and,
  // under reanimated 4, throws ("set the key `current` … on a frozen object")
  // because the worklet-frozen style object can't be mutated by Tamagui. So we
  // wrap each visual rendition (`LoaderRing`/`Dot`/`Bar`) in a `LoopView` that
  // carries the motion, mirroring the cross-platform `Marquee` composition.
  let content: React.ReactNode;
  if (type === "oval") {
    content = (
      <LoopView {...spin}>
        <LoaderRing size={size} />
      </LoopView>
    );
  } else if (type === "dots") {
    const dot = Math.max(4, Math.round(px * 0.3));
    const gap = Math.max(2, Math.round(px * 0.14));
    content = STEPS.map((i) => (
      <LoopView key={i} {...pulses[i]}>
        <LoaderDot width={dot} height={dot} marginHorizontal={gap / 2} />
      </LoopView>
    ));
  } else {
    const bar = Math.max(3, Math.round(px * 0.24));
    const gap = Math.max(2, Math.round(px * 0.12));
    content = STEPS.map((i) => (
      <LoopView key={i} {...pulses[i]}>
        <LoaderBar width={bar} height={px} marginHorizontal={gap / 2} />
      </LoopView>
    ));
  }

  return (
    <LoaderFrame ref={ref} size={size} {...ariaProps} {...rest}>
      {content}
    </LoaderFrame>
  );
});

export const Loader = withStaticProperties(LoaderComponent, {
  Frame: LoaderFrame,
  Ring: LoaderRing,
  Dot: LoaderDot,
  Bar: LoaderBar,
});

export type { LoaderSize, LoaderType };
