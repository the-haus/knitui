import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import { UnstyledButton, useReducedTransition } from "@knitui/components";
import { type GetProps, isWeb } from "@knitui/core";

import { CarouselDot, CarouselDots } from "../view/chrome";
import { useSelectedDot } from "./selectedDot";
import { Basic, Custom } from "./variants";

/**
 * Per-slot style sugar for `Pagination` — the dot vocabulary shared with
 * `Carousel`'s `styles` map (`dots` / `dot` / `activeDot`). Each maps to the
 * props of the styled part it targets.
 */
export interface PaginationStyles {
  /** The dots container (`Carousel.Dots`). */
  dots?: GetProps<typeof CarouselDots>;
  /** Each dot (`Carousel.Dot`). */
  dot?: GetProps<typeof CarouselDot>;
  /** The active dot, merged over `dot`. */
  activeDot?: GetProps<typeof CarouselDot>;
}

export interface PaginationProps {
  /** The fractional progress published by the carousel (`progress` prop). */
  progress: SharedValue<number>;
  /** Number of real items. */
  count: number;
  /** Called with the dot index when tapped (wire to `ref.scrollTo({ index })`). */
  onPress?: (index: number) => void;
  vertical?: boolean;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: PaginationStyles;
  /** Fully custom dot renderer (receives selected state). */
  renderDot?: (index: number, selected: boolean) => React.ReactNode;
  /** Per-dot accessibility label (default "Go to slide N of M"). */
  dotAccessibilityLabel?: (index: number, count: number) => string;
  testID?: string;
}

interface DotProps {
  index: number;
  count: number;
  progress: SharedValue<number>;
  dotProps?: GetProps<typeof CarouselDot>;
  activeDotProps?: GetProps<typeof CarouselDot>;
  onPress?: (index: number) => void;
  label: string;
  renderDot?: (index: number, selected: boolean) => React.ReactNode;
}

function Dot({
  index,
  count,
  progress,
  dotProps,
  activeDotProps,
  onPress,
  label,
  renderDot,
}: DotProps) {
  // The selected dot is the rounded progress (loop-wrapped into real-item space).
  // The visible grow/fade transition is owned by Tamagui's `animation` driver
  // below; this hook only flips the boolean it animates between (kept live on
  // both platforms by a `progress.addListener` — see useSelectedDot).
  const isActive = React.useCallback(
    (p: number): boolean => {
      "worklet";
      if (count <= 0) return false;
      return ((Math.round(p) % count) + count) % count === index;
    },
    [index, count],
  );

  const selected = useSelectedDot(progress, isActive, [index, count]);

  // Reduced-motion-safe transition key (null under prefers-reduced-motion); this
  // is what eases the scale/opacity/colour change between the two dot states.
  const dotTransition = useReducedTransition("fast");

  // Slide dots are a button group with `aria-current` on the active one — the
  // APG-correct choice without associated tabpanels (a tablist would need them).
  // The kit's `UnstyledButton` (Tamagui) takes W3C `aria-*` on web and RN
  // `accessibility*` on native (RNW doesn't bridge `accessibilityLabel` here).
  const a11yProps = isWeb
    ? ({ "aria-label": label, "aria-current": selected ? "true" : undefined } as Record<
        string,
        unknown
      >)
    : { accessibilityLabel: label, accessibilityState: { selected } };

  return (
    <UnstyledButton onPress={() => onPress?.(index)} {...a11yProps}>
      {renderDot ? (
        renderDot(index, selected)
      ) : (
        // Discrete, declarative motion: Tamagui animates `scale`/`opacity`
        // between the inactive/active states on its own driver (CSS on web,
        // reanimated on native) — no per-frame imperative painting.
        <CarouselDot
          active={selected}
          {...dotTransition}
          scale={selected ? 1 : 0.6}
          opacity={selected ? 1 : 0.4}
          {...dotProps}
          {...(selected ? activeDotProps : null)}
        />
      )}
    </UnstyledButton>
  );
}

/**
 * Decoupled pagination indicator. It is not coupled to a carousel instance — it
 * just reads a `progress` SharedValue and reports taps via `onPress`. Each dot
 * owns its own animation and selected state (see useDotHost), so this stays a
 * thin layout shell.
 */
function PaginationBase({
  progress,
  count,
  onPress,
  vertical = false,
  styles,
  renderDot,
  dotAccessibilityLabel,
  testID,
}: PaginationProps) {
  const webProps = isWeb
    ? ({ role: "group", "aria-label": "Choose slide to display" } as Record<string, unknown>)
    : null;

  return (
    <CarouselDots
      testID={testID}
      flexDirection={vertical ? "column" : "row"}
      {...styles?.dots}
      {...webProps}
    >
      {Array.from({ length: count }, (_, index) => (
        <Dot
          key={index}
          index={index}
          count={count}
          progress={progress}
          dotProps={styles?.dot}
          activeDotProps={styles?.activeDot}
          onPress={onPress}
          renderDot={renderDot}
          label={dotAccessibilityLabel?.(index, count) ?? `Go to slide ${index + 1} of ${count}`}
        />
      ))}
    </CarouselDots>
  );
}

/**
 * Decoupled pagination indicator (default `count` dots that read `progress`).
 * The data-driven variants are attached as a namespace, mirroring
 * react-native-reanimated-carousel: `Pagination.Basic` / `Pagination.Custom`.
 */
export const Pagination = Object.assign(PaginationBase, { Basic, Custom });
