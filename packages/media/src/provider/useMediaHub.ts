import * as React from "react";

import { MediaContext } from "./context";
import type { MediaHub } from "./media-hub";
import { getSharedMediaHub } from "./shared-engines";

/**
 * The media hub: pause everything, toggle whatever has focus, preload a source.
 * Stable for the life of the app, so it is safe in effect dependencies. Pair it
 * with `useMediaState()` when the UI has to follow what is playing.
 */
export function useMediaHub(): MediaHub {
  return React.useContext(MediaContext)?.hub ?? getSharedMediaHub();
}
