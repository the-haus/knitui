import { type GetProps, styled } from "@knitui/core";

import { kbdSizeVariant, type SizeKey } from "../internal/style-props";
import { Text } from "../Text";

export type KbdSize = SizeKey;

/**
 * Keyboard key — mirrors Mantine's `Kbd`. A monospace keycap: bold mono text on
 * a subtle tinted surface with a thicker bottom border for the pressed-key look.
 * `size` scales the keycap as a unit — font, padding (so the HEIGHT grows), and
 * corner radius all move together off the canonical control metrics. Color comes
 * from the theme ramp (`$color2` surface, `$color6` border, `$color12` text) so
 * `theme="..."` recolors it. Renders a semantic `<kbd>` on web. No Mantine `color`
 * prop.
 */
const KbdFrame = styled(Text, {
  name: "Kbd",
  fontFamily: "$mono",
  fontWeight: "700",
  textAlign: "center",
  backgroundColor: "$color2",
  color: "$color12",
  borderColor: "$color6",
  borderWidth: 1,
  borderBottomWidth: 3,

  variants: {
    size: {
      ...kbdSizeVariant,
    },
  } as const,
  defaultVariants: { size: "sm" },
});

export type KbdProps = GetProps<typeof KbdFrame>;

export const Kbd = KbdFrame.styleable<KbdProps>(function Kbd(props, ref) {
  return <KbdFrame ref={ref} {...props} render="kbd" />;
});
