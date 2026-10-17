// T1 + T2: drop the `$` sigil.
//
// T1  "$md" → "md" for string literals (and literal types). In `kit` mode every
//     token-shaped literal in the scanned files is a token (tables such as
//     controlMetrics, variant-colors and motion recipes included); in
//     `consumer` mode only literals in a style position are touched.
//     `$${x}` templates → `${x}`.
// T2  variant keys `$md: {...}` → `md: {...}` inside styled() `variants`.
//
// Everything else that still carries a `$` token (compound strings, dot paths,
// `$true`, runtime sigil checks, media-condition props) is reported.

import { ts, walk, propName, calleeName } from "../lib/ast.mjs";
import { collectStyleObjects, styleContextOf } from "../lib/context.mjs";
import {
  TOKEN_RE,
  DOT_TOKEN_RE,
  EXCLUDED_DOLLAR_NAMES,
  REMOVED_TOKENS,
  LITERAL_DOLLAR_ATTRS,
  stripToken,
} from "../lib/style-props.mjs";

export const id = "T1";

const TOKEN_API = new Set([
  "getTokenValue",
  "getToken",
  "getVariableValue",
  "getVariable",
  "getSize",
  "getSpace",
  "getRadius",
  "getFontSize",
  "getLineHeight",
  "getFontSized",
  "getTokenRelative",
]);
const MONEY_HINT = /price|amount|cost|total|currency|toFixed|toLocaleString|format/i;
const SIGIL_METHODS = new Set([
  "startsWith",
  "endsWith",
  "includes",
  "indexOf",
  "replace",
  "replaceAll",
  "split",
]);

function enclosingAttrName(node) {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isJsxAttribute(n)) return propName(n);
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) return null;
  }
  return null;
}

/** Rendered JSX text (a child expression's value), where a `$` is user-visible text. */
function inJsxChildren(node) {
  let n = node;
  for (;;) {
    const p = n.parent;
    if (!p) return false;
    if (ts.isParenthesizedExpression(p) || ts.isTemplateSpan(p) || ts.isTemplateExpression(p)) {
      n = p;
      continue;
    }
    if (ts.isConditionalExpression(p) && p.condition !== n) {
      n = p;
      continue;
    }
    if (
      ts.isBinaryExpression(p) &&
      p.right === n &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
        ts.SyntaxKind.PlusToken,
      ].includes(p.operatorToken.kind)
    ) {
      n = p;
      continue;
    }
    return (
      ts.isJsxExpression(p) &&
      !!p.parent &&
      (ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent))
    );
  }
}

function isModuleSpecifier(node) {
  const p = node.parent;
  return (
    p &&
    (ts.isImportDeclaration(p) ||
      ts.isExportDeclaration(p) ||
      ts.isExternalModuleReference(p) ||
      (ts.isLiteralTypeNode(p) && p.parent && ts.isImportTypeNode(p.parent)) ||
      (ts.isCallExpression(p) &&
        (p.expression.kind === ts.SyntaxKind.ImportKeyword || calleeName(p) === "require")))
  );
}

function isPropertyKey(node) {
  const p = node.parent;
  return (
    p &&
    (ts.isPropertyAssignment(p) ||
      ts.isPropertySignature(p) ||
      ts.isMethodDeclaration(p) ||
      ts.isPropertyDeclaration(p) ||
      ts.isEnumMember(p)) &&
    p.name === node
  );
}

