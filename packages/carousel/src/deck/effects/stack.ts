import { clamp } from "../../engine";
import type { DeckEffect, DeckEffectConfig } from "../types";

/**
 * A concentric stack: the top card drags freely (no tilt); cards behind are
 * centered and only scaled + faded by their (animated) `depth`. A calmer, more
 * "card-wallet" look than {@link tinderEffect}.
 */
export function stackEffect(config: DeckEffectConfig = {}): DeckEffect {
  const scaleInterval = config.scaleInterval ?? 0.05;
  const opacityInterval = config.opacityInterval ?? 0.12;

  return (s): ReturnType<DeckEffect> => {
    "worklet";
    const e = Math.max(0, s.depth);
    const scale = 1 - e * scaleInterval;
    const opacity = clamp(1 - e * opacityInterval, 0, 1);

    if (s.isTop) {
      return {
        transform: [{ translateX: s.drag.x }, { translateY: s.drag.y }, { scale }],
        opacity,
        zIndex: 100,
      };
    }
    return { transform: [{ scale }], opacity, zIndex: Math.round(100 - e * 10) };
  };
}
