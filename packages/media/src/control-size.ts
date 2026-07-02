/**
 * Media's bridge to the kit's canonical control-sizing system.
 *
 * Every player/recorder `size` prop is the kit's `SizeKey` (`xxs…xxl`) — the SAME
 * type Button/ActionIcon/Slider speak — so a media control sizes exactly like the
 * rest of the kit and no domain re-declares its own 5-key scale anymore.
 *
 * The kit spans seven keys, but media chrome is only tuned for `xs…xl` (the two
 * extremes would crowd or dwarf a transport bar). Rather than narrow the public
 * type — which would make `size` incompatible with the kit and churn three public
 * type names — we accept the full `SizeKey` and CLAMP the two unsupported extremes
 * to the nearest supported metric (`xxs → xs`, `xxl → xl`). This mirrors how the
 * kit's own components clamp out-of-range keys, and guarantees a media control is
 * never rendered un-sized. `xs…xl` are unaffected.
 *
 * Icon px comes straight from the canonical `controlIconSize` ladder (the same one
 * ActionIcon/Menu use), so media icons scale in lockstep with the kit — no local
 * `CONTROL_ICON_SIZE` copy to drift.
 */
import { controlIconSize, type SizeKey } from "@knitui/components/control-system";

/** A media control's `size` — the kit's full size scale. */
export type MediaSize = SizeKey;

/** The subset media chrome actually renders. */
export type SupportedMediaSize = "xs" | "sm" | "md" | "lg" | "xl";

const CLAMP = {
  xxs: "xs",
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
  xxl: "xl",
} as const satisfies Record<MediaSize, SupportedMediaSize>;

/** Clamp a kit size key into the `xs…xl` band media chrome supports. */
export const clampMediaSize = (size: MediaSize): SupportedMediaSize => CLAMP[size];

/** In-control icon px for a media control size — canonical ladder, clamped. */
export const mediaIconSize = (size: MediaSize): number => controlIconSize(clampMediaSize(size));
