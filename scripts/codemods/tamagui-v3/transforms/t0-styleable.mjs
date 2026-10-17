// T0: `Frame.styleable<P>(render, opts?)` → `styleable<P>(Frame, render, opts?)`,
// with `styleable` imported from "@knitui/core" (or relatively inside core).

import { ts, walk, dedupeEdits } from "../lib/ast.mjs";

export const id = "T0";

function importedNames(sf) {
  const names = new Map(); // local name → module
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const mod = st.moduleSpecifier.text;
    const ic = st.importClause;
    if (ic.name) names.set(ic.name.text, mod);
    const nb = ic.namedBindings;
    if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) names.set(el.name.text, mod);
    if (nb && ts.isNamespaceImport(nb)) names.set(nb.name.text, mod);
  }
  return names;
}

function declaresLocally(sf, name) {
  let found = false;
  walk(sf, (n) => {
    if (found) return false;
    if (
      (ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n)) &&
      n.name &&
      ts.isIdentifier(n.name) &&
      n.name.text === name
    ) {
      found = true;
    }
  });
  return found;
}

/** Edit that makes `styleable` importable from `mod` (null when already there). */
export function ensureNamedImport(sf, name, mod) {
  const decls = sf.statements.filter((s) => ts.isImportDeclaration(s));
  for (const d of decls) {
    if (d.moduleSpecifier.text !== mod || !d.importClause || d.importClause.isTypeOnly) continue;
    const nb = d.importClause.namedBindings;
    if (nb && ts.isNamedImports(nb)) {
      if (nb.elements.some((e) => e.name.text === name && !e.isTypeOnly)) return null;
      const last = nb.elements[nb.elements.length - 1];
      if (last) return { start: last.end, end: last.end, text: `, ${name}` };
      return { start: nb.getStart(sf) + 1, end: nb.getStart(sf) + 1, text: ` ${name} ` };
    }
  }
  const lastImport = decls[decls.length - 1];
  const text = `import { ${name} } from ${JSON.stringify(mod)};\n`;
  if (lastImport)
    return { start: lastImport.end, end: lastImport.end, text: `\n${text.trimEnd()}` };
  // after a leading "use client" directive, otherwise at the top
  const first = sf.statements[0];
  if (first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression)) {
    return { start: first.end, end: first.end, text: `\n${text.trimEnd()}` };
  }
  return { start: 0, end: 0, text };
}

export function run({ sf, ctx }) {
  const edits = [];
  const sites = [];
  walk(sf, (n) => {
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === "styleable" &&
      n.arguments.length >= 1 &&
      n.arguments.length <= 2
    ) {
      sites.push(n);
    }
  });
  if (!sites.length) return [];

  const imported = importedNames(sf);
  const mod = ctx.styleableModule(sf.fileName);
  const conflict =
    (imported.has("styleable") && imported.get("styleable") !== mod) ||
    (!imported.has("styleable") && declaresLocally(sf, "styleable"));
  if (conflict) {
    for (const n of sites)
      ctx.report("styleable-conflict", n, "a different `styleable` binding is in scope");
    return [];
  }

  for (const n of sites) {
    const recv = n.expression.expression.getText(sf);
    const ta = n.typeArguments ? `<${n.typeArguments.map((t) => t.getText(sf)).join(", ")}>` : "";
    const args = n.arguments.map((a) => a.getText(sf));
    // two minimal edits keep the receiver and the render function in place (so
    // report positions inside them stay exact): insert `styleable<P>(` before
    // the receiver, and turn `.styleable<P>(` into `, `
    const recvNode = n.expression.expression;
    let open = n.typeArguments ? n.typeArguments.end : n.expression.end;
    while (open < sf.text.length && sf.text[open] !== "(") open++;
    edits.push({
      start: recvNode.getStart(sf),
      end: recvNode.getStart(sf),
      text: `styleable${ta}(`,
      site: n,
      recv,
      args,
    });
    edits.push({ start: recvNode.end, end: open + 1, text: ", " });
  }
  const out = dedupeEdits(edits);
  for (const { site, recv, args } of out.filter((e) => e.site)) {
    ctx.report(
      "styleable-call",
      site,
      `${recv.length > 60 ? "<expr>" : recv}.styleable → styleable(…)`,
    );
    if (args.length === 2) {
      ctx.report(
        "styleable-opts",
        site,
        `options ${args[1].replace(/\s+/g, " ").slice(0, 80)}`,
        "check the option still exists on createStyledHOC",
      );
    }
  }
  const imp = ensureNamedImport(sf, "styleable", mod);
  if (imp) out.push(imp);
  return out;
}
