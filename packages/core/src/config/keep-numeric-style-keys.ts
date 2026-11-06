/**
 * The value a style key takes once nothing sets it, or `undefined` if clearing it with
 * `null` is safe.
 */
const restingValue = (key: string): number | undefined => {
  if (key === "opacity") return 1;
  if (key === "zIndex" || key === "elevation") return 0;
  if (key === "outlineOffset" || key === "outlineWidth") return 0;
  return key.includes("Radius") ? 0 : undefined;
};

/**
 * Keep numeric keys present in an animated style once they have appeared in it.
 *
 * When a key drops out of a component's animated style, the reanimated driver writes
 * `null` to clear it. Reanimated's Android serializer reads these keys as doubles, so
 * that `null` aborts the app the next time an SVG child draws. Holding the key at its
 * resting value means it only ever animates between numbers.
 *
 * Returns `style` itself when nothing dropped out, so its identity stays stable.
 */
export function keepNumericStyleKeys<T extends object>(style: T, seen: Set<string>): T {
  const dropped = [...seen].filter((key) => !(key in style));
  const kept = dropped.length > 0 ? ({ ...style } as Record<string, unknown>) : null;
  if (kept) for (const key of dropped) kept[key] = restingValue(key);
  for (const key of Object.keys(style)) {
    if (restingValue(key) !== undefined) seen.add(key);
  }
  return kept ? (kept as T) : style;
}
