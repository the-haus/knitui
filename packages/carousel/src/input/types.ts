import type * as React from "react";

import type { CarouselRef } from "../types";

/** Shared params for the web-only auxiliary input hooks (no-ops on native). */
export interface AuxInputParams {
  /** Ref to the carousel host element (the DOM node on web). */
  hostRef: React.RefObject<unknown>;
  enabled: boolean;
  vertical: boolean;
  count: number;
  controller: CarouselRef;
  /**
   * Two-axis deck: steps along the cross axis (the axis `vertical` does not
   * pick). Null/undefined for a single-axis carousel.
   */
  crossController?: { next: () => void; prev: () => void } | null;
}
