import * as React from "react";

import { type GetProps } from "@knitui/core";

import { slotStyles, type SlotStyles } from "../internal/styles";
import { Mark, type MarkProps } from "../Mark";
import { Text } from "../Text";

/** One ordered segment of the scanned string. */
interface HighlightChunk {
  chunk: string;
  highlighted: boolean;
  /** The original (pre-normalized) term that produced this match. */
  matchedTerm: string;
}

type HighlightMarkProps = Omit<MarkProps, "children">;
type HighlightStylesMap = Record<string, HighlightMarkProps>;

/**
 * Determine whether `highlightStyles` is a per-term map. The two supported
 * shapes are structurally ambiguous, so only term-keyed object values are
 * treated as per-term styles.
 */
function isPerTermMap(
  styles: HighlightMarkProps | HighlightStylesMap,
  terms: string[],
): styles is HighlightStylesMap {
  const termSet = new Set(terms.filter((term) => term.trim().length > 0));
  const entries = Object.entries(styles);
  return (
    entries.length > 0 &&
    entries.every(
      ([term, value]) =>
        termSet.has(term) && value !== null && typeof value === "object" && !Array.isArray(value),
    )
  );
}

/**
 * Resolve the props for one matched chunk, low → high precedence:
 *   `styles.mark` (slot sugar) < `highlightStyles` single-object < per-term entry.
 * The deprecated `highlightStyles` alias therefore merges OVER the `mark` slot
 * ("explicit beats sugar"); a per-term entry, the documented exception with no
 * Pillar-B equivalent, is the most specific and wins outright for its term.
 */
function resolveHighlightStyles(
  slotMark: HighlightMarkProps | undefined,
  legacy: HighlightMarkProps | HighlightStylesMap | undefined,
  terms: string[],
  matchedTerm: string,
): HighlightMarkProps {
  const base = slotMark ?? {};
  if (legacy === undefined) return base;
  if (isPerTermMap(legacy, terms)) return { ...base, ...(legacy[matchedTerm] ?? {}) };
  return { ...base, ...legacy };
}

/** Strip diacritics for accent-insensitive matching. */
function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Return true if position `pos` in `str` sits on a word boundary. */
function atWordBoundary(str: string, pos: number): boolean {
  if (pos <= 0 || pos >= str.length) return true;
  return /\w/.test(str[pos - 1]!) !== /\w/.test(str[pos]!);
}

/**
 * Split `text` into ordered segments, marking the runs that match any of
 * `parts`. Terms are tried longest-first at each position to resolve overlaps.
 * Empty / whitespace-only terms are ignored.
 */
function highlighter(
  text: string,
  parts: string[],
  opts: {
    caseInsensitive: boolean;
    wholeWord: boolean;
    accentInsensitive: boolean;
  },
): HighlightChunk[] {
  const { caseInsensitive, wholeWord, accentInsensitive } = opts;

  const normalize = (s: string) => {
    let r = accentInsensitive ? stripAccents(s) : s;
    if (caseInsensitive) r = r.toLowerCase();
    return r;
  };

  const terms = parts
    .filter((p) => p.trim().length > 0)
    .map((p) => ({ original: p, normalized: normalize(p) }))
    .filter((t) => t.normalized.length > 0)
    .sort((a, b) => b.normalized.length - a.normalized.length);

  if (terms.length === 0) {
    return [{ chunk: text, highlighted: false, matchedTerm: "" }];
  }

  const normText = normalize(text);
  const chunks: HighlightChunk[] = [];
  let cursor = 0;
  let plainStart = 0;

  while (cursor < text.length) {
    const hit = terms.find((t) => {
      if (!normText.startsWith(t.normalized, cursor)) return false;
      if (wholeWord) {
        const end = cursor + t.normalized.length;
        if (!atWordBoundary(text, cursor) || !atWordBoundary(text, end)) return false;
      }
      return true;
    });

    if (hit !== undefined) {
      if (cursor > plainStart) {
        chunks.push({ chunk: text.slice(plainStart, cursor), highlighted: false, matchedTerm: "" });
      }
      const matchLen = hit.normalized.length;
      chunks.push({
        chunk: text.slice(cursor, cursor + matchLen),
        highlighted: true,
        matchedTerm: hit.original,
      });
      cursor += matchLen;
      plainStart = cursor;
    } else {
      cursor += 1;
    }
  }

  if (plainStart < text.length) {
    chunks.push({ chunk: text.slice(plainStart), highlighted: false, matchedTerm: "" });
  }

  return chunks;
}

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Highlight generates its
 * `Mark` parts per chunk at runtime, so it can't expose a `Highlight.Mark` static
 * (Pillar A) — the `mark` slot is the right mechanism. `styles={{ mark: { … } }}`
 * is sugar for the props on every generated `<Mark>`.
 */
