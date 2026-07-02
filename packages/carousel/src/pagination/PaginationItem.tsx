import * as React from "react";
import { Extrapolation, interpolate, type SharedValue } from "react-native-reanimated";

import { Box, UnstyledButton } from "@knitui/components";
import {
  type AccessibilityRole,
  type AccessibilityState,
  isWeb,
  type ViewStyle,
} from "@knitui/core";

import { useDotHost } from "./dotAnimation";

/** Dot styling with numeric (animatable) width/height. */
export type DotStyle = Omit<ViewStyle, "width" | "height"> & {
  width?: number;
  height?: number;
};

/** Per-dot accessibility overrides (full control over SR announcements). */
export interface PaginationItemAccessibilityOverrides {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
}

const DEFAULT_DOT_SIZE = 10;

export interface PaginationItemProps {
  index: number;
  count: number;
  /** Progress shared value (real-item space, [0, count)). */
  animValue: SharedValue<number>;
  /** Container box size (px); falls back to dotStyle dims then 10. */
  size?: number;
  /** Lay the dot row out vertically (matches the carousel's `vertical`). */
  vertical?: boolean;
  dotStyle?: DotStyle;
  activeDotStyle?: DotStyle;
  /** Overrides the built-in fill animation with a worklet `(progress, index, count) => style`. */
  customReanimatedStyle?: (progress: number, index: number, count: number) => ViewStyle;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  children?: React.ReactNode;
}

/**
 * A single pagination dot. The active item is "filled" by sliding a coloured
 * inner block into view (an overflow-clipped translate driven by `animValue`),
 * which reads as a smooth fill rather than a hard toggle. `customReanimatedStyle`
 * replaces that animation entirely.
 */
export function PaginationItem({
  index,
  count,
  animValue,
  size,
  vertical = false,
  dotStyle,
  activeDotStyle,
  customReanimatedStyle,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  children,
}: PaginationItemProps) {
  const width = size ?? dotStyle?.width ?? DEFAULT_DOT_SIZE;
  const height = size ?? dotStyle?.height ?? DEFAULT_DOT_SIZE;

  const compute = React.useCallback(
    (p: number): ViewStyle => {
      "worklet";
      if (customReanimatedStyle) return customReanimatedStyle(p, index, count);
      // Slide the fill block across the clipped box. The box is rotated 90° for a
      // horizontal row so a single vertical translate covers both orientations.
      const extent = vertical ? height : width;
      let inputRange = [index - 1, index, index + 1];
      const outputRange = [-extent, 0, extent];
      // Loop wrap: the first dot is also "near" when progress passes the last item.
      if (index === 0 && p > count - 1) inputRange = [count - 1, count, count + 1];
      return {
        transform: [{ translateX: interpolate(p, inputRange, outputRange, Extrapolation.CLAMP) }],
      };
    },
    [index, count, width, height, vertical, customReanimatedStyle],
  );

  const isActive = React.useCallback(
    (p: number): boolean => {
      "worklet";
      return Math.round(p) === index;
    },
    [index],
  );

  const { selected, Host, setRef, hostStyle } = useDotHost(animValue, compute, isActive, [
    index,
    count,
    width,
    height,
    vertical,
    customReanimatedStyle,
  ]);

  const resolvedLabel = accessibilityLabel ?? `Slide ${index + 1} of ${count}`;
  const resolvedHint = accessibilityHint ?? (selected ? "" : `Go to ${resolvedLabel}`);
  const resolvedRole = accessibilityRole ?? "button";
  const resolvedState = accessibilityState ?? { selected };

  // Tamagui's `UnstyledButton` takes W3C `aria-*` on web, RN `accessibility*` on
  // native (RNW doesn't bridge `accessibilityLabel` to `aria-label` here).
  const a11yProps = isWeb
    ? ({
        "aria-label": resolvedLabel,
        "aria-current": selected ? "true" : undefined,
      } as Record<string, unknown>)
    : {
        accessibilityLabel: resolvedLabel,
        accessibilityHint: resolvedHint,
        accessibilityRole: resolvedRole,
        accessibilityState: resolvedState,
      };

  return (
    <UnstyledButton onPress={onPress} {...a11yProps}>
      <Box
        style={[
          {
            width,
            height,
            overflow: "hidden",
            transform: [{ rotateZ: vertical ? "0deg" : "90deg" }],
          },
          dotStyle,
        ]}
      >
        <Host
          ref={setRef}
          style={[{ flex: 1, backgroundColor: "#11181C" }, hostStyle, activeDotStyle]}
        >
          {children}
        </Host>
      </Box>
    </UnstyledButton>
  );
}
