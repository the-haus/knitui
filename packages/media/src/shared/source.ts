/**
 * The URI of a media source, whichever of its shapes it came in: a plain string or
 * a `{ uri }` object. `null` for a bundled asset (`require(...)`, a number) or no
 * source, which have no URI to key on.
 */
export function sourceUriOf(source: unknown): string | null {
  if (typeof source === "string") return source;
  if (source && typeof source === "object") {
    const uri = (source as { uri?: unknown }).uri;
    if (typeof uri === "string") return uri;
  }
  return null;
}
