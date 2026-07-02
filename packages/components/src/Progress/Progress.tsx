import * as React from "react";

import {
  createStyledContext,
  DURATIONS,
  type GetProps,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { clamp } from "../internal/number-utils";
import { renderTextChild } from "../internal/render-text-child";
import {
  fontSizeVariant,
  progressThicknessVariant,
  radiusVariant,
  type SizeKey,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { LoopView, useLoopingAnimation } from "../internal/use-looping-animation";
import { Text } from "../Text";

export type ProgressSize = SizeKey;

const DEFAULT_SIZE: ProgressSize = "md";

/** Shared down to every section/label so a section's label scales with the track `size`. */
const ProgressContext = createStyledContext<{
  size: ProgressSize;
  orientation: "horizontal" | "vertical";
}>({
  size: DEFAULT_SIZE,
  orientation: "horizontal",
});

/**
 * Track that holds one or more filled sections — mirrors Mantine's `Progress`.
 * Accent comes from the active theme's palette ramp (`$color9` fill on a
 * `$color4` track) via the `theme` prop, never a Mantine `color` prop. Use the
 * simple `<Progress value={60} />` form for a single bar, or the compound
 * `<Progress.Root><Progress.Section value={…}>…` form for stacked sections.
 * `orientation="vertical"` rotates the track; pair with an explicit `height`.
 */
const ProgressRootFrame = styled(Box, {
  name: "Progress",
  context: ProgressContext,
  overflow: "hidden",
  backgroundColor: "$color4",

  variants: {
    orientation: {
      horizontal: { flexDirection: "row", width: "100%" },
      vertical: { flexDirection: "column" },
    },
    size: progressThicknessVariant,
    radius: radiusVariant,
  } as const,

  defaultVariants: { orientation: "horizontal", radius: "xl" },
});

/** Diagonal "stripe" sheen — repeated skewed bars, cross-platform (no gradients). */
const STRIPES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

/**
 * One stripe + its gap = the repeat period (px). The animated sheen translates by
 * exactly one period and the duplicated stripes make the wrap seamless — this is
 * what the shared looping primitive's repeating-translate (`shimmer`) loop does,
 * so there is no backward "reverse-glide" the old `setInterval` mod-20 tick had.
 */
const STRIPE_PERIOD = 20;

const STRIPE_DURATION_MS = DURATIONS.deliberate;

const ProgressStripesOverlay = styled(Box, {
  name: "ProgressStripes",
  position: "absolute",
  pointerEvents: "none",
  top: 0,
  bottom: 0,
  left: -STRIPE_PERIOD,
  right: -STRIPE_PERIOD,
  overflow: "hidden",
});

/**
 * The translating sheen layer. It lives inside the static clip overlay and is the
 * element the looping primitive drives, so it must be a {@link LoopView} (a `Box`
 * on web, an `Animated.View` on native — the only target the native reanimated
 * worklet animates). Its layout is plain RN `style` so it applies on both the web
 * `Box` and the native `Animated.View`.
 */
const STRIPE_ROW_STYLE = { flexDirection: "row", flexGrow: 1 } as const;

const ProgressStripe = styled(Box, {
  name: "ProgressStripe",
  width: 10,
  marginRight: 10,
  height: "200%",
  marginTop: "-50%",
  backgroundColor: "$color1",
  opacity: 0.18,
  rotate: "20deg",
});

const ProgressSectionFrame = styled(Box, {
  name: "ProgressSection",
  context: ProgressContext,
  position: "relative",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  backgroundColor: "$color9",
});

const ProgressLabel = styled(Text, {
  name: "ProgressLabel",
  context: ProgressContext,
  color: "$color1",
  fontWeight: "700",
  numberOfLines: 1,
  userSelect: "none",
  variants: {
    size: {
      ...fontSizeVariant,
    },
  } as const,
});

/** Precise web a11y props for a progressbar; spread to dodge excess-prop checks. */
type ProgressAria = {
  role: "progressbar";
  "aria-label": string;
  "aria-valuenow"?: number;
  "aria-valuemin": number;
  "aria-valuemax": number;
};

const clampValue = (value: number) => clamp(value, 0, 100);

const ariaProps = (value: number, label: string): ProgressAria => ({
  role: "progressbar",
  "aria-label": label,
  "aria-valuenow": clampValue(value),
  "aria-valuemin": 0,
  "aria-valuemax": 100,
});

type ProgressSectionFrameProps = Omit<GetProps<typeof ProgressSectionFrame>, "aria-label">;

export interface ProgressSectionProps extends ProgressSectionFrameProps {
  /** Portion of the track this section fills, 0–100. */
  value: number;
  /** Diagonal striped sheen over the fill. @default false */
  striped?: boolean;
  /** Animate the stripes (implies `striped`). @default false */
  animated?: boolean;
  /** Attach `role="progressbar"` + `aria-value*` to this section. @default false */
  withAria?: boolean;
  /** Accessible label used when `withAria` is true. @default "Progress section" */
  "aria-label"?: string;
}

const ProgressSection = ProgressSectionFrame.styleable<ProgressSectionProps>(
  function ProgressSection(props, ref) {
    const {
      children,
      value,
      striped,
      animated,
      withAria,
      "aria-label": ariaLabel = "Progress section",
      ...rest
    } = props;
    const { orientation } = ProgressContext.useStyledContext();
    const showStripes = striped || animated;

    // The sheen slides by exactly one stripe period on a seamless repeating
    // translate (the shared looping primitive's `shimmer`) — a compositor
    // `@keyframes` on web / reanimated UI-thread loop on native, with no
    // `setInterval` and no per-frame re-render. Because a repeating translate
    // never plays backward, this also drops the old mod-20 wrap "reverse-glide".
    // When not `animated`, `distance` is 0 so the hook yields a still frame, and
    // reduced motion is likewise handled inside the hook (a static, no-timer frame).
    const loop = useLoopingAnimation({
      kind: "shimmer",
      axis: "x",
      distance: animated ? STRIPE_PERIOD : 0,
      durationMs: STRIPE_DURATION_MS,
    });

    const pct = `${Math.max(0, Math.min(100, value))}%`;
    const sizeStyle: Pick<BoxProps, "width" | "height"> =
      orientation === "vertical"
        ? { height: pct as BoxProps["height"], width: "100%" }
        : { width: pct as BoxProps["width"], height: "100%" };

    return (
      <ProgressSectionFrame
        ref={ref}
        {...sizeStyle}
        {...(withAria ? ariaProps(value, ariaLabel) : {})}
        {...rest}
      >
        {showStripes ? (
          <ProgressStripesOverlay>
            {/*
              `loop` is `{ style }`; the looping driver lives on the host `style`
              object (compositor on web / reanimated UI thread on native), not in
              Tamagui style props. `LoopView` is a `Box` on web and an
              `Animated.View` on native, so the same `style` array drives both —
              static layout first, the animated transform last. When not
              `animated` the hook's `distance` is 0, so it yields a still frame.
            */}
            <LoopView style={[STRIPE_ROW_STYLE, loop.style]}>
              {STRIPES.map((i) => (
                <ProgressStripe key={i} />
              ))}
            </LoopView>
          </ProgressStripesOverlay>
        ) : null}
        {renderTextChild(children, ProgressLabel)}
      </ProgressSectionFrame>
    );
  },
);

export interface ProgressLabelProps extends GetProps<typeof ProgressLabel> {}

type ProgressRootFrameProps = Omit<GetProps<typeof ProgressRootFrame>, "size">;

export interface ProgressRootProps extends ProgressRootFrameProps {
  /** Track thickness — a size key (`xxs`–`xxl`) or a px number. @default "md" */
  size?: ProgressSize | number;
}

const ProgressRoot = ProgressRootFrame.styleable<ProgressRootProps>(
  function ProgressRoot(props, ref) {
    const { size = DEFAULT_SIZE, orientation = "horizontal", ...rest } = props;
    // The `size` variants always set `height`. For vertical, translate the size
    // to a `width` and skip the variant so we don't apply conflicting heights.
    const thicknessStyle: Pick<BoxProps, "width" | "height"> =
      orientation === "vertical"
        ? { width: typeof size === "number" ? size : progressThicknessVariant[size].height }
        : {};

    const ctxSize: ProgressSize = typeof size === "string" ? size : DEFAULT_SIZE;
    const frameSize = orientation === "horizontal" ? size : undefined;

    return (
      <ProgressContext.Provider size={ctxSize} orientation={orientation}>
        <ProgressRootFrame
          ref={ref}
          size={frameSize}
          orientation={orientation}
          {...thicknessStyle}
          {...rest}
        />
      </ProgressContext.Provider>
    );
  },
);

type ProgressRootComponentProps = Omit<ProgressRootProps, "aria-label" | "role">;

/**
 * Named slots for the simple `<Progress value={…} />` sugar form (Pillar B /
 * `internal/styles.ts`). The compound `Progress.Root`/`Progress.Section` form
 * styles every part inline; this map gives the terse single-bar form a handle on
 * the inner `Section`/`Label` it composes. Each key maps to the props of the
 * styled part it targets — `styles={{ section: { backgroundColor: "$red9" } }}`
 * is sugar for `<Progress.Section …/>`.
 */
export interface ProgressStyles {
  /** Props spread onto the track root (`.Root`). */
  root?: ProgressRootProps;
  /** Props spread onto the single filled section (`.Section`). */
  section?: GetProps<typeof ProgressSectionFrame>;
  /** Props spread onto the section's label (`.Label`). */
  label?: GetProps<typeof ProgressLabel>;
}

const PROGRESS_SLOT_KEYS = [
  "root",
  "section",
  "label",
] as const satisfies readonly (keyof ProgressStyles)[];

export interface ProgressProps extends ProgressRootComponentProps {
  /** Filled portion of the track, 0–100. */
  value: number;
  /** Diagonal striped sheen over the fill. @default false */
  striped?: boolean;
  /** Animate the stripes (implies `striped`). @default false */
  animated?: boolean;
  /** Optional label rendered inside the filled section. */
  label?: React.ReactNode;
  /** Accessible label read by screen readers. @default "Progress" */
  "aria-label"?: string;
  /** Semantic progress role. @default "progressbar" */
  role?: "progressbar";
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<ProgressStyles>;
}

const ProgressComponent = ProgressRootFrame.styleable<ProgressProps>(function Progress(props, ref) {
  const {
    value,
    striped,
    animated,
    label,
    size,
    orientation,
    "aria-label": ariaLabel = "Progress",
    role = "progressbar",
    styles,
    ...rest
  } = props;

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<ProgressStyles>(styles, PROGRESS_SLOT_KEYS, "Progress");

  return (
    <ProgressRoot
      ref={ref}
      size={size}
      orientation={orientation}
      {...ariaProps(value, ariaLabel)}
      role={role}
      {...s.get("root")}
      {...rest}
    >
      <ProgressSection value={value} striped={striped} animated={animated} {...s.get("section")}>
        {label != null ? <ProgressLabel {...s.get("label")}>{label}</ProgressLabel> : null}
      </ProgressSection>
    </ProgressRoot>
  );
});

/**
 * `Progress` is the simple single-section wrapper; `Progress.Root` is the
 * explicit compound track you fill with `Progress.Section`s, each of which can
 * hold a `Progress.Label`.
 */
export const Progress = withStaticProperties(ProgressComponent, {
  Root: ProgressRoot,
  Section: ProgressSection,
  Label: ProgressLabel,
  Frame: ProgressRootFrame,
});
