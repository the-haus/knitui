/**
 * Test helpers for asserting Tamagui v3's WEB output by behaviour, not by
 * class-name spelling (docs/v3/conventions.md §8). v3 emits short hashed atomic
 * classes (`_oc-847342144`, `_b-688726769`); the condition / value lives in the
 * injected CSS rule, so tests read the rules that target an element's classes.
 *
 * Not a test file (jest matches `*.test.ts(x)` only) and excluded from the lib
 * build by the `*.test.*` pattern.
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

/* -------------------------------------------------------------------------- */
/* Resting (unconditional) styles                                             */
/* -------------------------------------------------------------------------- */

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

/** A rule with no pseudo-class, no `:where(:…)` state wrapper and no `@media`. */
const isRestingRule = (rule: string) =>
  !rule.startsWith("@") && !rule.includes(":where(:") && !/\.[\w-]+:[a-z]/.test(rule);

/**
 * The RESTING declarations an element's atomic classes carry, e.g.
 * `"background-color: var(--color9)"`: the twin of {@link declarationsUnder} for
 * the no-pseudo, no-media state.
 *
 * Use these (not `toHaveStyle`) for any value that is a `var(...)`: jest-dom drops
 * custom-property values it cannot compute, so `toHaveStyle({ color: "var(--x)" })`
 * passes vacuously.
 */
export function baseDeclarations(el: Element): string[] {
  return cssRulesOf(el).filter(isRestingRule).flatMap(bodyOf);
}

/** The resting value of one CSS property (`"background-color"`), last rule wins. */
export function baseValue(el: Element, property: string): string | undefined {
  let out: string | undefined;
  for (const decl of baseDeclarations(el)) {
    const [prop, value] = splitDeclaration(decl);
    if (prop === property) out = value;
  }
  return out;
}

/**
 * The element's resting styles as `{ "background-color": "var(--color9)" }`. v3
 * merges style slots per (property, condition) before emitting, so each property
 * has one class: the map is the resolved winner, not a cascade to reason about.
 */
export function baseStyle(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of baseDeclarations(el)) {
    const [prop, value] = splitDeclaration(decl);
    out[prop] = value;
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

/**
 * The element's resting rules as one text blob (no `@media`, no state/pseudo
 * selectors), for `toContain("background-color: var(--color3)")` assertions.
 */
export function restingCss(el: Element): string {
  return cssRulesOf(el).filter(isRestingRule).join("\n");
}

const kebab = (prop: string) => prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * The EFFECTIVE resting value of one property (camel or kebab case), honouring
 * shorthands and specificity: among the unconditional declarations of `property`
 * and any `shorthands` that cover it, the most specific rule (v3 repeats the class
 * to raise specificity) wins, ties going to the later rule. Use this where a
 * longhand and a shorthand (`padding-left` vs `padding-inline`) can both apply.
 */
export function effectiveBaseValue(
  el: Element,
  property: string,
  shorthands: readonly string[] = [],
): string | undefined {
  const names = new Set([kebab(property), ...shorthands.map(kebab)]);
  let best: { specificity: number; value: string } | undefined;
  for (const rule of cssRulesOf(el)) {
    if (rule.startsWith("@")) continue;
    const selector = rule.slice(0, rule.indexOf("{")).trim();
    if (selector.includes(":")) continue;
    const specificity = (selector.match(/\./g) ?? []).length;
    for (const decl of bodyOf(rule)) {
      const [name, value] = splitDeclaration(decl);
      if (!names.has(name)) continue;
      if (!best || specificity >= best.specificity) best = { specificity, value };
    }
  }
  return best?.value;
}

/** Effective left / right padding of an element (longhand beats `padding-inline`). */
export const paddingX = (el: Element) => ({
  left: effectiveBaseValue(el, "paddingLeft", ["paddingInline", "padding"]),
  right: effectiveBaseValue(el, "paddingRight", ["paddingInline", "padding"]),
});

/** One property's value under a pseudo-element (`"::placeholder"`, `"::selection"`). */
export function pseudoStyle(el: Element, pseudo: string, property: string): string | undefined {
  const name = kebab(property);
  let out: string | undefined;
  for (const rule of cssRulesOf(el)) {
    if (!rule.includes(pseudo)) continue;
    for (const decl of bodyOf(rule)) {
      const [prop, value] = splitDeclaration(decl);
      if (prop === name) out = value;
    }
  }
  return out;
}
