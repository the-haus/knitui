/**
 * Convert a React Native transform array into a CSS transform string. Pure and
 * platform-neutral — used by the web slide painter (`painter.web`) and the web
 * dot paint path (`pagination/dotAnimation`), so it lives in its own module
 * rather than a `.web` one (a cross-platform file can import it on any target).
 */
export function transformToCss(transform: unknown): string {
  if (!Array.isArray(transform)) return "";
  let out = "";
  for (const seg of transform) {
    // Each segment is a single-key object (`{ translateX: n }`). Read that key
    // without `Object.entries`, which would allocate a throwaway pair-array per
    // segment — this runs per slide per painted frame, so it stays allocation-free.
    let key: string | undefined;
    for (const k in seg as Record<string, unknown>) {
      key = k;
      break;
    }
    if (key === undefined) continue;
    const value = (seg as Record<string, number | string>)[key];
    // `scale*` are ratios (unitless); everything else with a numeric value is a
    // length and needs `px` — including `perspective`, whose CSS function is
    // invalid without a unit (`perspective(800)` ✗ / `perspective(800px)` ✓).
    const unitless = key === "scale" || key === "scaleX" || key === "scaleY";
    const part = !unitless && typeof value === "number" ? `${key}(${value}px)` : `${key}(${value})`;
    out = out === "" ? part : `${out} ${part}`;
  }
  return out;
}
