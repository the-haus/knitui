import { clamp } from "../../engine";
import type { DeckEffect, DeckEffectConfig } from "../types";

/**
 * A "coming up from behind" flavour: cards behind sit smaller and lower by their
 * (animated) `depth` and rise into place when promoted, while the top card tilts
 * and shrinks a touch the further it is dragged. A second exit style that doubles
 * as the worked example for a custom effect.
 */
export function swipeEffect(config: DeckEffectConfig = {}): DeckEffect {
  const stackInterval = config.stackInterval ?? 22;
  const scaleInterval = config.scaleInterval ?? 0.08;
  const opacityInterval = config.opacityInterval ?? 0.1;
  const tiltDeg = config.tiltDeg ?? 8;

  return (s): ReturnType<DeckEffect> => {
    "worklet";
    const e = Math.max(0, s.depth);
    const slide = e * stackInterval;
    const scale = 1 - e * scaleInterval;
    const opacity = clamp(1 - e * opacityInterval, 0, 1);

    if (s.isTop) {
      const norm = clamp(s.size.width > 0 ? s.drag.x / s.size.width : 0, -1, 1);
      const tilt = norm * tiltDeg;
      // Shrink a touch as it is flung, so the incoming card reads as "in front".
      const drag = Math.max(Math.abs(s.drag.x), Math.abs(s.drag.y));
      const shrink = 1 - Math.min(0.06, (s.size.width > 0 ? drag / s.size.width : 0) * 0.06);
      return {
        transform: [
          { translateX: s.drag.x },
          { translateY: s.drag.y + slide },
          { rotateZ: `${tilt}deg` },
          { scale: scale * shrink },
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
