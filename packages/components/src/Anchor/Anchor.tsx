import { type GetProps, styled } from "@knitui/core";

import {
  focusRingStyle,
  fontSizePassthroughVariant,
  type SizeKey,
  webCursor,
} from "../internal/style-props";
import { Text } from "../Text";

/**
 * Link text — mirrors Mantine's `Anchor`. Inherits the full `Text` surface
 * (`size`, `lineClamp`, `truncate`, `inline`, `inherit`) and adds `underline`,
 * which controls WHEN the underline shows. Renders an `<a>` element with
 * `role="link"` and accepts an `href`. Color is the kit's deliberate divergence
 * — the default link color comes from the theme accent ramp (`$color11`);
 * recolor via the `theme` prop, never a `color` prop.
 */
const AnchorFrame = styled(Text, {
  name: "Anchor",
  color: "$color11",
  ...webCursor("pointer"),
  // Anchor renders a real, natively-focusable `<a>` (when `href` is set), so the
  // shared focus-visible outline fires for keyboard users (web). See the focus
  // contract in `internal/variant-colors.ts` (`FOCUS_RING`).
  ...focusRingStyle,

  variants: {
    size: {
      ...fontSizePassthroughVariant,
    },
    underline: {
      always: { textDecorationLine: "underline" },
      hover: {
        textDecorationLine: "none",
        hoverStyle: { textDecorationLine: "underline" },
      },
      "not-hover": {
        textDecorationLine: "underline",
        hoverStyle: { textDecorationLine: "none" },
      },
      never: { textDecorationLine: "none" },
    },
  } as const,

  defaultVariants: { size: "md", underline: "hover" },
});

export type AnchorSize = SizeKey;
export type AnchorUnderline = "always" | "hover" | "not-hover" | "never";

type AnchorHostProps = {
  render: string;
  href?: string;
  role: "link";
};

export interface AnchorProps extends GetProps<typeof AnchorFrame> {
  /** Destination URL. Forwarded to the underlying `<a>` element on web. */
  href?: string;
}

export const Anchor = AnchorFrame.styleable<AnchorProps>(function Anchor(props, ref) {
  const { href, ...rest } = props;
  // `href` is a runtime-only `<a>` prop that isn't in the generated style prop
  // types; narrow it (with `render`) to a precise local type rather than widening
  // to `any` (spread, so no excess-property check fires).
  const hostProps: AnchorHostProps = {
    render: "a",
    role: "link",
    ...(href != null ? { href } : {}),
  };
  return <AnchorFrame ref={ref} {...rest} {...hostProps} />;
});
