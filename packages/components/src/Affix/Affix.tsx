import * as React from "react";

import { type GetProps, isWeb, styled } from "@knitui/core";

import { Box } from "../Box";
import { shadowVariant } from "../internal/style-props";
import { Portal } from "../Portal";

/** Default screen `z-index` for the Affix layer (mirrors Mantine's `modal`). */
const DEFAULT_Z_INDEX = 200;

/**
 * Fixed-position layer. `position: "fixed"` pins the element to the viewport on
 * web; offsets come from the `position` prop. Inline-start/end map to
 * left/right so the layer flips correctly under RTL. React Native has no
 * `fixed`, so the frame falls back to `absolute` there (set at render via
 * `isWeb`) — pinning to the nearest filling ancestor / the screen.
 */
const AffixFrame = styled(Box, {
  name: "Affix",

  variants: {
    shadow: shadowVariant,
  } as const,
});

type AffixFrameStyle = GetProps<typeof AffixFrame>;

type AffixFrameProps = Omit<
  GetProps<typeof AffixFrame>,
  "position" | "top" | "left" | "bottom" | "right"
>;

export interface AffixPosition {
  /** Distance from the top edge. */
  top?: AffixFrameStyle["top"];
  /** Distance from the inline-start (left) edge. */
  left?: AffixFrameStyle["left"];
  /** Distance from the bottom edge. */
  bottom?: AffixFrameStyle["bottom"];
  /** Distance from the inline-end (right) edge. */
  right?: AffixFrameStyle["right"];
}

export interface AffixProps extends AffixFrameProps {
  /** Root element `z-index`. @default 200 */
  zIndex?: number;
  /**
   * Render the fixed layer inside a `Portal` so it escapes any `overflow:hidden`
   * / transformed ancestor and paints above the rest of the app. Set `false` to
   * render in place (still `position:"fixed"`). @default true
   */
  withinPortal?: boolean;
  /** Affix position on screen. @default { bottom: 0, right: 0 } */
  position?: AffixPosition;
}

/**
 * `Affix` — renders its content fixed to a corner/edge of the viewport (e.g. a
 * scroll-to-top button). Mirrors Mantine's `Affix`: `position`, `zIndex`, and
 * `withinPortal` (renders the layer through `Portal` so it escapes
 * `overflow:hidden`/transformed ancestors; see prop docs).
 */
export const Affix = AffixFrame.styleable<AffixProps>(function Affix(props, ref) {
  const {
    zIndex = DEFAULT_Z_INDEX,
    withinPortal = true,
    position = { bottom: 0, right: 0 },
    ...rest
  } = props;

  const frame = (
    <AffixFrame
      ref={ref}
      {...rest}
      position={isWeb ? "fixed" : "absolute"}
      // The portal layer is `pointer-events: none` (so its full-viewport box does
      // not swallow clicks meant for the page behind the affix); re-enable events
      // on the frame itself so the affixed content stays interactive.
      pointerEvents="auto"
      zIndex={zIndex}
      top={position.top}
      left={position.left}
      bottom={position.bottom}
      right={position.right}
    />
  );

  return withinPortal ? <Portal hostName="root">{frame}</Portal> : frame;
});
