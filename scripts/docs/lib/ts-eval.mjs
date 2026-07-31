/**
 * Static evaluation of TypeScript expression nodes — enough of it to read a
 * Storybook `meta` object out of a story file without executing the module.
 *
 * Story files are plain CSF: a default `meta` plus named `StoryObj` exports.
 * Their `args` / `argTypes` / `parameters` are almost always literal data, often
 * referencing a file-local `const` (`options: VARIANTS`, `options: [undefined,
 * ...SHADOWS]`). This evaluator resolves those, and represents everything it
 * cannot statically reduce as a tagged marker instead of throwing:
 *
 *   { $ref: "Button" }             an unresolved identifier (e.g. `component: Button`)
 *   { $fn: "(args) => …" }         a function / arrow (e.g. a story `render`)
 *   { $expr: "someCall()" }        any other irreducible expression
 *
 * The markers are what make the generated registry honest: the docs site can
 * still show the source text for anything it can't turn into structured data.
 */
import ts from "typescript";

/** Marker predicates, re-used by the generators. */
export const isRef = (v) => !!v && typeof v === "object" && typeof v.$ref === "string";
export const isFn = (v) => !!v && typeof v === "object" && typeof v.$fn === "string";
export const isExpr = (v) => !!v && typeof v === "object" && typeof v.$expr === "string";
export const isMarker = (v) => isRef(v) || isFn(v) || isExpr(v);

/** The original source text behind a marker — what a snippet should print. */
export const markerSource = (v) =>
  isRef(v) ? v.$ref : isFn(v) ? v.$fn : isExpr(v) ? v.$expr : undefined;

/**
 * Collect every top-level `const NAME = <initializer>` in a source file, so
 * identifier references inside `meta` can be resolved (`options: VARIANTS`).
 */
export function collectTopLevelConsts(sourceFile) {
  const scope = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer) {
        scope.set(decl.name.text, decl.initializer);
      }
    }
  }
  return scope;
}

/** Unwrap `x as const`, `x satisfies T`, `(x)`, `x!`. */
export function unwrap(node) {
  let current = node;
  for (;;) {
    if (
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isTypeAssertionExpression?.(current)
    ) {
      current = current.expression;
      continue;
    }
    return current;
  }
}

/**
 * Reduce an expression node to JSON-serialisable data, or to a marker.
 *
 * `scope` is the file's top-level const map (see {@link collectTopLevelConsts}),
 * used to follow identifier references one hop at a time. `seen` guards against
 * a const that references itself.
 */
