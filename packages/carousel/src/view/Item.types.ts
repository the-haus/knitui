import type { ReactElement } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { AnimationStyle, RenderItem } from "../types";
import type { RegisterFn } from "./painter";

export interface ItemProps<T> {
  /** The item, or `undefined` when a lazy source hasn't loaded it yet. */
  item: T | undefined;
  index: number;
  count: number;
  loop: boolean;
  vertical: boolean;
  /** Resolved page size px (for the main-axis dimension). */
  pageSize: number;
  offset: SharedValue<number>;
  size: SharedValue<number>;
  animationStyle: AnimationStyle;
  renderItem: RenderItem<T>;
  /** Rendered when `item` is undefined (async source still loading). */
  renderPlaceholder?: (index: number) => ReactElement | null;
  /** Web imperative painter registration (no-op on native). */
  register: RegisterFn;
  /**
   * Two-axis deck: the layout rendered while `motionAxis` is 1 (a cross-axis
   * motion). Undefined without `crossAxis`.
   */
  crossStyle?: AnimationStyle;
  /** Two-axis deck: which layout renders (0 = `animationStyle`, 1 = `crossStyle`). */
  motionAxis?: SharedValue<number>;
  /**
   * The layout's `zIndex` at the SETTLED centre (see `paintOrder`), set as a
   * React-level prop on native so Android orders the slide views on commit.
   * Undefined for layouts without a `zIndex`.
   */
  paintZ?: number;
  /** Position in paint order (0 = bottom); Android `elevation`. */
  paintRank?: number;
}
