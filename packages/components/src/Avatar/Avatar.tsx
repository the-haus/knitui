import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  styled,
  Theme,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { Image, type ImageProps } from "../Image";
import { type GradientValue, useGradient } from "../internal/gradient";
import {
  controlTextColorVariant,
  fontSizePassthroughVariant,
  pickVariants,
  radiusVariant,
  type SizeKey,
  squareSizeVariantFallthrough,
  surfaceColorVariant,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type AvatarSize = SizeKey;
export type AvatarVariant =
  | "filled"
  | "light"
  | "outline"
  | "transparent"
  | "default"
  | "white"
  | "gradient";

/** Accent color theme names available for auto-color assignment. */
const ACCENT_COLORS = [
  "blue",
  "red",
  "green",
  "orange",
  "pink",
  "purple",
  "teal",
  "yellow",
  "gray",
] as const;
type AccentColor = (typeof ACCENT_COLORS)[number];

/** Stable hash → 0..n-1 index, unsigned 32-bit Bernstein. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickColor(name: string, allowed: readonly string[]): string {
  return allowed[hashString(name) % allowed.length];
}

/**
 * Group context — shared down so each `Avatar` inside an `Avatar.Group` overlaps
 * its neighbour (negative left margin) and draws a `$background` ring so the
 * stacked circles stay visually separated.
 */
const AvatarGroupContext = createStyledContext<{ withinGroup: boolean; spacing: number }>({
  withinGroup: false,
  spacing: 0,
});

/**
 * Circular avatar — mirrors Mantine's `Avatar`. Built from `Box` + `Text`.
 * Accent comes from the `theme` prop + palette ramp ($color1…$color12), never a
 * `color` prop; `variant` chooses how the ramp applies, `size` the diameter,
 * `radius` the rounding (defaults to a full circle). When `src` is set the image
 * is rendered (clipped to the frame) and falls back to the themed placeholder —
 * `name` initials or `children` — if it fails to load or is absent.
 */
const AvatarFrame = styled(Box, {
  name: "Avatar",
  context: AvatarGroupContext,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderRadius: 999,
  borderWidth: 0,
  borderColor: "transparent",

  variants: {
    // Static fill from the shared `variant-colors` ladder. Avatar's base is
    // `borderWidth: 0`, so the bordered variants re-add `borderWidth: 1`.
    variant: {
      ...pickVariants(surfaceColorVariant, [
        "filled",
        "light",
        "outline",
        "transparent",
        "default",
        "white",
        "gradient",
      ]),
      outline: { ...surfaceColorVariant.outline, borderWidth: 1 },
      default: { ...surfaceColorVariant.default, borderWidth: 1 },
    },
    size: {
      ...squareSizeVariantFallthrough,
    },
    radius: radiusVariant,
    /** Set by `Avatar.Group`: ring + overlap so stacked avatars stay distinct. */
    withinGroup: {
      true: { borderWidth: 2, borderColor: "$background" },
    },
    /** Set by `Avatar.Group`: negative left margin for the overlap. */
    spacing: {
      ":number": (val: number) => ({ marginLeft: -val }),
    },
  } as const,

  defaultVariants: { variant: "light", size: "md" },
});

const AvatarText = styled(Text, {
  name: "AvatarText",
  userSelect: "none",
  fontWeight: "600",
  variants: {
    // Initials color per variant — shared emphasis ladder, restricted to Avatar's set.
    variant: {
      ...pickVariants(controlTextColorVariant, [
        "filled",
        "light",
        "outline",
        "transparent",
        "default",
        "white",
        "gradient",
      ]),
    },
    size: {
      ...fontSizePassthroughVariant,
    },
  } as const,
});

/** Derive up to two uppercase initials from a name (mirrors Mantine). */
function getInitials(name: string, limit = 2): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return name.slice(0, limit).toUpperCase();
  }
  return parts
    .map((word) => word[0])
    .slice(0, limit)
    .join("")
    .toUpperCase();
}

/**
 * Named slots for {@link AvatarStyles} (Pillar B / `internal/styles.ts`). Each
 * key maps to the props of the styled part it targets, so
 * `styles={{ text: { color: "$red9" } }}` is sugar for `<Avatar.Text color="$red9" />`.
 */
export interface AvatarStyles {
  /** Props spread onto the avatar frame (`.Frame`). */
  root?: GetProps<typeof AvatarFrame>;
  /** Props spread onto the `<Image>` when `src` resolves (`.Image`). */
  image?: ImageProps;
  /** Props spread onto the initials/placeholder text (`.Text`). */
  text?: GetProps<typeof AvatarText>;
}

