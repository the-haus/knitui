import type { ScrollViewProps } from "react-native";

import type { ScrollAreaProps } from "@knitui/components";

/**
 * Props for `Sheet.ScrollView`: the kit's `ScrollArea` API, plus React Native's
 * `ScrollView` props on native. `ScrollArea`'s overlay-scrollbar props have no native
 * rendering and are ignored there; everything else reaches the scroller.
 */
export type SheetScrollViewProps = ScrollAreaProps & Omit<ScrollViewProps, keyof ScrollAreaProps>;

/** `ScrollArea` props that mean nothing to a native `ScrollView`. */
export const SCROLL_AREA_ONLY_PROPS = [
  "scrollbars",
  "type",
  "scrollbarSize",
  "offsetScrollbars",
  "scrollHideDelay",
  "onScrollPositionChange",
  "scrollValueX",
  "scrollValueY",
  "viewportRef",
  "viewportProps",
  "onRefresh",
  "refreshing",
  "refreshColor",
  "scrollbarProps",
  "thumbProps",
  "cornerProps",
  "styles",
  "handleRef",
  "shadows",
  "shadowSize",
  "shadowColor",
  "renderShadow",
] as const;
