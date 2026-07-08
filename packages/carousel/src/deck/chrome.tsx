import { Box, Text } from "@knitui/components";
import {
  type GetProps,
  type SlotAccessor,
  slotStyles,
  type SlotStyles,
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
  name: "SwipeDeck",
  position: "relative",
  overflow: "visible",
});

/**
 * A card's visual surface. Fills the animated host (`flex: 1`) and owns radius /
 * background / border. Neutral, card-like defaults; override via `styles.card`.
 */
export const DeckCardBox = styled(Box, {
  name: "SwipeDeckCard",
  flex: 1,
  borderRadius: "$xl",
  backgroundColor: "$background",
  borderWidth: 1,
  borderColor: "$borderColor",
  overflow: "hidden",
});

const TONE_COLORS = {
  like: "$green9",
  nope: "$red9",
  super: "$blue9",
  neutral: "$color9",
} as const;

/** The bordered LIKE / NOPE chip. `tone` colors the border; sits in an opacity host. */
export const DeckStamp = styled(Box, {
  name: "SwipeDeckStamp",
  borderWidth: 4,
  borderRadius: "$md",
  paddingHorizontal: "$sm",
  paddingVertical: "$xs",
  alignSelf: "flex-start",
  variants: {
    tone: {
      like: { borderColor: TONE_COLORS.like },
      nope: { borderColor: TONE_COLORS.nope },
      super: { borderColor: TONE_COLORS.super },
      neutral: { borderColor: TONE_COLORS.neutral },
    },
  } as const,
  defaultVariants: { tone: "neutral" },
});

/** The stamp's label text; `tone` matches the chip border. */
export const DeckStampText = styled(Text, {
  name: "SwipeDeckStampText",
  fontSize: 32,
  fontWeight: "800",
  letterSpacing: 2,
  variants: {
    tone: {
      like: { color: TONE_COLORS.like },
      nope: { color: TONE_COLORS.nope },
      super: { color: TONE_COLORS.super },
      neutral: { color: TONE_COLORS.neutral },
    },
  } as const,
  defaultVariants: { tone: "neutral" },
});

export type DeckStampTone = "like" | "nope" | "super" | "neutral";

/* ── Per-slot styles ────────────────────────────────────────────────────── */

/**
 * Named style slots. `styles={{ card: { borderRadius: "$lg" } }}` is sugar for
 * `<SwipeDeck.Card borderRadius="$lg" />`. Precedence:
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
