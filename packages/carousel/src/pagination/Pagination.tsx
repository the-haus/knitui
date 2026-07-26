import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import { UnstyledButton, useReducedTransition } from "@knitui/components";
import { type GetProps, isWeb } from "@knitui/core";
import { useCallbackRef } from "@knitui/hooks";

import { CarouselDot, CarouselDots } from "../view/chrome";
import { useSelectedIndex } from "./selectedDot";
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
  /** Whether this dot is the selected one — derived once for the whole row. */
  selected: boolean;
  dotProps?: GetProps<typeof CarouselDot>;
  activeDotProps?: GetProps<typeof CarouselDot>;
  onPress?: (index: number) => void;
  label: string;
  renderDot?: (index: number, selected: boolean) => React.ReactNode;
}

function DotInner({
  index,
  selected,
  dotProps,
  activeDotProps,
  onPress,
  label,
  renderDot,
}: DotProps) {
  // `selected` arrives from the row's single `useSelectedIndex` (the rounded,
  // loop-wrapped progress). The visible grow/fade transition is owned by
  // Tamagui's `animation` driver below; the boolean is all it animates between.
  //
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
 * One dot, memoized.
 *
 * Only ONE dot's `selected` flips when the carousel changes page, but the row
 * re-renders every dot — and each dot mounts a `useReducedTransition` and rebuilds
 * its Tamagui `CarouselDot` (whose `active`/`scale`/`opacity` variants the animation
 * driver then re-diffs). A plain shallow compare is enough here because every prop
 * is a primitive or an identity-stable object: `dotProps`/`activeDotProps` come from
 * `slotStyles`, which hands back the same object across renders, `label` is a string,
 * and `onPress` is stabilised by the row (see `PaginationBase`).
 *
 * `renderDot` is deliberately NOT stabilised: a consumer's inline renderer closes
 * over its own state, and freezing it would show stale dot content — the same
 * `FlatList`-`extraData` trap documented for `Carousel`'s `renderItem`. An inline
 * `renderDot` simply means this memo does not hold, exactly as before.
 */
const Dot = React.memo(DotInner);

/**
 * Decoupled pagination indicator. It is not coupled to a carousel instance — it
 * just reads a `progress` SharedValue and reports taps via `onPress`. Selection
 * is derived ONCE here (`useSelectedIndex`) and handed down as a boolean; the
 * dots own only their own (declarative) transition, so this stays a thin layout
 * shell with exactly one reanimated subscription per row.
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

  // ONE subscription to `progress` for the whole row (the carousel writes it
  // every frame) — not one reanimated mapper per dot.
  const selectedIndex = useSelectedIndex(progress, count);

  // Stabilised so the `Dot` memo above can actually hold: every caller writes this
  // inline (`Carousel` passes `(i) => core.controller.scrollTo({ index: i })`), which
  // would otherwise hand all `count` dots a new prop on every render. Safe to
  // stabilise because it is a pure imperative action — it contributes nothing to
  // what the dot renders, so an always-latest ref cannot make output stale.
  const handlePress = useCallbackRef(onPress);

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
          selected={selectedIndex === index}
          dotProps={styles?.dot}
          activeDotProps={styles?.activeDot}
          onPress={handlePress}
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