export interface HighlightStyles {
  /** Props spread onto every highlighted `Mark`. */
  mark?: HighlightMarkProps;
}

const HIGHLIGHT_SLOT_KEYS = ["mark"] as const satisfies readonly (keyof HighlightStyles)[];

export interface HighlightProps extends Omit<GetProps<typeof Text>, "children"> {
  /** The text to scan and render. Highlighting only applies to a string. */
  children: string;
  /** Substring(s) to highlight. Empty terms are ignored. */
  highlight: string | string[];
  /** Per-slot style sugar. Slot: `mark` — props spread onto every highlighted `Mark`. */
  styles?: SlotStyles<HighlightStyles>;
  /**
   * @deprecated Use `styles={{ mark: { … } }}` for the single-object form. This
   * alias still works and merges OVER `styles.mark` ("explicit beats sugar"). The
   * per-term `Record<string, MarkProps>` form has no `styles` equivalent and is
   * retained as the documented exception:
   * - A single `MarkProps` object — applied to ALL matches.
   * - A `Record<string, MarkProps>` keyed by term — per-term styles.
   */
  highlightStyles?: HighlightMarkProps | HighlightStylesMap;
  /** Match regardless of case. Default `true`. */
  caseInsensitive?: boolean;
  /** Only match whole words (respects `\w` boundaries). Default `false`. */
  wholeWord?: boolean;
  /** Match regardless of diacritics / accents. Default `false`. */
  accentInsensitive?: boolean;
}

/**
 * Renders text with matched substrings wrapped in `Mark` — mirrors Mantine's
 * `Highlight`. The highlight tint comes from `Mark` (theme ramp); recolor every
 * mark at once with `highlightStyles={{ theme: "yellow" }}` or per-term with
 * `highlightStyles={{ hello: { theme: "red" }, world: { theme: "blue" } }}`.
 * Inherits the full `Text` surface (`size`, `fw`, `c`, …) and forwards its ref.
 */
export const Highlight = Text.styleable<HighlightProps>(function Highlight(props, ref) {
  const {
    children,
    highlight,
    highlightStyles,
    styles,
    caseInsensitive = true,
    wholeWord = false,
    accentInsensitive = false,
    ...rest
  } = props;

  // Per-slot style sugar; the `mark` slot is the base for every generated Mark.
  const s = slotStyles<HighlightStyles>(styles, HIGHLIGHT_SLOT_KEYS, "Highlight");
  const slotMark = s.get("mark");

  if (typeof children !== "string") {
    return (
      <Text ref={ref} {...rest}>
        {children}
      </Text>
    );
  }

  const terms = Array.isArray(highlight) ? highlight : [highlight];
  const chunks = highlighter(children, terms, { caseInsensitive, wholeWord, accentInsensitive });

  return (
    <Text ref={ref} {...rest}>
      {chunks.map((part, index) => {
        if (!part.highlighted) {
          return <React.Fragment key={index}>{part.chunk}</React.Fragment>;
        }
        const markProps = resolveHighlightStyles(
          slotMark,
          highlightStyles,
          terms,
          part.matchedTerm,
        );
        return (
          <Mark key={index} {...markProps}>
            {part.chunk}
          </Mark>
        );
      })}
    </Text>
  );
});
