/**
 * Inline style typing for the carousel's host nodes.
 *
 * The kit's `ViewStyle` is reanimated's `StyleProps` (it admits native-only
 * `OpaqueColorValue`s), while a v3 Tamagui `Box` types `style` as CSS ∪ RN
 * style. The two are not mutually assignable, so a style object handed to BOTH a
 * reanimated `Animated.View` and a `Box` (the shared slide / card geometry) is
 * typed as their intersection: {@link LayoutStyle}. Web-only objects that carry
 * CSS-only keys (`scrollSnapType`, `overflowX`…) are {@link HostStyle}.
 */
import type { StyleProp, ViewStyle } from "@knitui/core";

/** One style object as a Tamagui host's `style` prop accepts it (no array / falsy). */
export type HostStyle = Exclude<
  NonNullable<StyleProp>,
  ReadonlyArray<unknown> | boolean | string | number
>;

/** A style object both a Tamagui host and a reanimated view accept. */
export type LayoutStyle = HostStyle & ViewStyle;

/**
 * A layout worklet's output (`AnimationStyle` / `DeckEffect`, typed as the kit's
 * `ViewStyle`) used as a host's pre-paint style on web. Layout styles carry only
 * transforms, opacity and zIndex, never a native `OpaqueColorValue`, so the
 * narrowing is sound; it lives here so the one cast is named and documented.
 */
export const toHostStyle = (style: ViewStyle | null | undefined): HostStyle | undefined =>
  (style ?? undefined) as HostStyle | undefined;
