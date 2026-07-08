import type { ReactElement, ReactNode } from "react";

import type { SlotStyles, StyleProp, ViewStyle } from "@knitui/core";

import type { DeckStyles } from "./chrome";

/** A swipe direction. `right` = like, `left` = nope, `up` = super-like (by convention). */
export type SwipeDirection = "left" | "right" | "up" | "down";

/**
 * Live state of one card, handed to a {@link DeckEffect} worklet. This is the
 * deck's analogue of the carousel's scalar `progress` — a richer object so
 * effects can react to 2-D drag *and* stack depth.
 */
export interface DeckCardState {
  /**
   * The card's live stack slot, animated: `0` = the top (active) card, `1` = the
   * card behind it, `2` = the next, … It is fractional while a card is rising to
   * a new slot after a swipe (it springs from its old slot to its new one), so an
   * effect that reads it gets the smooth in-between positions for free.
   */
  depth: number;
  /** Whether this is the top card (the one being dragged). */
  isTop: boolean;
  /** The top card's live drag translation in px. `{ 0, 0 }` for cards behind. */
  drag: { x: number; y: number };
  /** The card's measured size in px. */
  size: { width: number; height: number };
}

/**
 * A card-transform worklet: maps a card's {@link DeckCardState} to a style. This
 * is the extensibility seam — new visual effects are just new worklets, selected
 * by `effect`. Mirrors the carousel's `AnimationStyle`.
 */
export type DeckEffect = (state: DeckCardState) => ViewStyle;

/** Builds a {@link DeckEffect} from optional tuning config (a registered factory). */
export type DeckEffectFactory = (config?: DeckEffectConfig) => DeckEffect;

/** Tuning shared by the built-in effects (each ignores what it doesn't use). */
export interface DeckEffectConfig {
  /** Step between stacked cards along the deck, px. */
  stackInterval?: number;
  /** Scale step per card deeper in the deck (0.05 = 5% smaller each). */
  scaleInterval?: number;
  /** Opacity step per card deeper in the deck. */
  opacityInterval?: number;
  /** Max tilt applied to the top card per full page of horizontal drag, deg. */
  tiltDeg?: number;
  /** Rotation step per card for the `fan` effect, deg. */
  fanDeg?: number;
  /** Which way the deck is anchored / fans (default "up"/"top"). */
  anchor?: "top" | "bottom" | "left" | "right";
}

/** Built-in effect names. Pass a {@link DeckEffect} for anything custom. */
export type DeckEffectName = "tinder" | "stack" | "fan" | "swipe";

/** Imperative handle exposed via `ref`. */
export interface SwipeDeckRef {
  /** Fling the top card off toward `direction` (like a gesture commit). */
  swipe: (direction: SwipeDirection) => void;
  /** Convenience for `swipe("left")` (dislike). */
  swipeLeft: () => void;
  /** Convenience for `swipe("right")` (like). */
  swipeRight: () => void;
  /** Convenience for `swipe("up")` (super-like). */
  swipeUp: () => void;
  /** The index of the current top card in `data`. */
  getActiveIndex: () => number;
}

export interface SwipeDeckProps<T> {
  /* Data & render -------------------------------------------------------- */
  /** The cards, top of the deck first. Consumed as they are swiped away. */
  data: T[];
  /** Render one card's content. Wrapped in the deck's animated + styled host. */
  renderCard: (item: T, index: number) => ReactElement | null;
  /** Rendered once the deck is exhausted (no cards left). */
  renderEmpty?: () => ReactElement | null;
  /** Stable keys (recommended). Defaults to the data index. */
  keyExtractor?: (item: T, index: number) => string;

  /* Effect / layout ------------------------------------------------------ */
  /** Card-transform effect: a built-in name or a custom worklet. Default "tinder". */
  effect?: DeckEffectName | DeckEffect;
  /** Tuning for the built-in effects. Ignored when `effect` is a custom worklet. */
  effectConfig?: DeckEffectConfig;
  /** How many cards are mounted/visible in the deck at once (default 3). */
  stackSize?: number;

  /* Gesture -------------------------------------------------------------- */
  /** Which directions commit a swipe (default `["left", "right"]`). */
  directions?: SwipeDirection[];
  /** Commit distance as a fraction of the card size, 0..1 (default 0.25). */
  threshold?: number;
  /** Release velocity (px/s) that commits a swipe regardless of distance (default 800). */
  velocityThreshold?: number;
  /** Disable dragging (imperative `ref` swipes still work). */
  disabled?: boolean;

  /* Callbacks ------------------------------------------------------------ */
  /** Fired when a card is committed in any direction. */
  onSwipe?: (item: T, index: number, direction: SwipeDirection) => void;
  onSwipeLeft?: (item: T, index: number) => void;
  onSwipeRight?: (item: T, index: number) => void;
  onSwipeUp?: (item: T, index: number) => void;
  onSwipeDown?: (item: T, index: number) => void;
  /** Fired when the top card changes (after a commit settles). */
  onActiveIndexChange?: (index: number) => void;
  /** Fired once the deck runs out of cards. */
  onEmpty?: () => void;

  /* Stamps (the LIKE / NOPE overlays) ------------------------------------ */
  /**
   * Per-direction overlay whose opacity is driven by the drag toward that
   * direction (0 at rest → 1 at the commit threshold). Full control.
   */
  renderStamp?: (direction: SwipeDirection) => ReactNode;
  /**
   * Convenience built-in stamps — a bordered label per direction, e.g.
   * `{ right: "LIKE", left: "NOPE", up: "SUPER" }`. Superseded by `renderStamp`.
   */
  stampLabels?: Partial<Record<SwipeDirection, string>>;

  /* Styling & a11y ------------------------------------------------------- */
  /** Container style — set the deck's width/height here. */
  style?: StyleProp<ViewStyle>;
  /**
   * Per-slot style sugar spread onto the matching styled part
   * (`root` / `card` / `stamp`). Explicit props always win.
   */
  styles?: SlotStyles<DeckStyles>;
  accessibilityLabel?: string;
  testID?: string;
}
