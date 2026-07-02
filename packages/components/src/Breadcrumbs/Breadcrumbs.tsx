import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { Text } from "../Text";

/**
 * Row of navigational crumbs separated by a `separator` — mirrors Mantine's
 * `Breadcrumbs`. Children are rendered in order with the separator interleaved
 * only BETWEEN them (never trailing). String/number crumbs auto-wrap in themed
 * text; element crumbs (e.g. an `Anchor`) render as-is. The separator is dimmed
 * via the theme ramp. Renders a semantic `<nav aria-label="Breadcrumb">`.
 */
const BreadcrumbsFrame = styled(Box, {
  name: "Breadcrumbs",
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
});

/** A string/number crumb wrapped as text. */
const BreadcrumbLabel = styled(Text, {
  name: "Breadcrumb",
});

/** The interleaved separator — dimmed and non-selectable. */
const BreadcrumbSeparator = styled(Text, {
  name: "BreadcrumbsSeparator",
  color: "$color",
  opacity: 0.6,
  userSelect: "none",
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ label: { color: "$red9" } }}` is
 * sugar for `<Breadcrumbs.Label color="$red9" />`. The `separator` slot is the
 * canonical home for separator styling; the legacy `separatorMargin` prop merges
 * OVER it (the "explicit beats sugar" rule).
 */
export interface BreadcrumbsStyles {
  /** Props for the navigation landmark frame (`.Frame`). */
  root?: GetProps<typeof BreadcrumbsFrame>;
  /** Props for each string/number crumb wrapper (`.Label`). */
  label?: GetProps<typeof BreadcrumbLabel>;
  /** Props for each interleaved separator (`.Separator`). */
  separator?: GetProps<typeof BreadcrumbSeparator>;
}

const BREADCRUMBS_SLOT_KEYS = [
  "root",
  "label",
  "separator",
] as const satisfies readonly (keyof BreadcrumbsStyles)[];

type BreadcrumbsFrameProps = Omit<GetProps<typeof BreadcrumbsFrame>, "aria-label" | "children">;

export interface BreadcrumbsProps extends BreadcrumbsFrameProps {
  /** Crumbs to render; each becomes one breadcrumb. */
  children: React.ReactNode;
  /** Accessible label for the navigation landmark. @default "Breadcrumb" */
  "aria-label"?: string;
  /** Node placed between crumbs. @default '/' */
  separator?: React.ReactNode;
  /**
   * Inline spacing around each separator. Token, CSS value or number.
   * @default '$xs'
   * @deprecated Prefer `styles={{ separator: { marginHorizontal } }}`. This prop
   *   still wins over the `separator` slot for backward compatibility.
   */
  separatorMargin?: BoxProps["marginHorizontal"];
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<BreadcrumbsStyles>;
}

const BreadcrumbsComponent = BreadcrumbsFrame.styleable<BreadcrumbsProps>(
  function Breadcrumbs(props, ref) {
    const {
      children,
      separator = "/",
      separatorMargin = "$xs",
      "aria-label": ariaLabel = "Breadcrumb",
      styles,
      ...rest
    } = props;

    const s = slotStyles<BreadcrumbsStyles>(styles, BREADCRUMBS_SLOT_KEYS, "Breadcrumbs");

    // Bind the `label` slot onto the auto-wrap text element so string/number
    // crumbs pick up the slot sugar; element crumbs still pass through untouched.
    const LabelWrapper = useSlotTextWrapper(BreadcrumbLabel, s.get("label"));

    const items = React.Children.toArray(children).filter(
      (child) => child !== null && child !== undefined && typeof child !== "boolean",
    );
    const margin: { marginHorizontal?: BoxProps["marginHorizontal"] } =
      separatorMargin != null ? { marginHorizontal: separatorMargin } : {};

    // `aria-label` is a runtime-only web prop that isn't in the generated
    // style-prop types; narrow it (with `render`) locally rather than widening.
    const navProps: { "aria-label": string } = {
      "aria-label": ariaLabel,
    };

    return (
      <BreadcrumbsFrame ref={ref} {...s.get("root")} {...rest} render="nav" {...navProps}>
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {renderTextChild(child, LabelWrapper)}
            {index < items.length - 1 ? (
              typeof separator === "string" || typeof separator === "number" ? (
                // `separator` slot is the canonical home; `separatorMargin` is the
                // legacy explicit knob and merges OVER it.
                <BreadcrumbSeparator {...s.merge("separator", margin)}>
                  {separator}
                </BreadcrumbSeparator>
              ) : (
                <Box {...margin}>{separator}</Box>
              )
            ) : null}
          </React.Fragment>
        ))}
      </BreadcrumbsFrame>
    );
  },
);

export const Breadcrumbs = withStaticProperties(BreadcrumbsComponent, {
  Frame: BreadcrumbsFrame,
  Label: BreadcrumbLabel,
  Separator: BreadcrumbSeparator,
});
