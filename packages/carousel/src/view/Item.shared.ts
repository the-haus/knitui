import type { ReactElement } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { RenderItem } from "../types";

/**
 * Presentation shared by the native (`Item.tsx`) and web (`Item.web.tsx`) slide
 * variants. The two differ only in how they animate (Reanimated `useAnimatedStyle`
 * vs. the web `addListener` painter); everything else — box style, dimension,
 * content branch — is identical and lives here.
 */

/** Every slide is stacked at the origin and placed purely by its transform. */
export const SLIDE_BASE: ViewStyle = { position: "absolute", pointerEvents: "box-none" };

/**
 * Main-axis dimension for a slide; the cross axis stretches to the container.
 *
 * The slide is centred on the main axis (`50%` minus half a page) rather than
 * pinned to the leading edge, so when `pageSize` is smaller than the viewport
 * the active slide (progress 0, no translation) sits in the middle and its
 * neighbours peek in symmetrically — instead of hugging the left/top with all
 * the slack on one side. This is a constant inset applied to every slide, so it
 * is purely visual: the snap offsets and active-index math (multiples of `size`)
 * are unaffected. When `pageSize` equals the viewport it is a no-op.
 */
export function slideDimension(vertical: boolean, pageSize: number): ViewStyle {
  return vertical
    ? { left: 0, right: 0, height: pageSize, top: "50%", marginTop: -pageSize / 2 }
    : { top: 0, bottom: 0, width: pageSize, left: "50%", marginLeft: -pageSize / 2 };
}

/** The slide body: the loaded item via `renderItem`, else the loading placeholder. */
export function slideContent<T>(
  item: T | undefined,
  index: number,
  progress: SharedValue<number>,
  renderItem: RenderItem<T>,
  renderPlaceholder?: (index: number) => ReactElement | null,
): ReactElement | null {
  return item !== undefined
    ? renderItem({ item, index, progress })
    : (renderPlaceholder?.(index) ?? null);
}
