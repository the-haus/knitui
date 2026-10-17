/**
 * Test helpers for asserting Tamagui v3's WEB output by behaviour, not by
 * class-name spelling (docs/v3/conventions.md §8): v3 emits short hashed atomic
 * classes, and the condition / value lives in the injected CSS rule, so tests
 * read the rules that target an element's classes. Mirrors the components
 * package helper. Not a test file (jest matches `*.test.ts(x)` only).
 */

/** Every CSS rule text currently in the document (grouping rules flattened). */
export function allCssRules(): string[] {
  const out: string[] = [];
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      out.push(rule.cssText);
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested && !(rule instanceof CSSStyleRule)) visit(nested);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // unreadable sheet
    }
  }
  return out;
}

const escape = (cls: string) => cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The CSS rules that target one of `el`'s atomic classes. */
export function cssRulesOf(el: Element): string[] {
  const classes = Array.from(el.classList).filter((c) => c.startsWith("_"));
  const matchers = classes.map((c) => new RegExp(`\\.${escape(c)}(?![\\w-])`));
  return allCssRules().filter((rule) => matchers.some((m) => m.test(rule)));
}

/** All declarations (`"opacity: 0"`) `el`'s atomic rules carry, under any selector. */
export function declarationsOf(el: Element): string[] {
  const out: string[] = [];
  for (const rule of cssRulesOf(el)) {
    const body = /\{([^{}]*)\}\s*\}?\s*$/.exec(rule)?.[1] ?? "";
    for (const decl of body.split(";")) {
      const trimmed = decl.trim();
      if (trimmed) out.push(trimmed);
    }
  }
  return out;
}

/** The element's resolved inline + atomic style text, for loose assertions. */
export function styleTextOf(el: Element): string {
  return [el.getAttribute("style") ?? "", ...cssRulesOf(el)].join("\n");
}
