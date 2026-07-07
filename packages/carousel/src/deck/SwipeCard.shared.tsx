import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import type { GetProps, ViewStyle } from "@knitui/core";

import { sanitizeAnimationStyle } from "../layouts";
import { type DeckCardBox, DeckStamp, DeckStampText, type DeckStampTone } from "./chrome";
import type { DeckEffect, SwipeDirection } from "./types";
import type { TopCardApi } from "./useSwipeDeck";

/** Absolute fill: every card overlaps at the deck origin; its effect transforms it. */
export const CARD_BASE: ViewStyle = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

/** Coerce a non-finite `zIndex` (native crashes on it) — reuse the layout sanitizer. */
export const sanitizeDeckStyle = sanitizeAnimationStyle;

/** Which tone (color) a direction's stamp uses. */
export const STAMP_TONE: Record<SwipeDirection, DeckStampTone> = {
  right: "like",
  left: "nope",
  up: "super",
  down: "neutral",
};

/** Where a direction's stamp sits on the card, tilted like a rubber stamp. */
export function stampPosition(direction: SwipeDirection): ViewStyle {
  switch (direction) {
    case "right":
      return { position: "absolute", top: 24, left: 24, transform: [{ rotate: "-14deg" }] };
    case "left":
      return { position: "absolute", top: 24, right: 24, transform: [{ rotate: "14deg" }] };
    case "up":
      return { position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center" };
    default: // down
      return { position: "absolute", top: 24, left: 0, right: 0, alignItems: "center" };
  }
}

export interface SwipeCardProps {
  children: React.ReactNode;
  /** 0 = top card, 1 = behind, … (the target slot; the card animates toward it). */
  depth: number;
  isTop: boolean;
  effect: DeckEffect;
  sizeW: SharedValue<number>;
  sizeH: SharedValue<number>;
  directions: SwipeDirection[];
  threshold: number;
  velocityThreshold: number;
  disabled: boolean;
  onCommit: (direction: SwipeDirection) => void;
  registerTop: (api: TopCardApi | null) => void;
  /** Directions that should show a stamp overlay on the top card. */
  stampDirections: SwipeDirection[];
  renderStamp?: (direction: SwipeDirection) => React.ReactNode;
  stampLabels?: Partial<Record<SwipeDirection, string>>;
  cardStyle?: GetProps<typeof DeckCardBox>;
  stampStyle?: GetProps<typeof DeckStamp>;
}

/**
 * Resolve one direction's stamp content: the consumer's `renderStamp` wins,
 * else a built-in bordered label (only when `stampLabels[direction]` is set).
 */
export function stampContentFor(
  direction: SwipeDirection,
  renderStamp: SwipeCardProps["renderStamp"],
  stampLabels: SwipeCardProps["stampLabels"],
  stampStyle: SwipeCardProps["stampStyle"],
): React.ReactNode {
  if (renderStamp) return renderStamp(direction);
  const label = stampLabels?.[direction];
  if (!label) return null;
  const tone = STAMP_TONE[direction];
  return (
    <DeckStamp tone={tone} {...stampStyle}>
      <DeckStampText tone={tone}>{label}</DeckStampText>
    </DeckStamp>
  );
}
