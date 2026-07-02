import type { Ref } from "react";
import type { LayoutChangeEvent } from "react-native";

import type { TamaguiElement } from "@knitui/core";

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Props the consumer spreads onto the measured element to enable native
 * measurement. Empty on web — there the returned `ref` + `ResizeObserver` drives
 * it.
 */
export interface ElementSizeRootProps {
  onLayout?: (event: LayoutChangeEvent) => void;
}

export interface UseElementSizeReturn extends ElementSize {
  /**
   * Attach to the element you want to measure. Typed as a generic `Ref` because
   * the web hook returns a CALLBACK ref (it must re-attach its `ResizeObserver`
   * when the measured node mounts AFTER first render — e.g. a `keepMounted={false}`
   * `Collapse` subtree), while the native hook returns a plain object ref for
   * parity. Consumers only spread it onto the element, never read `.current`.
   */
  ref: Ref<TamaguiElement | null>;
  /** Spread onto the measured element (drives measurement on native). */
  rootProps: ElementSizeRootProps;
}
