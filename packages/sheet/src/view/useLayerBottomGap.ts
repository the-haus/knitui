import type { LayoutChangeEvent } from "@knitui/core";

const noMeasure = (_event: LayoutChangeEvent) => {};

/** Web reads the keyboard from the visual viewport, which already counts from the layer. */
export function useLayerBottomGap(): [number, (event: LayoutChangeEvent) => void] {
  return [0, noMeasure];
}
