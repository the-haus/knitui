import type * as React from "react";

import type { BoxProps } from "../Box";

/** Axis a collapse animates along. */
export type CollapseAxis = "height" | "width";

/**
 * Props for the {@link CollapseBox} primitive — the clip element shared by
 * `Collapse` and `Spoiler`. The consumer measures its own content (via
 * `useElementSize`, so it can read the natural size for its own logic) and feeds
 * `CollapseBox` a concrete pixel `size` target along {@link CollapseBoxProps.axis}.
 *
 * The two platforms animate that target differently:
 *
 * - **Web** (`collapse-box.tsx`) stays on Tamagui's animation driver — it spreads
 *   the kit's `transition` + `animateOnly` onto the `Frame`, exactly as the
 *   components did inline before. No custom CSS; web behaviour is unchanged.
 * - **Native** (`collapse-box.native.tsx`) drives reanimated `useAnimatedStyle` +
 *   `withTiming` off the UI thread, because Tamagui's reanimated driver animates
 *   the layout `height`/`width` prop with visible jank. The animated `Animated.View`
 *   is nested inside the styled `Frame`, which keeps the static styling + clip.
 *
 * `BoxProps`' own `height`/`width`/`opacity` are omitted — the clip owns those;
 * pass the targets via `size` / `opacity` instead.
 */
export interface CollapseBoxProps extends Omit<BoxProps, "height" | "width" | "opacity"> {
  /** Target size in px along {@link CollapseBoxProps.axis}. `undefined` renders at
   *  the natural size (CSS `auto` / no constraint) — the first paint of content
   *  that mounts already expanded, where there is no previous frame to animate. */
  size?: number;
  /** Measured natural size of the content along the CROSS axis (px). Native-only:
   *  the clip pins its content out of flow to measure the main axis, so the cross
   *  extent has to be supplied here for the clip to render at the content's width
   *  (vertical) / height (horizontal). Ignored on web, where the in-flow clip sizes
   *  to its content. `undefined` until the first measurement lands. */
  crossSize?: number;
  /** Axis to clip + animate. @default "height" */
  axis?: CollapseAxis;
  /** When `false`, snap to {@link CollapseBoxProps.size} with no transition
   *  (reduced motion or a `0` duration). @default true */
  animate?: boolean;
  /** Transition duration in ms. @default 200 */
  durationMs?: number;
  /** Transition timing function (CSS keyword / `cubic-bezier(...)`). @default "ease" */
  timingFunction?: string;
  /** Target opacity, faded with the size when {@link CollapseBoxProps.animateOpacity}.
   *  Typed as Tamagui's opacity so a spread of the `Frame`'s own props stays
   *  compatible; consumers pass `0`/`1`. @default 1 */
  opacity?: BoxProps["opacity"];
  /** Fade opacity together with the size animation. @default false */
  animateOpacity?: boolean;
  /** Element to render as the clip — the consumer's styled part (`Collapse.Frame`,
   *  `Spoiler.Region`) so its baked-in styling + debug name are preserved.
   *  @default Box */
  Frame?: React.ElementType;
  children?: React.ReactNode;
}
