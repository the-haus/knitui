/**
 * Platform-free media-query core shared by the web and native hooks.
 *
 * Web passes query strings straight to `window.matchMedia`, so it gets full CSS
 * fidelity. Native has no `matchMedia`, so this module can (a) parse the
 * cross-platform subset of a matchMedia string into a structured descriptor and
 * (b) evaluate a descriptor against a {@link MediaEnvironment} snapshot built
 * from React Native's `Dimensions` / `Appearance` / `AccessibilityInfo`.
 *
 * Everything here is pure and deterministic — no React, no `window`, no
 * `react-native` — so it is unit-testable in isolation and safe to run during
 * server-side rendering.
 */

export type Orientation = "portrait" | "landscape";
export type ColorScheme = "light" | "dark";

/** A snapshot of the runtime environment a media query is evaluated against. */
export interface MediaEnvironment {
  width: number;
  height: number;
  colorScheme: ColorScheme;
  reducedMotion: boolean;
}

/**
 * Structured, cross-platform media-query descriptor. Every field is supported on
 * both web and native — unlike raw matchMedia strings, which can reference
 * web-only features (`hover`, `pointer`, `resolution`, …).
 */
export interface MediaQueryObject {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  orientation?: Orientation;
  prefersColorScheme?: ColorScheme;
  prefersReducedMotion?: boolean;
}

/** A media query as either a matchMedia string or a structured descriptor. */
export type MediaQueryInput = string | MediaQueryObject;

/** Result of parsing a matchMedia string into cross-platform descriptors. */
export interface ParsedMediaQuery {
  /** OR-combined conjunction groups — the query matches if ANY group matches. */
  groups: MediaQueryObject[];
  /** Feature names the native evaluator cannot resolve (e.g. `hover`, `pointer`). */
  unsupportedFeatures: string[];
}

interface InternalGroup {
  object: MediaQueryObject;
  unsupported: string[];
}

/** Media *types* (as opposed to features) that we evaluate as "matches screen". */
const IGNORED_MEDIA_TYPES = new Set(["all", "screen", "only", "and"]);

function parseLength(raw: string): number | undefined {
  const match = /^(-?\d*\.?\d+)\s*(px|em|rem)?$/.exec(raw.trim());
  if (!match) return undefined;
  const value = parseFloat(match[1]);
  // Resolve relative units against the CSS root default so a query written in
  // `em`/`rem` still evaluates on native (which only knows device pixels).
  return match[2] === "em" || match[2] === "rem" ? value * 16 : value;
}

function applyFeature(group: InternalGroup, name: string, rawValue: string | undefined): void {
  const value = rawValue?.trim();
  const px = value ? parseLength(value) : undefined;
  switch (name) {
    case "min-width":
      if (px != null) group.object.minWidth = px;
      return;
    case "max-width":
      if (px != null) group.object.maxWidth = px;
      return;
    case "min-height":
      if (px != null) group.object.minHeight = px;
      return;
    case "max-height":
      if (px != null) group.object.maxHeight = px;
      return;
    case "width":
      if (px != null) {
        group.object.minWidth = px;
        group.object.maxWidth = px;
      }
      return;
    case "height":
      if (px != null) {
        group.object.minHeight = px;
        group.object.maxHeight = px;
      }
      return;
    case "orientation":
      if (value === "portrait" || value === "landscape") group.object.orientation = value;
      return;
    case "prefers-color-scheme":
      if (value === "light" || value === "dark") group.object.prefersColorScheme = value;
      return;
    case "prefers-reduced-motion":
      group.object.prefersReducedMotion = value === "reduce";
      return;
    default:
      group.unsupported.push(name);
  }
}

