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
}
