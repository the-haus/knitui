import { clamp } from "../../engine";
import type { DeckEffect, DeckEffectConfig } from "../types";

/**
 * The default deck effect: cards are stacked below and behind by their (animated)
 * `depth`, and the top card free-drags and tilts with horizontal travel. Because
 * `depth` is animated, a card promoted after a swipe rises smoothly from its old
 * slot to the front (no pop).
 */
export function tinderEffect(config: DeckEffectConfig = {}): DeckEffect {
  const stackInterval = config.stackInterval ?? 14;
  const scaleInterval = config.scaleInterval ?? 0.06;
  const opacityInterval = config.opacityInterval ?? 0.08;
  const tiltDeg = config.tiltDeg ?? 12;

  return (s): ReturnType<DeckEffect> => {
    "worklet";
    const e = Math.max(0, s.depth);
    const slide = e * stackInterval;
    const scale = 1 - e * scaleInterval;
    const opacity = clamp(1 - e * opacityInterval, 0, 1);

    if (s.isTop) {
      const tilt = clamp(s.size.width > 0 ? s.drag.x / s.size.width : 0, -1, 1) * tiltDeg;
      return {
        transform: [
          { translateX: s.drag.x },
          { translateY: s.drag.y + slide },
          { rotateZ: `${tilt}deg` },
          { scale },
        ],
        opacity,
        zIndex: 100,
      };
    }
    return {
      transform: [{ translateY: slide }, { scale }],
      opacity,
      zIndex: Math.round(100 - e * 10),
    };
  };
}
