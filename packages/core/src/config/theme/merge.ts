const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Deep-merge two plain objects, right winning. Arrays and non-object values
 * REPLACE (they are not concatenated) — so an explicit 12-step ramp or an
 * `includeTamaguiColors` array overrides rather than appends. Inputs are not
 * mutated.
 */
export const deepMerge = <T extends Record<string, unknown>>(base: T, override: Partial<T>): T => {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const prev = out[key];
    out[key] = isPlainObject(prev) && isPlainObject(value) ? deepMerge(prev, value) : value;
  }
  return out as T;
};
