/**
 * The deck effect registry — the extensibility seam for "cool layouts". Each
 * built-in effect is a factory `(config?) => DeckEffect` (a card-transform
 * worklet); `resolveDeckEffect` turns the `effect` prop (a name or a custom
 * worklet) into the worklet the cards run. Adding an effect = add a file + a
 * registry entry here. Mirrors the carousel's `useLayout` (`src/layouts`).
 */
import type { DeckEffect, DeckEffectConfig, DeckEffectFactory, DeckEffectName } from "../types";
import { fanEffect } from "./fan";
import { stackEffect } from "./stack";
import { swipeEffect } from "./swipe";
import { tinderEffect } from "./tinder";

export { fanEffect, stackEffect, swipeEffect, tinderEffect };

/** Name → factory. Extend this to register a new built-in effect. */
export const deckEffects: Record<DeckEffectName, DeckEffectFactory> = {
  tinder: tinderEffect,
  stack: stackEffect,
  fan: fanEffect,
  swipe: swipeEffect,
};

/** Resolve the `effect` prop (a built-in name or a custom worklet) to a worklet. */
export function resolveDeckEffect(
  effect: DeckEffectName | DeckEffect | undefined,
  config: DeckEffectConfig | undefined,
): DeckEffect {
  if (typeof effect === "function") return effect;
  const factory = deckEffects[effect ?? "tinder"] ?? tinderEffect;
  return factory(config);
}
