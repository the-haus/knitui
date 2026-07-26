/**
 * The OVER-MEDIA palette — the tokens chrome painted ON TOP of media pixels uses
 * (the `@knitui/media` Video player). Video controls float over arbitrary video
 * content, so they can't ride the normal `$colorN` surface ramp the way a card
 * does: their backdrops must be translucent scrims and their glyphs a fixed light
 * color, regardless of the app theme. These values are therefore THEME-INDEPENDENT
 * (identical in light and dark) and are spread into every theme's `extra` so a
 * `$mediaScrim` / `$mediaOnScrim` reference resolves anywhere. This is the single
 * source of truth for the over-media look — media no longer hardcodes `rgba(…)` /
 * `"white"` literals. (Keeping the literals HERE, in the theme layer, is correct:
 * a `linear-gradient` / scrim color genuinely can't be a `$colorN` ramp token.)
 *
 * NB: this lives in its own module — deliberately NOT in `themes.ts` — because
 * `themes.ts`'s module body runs `createThemes(...)`, generating the full theme
 * suite. Importing a 5-key literal must not drag that work in as a side effect.
 */
export const OVER_MEDIA = {
  /** Text / glyph color for chrome on a dark scrim (the old `ON_DARK = "white"`). */
  mediaOnScrim: "white",
  /** Strong scrim — caption bubble + the opaque stop of the bottom gradient. */
  mediaScrim: "rgba(0,0,0,0.75)",
  /** Control surface — menu/flyout backdrops floating over the video. */
  mediaControlSurface: "rgba(0,0,0,0.7)",
  /** Full-frame overlay backdrop — the error / message scrim. */
  mediaOverlay: "rgba(0,0,0,0.6)",
  /** Light wash — the buffered-range underlay on the scrubber track. */
  mediaHighlight: "rgba(255,255,255,0.35)",
} as const;
