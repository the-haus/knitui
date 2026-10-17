import { createAnimations } from "@tamagui/animations-reanimated";

import { MOTION_PRESETS } from "./motion";

/**
 * Reanimated native driver. Web resolves `animations.ts`; native resolves this
 * sibling so the same `transition` keys run off-thread on native.
 *
 * v3 drivers share one preset format, so this is the SAME `MOTION_PRESETS`
 * table the web driver uses — the easing curves are CSS timing-function strings
 * (`"ease-out"`, `"cubic-bezier(…)"`), which the v3 reanimated driver parses
 * itself (v2 needed `Easing.bezier(...)` objects here).
 */
export const animations = createAnimations(MOTION_PRESETS);
