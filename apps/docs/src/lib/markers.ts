/**
 * Story args are read out of the story files statically (never executed — see
 * `scripts/docs/lib/ts-eval.mjs`), so anything the evaluator cannot reduce to
 * JSON arrives as a tagged marker instead:
 *
 *   { $ref: "voyagerStyle" }        an unresolved identifier
 *   { $fn: "(args) => …" }          a function / arrow
 *   { $expr: "<Text>⭐</Text>" }    any other irreducible expression
 *
 * A marker is a description of source text, not a value. It must never be handed
 * to React as a prop — `children: { $expr: "<Box …>" }` renders as "Objects are
 * not valid as a React child". The playground imports the story module for real,
 * so the honest move is to drop marker-valued args from the overrides it layers
 * on top and let the story's own value through, and to print the source text in
 * the snippet.
 *
 * Client-safe: unlike `registry.ts`, this module reads no generated data.
 */

type Marker = { $ref?: string; $fn?: string; $expr?: string };

const MARKER_KEYS = ["$ref", "$fn", "$expr"] as const;

export function isMarker(value: unknown): value is Marker {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return MARKER_KEYS.some((key) => typeof (value as Marker)[key] === "string");
}

/** The original source text behind a marker. */
export function markerSource(value: unknown): string | undefined {
  if (!isMarker(value)) return undefined;
  for (const key of MARKER_KEYS) {
    const source = value[key];
    if (typeof source === "string") return source;
  }
  return undefined;
}

/** Does this value hold a marker anywhere inside it? */
export function containsMarker(value: unknown): boolean {
  if (isMarker(value)) return true;
  if (Array.isArray(value)) return value.some(containsMarker);
  if (value && typeof value === "object") return Object.values(value).some(containsMarker);
  return false;
}

/**
 * Drop every arg that carries a marker, so the story's real value survives.
 *
 * Whole args go, not just the marker inside them: half-substituting a nested
 * marker (`data: [{ value, label: <marker> }]`) would hand the component a
 * malformed object, where dropping the arg hands it the story's own array.
 */
export function withoutMarkers(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (!containsMarker(value)) out[key] = value;
  }
  return out;
}

/**
 * One arg value as the JS expression a reader would write.
 *
 * Like `JSON.stringify`, except markers anywhere in the tree print as their
 * source text and object keys stay unquoted where they can. `undefined` means
 * there is nothing printable. Mirrors `printValue` in build-registry.mjs, which
 * does the same job for the static story snippets.
 */
export function printValue(value: unknown): string | undefined {
  if (isMarker(value)) return markerSource(value);
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => printValue(item) ?? "undefined").join(", ")}]`;
  }
  if (value && typeof value === "object") {
    const fields = Object.entries(value)
      .map(([key, item]) => {
        const printed = printValue(item);
        return printed === undefined ? null : `${propertyKey(key)}: ${printed}`;
      })
      .filter(Boolean);
    return `{ ${fields.join(", ")} }`;
  }
  return undefined;
}

/** An object key, quoted only when it isn't a bare identifier. */
function propertyKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}
