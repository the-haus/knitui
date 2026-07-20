import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useId } from "@knitui/hooks";

import { Box } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { type GradientValue, useGradient } from "../internal/gradient";
import { renderTextChild } from "../internal/render-text-child";
import {
  controlTextColorVariant,
  fontSizeVariant,
  mutedTextColorVariant,
  pickVariants,
  radiusVariant,
  shadowVariant,
  type SizeKey,
  surfaceColorVariant,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type AlertSize = SizeKey;
type AlertVariant =
  "filled" | "light" | "outline" | "default" | "transparent" | "white" | "gradient";

const AlertContext = createStyledContext<{ size: AlertSize; variant: AlertVariant }>({
  size: "md",
  variant: "light",
});

/**
 * Feedback panel — mirrors Mantine's `Alert`. Box + Text, accent from the
 * `theme` prop + palette ramp (never a `color` prop). `variant` picks the fill,
 * `size` sets token-driven spacing/type metrics, `radius` the rounding. Optional
 * `title`, `icon`, and a `withCloseButton` / `onClose` close affordance.
 * `role="alert"` plus wired `aria-labelledby` / `aria-describedby` for screen readers.
 */
const AlertFrame = styled(Box, {
  name: "Alert",
  context: AlertContext,
  flexDirection: "column",
  borderWidth: 1,
  borderColor: "transparent",

  variants: {
    // Static fill from the shared `variant-colors` ladder (a panel isn't interactive).
    variant: {
      ...pickVariants(surfaceColorVariant, [
        "filled",
        "light",
        "outline",
        "default",
        "transparent",
        "white",
        "gradient",
      ]),
    },
    size: {
      xxs: { paddingVertical: "$xxs", paddingHorizontal: "$xs", borderRadius: "$xs" },
      xs: { paddingVertical: "$xs", paddingHorizontal: "$sm", borderRadius: "$xs" },
      sm: { paddingVertical: "$xs", paddingHorizontal: "$md", borderRadius: "$sm" },
      md: { paddingVertical: "$sm", paddingHorizontal: "$md", borderRadius: "$sm" },
      lg: { paddingVertical: "$md", paddingHorizontal: "$lg", borderRadius: "$md" },
      xl: { paddingVertical: "$lg", paddingHorizontal: "$xl", borderRadius: "$md" },
      xxl: { paddingVertical: "$xl", paddingHorizontal: "$xxl", borderRadius: "$lg" },
    },
    radius: radiusVariant,
    // Optional elevation from the shared `shadowVariant` ladder (opt-in; no
    // shadow by default — not in `defaultVariants`).
    shadow: shadowVariant,
  } as const,

  defaultVariants: { size: "md", variant: "light" },
});

const AlertWrapper = styled(Box, {
  name: "AlertWrapper",
  context: AlertContext,
  flexDirection: "row",
  alignItems: "flex-start",
  variants: {
    size: {
      xxs: { gap: "$xxs" },
      xs: { gap: "$xxs" },
      sm: { gap: "$xs" },
      md: { gap: "$sm" },
      lg: { gap: "$md" },
      xl: { gap: "$lg" },
      xxl: { gap: "$xl" },
    },
  } as const,
});

const AlertIcon = styled(Box, {
  name: "AlertIcon",
  alignItems: "center",
  justifyContent: "center",
});

const AlertBody = styled(Box, {
  name: "AlertBody",
  context: AlertContext,
  flexDirection: "column",
  flex: 1,
  variants: {
    size: {
      xxs: { gap: "$xxs" },
      xs: { gap: "$xxs" },
      sm: { gap: "$xs" },
      md: { gap: "$xs" },
      lg: { gap: "$sm" },
      xl: { gap: "$sm" },
      xxl: { gap: "$md" },
    },
  } as const,
});

const AlertContent = styled(Box, {
  name: "AlertContent",
  context: AlertContext,
  flexDirection: "column",
  variants: {
    size: {
      xxs: { gap: "$xxs" },
      xs: { gap: "$xxs" },
      sm: { gap: "$xs" },
      md: { gap: "$xs" },
      lg: { gap: "$sm" },
      xl: { gap: "$sm" },
      xxl: { gap: "$md" },
    },
  } as const,
});

const AlertTitle = styled(Text, {
  name: "AlertTitle",
  context: AlertContext,
  fontWeight: "700",
  variants: {
    // Title uses the EMPHASIS foreground ladder (shared).
    variant: {
      ...pickVariants(controlTextColorVariant, [
        "filled",
        "light",
        "outline",
        "default",
        "transparent",
        "white",
        "gradient",
      ]),
    },
    size: {
      ...fontSizeVariant,
    },
  } as const,
});

const AlertMessage = styled(Text, {
  name: "AlertMessage",
  context: AlertContext,
  variants: {
    // Message uses the MUTED foreground ladder (softer body copy; shared).
    variant: {
      ...pickVariants(mutedTextColorVariant, [
        "filled",
        "light",
        "outline",
        "default",
        "transparent",
        "white",
        "gradient",
      ]),
    },
    size: {
      ...fontSizeVariant,
    },
  } as const,
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ title: { color: "$red9" } }}` is
 * sugar for `<Alert.Title color="$red9" />`.
 */
export interface AlertStyles {
  /** Props for the icon column wrapper (`.Icon`). */
  icon?: GetProps<typeof AlertIcon>;
  /** Props for the body column that holds title + message (`.Body`). */
  body?: GetProps<typeof AlertBody>;
  /** Props for the title text (`.Title`). */
  title?: GetProps<typeof AlertTitle>;
  /** Props for the message text (text-only children) (`.Message`). */
  message?: GetProps<typeof AlertMessage>;
  /** Props for the content column (rich, non-text children) (`.Content`). */
  content?: GetProps<typeof AlertContent>;
  /** Props spread onto the close button (under `closeButtonLabel`). */
  closeButton?: CloseButtonProps;
}

const ALERT_SLOT_KEYS = [
  "icon",
  "body",
  "title",
  "message",
  "content",
  "closeButton",
] as const satisfies readonly (keyof AlertStyles)[];

export interface AlertProps extends GetProps<typeof AlertFrame> {
  /** Alert title, rendered bold above the body. */
  title?: React.ReactNode;
  /** Icon displayed in a column next to the body. */
  icon?: React.ReactNode;
  /** Show a close button pinned to the top-right. @default false */
  withCloseButton?: boolean;
  /** Called when the close button is pressed. */
  onClose?: () => void;
  /** `aria-label` for the close button. @default "Close" */
  closeButtonLabel?: string;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<AlertStyles>;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `$colorN` ramp tokens or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

/**
 * Pure-text body (`string`/`number`, including inline runs) renders as a single
 * themed `AlertMessage`. The moment an element is present — mixed or not — we use
 * the `AlertContent` Box instead so rich content isn't trapped inside a `<Text>`.
 */
function isTextOnly(children: React.ReactNode): boolean {
  const array = React.Children.toArray(children);
  return array.length > 0 && array.every((c) => typeof c === "string" || typeof c === "number");
}

function hasRenderableChild(children: React.ReactNode): boolean {
  return React.Children.toArray(children).length > 0;
}

function getCloseButtonSize(size: AlertSize): AlertSize {
  switch (size) {
    case "xxs":
    case "xs":
    case "sm":
      return size;
    case "md":
      return "sm";
    case "lg":
      return "md";
    case "xl":
      return "lg";
    case "xxl":
      return "xl";
  }
}

const AlertComponent = AlertFrame.styleable<AlertProps>(function Alert(props, ref) {
  const {
    children,
    title,
    icon,
    withCloseButton,
    onClose,
    closeButtonLabel = "Close",
    size = "md",
    variant = "light",
    styles,
    gradient,
    id,
    ...rest
  } = props;

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<AlertStyles>(styles, ALERT_SLOT_KEYS, "Alert");

  // Gradient fill (only when `variant="gradient"`): web paints a CSS
  // `backgroundImage`; native renders the `layer` behind the icon/body content.
  const grad = useGradient(variant === "gradient" ? gradient : undefined);

  const rootId = useId(typeof id === "string" ? id : undefined);
  const titleId = title ? `${rootId}-title` : undefined;
  const hasBody = hasRenderableChild(children);
  const bodyId = hasBody ? `${rootId}-body` : undefined;
  const bodyContent = hasBody ? (
    isTextOnly(children) ? (
      <AlertMessage id={bodyId} {...s.get("message")}>
        {children}
      </AlertMessage>
    ) : (
      <AlertContent id={bodyId} {...s.get("content")}>
        {renderTextChild(children, AlertMessage)}
      </AlertContent>
    )
  ) : null;

  // Pick a close-button variant whose glyph contrasts the panel fill: on a
  // `filled` ($color9) panel the close button matches it ($color1 glyph); on a
  // `white` panel it stays dark; elsewhere a subtle accent-tinted glyph reads.
  const closeVariant = variant === "filled" ? "filled" : variant === "white" ? "white" : "subtle";
  const closeButtonSize = getCloseButtonSize(size);

  return (
    <AlertFrame
      ref={ref}
      size={size}
      variant={variant}
      id={rootId}
      role="alert"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      {...grad.frameProps}
      {...rest}
    >
      {grad.layer}
      <AlertWrapper>
        {icon ? (
          // Icons inside take the Alert's ACCENT — the same emphasis foreground
          // ladder as `AlertTitle` — so a dropped-in `@knitui/icons` glyph matches
          // the title color and the `size` metrics without per-call sizing.
          <AlertIcon {...s.get("icon")}>
            <ControlIconProvider size={size} variant={variant}>
              {icon}
            </ControlIconProvider>
          </AlertIcon>
        ) : null}
        <AlertBody {...s.get("body")}>
          {title ? (
            <AlertTitle id={titleId} {...s.get("title")}>
              {title}
            </AlertTitle>
          ) : null}
          {bodyContent}
        </AlertBody>
        {withCloseButton ? (
          <CloseButton
            variant={closeVariant}
            size={closeButtonSize}
            onPress={onClose}
            // `closeButtonLabel` is the explicit per-part prop and wins over the
            // `closeButton` slot sugar (the "explicit beats sugar" rule).
            {...s.merge("closeButton", { "aria-label": closeButtonLabel })}
          />
        ) : null}
      </AlertWrapper>
    </AlertFrame>
  );
});

export const Alert = withStaticProperties(AlertComponent, {
  Frame: AlertFrame,
  Icon: AlertIcon,
  Body: AlertBody,
  Content: AlertContent,
  Title: AlertTitle,
  Message: AlertMessage,
});

export type { AlertSize, AlertVariant };
