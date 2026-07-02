import type { StyleProps } from "react-native-reanimated";

import type { ViewProps } from "./essentials";

/**
 * Cross-platform style / layout / accessibility types, sourced WITHOUT importing
 * `react-native` directly.
 *
 * The kit's principle is that packages depend on `@knitui/core`, never on
 * `react-native`. These are the RN-shaped types the kit's components and
 * animations need, sourced from dependencies that already abstract the platform:
 *
 * - Animated/inline style shapes come from `react-native-reanimated`'s
 *   `StyleProps` (which `extends ViewStyle, TextStyle`) — these styles are
 *   literally reanimated styles.
 * - The style-prop / a11y-prop types come from Tamagui's `ViewProps`.
 * - `LayoutChangeEvent` is defined structurally so it matches both RN's and
 *   Tamagui's layout event without importing either.
 *
 * Type-only; nothing here exists at runtime.
 */

/** An inline/animated view style (reanimated's ViewStyle+TextStyle superset). */
export type ViewStyle = StyleProps;

/** A style prop as the kit's view primitives accept it (object | array | falsy). */
export type StyleProp<_T = ViewStyle> = ViewProps["style"];

/**
 * `onLayout` event payload — the layout fields consumers read. Defined
 * structurally (rather than pulled from RN) so it matches both React Native's
 * `LayoutChangeEvent` and Tamagui's `LayoutEvent` at the call sites.
 */
export interface LayoutChangeEvent {
  nativeEvent: { layout: { x: number; y: number; width: number; height: number } };
}

/** Accessibility role, as the kit's primitives type it. */
export type AccessibilityRole = NonNullable<ViewProps["accessibilityRole"]>;

/** Accessibility state, as the kit's primitives type it. */
export type AccessibilityState = NonNullable<ViewProps["accessibilityState"]>;
