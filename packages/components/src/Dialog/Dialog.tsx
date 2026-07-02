import * as React from "react";

import { AnimatePresence, type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Affix, type AffixPosition } from "../Affix";
import { Box } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import {
  DISTANCES,
  type MotionPreset,
  type MotionPresetName,
  useMotionPreset,
} from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import {
  panelWidthVariant,
  radiusVariant,
  shadowVariant,
  type SizeKey,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type DialogSize = SizeKey;

/**
 * Default enter/exit motion — a subtle 8px rise-in fade, matching Mantine.
 * Override per instance via the `animation` prop. Exit animates because the
 * component wraps its content in `AnimatePresence` (unless `keepMounted`).
 */
const DEFAULT_DIALOG_MOTION: MotionPreset = {
  transition: "medium",
  enterStyle: { opacity: 0, y: DISTANCES.nudge },
  exitStyle: { opacity: 0, y: DISTANCES.nudge },
  animateOnly: ["transform", "opacity"],
};

const DialogFrame = styled(Box, {
  name: "Dialog",
  position: "relative",
  backgroundColor: "$background",
  padding: "$md",

  variants: {
    radius: radiusVariant,
    shadow: shadowVariant,
    withBorder: {
      true: { borderWidth: 1, borderColor: "$borderColor" },
    },
    size: panelWidthVariant,
  } as const,

  defaultVariants: { radius: "md", shadow: "md", size: "md" },
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ content: { padding: "$lg" } }}` is
 * sugar for `<Dialog.Content padding="$lg" />`. Vocabulary matches the shared
 * modal chrome (`content`/`closeButton`); Dialog has no overlay/header/title.
 *
 * `closeButton` is low-precedence sugar: it layers UNDER the explicit
 * `closeButtonProps`, so the explicit per-part props win (the "explicit beats
 * sugar" rule, see `internal/styles.ts`).
 */
export interface DialogStyles {
  /** Props spread onto the content frame (`Dialog.Content`). */
  content?: GetProps<typeof DialogFrame>;
  /** Props spread onto the close button (`Dialog.CloseButton`), under `closeButtonProps`. */
  closeButton?: CloseButtonProps;
}

const DIALOG_SLOT_KEYS = [
  "content",
  "closeButton",
] as const satisfies readonly (keyof DialogStyles)[];

// `position` is Omit-ed from the inherited Box style props: it clashes with the
// CSS `position` keyword type, and here it carries Mantine's `AffixPosition`.
export interface DialogProps extends Omit<GetProps<typeof DialogFrame>, "position" | "size"> {
  /** Opened state. */
  opened: boolean;
  /** Called when the close button is pressed. */
  onClose?: () => void;
  /** Dialog content. */
  children?: React.ReactNode;
  /** Show the close button (top-inline-end). @default true */
  withCloseButton?: boolean;
  /**
   * @deprecated Use `styles={{ closeButton: … }}`. Kept as a backward-compatible
   * alias merged OVER the `closeButton` slot (explicit beats sugar).
   */
  closeButtonProps?: CloseButtonProps;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<DialogStyles>;
  /** Viewport corner to pin to. @default { bottom: "$xl", right: "$xl" } */
  position?: AffixPosition;
  /** Content width — key (xxs–xxl), px number, or CSS string. @default "md" */
  size?: DialogSize | number | string;
  /** Show the outline border. @default true */
  withBorder?: boolean;
  /** Keep mounted while closed (toggles `display:"none"` instead of unmounting). @default false */
  keepMounted?: boolean;
  /** Render inside a `Portal`. @default true */
  withinPortal?: boolean;
  /** Root `z-index`. @default 300 */
  zIndex?: number;
  /**
   * Enter/exit animation — a motion preset name, an inline {@link MotionPreset},
   * or `false` to disable. @default a subtle rise-in fade. Reduced motion is always
   * honoured (collapses to instant). Exit animates unless `keepMounted`.
   */
  animation?: MotionPresetName | MotionPreset | false;
  /**
   * Animation speed in ms — overrides the preset's duration while keeping its
   * easing. Ignored when `animation` is `false` or reduced motion is on.
   */
  duration?: number;
}

/**
 * Floating corner dialog — mirrors Mantine's `Dialog`. A small `Paper`-like box
 * pinned to a viewport corner via `Affix` (no overlay scrim). Accent comes from
 * the `theme` prop + palette ramp, never a Mantine `color` prop.
 */
const DialogComponent = DialogFrame.styleable<DialogProps>(function Dialog(props, ref) {
  const {
    opened,
    onClose,
    children,
    withCloseButton = true,
    closeButtonProps,
    styles,
    position = { bottom: "$xl", right: "$xl" },
    size = "md",
    withBorder = true,
    keepMounted = false,
    withinPortal = true,
    zIndex = 300,
    radius,
    shadow,
    animation = DEFAULT_DIALOG_MOTION,
    duration,
    ...rest
  } = props;

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<DialogStyles>(styles, DIALOG_SLOT_KEYS, "Dialog");
  // Resolve the enter/exit motion once; reduced motion collapses it to inert.
  const motion = useMotionPreset(animation, { duration });

  const inner = (
    <>
      {withCloseButton ? (
        <CloseButton
          size="sm"
          position="absolute"
          top="$xs"
          right="$xs"
          aria-label="Close dialog"
          onPress={onClose}
          // `closeButtonProps` is the explicit per-part prop and wins over the
          // `closeButton` slot sugar (the "explicit beats sugar" rule).
          {...s.merge("closeButton", closeButtonProps)}
        />
      ) : null}
      {renderTextChild(children, Text)}
    </>
  );

  // `keepMounted` stays in the tree and toggles `display` — entrance animates but
  // there is no exit (the node never leaves). Mirrors the prior behaviour.
  if (keepMounted) {
    return (
      <Affix position={position} zIndex={zIndex} withinPortal={withinPortal}>
        <DialogFrame
          ref={ref}
          role="dialog"
          display={opened ? "flex" : "none"}
          size={size}
          withBorder={withBorder}
          radius={radius}
          shadow={shadow}
          {...motion}
          {...s.get("content")}
          {...rest}
        >
          {inner}
        </DialogFrame>
      </Affix>
    );
  }

  // Default: AnimatePresence holds the content in the tree through its EXIT
  // animation, then unmounts it — so the dialog animates both in and out. The
  // keyed child becoming `null` on close is what triggers the exit. AnimatePresence
  // sits OUTSIDE the Portal (in `Affix`) so the React parent/child relationship the
  // presence protocol relies on survives the teleport re-parent.
  return (
    <AnimatePresence>
      {opened ? (
        <Affix key="dialog" position={position} zIndex={zIndex} withinPortal={withinPortal}>
          <DialogFrame
            ref={ref}
            role="dialog"
            size={size}
            withBorder={withBorder}
            radius={radius}
            shadow={shadow}
            {...motion}
            {...s.get("content")}
            {...rest}
          >
            {inner}
          </DialogFrame>
        </Affix>
      ) : null}
    </AnimatePresence>
  );
});

export const Dialog = withStaticProperties(DialogComponent, {
  Content: DialogFrame,
  CloseButton,
});
