import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useId } from "@knitui/hooks";

import { Box } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { renderTextChild } from "../internal/render-text-child";
import { radiusVariant, shadowVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Loader, type LoaderProps } from "../Loader";
import { Text } from "../Text";

/**
 * Self-contained notification tile — mirrors Mantine's `Notification`. A row of:
 * a `$color9` left accent line (shown only when there is NO icon), an optional
 * themed circular icon/loader badge, a body (`title` + message), and an optional
 * close button. Accent comes from the `theme` prop + palette ramp, never a
 * Mantine `color` prop. `role="alert"` plus wired `aria-labelledby` /
 * `aria-describedby`.
 */
const NotificationFrame = styled(Box, {
  name: "Notification",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "$background",
  paddingVertical: "$sm",
  paddingHorizontal: "$md",
  gap: "$sm",
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "transparent",
  ...shadowVariant.md,

  variants: {
    radius: radiusVariant,
    /** Border on the root element. */
    withBorder: {
      true: { borderColor: "$color7" },
    },
    /** The colored accent line, shown when there is no icon badge. */
    hasIcon: {
      false: { borderLeftWidth: 4, borderLeftColor: "$color9" },
    },
  } as const,

  defaultVariants: { radius: "md" },
});

/** Circular themed badge wrapping the icon or a small loader. */
const NotificationIcon = styled(Box, {
  name: "NotificationIcon",
  width: "$xl",
  height: "$xl",
  borderRadius: 9999,
  backgroundColor: "$color9",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const NotificationBody = styled(Box, {
  name: "NotificationBody",
  flexDirection: "column",
  flex: 1,
  gap: "$xs",
});

const NotificationTitle = styled(Text, {
  name: "NotificationTitle",
  fontWeight: "700",
  fontSize: "$sm",
  color: "$color12",
});

const NotificationMessage = styled(Text, {
  name: "NotificationMessage",
  fontSize: "$sm",
  color: "$color11",
});

const NotificationContent = styled(Box, {
  name: "NotificationContent",
});

const NotificationIconText = styled(Text, {
  name: "NotificationIconText",
  color: "$color1",
  fontSize: "$sm",
  fontWeight: "700",
  userSelect: "none",
});

type NotificationFrameProps = Omit<GetProps<typeof NotificationFrame>, "children">;

/**
 * Named slots for {@link NotificationStyles}. Each maps to a styled part the
 * component renders; the `styles` map spreads each entry onto that part.
 */
export interface NotificationStyles {
  /** Props spread onto the circular icon badge (`.Icon`). */
  icon?: GetProps<typeof NotificationIcon>;
  /** Props spread onto the body column that holds title + message (`.Body`). */
  body?: GetProps<typeof NotificationBody>;
  /** Props spread onto the title (`.Title`). */
  title?: GetProps<typeof NotificationTitle>;
  /** Props spread onto the message text (text-only children) (`.Message`). */
  message?: GetProps<typeof NotificationMessage>;
  /** Props spread onto the content column (rich, non-text children) (`.Content`). */
  content?: GetProps<typeof NotificationContent>;
  /**
   * Props spread onto the `Loader` shown while `loading` (under `loaderProps`).
   * Targets a sub-component (`Loader`), so it has no matching `Notification.X`
   * static — this slot deliberately reaches into the rendered loader.
   */
  loader?: Pick<LoaderProps, "size" | "type">;
  /**
   * Props spread onto the close button (under `closeButtonProps`). Targets a
   * sub-component (`CloseButton`), so it has no matching `Notification.X` static —
   * this slot deliberately reaches into the rendered close button.
   */
  closeButton?: CloseButtonProps;
}

const NOTIFICATION_SLOTS = [
  "icon",
  "body",
  "title",
  "message",
  "content",
  "loader",
  "closeButton",
] as const satisfies readonly (keyof NotificationStyles)[];

export interface NotificationProps extends NotificationFrameProps {
  /** Uniform per-slot style passthrough. See {@link NotificationStyles}. */
  styles?: SlotStyles<NotificationStyles>;
  /** Bold title rendered above the message body. */
  title?: React.ReactNode;
  /** Description / message body. */
  children?: React.ReactNode;
  /** Icon shown in a themed circular badge; replaces the accent line. */
  icon?: React.ReactNode;
  /** Show a `Loader` in place of the icon (takes precedence over `icon`). @default false */
  loading?: boolean;
  /** Show the close button. @default true */
  withCloseButton?: boolean;
  /** Called when the close button is pressed. */
  onClose?: () => void;
  /** Typed, cross-platform-safe subset of close-button props. */
  closeButtonProps?: { "aria-label"?: string };
  /** Cross-platform-safe `Loader` passthrough props. */
  loaderProps?: Pick<LoaderProps, "size" | "type">;
}

/**
 * Pure-text body renders as a single themed `NotificationMessage`. Any element
 * present routes to the `NotificationContent` Box so rich content isn't trapped
 * inside a `<Text>` (text runs within it stay themed via `renderTextChild`).
 */
function isTextOnly(children: React.ReactNode): boolean {
  const array = React.Children.toArray(children);
  return array.length > 0 && array.every((c) => typeof c === "string" || typeof c === "number");
}

function hasRenderableChild(children: React.ReactNode): boolean {
  return React.Children.toArray(children).length > 0;
}

const NotificationComponent = NotificationFrame.styleable<NotificationProps>(
  function Notification(props, ref) {
    const {
      title,
      children,
      icon,
      loading = false,
      withCloseButton = true,
      onClose,
      closeButtonProps,
      loaderProps,
      styles,
      id,
      ...rest
    } = props;

    const slots = slotStyles(styles, NOTIFICATION_SLOTS, "Notification");
    const rootId = useId(typeof id === "string" ? id : undefined);
    const titleId = title ? `${rootId}-title` : undefined;
    const hasBody = hasRenderableChild(children);
    const bodyId = hasBody ? `${rootId}-body` : undefined;

    const showBadge = loading || icon != null;
    const bodyContent = hasBody ? (
      isTextOnly(children) ? (
        <NotificationMessage id={bodyId} {...slots.get("message")}>
          {children}
        </NotificationMessage>
      ) : (
        <NotificationContent id={bodyId} {...slots.get("content")}>
          {renderTextChild(children, NotificationMessage)}
        </NotificationContent>
      )
    ) : null;

    return (
      <NotificationFrame
        ref={ref}
        hasIcon={showBadge}
        id={rootId}
        role="alert"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        {...rest}
      >
        {showBadge ? (
          <NotificationIcon {...slots.get("icon")}>
            {loading ? (
              <Loader size="xs" {...slots.merge("loader", loaderProps)} />
            ) : typeof icon === "string" || typeof icon === "number" ? (
              <NotificationIconText>{icon}</NotificationIconText>
            ) : (
              // The icon sits ON the `$color9` badge fill, so it takes the
              // CONTRAST color (`$color1`, matching `NotificationIconText`) and a
              // size suited to the circular badge — no per-call sizing needed.
              <ControlIconProvider color="$color1" size="sm">
                {icon}
              </ControlIconProvider>
            )}
          </NotificationIcon>
        ) : null}

        <NotificationBody {...slots.get("body")}>
          {title ? (
            <NotificationTitle id={titleId} {...slots.get("title")}>
              {title}
            </NotificationTitle>
          ) : null}
          {bodyContent}
        </NotificationBody>

        {withCloseButton ? (
          <CloseButton
            size="sm"
            onPress={onClose}
            alignSelf="flex-start"
            aria-label="Close notification"
            {...slots.merge("closeButton", closeButtonProps)}
          />
        ) : null}
      </NotificationFrame>
    );
  },
);

export const Notification = withStaticProperties(NotificationComponent, {
  Body: NotificationBody,
  Frame: NotificationFrame,
  Icon: NotificationIcon,
  IconText: NotificationIconText,
  Content: NotificationContent,
  Title: NotificationTitle,
  Message: NotificationMessage,
});

export type NotificationBodyProps = GetProps<typeof NotificationBody>;
export type NotificationContentProps = GetProps<typeof NotificationContent>;
export type NotificationIconProps = GetProps<typeof NotificationIcon>;
export type NotificationIconTextProps = GetProps<typeof NotificationIconText>;
export type NotificationTitleProps = GetProps<typeof NotificationTitle>;
export type NotificationMessageProps = GetProps<typeof NotificationMessage>;