const AVATAR_SLOT_KEYS = [
  "root",
  "image",
  "text",
] as const satisfies readonly (keyof AvatarStyles)[];

export interface AvatarProps extends GetProps<typeof AvatarFrame> {
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<AvatarStyles>;
  /** User's name. When set (and no `children`), rendered as initials. */
  name?: string;
  /**
   * Image URL. When set and the image loads, it is rendered clipped to the
   * avatar; on load error (or when unset) the themed placeholder is shown.
   */
  src?: string | null;
  /** Accessible label; also used as the `aria-label` of the placeholder. */
  alt?: string;
  /**
   * When `true` (default) and `name` is given without an explicit `theme` prop,
   * automatically selects a theme color by hashing the name — mirrors Mantine's
   * `color="initials"` auto-color behavior.
   */
  autoColor?: boolean;
  /**
   * Subset of accent colors eligible for auto-color assignment. Defaults to all
   * available accent themes. Mirrors Mantine's `allowedInitialsColors`.
   */
  allowedInitialsColors?: readonly string[];
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `$colorN` ramp tokens or any CSS color. Defaults to the active theme ramp.
   * Shown behind the initials/placeholder; an `src` image still covers it.
   */
  gradient?: GradientValue;
}

const AvatarComponent = AvatarFrame.styleable<AvatarProps>(function Avatar(props, ref) {
  const {
    children,
    name,
    src,
    alt,
    size = "md",
    variant = "light",
    radius,
    autoColor = true,
    allowedInitialsColors = ACCENT_COLORS,
    theme,
    styles,
    gradient,
    ...rest
  } = props;

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<AvatarStyles>(styles, AVATAR_SLOT_KEYS, "Avatar");

  // Gradient fill (only when `variant="gradient"`): web paints a CSS
  // `backgroundImage`; native renders the `layer` behind the placeholder.
  const grad = useGradient(variant === "gradient" ? gradient : undefined);

  // Reset the load-error state whenever the source changes.
  const [errored, setErrored] = React.useState(false);
  React.useEffect(() => setErrored(false), [src]);

  const placeholder = children ?? (name ? getInitials(name) : null);
  const showImage = !!src && !errored;

  const inner = (
    <AvatarFrame
      ref={ref}
      size={size}
      variant={variant}
      radius={radius}
      theme={theme}
      role="img"
      aria-label={alt ?? name}
      {...grad.frameProps}
      {...s.get("root")}
      {...rest}
    >
      {grad.layer}
      {showImage ? (
        <Image
          // The slot sugar spreads UNDER the explicit per-part props (src, the
          // load-error handler) so the engine's own wiring always wins.
          {...s.merge("image", {
            src,
            width: "100%",
            height: "100%",
            fit: "cover",
            radius,
            onError: () => setErrored(true),
          })}
        />
      ) : typeof placeholder === "string" ? (
        <AvatarText size={size} variant={variant} {...s.get("text")}>
          {placeholder}
        </AvatarText>
      ) : (
        placeholder
      )}
    </AvatarFrame>
  );

  // When autoColor is on and a name is given without an explicit theme, wrap in
  // a Theme derived from the name hash so initials are always distinctly colored.
  if (autoColor && name && !theme) {
    const colorTheme = pickColor(name, allowedInitialsColors) as AccentColor;
    return <Theme name={colorTheme}>{inner}</Theme>;
  }

  return inner;
});

const AvatarGroupFrame = styled(Box, {
  name: "AvatarGroup",
  role: "group",
  flexDirection: "row",
  alignItems: "center",
});

export interface AvatarGroupProps extends GetProps<typeof AvatarGroupFrame> {
  /** Overlap between avatars, in px. @default 8 */
  spacing?: number;
}

/**
 * `Avatar.Group` — a row of overlapping avatars. Provides the overlap distance
 * and ring through context so every child `Avatar` self-positions; the left pad
 * cancels the first child's negative margin so the row stays flush-left.
 */
const AvatarGroup = AvatarGroupFrame.styleable<AvatarGroupProps>(function AvatarGroup(
  { spacing = 8, children, ...rest },
  ref,
) {
  return (
    <AvatarGroupContext.Provider withinGroup spacing={spacing}>
      <AvatarGroupFrame ref={ref} paddingLeft={spacing} {...rest}>
        {children}
      </AvatarGroupFrame>
    </AvatarGroupContext.Provider>
  );
});

export const Avatar = withStaticProperties(AvatarComponent, {
  Text: AvatarText,
  Image: Image,
  Frame: AvatarFrame,
  Group: AvatarGroup,
});
