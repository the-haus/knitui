import { Box, Text } from "@knitui/components";
import {
  type GetProps,
  type SlotAccessor,
  slotStyles,
  type SlotStyles,
  styleable,
  styled,
} from "@knitui/core";

/**
 * Tamagui styling surface for the `SwipeDeck`. As in the carousel chrome
 * (`src/view/chrome.tsx`), the motion node — the per-card reanimated
 * `Animated.View` / painted `View` that owns `transform`/`opacity` — is NOT
 * styled here; the themeable `DeckCardBox` / `DeckStamp` sit *inside* it and own
 * the visuals only (never share one node with an animation driver — repo memory
 * `loop-animation-reanimated-host`).
 */

/* ── Styled chrome ──────────────────────────────────────────────────────── */

/**
 * The deck region. `position: "relative"` is REQUIRED so the absolutely-filled
 * card hosts anchor to it (a Tamagui `Box` defaults to `static` on web).
 * `overflow: "visible"` lets a flung card travel off-screen and the deck peek
 * out behind the top card.
 */
export const DeckFrame = styled(Box, {
  displayName: "SwipeDeck",
  position: "relative",
  overflow: "visible",
});

/**
 * A card's visual surface. Fills the animated host (`flex: 1`) and owns radius /
 * background / border. Neutral, card-like defaults; override via `styles.card`.
 */
export const DeckCardBox = styled(Box, {
  displayName: "SwipeDeckCard",
  flex: 1,
  borderRadius: "xl",
  backgroundColor: "background",
  borderWidth: 1,
  borderColor: "borderColor",
  overflow: "hidden",
});

export type DeckStampTone = "like" | "nope" | "super" | "neutral";

/**
 * The accent sub-theme each tone mounts. The stamp paints from that theme's
 * `color9`, so a tone recolours border AND label (and follows light/dark) with
 * no per-tone palette names. `neutral` stays on the surrounding theme.
 */
const TONE_THEME = {
  like: "green",
  nope: "red",
  super: "blue",
  neutral: undefined,
} as const satisfies Record<DeckStampTone, string | undefined>;

/** The bordered chip itself (static; the tone arrives as a sub-theme). */
const DeckStampFrame = styled(Box, {
  displayName: "SwipeDeckStamp",
  borderWidth: 4,
  borderRadius: "md",
  paddingHorizontal: "sm",
  paddingVertical: "xs",
  alignSelf: "flex-start",
  borderColor: "color9",
});

export interface DeckStampProps extends GetProps<typeof DeckStampFrame> {
  /** The stamp's colour: like (green), nope (red), super (blue). @default "neutral" */
  tone?: DeckStampTone;
}

/**
 * The bordered LIKE / NOPE chip; sits in an opacity host. A `styleable` because
 * `tone` provides a sub-theme (`theme="green"` …) to the chip and its label,
 * which a variant cannot do.
 */
export const DeckStamp = styleable<DeckStampProps>(DeckStampFrame, function DeckStamp(props, ref) {
  const { tone = "neutral", ...rest } = props;
  const theme = TONE_THEME[tone];
  return <DeckStampFrame ref={ref} {...(theme ? { theme } : null)} {...rest} />;
});

/** The stamp's label text; inherits the stamp's tone through its sub-theme. */
export const DeckStampText = styled(Text, {
  displayName: "SwipeDeckStampText",
  fontSize: 32,
  fontWeight: "800",
  letterSpacing: 2,
  color: "color9",
});

/* ── Per-slot styles ────────────────────────────────────────────────────── */

/**
 * Named style slots. `styles={{ card: { borderRadius: "lg" } }}` is sugar for
 * `<SwipeDeck.Card borderRadius="lg" />`. Precedence:
 * `defaults < styles[slot] < explicit props < inline`.
 */
export interface DeckStyles {
  /** The deck region (`DeckFrame`). */
  root?: GetProps<typeof DeckFrame>;
  /** Every card's visual box (`DeckCardBox`). */
  card?: GetProps<typeof DeckCardBox>;
  /** The built-in stamp chip (`DeckStamp`). */
  stamp?: GetProps<typeof DeckStamp>;
}

export const DECK_SLOT_KEYS = [
  "root",
  "card",
  "stamp",
] as const satisfies readonly (keyof DeckStyles)[];

/** Build the typed slot accessor over the deck's `styles` map. */
export function useDeckSlots(styles?: SlotStyles<DeckStyles>): SlotAccessor<DeckStyles> {
  return slotStyles<DeckStyles>(styles, DECK_SLOT_KEYS, "SwipeDeck");
}
