// `/extras` (not the root entry) so the animated-number hooks re-exported from
// `@knitui/core` (`useAnimatedNumber*`) work on web too; the root CSS driver
// omits them and those hooks throw without it.
import { createAnimations } from "@tamagui/animations-css/extras";

import { MOTION_PRESETS } from "./motion";

/**
 * CSS animation driver (web). Native resolves the `animations.native.ts` sibling
 * (reanimated). Both are built from the SAME `MOTION_PRESETS` table in
 * `motion.ts`: in v3 a preset means the same motion on every driver (springs
 * compile to a `linear()` easing on the web), so the names cannot drift apart.
 */
export const animations = createAnimations(MOTION_PRESETS);