export function evalNode(node, sourceFile, scope, seen = new Set()) {
  if (!node) return undefined;
  const n = unwrap(node);
  const text = () => n.getText(sourceFile);

  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isNumericLiteral(n)) return Number(n.text);
  if (n.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (n.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (n.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(n) && n.text === "undefined") return undefined;

  // -x / +x — common in offset/degree args.
  if (ts.isPrefixUnaryExpression(n) && ts.isNumericLiteral(n.operand)) {
    const value = Number(n.operand.text);
    if (n.operator === ts.SyntaxKind.MinusToken) return -value;
    if (n.operator === ts.SyntaxKind.PlusToken) return value;
  }

  // Constant folding for the two operator forms story args actually use:
  // arithmetic (`ratio: 16 / 9`) and string concatenation (a long `children`
  // paragraph split across source lines). Both reduce to real data, so the
  // playground gets a usable control instead of an opaque marker.
  if (ts.isBinaryExpression(n)) {
    const left = evalNode(n.left, sourceFile, scope, seen);
    const right = evalNode(n.right, sourceFile, scope, seen);
    const operator = n.operatorToken.kind;
    if (
      operator === ts.SyntaxKind.PlusToken &&
      typeof left === "string" &&
      typeof right === "string"
    ) {
      return left + right;
    }
    if (typeof left === "number" && typeof right === "number") {
      if (operator === ts.SyntaxKind.PlusToken) return left + right;
      if (operator === ts.SyntaxKind.MinusToken) return left - right;
      if (operator === ts.SyntaxKind.AsteriskToken) return left * right;
      if (operator === ts.SyntaxKind.SlashToken) return left / right;
      if (operator === ts.SyntaxKind.PercentToken) return left % right;
      if (operator === ts.SyntaxKind.AsteriskAsteriskToken) return left ** right;
    }
    return { $expr: text() };
  }

  if (ts.isArrayLiteralExpression(n)) {
    const out = [];
    for (const element of n.elements) {
      if (ts.isSpreadElement(element)) {
        const spread = evalNode(element.expression, sourceFile, scope, seen);
        if (Array.isArray(spread)) out.push(...spread);
        else out.push({ $expr: element.getText(sourceFile) });
        continue;
      }
      out.push(evalNode(element, sourceFile, scope, seen));
    }
    return out;
  }

  if (ts.isObjectLiteralExpression(n)) {
    const out = {};
    for (const prop of n.properties) {
      if (ts.isSpreadAssignment(prop)) {
        const spread = evalNode(prop.expression, sourceFile, scope, seen);
        if (spread && typeof spread === "object" && !Array.isArray(spread)) Object.assign(out, spread);
        continue;
      }
      const key = propertyName(prop.name, sourceFile);
      if (key == null) continue;
      if (ts.isPropertyAssignment(prop)) {
        out[key] = evalNode(prop.initializer, sourceFile, scope, seen);
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        out[key] = evalNode(prop.name, sourceFile, scope, seen);
      } else if (ts.isMethodDeclaration(prop)) {
        out[key] = { $fn: prop.getText(sourceFile) };
      }
    }
    return out;
  }

  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) return { $fn: text() };
  if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
    return { $expr: text() };
  }

  if (ts.isIdentifier(n)) {
    const name = n.text;
    if (scope.has(name) && !seen.has(name)) {
      const next = new Set(seen).add(name);
      return evalNode(scope.get(name), sourceFile, scope, next);
    }
    return { $ref: name };
  }

  // `SOME_TABLE.key` where SOME_TABLE is a local const object.
  if (ts.isPropertyAccessExpression(n)) {
    const target = evalNode(n.expression, sourceFile, scope, seen);
    if (target && typeof target === "object" && !isMarker(target) && n.name.text in target) {
      return target[n.name.text];
    }
    return { $expr: text() };
  }

  return { $expr: text() };
}

/** The static key of an object-literal property, when it has one. */
function propertyName(name, sourceFile) {
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name)) {
    const inner = unwrap(name.expression);
    if (ts.isStringLiteral(inner) || ts.isNumericLiteral(inner)) return inner.text;
    return name.getText(sourceFile);
  }
  return null;
}

/**
 * The JSDoc/leading-comment prose attached to a node, as plain text.
 *
 * Most stories in this repo carry a one-or-two-line `/** … *\/` above the
 * export — free, already-written caption copy for the docs site.
 */
export function leadingDoc(node, sourceFile) {
  const full = sourceFile.getFullText();
  const ranges = ts.getLeadingCommentRanges(full, node.getFullStart()) ?? [];
  const blocks = ranges
    .filter((r) => r.kind === ts.SyntaxKind.MultiLineCommentTrivia)
    .map((r) => full.slice(r.pos, r.end))
    .filter((c) => c.startsWith("/**"));
  if (!blocks.length) return undefined;

  return (
    blocks[blocks.length - 1]
      .replace(/^\/\*\*/, "")
      .replace(/\*\/$/, "")
      .split("\n")
      .map((line) => line.replace(/^\s*\*/, "").trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim() || undefined
  );
}

/** Find `const meta = {…}` (or `const meta: Meta<T> = {…}`) in a story file. */
export function findMetaNode(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === "meta" && decl.initializer) {
        const init = unwrap(decl.initializer);
        if (ts.isObjectLiteralExpression(init)) return init;
      }
    }
  }
  return undefined;
}

/**
 * The exported story declarations of a story file, in source order:
 * `[{ name, objectLiteral, node, doc }]`. `export default meta` is skipped.
 */
export function findStoryExports(sourceFile) {
  const out = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      if (decl.name.text === "meta") continue;
      const init = unwrap(decl.initializer);
      if (!ts.isObjectLiteralExpression(init)) continue;
      out.push({
        name: decl.name.text,
        objectLiteral: init,
        node: statement,
        doc: leadingDoc(statement, sourceFile),
      });
    }
  }
  return out;
}

/** The object-literal property node for `key`, if present. */
export function getProperty(objectLiteral, key) {
  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop) && !ts.isMethodDeclaration(prop)) continue;
    const name = prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) ? prop.name.text : null;
    if (name === key) return prop;
  }
  return undefined;
}

export { ts };