function parseGroup(raw: string): InternalGroup {
  const group: InternalGroup = { object: {}, unsupported: [] };
  // Split a conjunction on `and`, keeping parenthesised features intact.
  const parts = raw.split(/\s+and\s+/i);
  for (const part of parts) {
    const condition = part.trim();
    if (!condition) continue;
    if (!condition.startsWith("(")) {
      // A bare media type (`screen`, `all`, …). Anything unknown that isn't a
      // recognised type is treated as unsupported so we fail safe on native.
      if (!IGNORED_MEDIA_TYPES.has(condition.replace(/^only\s+/, ""))) {
        group.unsupported.push(condition);
      }
      continue;
    }
    const inner = condition.replace(/^\(|\)$/g, "");
    const colon = inner.indexOf(":");
    const name = (colon === -1 ? inner : inner.slice(0, colon)).trim().toLowerCase();
    const value = colon === -1 ? undefined : inner.slice(colon + 1);
    applyFeature(group, name, value);
  }
  return group;
}

function parseInternal(query: string): InternalGroup[] {
  return query
    .toLowerCase()
    .split(",")
    .map((group) => parseGroup(group))
    .filter((group) => Object.keys(group.object).length > 0 || group.unsupported.length > 0);
}

/**
 * Parse a matchMedia string into cross-platform descriptors plus the list of
 * features that cannot be resolved on native. Web never needs this (it uses
 * `matchMedia` directly); the native hook uses `unsupportedFeatures` to warn.
 */
export function parseMediaQuery(query: string): ParsedMediaQuery {
  const groups = parseInternal(query);
  const unsupported = new Set<string>();
  for (const group of groups) for (const feature of group.unsupported) unsupported.add(feature);
  return {
    groups: groups.map((group) => group.object),
    unsupportedFeatures: [...unsupported],
  };
}

/** Serialise a structured descriptor to a matchMedia string (used on web). */
export function queryToString(query: MediaQueryObject): string {
  const parts: string[] = [];
  if (query.minWidth != null) parts.push(`(min-width: ${query.minWidth}px)`);
  if (query.maxWidth != null) parts.push(`(max-width: ${query.maxWidth}px)`);
  if (query.minHeight != null) parts.push(`(min-height: ${query.minHeight}px)`);
  if (query.maxHeight != null) parts.push(`(max-height: ${query.maxHeight}px)`);
  if (query.orientation != null) parts.push(`(orientation: ${query.orientation})`);
  if (query.prefersColorScheme != null) {
    parts.push(`(prefers-color-scheme: ${query.prefersColorScheme})`);
  }
  if (query.prefersReducedMotion != null) {
    parts.push(
      `(prefers-reduced-motion: ${query.prefersReducedMotion ? "reduce" : "no-preference"})`,
    );
  }
  return parts.length ? parts.join(" and ") : "all";
}

function matchesGroup(group: MediaQueryObject, env: MediaEnvironment): boolean {
  if (group.minWidth != null && env.width < group.minWidth) return false;
  if (group.maxWidth != null && env.width > group.maxWidth) return false;
  if (group.minHeight != null && env.height < group.minHeight) return false;
  if (group.maxHeight != null && env.height > group.maxHeight) return false;
  if (group.orientation != null) {
    const orientation: Orientation = env.width >= env.height ? "landscape" : "portrait";
    if (orientation !== group.orientation) return false;
  }
  if (group.prefersColorScheme != null && env.colorScheme !== group.prefersColorScheme)
    return false;
  if (group.prefersReducedMotion != null && env.reducedMotion !== group.prefersReducedMotion) {
    return false;
  }
  return true;
}

/**
 * Evaluate a media query against an environment snapshot — the native-side twin
 * of `window.matchMedia(...).matches`.
 *
 * For a string, any OR group that references an unsupported feature is treated
 * as non-matching (fail-safe), so `(hover: hover)` resolves to `false` on native
 * rather than silently matching. Structured descriptors only expose
 * cross-platform fields, so they always evaluate deterministically.
 */
export function matchesQuery(query: MediaQueryInput, env: MediaEnvironment): boolean {
  if (typeof query !== "string") return matchesGroup(query, env);
  const groups = parseInternal(query);
  if (groups.length === 0) return true; // empty query ("all") matches everything
  return groups.some((group) => group.unsupported.length === 0 && matchesGroup(group.object, env));
}
