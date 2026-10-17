// T7 (report only): v2 constructs with no mechanical v3 spelling that the
// other transforms do not already report.
//   - spread / function variants (`"...size"`, `":string"`, plain functions) → styled.dynamic

import { ts, propName, unwrap } from "../lib/ast.mjs";
import { collectStyleObjects } from "../lib/context.mjs";

export const id = "T7";

export function run({ sf, ctx }) {
  const { variantGroups, styledConfigs } = collectStyleObjects(sf);
  for (const cfg of styledConfigs) {
    for (const m of cfg.properties) {
      if (!ts.isPropertyAssignment(m) || propName(m) !== "variants") continue;
      const variants = unwrap(m.initializer);
      if (!variants || !ts.isObjectLiteralExpression(variants)) {
        ctx.report("variant-function", m, "variants is not an object literal");
        continue;
      }
      for (const g of variants.properties) {
        if (ts.isSpreadAssignment(g)) {
          ctx.report(
            "variant-function",
            g,
            `variants spread ${g.expression.getText(sf).slice(0, 60)}`,
            "inline the groups; keep variant bodies static",
          );
          continue;
        }
        const v = ts.isPropertyAssignment(g) ? unwrap(g.initializer) : null;
        if (v && !ts.isObjectLiteralExpression(v)) {
          ctx.report(
            "variant-function",
            g,
            `variant group "${propName(g)}" = ${v.getText(sf).replace(/\s+/g, " ").slice(0, 60)}`,
            "styled.dynamic<T>(…) or a literal group generated at module scope",
          );
        }
      }
    }
  }
  for (const group of variantGroups) {
    for (const m of group.properties) {
      if (!ts.isPropertyAssignment(m) && !ts.isMethodDeclaration(m)) continue;
      const key = propName(m);
      const v = ts.isPropertyAssignment(m) ? unwrap(m.initializer) : m;
      const isFn =
        v && (ts.isArrowFunction(v) || ts.isFunctionExpression(v) || ts.isMethodDeclaration(v));
      const spreadKey = key && (key.startsWith("...") || key.startsWith(":"));
      if (isFn || spreadKey || (v && ts.isIdentifier(v)) || (v && ts.isCallExpression(v))) {
        const what = isFn
          ? "function"
          : v && !ts.isObjectLiteralExpression(v)
            ? "non-literal"
            : "spread-key";
        ctx.report(
          "variant-function",
          m,
          `variant "${key}" (${what})`,
          "styled.dynamic<T>((value, env) => ({ … }))",
        );
      }
    }
  }
  return [];
}