export function run({ sf, ctx }) {
  const edits = [];
  const kit = ctx.mode === "kit";
  const { variantGroups, styledConfigs } = collectStyleObjects(sf);

  const inStylePosition = (node) => styleContextOf(node, styledConfigs);

  walk(sf, (n) => {
    // --- string literals / literal types ---
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const text = n.text;
      if (!text.includes("$")) return;
      if (isModuleSpecifier(n)) return;
      if (inJsxChildren(n)) return; // visible text, not a token
      const attr = enclosingAttrName(n);
      if (attr && LITERAL_DOLLAR_ATTRS.has(attr)) return;

      if (isPropertyKey(n)) {
        handleKey(n, text);
        return;
      }
      if (text === "$") {
        handleBareSigil(n);
        return;
      }
      if (EXCLUDED_DOLLAR_NAMES.has(text)) return;
      if (REMOVED_TOKENS.has(text)) {
        ctx.report(
          "token-removed",
          n,
          `${text} has no v3 equivalent`,
          "delete the key / use the controlMetrics default (md)",
        );
        return;
      }
      if (DOT_TOKEN_RE.test(text)) {
        ctx.report("token-dot-path", n, `"${text}"`, "rename to one flat token name");
        return;
      }
      const stripped = stripToken(text);
      if (stripped !== null) {
        const pos = inStylePosition(n);
        if (!kit && !pos) {
          ctx.report(
            "token-out-of-context",
            n,
            `"${text}"`,
            `"${stripped}" if this reaches a style prop`,
          );
          return;
        }
        const raw = n.getText(sf);
        edits.push({ start: n.getStart(sf), end: n.end, text: raw[0] + raw.slice(2) });
        const isType = n.parent && ts.isLiteralTypeNode(n.parent);
        ctx.report(isType ? "token-literal-type" : "token-literal", n, text, undefined, {
          context: pos ?? "table",
        });
        reportTokenApi(n);
        return;
      }
      if (
        /\$[A-Za-z]/.test(text) &&
        (/`/.test(text) || /[A-Za-z]{2,}[,.]?\s+[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(text))
      ) {
        ctx.report(
          "token-prose",
          n,
          `"${text.length > 70 ? text.slice(0, 70) + "…" : text}"`,
          "docs text: update the spelling by hand",
        );
        return;
      }
      if (/\$[A-Za-z]/.test(text)) {
        ctx.report(
          "token-compound",
          n,
          `"${text.length > 70 ? text.slice(0, 70) + "…" : text}"`,
          "resolve the token at runtime (theme / getTokenValue) or use a v3 variable",
        );
      }
      return;
    }

    // --- identifier keys `$md:` ---
    if (ts.isIdentifier(n) && n.text.startsWith("$") && isPropertyKey(n)) {
      handleKey(n, n.text);
      return;
    }

    // --- JSX attributes named `$sm` / `$platform-web` / `$theme-dark` / `$group-*` ---
    if (ts.isJsxAttribute(n)) {
      const name = propName(n);
      if (name && name.startsWith("$")) {
        ctx.report(
          "media-prop",
          n,
          `${name}={…}`,
          `fold into each prop as ${name.replace(/^\$(platform-|theme-)?/, "")}: clauses`,
        );
      }
      return;
    }

    // --- templates ---
    if (
      ts.isTemplateExpression(n) ||
      ts.isTemplateLiteralTypeNode?.(n) ||
      n.kind === ts.SyntaxKind.TemplateLiteralType
    ) {
      handleTemplate(n);
      return;
    }

    // --- regex literals that detect the sigil ---
    if (n.kind === ts.SyntaxKind.RegularExpressionLiteral && /\\\$/.test(n.getText(sf))) {
      ctx.report(
        "sigil-detection",
        n,
        `regex ${n.getText(sf)}`,
        "use core isToken()/resolveToken()",
      );
    }
  });

  function handleKey(node, text) {
    const owner = node.parent?.parent;
    if (!TOKEN_RE.test(text) || EXCLUDED_DOLLAR_NAMES.has(text)) return;
    if (owner && variantGroups.has(owner)) {
      const raw = node.getText(sf);
      const replacement = ts.isIdentifier(node) ? raw.slice(1) : raw[0] + raw.slice(2);
      edits.push({ start: node.getStart(sf), end: node.end, text: replacement });
      ctx.report("token-variant-key", node, `${text} → ${text.slice(1)}`);
      return;
    }
    if (
      /^\$(xs|sm|md|lg|xl|xxs|xxl|gt\w+|max\w+|platform-|theme-|group-)/.test(text) &&
      owner &&
      styleContextOf(owner, styledConfigs)
    ) {
      ctx.report(
        "media-prop",
        node,
        `${text} key in a style object`,
        `fold into each prop as ${text.slice(1)}: clauses`,
      );
      return;
    }
    ctx.report("token-key-unknown", node, `${text} key`);
  }

  function handleBareSigil(node) {
    if (inJsxChildren(node)) return;
    const p = node.parent;
    if (!p) return;
    if (
      ts.isCallExpression(p) &&
      ts.isPropertyAccessExpression(p.expression) &&
      SIGIL_METHODS.has(p.expression.name.text)
    ) {
      ctx.report(
        "sigil-detection",
        p,
        p.getText(sf).replace(/\s+/g, " ").slice(0, 80),
        "use core isToken()/resolveToken()",
      );
      return;
    }
    if (ts.isBinaryExpression(p)) {
      const op = p.operatorToken.kind;
      if (
        op === ts.SyntaxKind.PlusToken ||
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken
      ) {
        ctx.report(
          "sigil-detection",
          p,
          p.getText(sf).replace(/\s+/g, " ").slice(0, 80),
          "use core isToken()/resolveToken()",
        );
      }
    }
  }

  function reportTokenApi(node) {
    let arg = node;
    while (
      arg.parent &&
      (ts.isAsExpression(arg.parent) ||
        ts.isParenthesizedExpression(arg.parent) ||
        ts.isSatisfiesExpression?.(arg.parent))
    )
      arg = arg.parent;
    const call = arg.parent;
    if (!call || !ts.isCallExpression(call) || call.arguments[0] !== arg) return;
    const name = calleeName(call)?.split(".").pop();
    if (name && TOKEN_API.has(name)) {
      ctx.report(
        "token-api-call",
        call,
        `${name}(${node.getText(sf)})`,
        "confirm the v3 API resolves a bare name",
      );
    }
  }

  function handleTemplate(n) {
    const head = n.head;
    const spans = n.templateSpans;
    const attr = enclosingAttrName(n);
    if (attr && LITERAL_DOLLAR_ATTRS.has(attr)) return;
    const pieces = [head.text, ...spans.map((s) => s.literal.text)];
    const isType = !ts.isTemplateExpression(n);
    if (head.text === "$" && spans.length >= 1) {
      const spanText = spans
        .map((s) => s.expression?.getText(sf) ?? s.type?.getText(sf) ?? "")
        .join(" ");
      const visible = inJsxChildren(n) || MONEY_HINT.test(spanText);
      const restHasToken = pieces.slice(1).some((t) => /\$[A-Za-z]/.test(t) || t.endsWith("$"));
      if (visible || restHasToken) {
        ctx.report(
          "token-template-compound",
          n,
          n.getText(sf).slice(0, 80),
          "looks like visible text or a compound token; check by hand",
        );
        return;
      }
      const start = head.getStart(sf) + 1; // the `$` after the backtick
      edits.push({ start, end: start + 1, text: "" });
      ctx.report(
        "token-template",
        n,
        n.getText(sf).replace(/\s+/g, " ").slice(0, 80) + (isType ? " (type)" : ""),
      );
      if (!isType) reportTokenApi(n);
      return;
    }
    if (pieces.some((t) => /\$[A-Za-z]/.test(t) || (t.endsWith("$") && t !== ""))) {
      if (inJsxChildren(n)) return;
      ctx.report(
        "token-template-compound",
        n,
        n.getText(sf).replace(/\s+/g, " ").slice(0, 80),
        "resolve the token at runtime or rebuild without the sigil",
      );
    }
  }

  return edits;
}
