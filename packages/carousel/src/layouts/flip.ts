import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, FlipConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";
import { distanceZ } from "./zOrder";

/**
 * A flip deck: slides stay pinned at the centre and rotate 180° about the chosen
 * axis. The active card faces front; the next card is turned away (its back face
 * hidden via `backfaceVisibility`) and rotates into view as you advance — so the
 * stack appears to flip from one slide to the next. `perspective` adds depth.
 */
export function flipLayout(_base: BaseLayoutConfig, config: FlipConfig = {}): AnimationStyle {
  const perspective = config.perspective ?? 0;
  const axis = config.axis ?? "y";
  // Resolved once at closure-creation — this worklet runs per mounted slide per
  // frame, so the `perspective > 0` test and the axis choice do not belong inside.
  const hasPerspective = perspective > 0;
  const rotateOnX = axis === "x";

  return (progress: number): ViewStyle => {
    "worklet";
    const angle = progress * 180;
    const dist = Math.abs(progress);
    const zIndex = distanceZ(progress);

    const rot = rotateOnX ? { rotateX: `${angle}deg` } : { rotateY: `${angle}deg` };

    // Built in one shot instead of `[...persp, rot]`, which allocated a throwaway
    // array and copied it. The final array stays fresh per call by design — a
    // transform array handed to reanimated must not be reused/mutated after it is
    // converted.
    // Once a card turns past 90° its back faces the viewer; hide it so only the
    // front-facing slide shows through the stack.
    //
    // A slide two pages away has turned a full 360° and faces front again, so
    // `backfaceVisibility` alone left every even-distance slide showing behind
    // the active one. From one page out a slide is past 90° (back face) anyway,
    // so hiding it there is invisible during the flip.
    return {
      transform: hasPerspective ? [{ perspective }, rot] : [rot],
      backfaceVisibility: "hidden",
      opacity: dist < 1 ? 1 : 0,
      zIndex,
    };
  };
}
