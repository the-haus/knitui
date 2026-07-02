/**
 * Caption engine — a DOM-free / RN-free WebVTT + SubRip (SRT) parser and the
 * active-cue lookup that drives the native caption overlay.
 *
 * On web the browser decodes `<track>` files and paints the cues for us. Native
 * (`expo-video`) only surfaces subtitle tracks EMBEDDED in an HLS/DASH manifest;
 * it has no way to load an external sidecar `.vtt`/`.srt`. So on native we run
 * our own pipeline: fetch the cue file, parse it here, and render the cue that
 * covers the current playback time. This module is the pure core of that — no
 * `fetch`, no platform imports — so it is unit-tested directly.
 */

/** A single timed caption cue. Times are in seconds. */
export interface Cue {
  /** Start time, seconds (inclusive). */
  start: number;
  /** End time, seconds (exclusive). */
  end: number;
  /** Cue body. Multi-line cues keep their `\n` line breaks. */
  text: string;
}

/**
 * Parse a timestamp in either WebVTT (`HH:MM:SS.mmm` / `MM:SS.mmm`) or SRT
 * (`HH:MM:SS,mmm`) form into seconds. Returns `null` when it isn't a timestamp.
 */
export function parseTimestamp(input: string): number | null {
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/.exec(input.trim());
  if (!match) return null;
  const hours = match[1] ? Number.parseInt(match[1], 10) : 0;
  const minutes = Number.parseInt(match[2], 10);
  const seconds = Number.parseInt(match[3], 10);
  const millis = Number.parseInt(match[4].padEnd(3, "0"), 10);
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

const ARROW = "-->";

/**
 * Parse a WebVTT or SRT document into cues. The two formats share a block
 * structure (groups separated by blank lines, each with a `start --> end` line
 * followed by the cue body), differing only in the decimal separator and the
 * `WEBVTT` header — both of which this handles, so a single parser covers both.
 *
 * Unparseable blocks (the `WEBVTT` header, `NOTE`/`STYLE`/`REGION` blocks, junk)
 * are skipped rather than throwing, so a malformed cue never breaks playback.
 */
export function parseCues(input: string): Cue[] {
  const normalized = input.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  const blocks = normalized.split(/\n{2,}/);
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const arrowIndex = lines.findIndex((line) => line.includes(ARROW));
    if (arrowIndex === -1) continue;

    const [rawStart, rawRest] = lines[arrowIndex].split(ARROW);
    if (rawRest === undefined) continue;
    const start = parseTimestamp(rawStart);
    // The end timestamp may be followed by cue settings (e.g. `align:center`).
    const end = parseTimestamp(rawRest.trim().split(/\s+/)[0] ?? "");
    if (start === null || end === null) continue;

    const text = lines
      .slice(arrowIndex + 1)
      .join("\n")
      .trim();
    if (!text) continue;

    cues.push({ start, end, text });
  }

  return cues;
}

/** Parse a WebVTT document. Thin alias over {@link parseCues}. */
export function parseVtt(input: string): Cue[] {
  return parseCues(input);
}

/** Parse a SubRip (SRT) document. Thin alias over {@link parseCues}. */
export function parseSrt(input: string): Cue[] {
  return parseCues(input);
}

/**
 * The text of the cue(s) active at `time`, or `null` when none is. Overlapping
 * cues are joined with a newline (mirroring how stacked cues render). The cue
 * window is half-open `[start, end)` so adjacent cues never both show.
 */
export function activeCueText(cues: readonly Cue[], time: number): string | null {
  let active: string | null = null;
  for (const cue of cues) {
    if (time >= cue.start && time < cue.end) {
      active = active === null ? cue.text : `${active}\n${cue.text}`;
    }
  }
  return active;
}

/* -------------------------------------------------------------------------- */
/* data: URI decoding                                                         */
/* -------------------------------------------------------------------------- */

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decode a base64 string to raw bytes. Tolerates missing padding/whitespace. */
function base64ToBytes(input: string): number[] {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = BASE64_ALPHABET.indexOf(clean[i]);
    const c1 = BASE64_ALPHABET.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] ? BASE64_ALPHABET.indexOf(clean[i + 2]) : -1;
    const c3 = clean[i + 3] ? BASE64_ALPHABET.indexOf(clean[i + 3]) : -1;
    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2 !== -1) bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 !== -1) bytes.push(((c2 & 3) << 6) | c3);
  }
  return bytes;
}

/**
 * Decode a `data:` URI to its text payload (UTF-8), handling both
 * percent-encoded and `;base64` bodies. Returns `null` when `src` is not a data
 * URI — the caller then falls back to a network fetch. Pure (no `fetch`/`atob`)
 * so it works in the engine and in unit tests, and on native where `atob` may be
 * absent.
 */
export function decodeDataUri(src: string): string | null {
  if (!src.startsWith("data:")) return null;
  const comma = src.indexOf(",");
  if (comma === -1) return null;
  const meta = src.slice("data:".length, comma);
  const body = src.slice(comma + 1);
  if (/;base64/i.test(meta)) {
    const bytes = base64ToBytes(body);
    // Reinterpret the bytes as UTF-8 via percent-decoding.
    const percent = bytes.map((b) => `%${b.toString(16).padStart(2, "0")}`).join("");
    try {
      return decodeURIComponent(percent);
    } catch {
      return bytes.map((b) => String.fromCharCode(b)).join("");
    }
  }
  try {
    return decodeURIComponent(body);
  } catch {
    return body;
  }
}
