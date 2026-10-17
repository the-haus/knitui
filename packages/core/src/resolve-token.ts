import { getConfig, isVariable } from "@tamagui/core";

/**
 * Config-driven token detection and resolution — the v3 replacement for every
 * `value[0] === "$"` sigil check.
 *
 * v3 has no `$` sigil (`p="md"`, `bg="color2"`), so the SHAPE of a string can no
 * longer say whether it is a token. A sigil check keeps type-checking and
 * silently stops working (the first v3 apps lost every icon colour that way).
 * These helpers ask the active Tamagui config (and optionally a theme) whether it
 * knows the name, and treat anything it doesn't know as a literal value.
 *
 * Accepted spellings: a bare key (`"md"`), a qualified key (`"space.md"`), and —
 * defensively, for values that reach the kit from v2-era callers — a legacy
 * `"$md"`. Numbers are never tokens (a number is a raw value in v3).
 */

/** The built-in token categories plus the font sections of the default font. */
export type TokenCategory =
  | "color"
  | "space"
  | "size"
  | "radius"
  | "zIndex"
  | "fontSize"
  | "lineHeight"
  | "fontWeight"
  | "letterSpacing";

/** A theme as `useTheme()` returns it (entries are Variables / `.get()`-ables) or a plain map. */
export type ThemeLike = Record<string, unknown>;

export interface ResolveTokenOptions {
  /**
   * The active theme (`useTheme()`), consulted FIRST for `"color"` (theme keys
   * such as `color11` / `background` win over raw colour tokens, as in Tamagui's
   * own resolver). Without it only config tokens are known.
   */
  theme?: ThemeLike;
  /** The font whose `fontSize` / `lineHeight` / … sections are read. Default: the config's `defaultFont`. */
  font?: string;
}

type ConfigShape = {
  tokensParsed?: Record<string, Record<string, unknown>>;
  fontsParsed?: Record<string, Record<string, Record<string, unknown> | undefined> | undefined>;
  themes?: Record<string, Record<string, unknown>>;
  defaultFont?: string;
  settings?: { defaultFont?: string };
};

const FONT_SECTION: Partial<Record<TokenCategory, string>> = {
  fontSize: "size",
  lineHeight: "lineHeight",
  fontWeight: "weight",
  letterSpacing: "letterSpacing",
};

const TOKEN_CATEGORIES = ["color", "space", "size", "radius", "zIndex"] as const;

const activeConfig = (): ConfigShape | undefined => {
  try {
    return getConfig() as unknown as ConfigShape;
  } catch {
    // no `createTamagui` has run yet (module scope / config-free SSR paths)
    return undefined;
  }
};

/** `"$md"` → `"md"`, `"space.md"` → `["space", "md"]`. */
const parseName = (value: string): { qualifier?: string; name: string } => {
  const bare = value.charCodeAt(0) === 36 /* "$", legacy v2 spelling */ ? value.slice(1) : value;
  const dot = bare.indexOf(".");
  if (dot > 0) {
    const qualifier = bare.slice(0, dot);
    if (qualifier in FONT_SECTION || (TOKEN_CATEGORIES as readonly string[]).includes(qualifier)) {
      return { qualifier, name: bare.slice(dot + 1) };
    }
  }
  return { name: bare };
};

/** Unwrap a Tamagui Variable / theme proxy entry / raw value to its raw value. */
const unwrap = (entry: unknown): string | number | undefined => {
  if (entry == null) return undefined;
  if (typeof entry === "string" || typeof entry === "number") return entry;
  if (isVariable(entry)) return (entry as { val: string | number }).val;
  if (typeof entry === "object") {
    const maybe = entry as { val?: unknown; get?: () => unknown };
    if (typeof maybe.get === "function") {
      const got = maybe.get();
      if (typeof got === "string" || typeof got === "number") return got;
    }
    if (typeof maybe.val === "string" || typeof maybe.val === "number") return maybe.val;
  }
  return undefined;
};

const lookup = (
  config: ConfigShape | undefined,
  category: TokenCategory,
  name: string,
  options: ResolveTokenOptions | undefined,
): string | number | undefined => {
  if (category === "color" && options?.theme && name in options.theme) {
    const fromTheme = unwrap(options.theme[name]);
    if (fromTheme !== undefined) return fromTheme;
  }
  if (!config) return undefined;
  const section = FONT_SECTION[category];
  if (section) {
    const fontName = options?.font ?? config.settings?.defaultFont ?? config.defaultFont ?? "body";
    const font = config.fontsParsed?.[fontName] ?? config.fontsParsed?.[`$${fontName}`];
    const entries = font?.[section];
    return entries && name in entries ? unwrap(entries[name]) : undefined;
  }
  const tokens = config.tokensParsed?.[category];
  return tokens && name in tokens ? unwrap(tokens[name]) : undefined;
};

/**
 * Resolve a token NAME to its raw value in `category`, or `undefined` when the
 * config (or `options.theme`, for colours) does not know it. Callers keep a
 * literal by falling back to their input:
 *
 * ```ts
 * const px = resolveToken(size, "size") ?? size;          // "md" → 40, 40 → 40
 * const fill = resolveToken(color, "color", { theme }) ?? color; // "color11" → "hsla(…)", "#fff" → "#fff"
 * ```
 *
 * A qualified name (`"radius.md"`) overrides `category`.
 */
export function resolveToken(
  value: unknown,
  category: TokenCategory,
  options?: ResolveTokenOptions,
): string | number | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  const { qualifier, name } = parseName(value);
  return lookup(
    activeConfig(),
    (qualifier as TokenCategory | undefined) ?? category,
    name,
    options,
  );
}

/**
 * Whether `value` names a token — in `category` when given, otherwise in ANY
 * token category, any font section of the default font, or any theme key of the
 * active config (`color11`, `background`, `focusRingColor`…). Numbers and
 * unknown strings (`"#fff"`, `"50%"`, `"auto"`) are not tokens.
 */
export function isToken(
  value: unknown,
  category?: TokenCategory,
  options?: ResolveTokenOptions,
): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  const { qualifier, name } = parseName(value);
  const config = activeConfig();
  const target = (qualifier as TokenCategory | undefined) ?? category;
  if (target) return lookup(config, target, name, options) !== undefined;

  if (options?.theme && name in options.theme) return true;
  for (const cat of TOKEN_CATEGORIES) {
    if (lookup(config, cat, name, undefined) !== undefined) return true;
  }
  for (const cat of Object.keys(FONT_SECTION) as TokenCategory[]) {
    if (lookup(config, cat, name, options) !== undefined) return true;
  }
  return config ? themeKeysOf(config).has(name) : false;
}

const themeKeyCache = new WeakMap<object, Set<string>>();

/** Every key any theme of `config` defines (cached per config object). */
const themeKeysOf = (config: ConfigShape): Set<string> => {
  let keys = themeKeyCache.get(config);
  if (!keys) {
    keys = new Set<string>();
    for (const theme of Object.values(config.themes ?? {})) {
      for (const key of Object.keys(theme)) keys.add(key);
    }
    themeKeyCache.set(config, keys);
  }
  return keys;
};
