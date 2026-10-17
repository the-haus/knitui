/**
 * Test helpers for asserting Tamagui v3's WEB output by behaviour, not by
 * class-name spelling (docs/v3/conventions.md §8). v3 emits short hashed atomic
 * classes (`_oc-847342144`, `_b-688726769`); the condition / value lives in the
 * injected CSS rule, so tests read the rules that target an element's classes.
 *
 * Not a test file (jest matches `*.test.ts(x)` only) and excluded from the lib
 * build by the `*.test.*` pattern.
 *
 * A copy of `packages/components/src/__tests__/css-rules.test.helper.ts` (dates
 * does not reach into another package's test sources), plus the dates-only
 * `baseStyle` / `stateStyle` readers used by the cell-state tests.
 */

/** Every CSS rule text currently in the document (media/supports rules flattened). */
export function allCssRules(): string[] {
  const out: string[] = [];
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested && !(rule instanceof CSSStyleRule)) {
        // keep the group's text too, so `@media (hover: hover)` stays assertable
        out.push(rule.cssText);
        continue;
      }
      out.push(rule.cssText);
      if (nested) visit(nested);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // cross-origin / unreadable sheet
    }
  }
  return out;
}

const escape = (cls: string) => cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The CSS rules that target one of `el`'s classes (atomic classes only). */
export function cssRulesOf(el: Element): string[] {
  const rules = allCssRules();
  const classes = Array.from(el.classList).filter((c) => c.startsWith("_"));
  const matchers = classes.map((c) => new RegExp(`\\.${escape(c)}(?![\\w-])`));
  return rules.filter((rule) => matchers.some((m) => m.test(rule)));
}

/**
 * The CSS declarations `el` gets under `pseudo` (e.g. `":focus-visible"`,
 * `":hover"`, `":active"`) — `"outline-color: var(--focusRingColor)"` entries.
 */
export function declarationsUnder(el: Element, pseudo: string): string[] {
  const out: string[] = [];
  for (const rule of cssRulesOf(el)) {
    if (!rule.includes(pseudo)) continue;
    const body = /\{([^{}]*)\}\s*\}?\s*$/.exec(rule)?.[1] ?? "";
    for (const decl of body.split(";")) {
      const trimmed = decl.trim();
      if (trimmed) out.push(trimmed);
    }
  }
  return out;
}

/** Whether `el` carries the kit focus ring (an outline under `:focus-visible`). */
export function hasFocusRing(el: Element): boolean {
  return declarationsUnder(el, ":focus-visible").some((d) => d.startsWith("outline-color"));
}

/** `"background-color: var(--color9)"` → `["background-color", "var(--color9)"]`. */
function splitDeclaration(decl: string): [string, string] {
  const at = decl.indexOf(":");
  return [decl.slice(0, at).trim(), decl.slice(at + 1).trim()];
}

/** The declarations in one rule's (innermost) body. */
function bodyOf(rule: string): string[] {
  const body = /\{([^{}]*)\}\s*\}?\s*$/.exec(rule)?.[1] ?? "";
  return body
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);
}

/**
 * The element's UNCONDITIONAL atomic styles as `{ "background-color": "var(--color9)" }`:
 * rules with no pseudo-class and no `@media` wrapper. v3 merges style slots per
 * (property, condition) before emitting, so each property has exactly one class —
 * the map is the resolved winner, not a cascade to reason about.
 */
export function baseStyle(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rule of cssRulesOf(el)) {
    if (rule.startsWith("@") || rule.includes(":where(:") || /\.[\w-]+:[a-z]/.test(rule)) continue;
    for (const decl of bodyOf(rule)) {
      const [prop, value] = splitDeclaration(decl);
      out[prop] = value;
    }
  }
  return out;
}

/** The element's styles under one pseudo (`":hover"`, `":active"`, `":focus-visible"`). */
export function stateStyle(el: Element, pseudo: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of declarationsUnder(el, pseudo)) {
    const [prop, value] = splitDeclaration(decl);
    out[prop] = value;
  }
  return out;
}
