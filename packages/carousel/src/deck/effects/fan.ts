import { clamp } from "../../engine";
import type { DeckEffect, DeckEffectConfig } from "../types";

/**
 * A fanned hand of cards: each card behind is rotated a little further and
 * nudged sideways by its (animated) `depth`, so the deck spreads like a poker
 * fan. The top card drags and tilts; a promoted card straightens into place.
 */
export function fanEffect(config: DeckEffectConfig = {}): DeckEffect {
  const fanDeg = config.fanDeg ?? 7;
  const stackInterval = config.stackInterval ?? 16;
  const scaleInterval = config.scaleInterval ?? 0.04;
  const opacityInterval = config.opacityInterval ?? 0.06;
  const tiltDeg = config.tiltDeg ?? 10;
  // Fan toward the right by default; "left" mirrors it.
  const dir = config.anchor === "left" ? -1 : 1;

  return (s): ReturnType<DeckEffect> => {
    "worklet";
    const e = Math.max(0, s.depth);
    const slideX = dir * e * stackInterval;
    const rotate = dir * e * fanDeg;
    const scale = 1 - e * scaleInterval;
    const opacity = clamp(1 - e * opacityInterval, 0, 1);

    if (s.isTop) {
      const tilt = clamp(s.size.width > 0 ? s.drag.x / s.size.width : 0, -1, 1) * tiltDeg;
      return {
        transform: [
          { translateX: s.drag.x + slideX },
          { translateY: s.drag.y },
          { rotateZ: `${tilt + rotate}deg` },
          { scale },
        ],
        opacity,
        zIndex: 100,
      };
    }
    return {
      transform: [{ translateX: slideX }, { rotateZ: `${rotate}deg` }, { scale }],
      opacity,
      zIndex: Math.round(100 - e * 10),
    };
  };
}
