import * as React from "react";

import { type GetProps } from "@knitui/core";

import { slotStyles, type SlotStyles } from "../internal/styles";
import { Loader, type LoaderProps } from "../Loader";
import { Overlay, type OverlayProps } from "../Overlay";

type LoadingOverlayFrameProps = Omit<
  GetProps<typeof Overlay>,
  "center" | "children" | "backgroundColor" | "color"
>;

/** Cross-platform-safe subset of `Loader` props the `loader` slot may carry. */
export type LoadingOverlayLoaderStyle = Pick<LoaderProps, "aria-label" | "size" | "type">;
/** Cross-platform-safe subset of `Overlay` props the `overlay` slot may carry. */
export type LoadingOverlayOverlayStyle = Pick<
  OverlayProps,
  "backgroundOpacity" | "backgroundColor" | "blur" | "radius"
>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). `overlay` styles the scrim,
 * `loader` the centered spinner. Both are low-precedence sugar: the deprecated
 * `overlayProps`/`loaderProps` aliases merge OVER their slot ("explicit beats
 * sugar").
 */
export interface LoadingOverlayStyles {
  /** Props spread onto the `Overlay` scrim (under the deprecated `overlayProps`). */
  overlay?: LoadingOverlayOverlayStyle;
  /** Props spread onto the centered `Loader` (under the deprecated `loaderProps`). */
  loader?: LoadingOverlayLoaderStyle;
}

const LOADING_OVERLAY_SLOT_KEYS = [
  "overlay",
  "loader",
] as const satisfies readonly (keyof LoadingOverlayStyles)[];

export interface LoadingOverlayProps extends LoadingOverlayFrameProps {
  /** Render the scrim + loader when true; renders nothing when false. @default false */
  visible?: boolean;
  /**
   * @deprecated Use `styles={{ loader: … }}`. Kept as a backward-compatible alias
   * merged OVER the `loader` slot (explicit beats sugar).
   */
  loaderProps?: LoadingOverlayLoaderStyle;
  /**
   * @deprecated Use `styles={{ overlay: … }}`. Kept as a backward-compatible alias
   * merged OVER the `overlay` slot (explicit beats sugar).
   */
  overlayProps?: LoadingOverlayOverlayStyle;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<LoadingOverlayStyles>;
}

/**
 * Covers its parent with a centered `Loader` over a scrim — mirrors Mantine's
 * `LoadingOverlay`. Composes `Overlay` (a light `#fff` wash by default, matching
 * Mantine) + a centered `Loader`. Renders `null` when `visible` is false. Accent
 * for the loader comes from the `theme` prop + palette ramp. NOTE: Mantine's
 * web-only enter/exit `transitionProps` wrapper is intentionally omitted
 * (cross-platform); visibility is a plain mount/unmount.
 */
export const LoadingOverlay = Overlay.styleable<LoadingOverlayProps>(
  function LoadingOverlay(props, ref) {
    const { visible = false, loaderProps, overlayProps, styles, zIndex = 400, ...rest } = props;

    // Per-slot style sugar; the deprecated `overlayProps`/`loaderProps` aliases win
    // over their slot ("explicit beats sugar").
    const s = slotStyles<LoadingOverlayStyles>(styles, LOADING_OVERLAY_SLOT_KEYS, "LoadingOverlay");
    const overlaySlot = s.merge("overlay", overlayProps);
    const loaderSlot = s.merge("loader", loaderProps);

    if (!visible) return null;

    return (
      <Overlay
        ref={ref}
        center
        backgroundColor="#fff"
        backgroundOpacity={0.75}
        zIndex={zIndex}
        {...overlaySlot}
        {...rest}
      >
        <Loader {...loaderSlot} />
      </Overlay>
    );
  },
);
