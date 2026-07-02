import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import { type StyleProp, View, type ViewStyle } from "@knitui/core";

import {
  type DotStyle,
  PaginationItem,
  type PaginationItemAccessibilityOverrides,
} from "./PaginationItem";

/** Shared props for the data-driven pagination variants. */
export interface BasicPaginationProps<T> {
  /** Progress shared value published by the carousel (`progress` prop). */
  progress: SharedValue<number>;
  /** One entry per dot — typically the same array as the carousel's `data`. */
  data: T[];
  /** Lay the dots out horizontally (default true). */
  horizontal?: boolean;
  /** Render custom dot content (rendered inside the dot box). */
  renderItem?: (item: T, index: number) => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  dotStyle?: DotStyle;
  activeDotStyle?: DotStyle;
  /** Dot box size (px) along the layout axis. */
  size?: number;
  /** Called with the dot index when tapped (wire to `ref.scrollTo({ index })`). */
  onPress?: (index: number) => void;
  /** Carousel name, woven into the default per-dot accessibility label. */
  carouselName?: string;
  /** Per-dot accessibility overrides. */
  paginationItemAccessibility?: (
    index: number,
    length: number,
  ) => PaginationItemAccessibilityOverrides;
}

/** {@link Custom} additionally accepts a worklet to fully own the dot animation. */
export interface CustomPaginationProps<T> extends BasicPaginationProps<T> {
  customReanimatedStyle?: (progress: number, index: number, length: number) => ViewStyle;
}

function PaginationRow<T>({
  progress,
  data,
  horizontal = true,
  renderItem,
  containerStyle,
  dotStyle,
  activeDotStyle,
  size,
  onPress,
  carouselName,
  paginationItemAccessibility,
  customReanimatedStyle,
}: CustomPaginationProps<T>) {
  return (
    <View
      style={[
        {
          flexDirection: horizontal ? "row" : "column",
          alignSelf: "center",
          justifyContent: "space-between",
          alignItems: "center",
        },
        containerStyle,
      ]}
    >
      {data.map((item, index) => {
        const defaultLabel = carouselName
          ? `Slide ${index + 1} of ${data.length} - ${carouselName}`
          : `Slide ${index + 1} of ${data.length}`;
        const overrides = paginationItemAccessibility?.(index, data.length) ?? {};
        return (
          <PaginationItem
            key={index}
            index={index}
            count={data.length}
            animValue={progress}
            size={size}
            vertical={!horizontal}
            dotStyle={dotStyle}
            activeDotStyle={activeDotStyle}
            customReanimatedStyle={customReanimatedStyle}
            onPress={() => onPress?.(index)}
            accessibilityLabel={overrides.accessibilityLabel ?? defaultLabel}
            accessibilityHint={overrides.accessibilityHint}
            accessibilityRole={overrides.accessibilityRole}
            accessibilityState={overrides.accessibilityState}
          >
            {renderItem?.(item, index)}
          </PaginationItem>
        );
      })}
    </View>
  );
}

/**
 * Data-driven pagination with the built-in sliding-fill dot animation. One dot
 * per `data` entry; `renderItem` lets you place custom content inside each dot.
 */
export function Basic<T>(props: BasicPaginationProps<T>) {
  return <PaginationRow {...props} />;
}

/**
 * Like {@link Basic}, but `customReanimatedStyle` (a worklet) fully controls each
 * dot's animated style from `(progress, index, length)`.
 */
export function Custom<T>(props: CustomPaginationProps<T>) {
  return <PaginationRow {...props} />;
}
