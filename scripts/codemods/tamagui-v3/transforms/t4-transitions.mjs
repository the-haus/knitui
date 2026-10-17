// T4: transitions.
//   transition={["name", { opacity: "x" }]} → transition={{ preset: "name", opacity: "x" }}
//   animateOnly={["a", "b"]}               → transition.properties = "a, b"
//   animateOnly={[]}                       → transition="none"
// Applies to JSX attributes and to style objects (styled() base / variants /
// styles slots / style() pieces). Everything else that mentions animateOnly or
// a tuple transition is reported.

import {
  ts,
  walk,
  propName,
  unwrap,
  jsxAttrExpr,
  objKey,
  quote,
  memberRemovalRange,
} from "../lib/ast.mjs";
import { collectStyleObjects } from "../lib/context.mjs";

export const id = "T4";

const IDENT = /^[A-Za-z][\w-]*$/;
const PASS_KEYS = new Set(["enter", "exit"]);
const FAIL_KEYS = new Set([
  "stiffness",
  "damping",
  "mass",
  "velocity",
  "overshootClamping",
  "restDisplacementThreshold",
  "restSpeedThreshold",
  "tension",
  "friction",
  "bounciness",
  "speed",
  "type",
  "spring",
]);

function fail(reason) {
  return { ok: false, reason };
}

/** Parse the v2 transition expression into `{ preset?, duration?, delay?, enter?, exit?, props: [[k, text]] }`. */
function parseLegacy(expr, sf) {
  const e = unwrap(expr);
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
    if (!IDENT.test(e.text)) return fail(`transition "${e.text}" is a CSS timing, not a preset`);
    return { ok: true, kind: "string", preset: e.text, props: [] };
  }
  let opts = null;
  let preset;
  if (ts.isArrayLiteralExpression(e)) {
    const [p, o, ...rest] = e.elements;
    if (rest.length || !p) return fail("transition tuple has an unexpected shape");
    const pu = unwrap(p);
    if (!(ts.isStringLiteral(pu) || ts.isNoSubstitutionTemplateLiteral(pu)))
      return fail("transition tuple preset is not a literal");
    if (!IDENT.test(pu.text)) return fail(`transition "${pu.text}" is a CSS timing, not a preset`);
    preset = pu.text;
    if (o) {
      opts = unwrap(o);
      if (!ts.isObjectLiteralExpression(opts))
        return fail("transition tuple options are not an object literal");
    }
  } else if (ts.isObjectLiteralExpression(e)) {
    opts = e;
  } else {
    return fail("transition value is an expression");
  }
  const out = {
    ok: true,
    kind: ts.isArrayLiteralExpression(e) ? "tuple" : "object",
    preset,
    props: [],
    extra: [],
  };
  if (opts) {
    for (const m of opts.properties) {
      if (!ts.isPropertyAssignment(m)) return fail("transition options contain a spread / method");
      const key = propName(m);
      if (key === null) return fail("transition options contain a computed key");
      const v = unwrap(m.initializer);
      const isStr = ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v);
      const isNum = ts.isNumericLiteral(v);
      if (FAIL_KEYS.has(key))
        return fail(`transition option "${key}" needs a hand migration (spring / type)`);
      if (key === "default" || key === "preset") {
        if (!isStr) return fail("transition default is not a literal");
        out.preset = v.text;
        if (key === "default") out.legacyDefault = true;
      } else if (key === "duration" || key === "delay") {
        if (!isNum) return fail(`transition ${key} is not a number literal`);
        out[key] = Number(v.text);
      } else if (PASS_KEYS.has(key)) {
        if (!isStr) return fail(`transition ${key} is not a literal`);
        out[key] = v.text;
      } else if (key === "properties") {
        if (!isStr) return fail("transition properties is not a literal");
        out.properties = v.text;
      } else if (isStr) {
        out.props.push([key, v.text]);
      } else {
        return fail(`transition property "${key}" is not a string preset`);
      }
    }
  }
  return out;
}

function animateOnlyList(expr) {
  const e = unwrap(expr);
  if (!ts.isArrayLiteralExpression(e)) return null;
  const list = [];
  for (const el of e.elements) {
    const u = unwrap(el);
    if (!(ts.isStringLiteral(u) || ts.isNoSubstitutionTemplateLiteral(u))) return null;
    list.push(u.text);
  }
  return list;
}

/**
 * Migrate a (transition, animateOnly) pair. Returns
 * `{ ok, transitionText?: string (JS expression), category }`.
 */
export function migratePair(transitionExpr, animateOnlyExpr, sf) {
  let list = null;
  if (animateOnlyExpr) {
    list = animateOnlyList(animateOnlyExpr);
    if (list === null) return fail("animateOnly is not an array literal of strings");
    if (list.length === 0)
      return { ok: true, transitionText: quote("none"), category: "transition-none" };
  }
  if (!transitionExpr) {
    if (list) return fail("animateOnly without a transition at the same site");
    return { ok: true, transitionText: null };
  }
  const t = parseLegacy(transitionExpr, sf);
  if (!t.ok) {
    if (!list && !ts.isArrayLiteralExpression(unwrap(transitionExpr)))
      return { ok: true, transitionText: null };
    return t;
  }
  if (t.kind === "string" && !list) return { ok: true, transitionText: null };
  if (t.kind === "object" && !list && !t.legacyDefault) return { ok: true, transitionText: null };

  let props = t.props;
  if (list) {
    const allowed = new Set(list);
    props = props.filter(([k]) => allowed.has(k));
  }
  if (t.delay !== undefined && props.length) {
    // v2 applied the top-level delay to every per-property override
    props = props.map(([k, v]) => {
      if (!IDENT.test(v)) return [k, null];
      return [k, `{ preset: ${quote(v)}, delay: ${t.delay} }`];
    });
    if (props.some(([, v]) => v === null))
      return fail("transition delay with a CSS-timing property override");
  } else {
    props = props.map(([k, v]) => [k, quote(v)]);
  }

  // a single-element tuple with nothing else is just the preset string
  if (
    t.kind === "tuple" &&
    !list &&
    !props.length &&
    t.duration === undefined &&
    t.delay === undefined &&
    !t.enter &&
    !t.exit
  ) {
    return { ok: true, transitionText: quote(t.preset), category: "transition-tuple" };
  }

  const parts = [];
  if (t.preset !== undefined) parts.push(`preset: ${quote(t.preset)}`);
  if (t.duration !== undefined) parts.push(`duration: ${t.duration}`);
  if (t.delay !== undefined) parts.push(`delay: ${t.delay}`);
  if (t.enter !== undefined) parts.push(`enter: ${quote(t.enter)}`);
  if (t.exit !== undefined) parts.push(`exit: ${quote(t.exit)}`);
  for (const [k, v] of props) parts.push(`${objKey(k)}: ${v}`);
  const hasTiming = t.preset !== undefined || t.duration !== undefined;
  if (list && hasTiming) parts.push(`properties: ${quote(list.join(", "))}`);
  else if (t.properties !== undefined) parts.push(`properties: ${quote(t.properties)}`);
  return {
    ok: true,
    transitionText: `{ ${parts.join(", ")} }`,
    category: list ? "transition-animate-only" : "transition-tuple",
  };
}

export function run({ sf, ctx }) {
  const edits = [];
  const handled = new Set(); // nodes (attrs / members) consumed here

  // --- JSX ---
  walk(sf, (n) => {
    if (!(ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n))) return;
    const attrs = n.attributes.properties;
    const tr = attrs.find((a) => ts.isJsxAttribute(a) && propName(a) === "transition");
    const ao = attrs.find((a) => ts.isJsxAttribute(a) && propName(a) === "animateOnly");
    if (!tr && !ao) return;
    const trExpr = tr ? jsxAttrExpr(tr) : null;
    const aoExpr = ao ? jsxAttrExpr(ao) : null;
    if ((tr && !trExpr) || (ao && !aoExpr)) return;
    const res = migratePair(trExpr, aoExpr, sf);
    if (!res.ok) {
      ctx.report(
        "transition-manual",
        ao ?? tr,
        res.reason,
        'transition={{ preset, properties: "a, b" }}',
      );
      if (ao) handled.add(ao);
      if (tr) handled.add(tr);
      return;
    }
    if (res.transitionText === null) return;
    const attrText = res.transitionText.startsWith('"')
      ? `transition=${res.transitionText}`
      : `transition={${res.transitionText}}`;
    if (tr) edits.push({ start: tr.getStart(sf), end: tr.end, text: attrText });
    if (ao) {
      handled.add(ao);
      edits.push({ start: ao.getStart(sf), end: ao.end, text: tr ? "" : attrText });
    }
    ctx.report(res.category, tr ?? ao, attrText.replace(/\s+/g, " "));
  });

  // --- style objects ---
  const { objects } = collectStyleObjects(sf);
  for (const { obj } of objects) {
    const members = obj.properties.filter((m) => ts.isPropertyAssignment(m));
    const tr = members.find((m) => propName(m) === "transition");
    const ao = members.find((m) => propName(m) === "animateOnly");
    if (!tr && !ao) continue;
    const res = migratePair(tr?.initializer ?? null, ao?.initializer ?? null, sf);
    if (ao) handled.add(ao);
    if (!res.ok) {
      ctx.report(
        "transition-manual",
        ao ?? tr,
        res.reason,
        'transition: { preset, properties: "a, b" }',
      );
      continue;
    }
    if (res.transitionText === null) continue;
    if (tr)
      edits.push({
        start: tr.initializer.getStart(sf),
        end: tr.initializer.end,
        text: res.transitionText,
      });
    if (ao) {
      if (tr) edits.push({ ...memberRemovalRange(sf, ao), text: "" });
      else
        edits.push({
          start: ao.getStart(sf),
          end: ao.end,
          text: `transition: ${res.transitionText}`,
        });
    }
    ctx.report(res.category, tr ?? ao, `transition: ${res.transitionText}`);
  }

  // --- everything else: report ---
  walk(sf, (n) => {
    if (handled.has(n)) return false;
    if (ts.isIdentifier(n) && n.text === "animateOnly") {
      const p = n.parent;
      if (
        p &&
        (ts.isJsxAttribute(p) ||
          ts.isPropertyAssignment(p) ||
          ts.isShorthandPropertyAssignment(p)) &&
        handled.has(p)
      )
        return;
      ctx.report(
        "transition-manual",
        n,
        `animateOnly reference (${ts.SyntaxKind[p.kind]})`,
        "move into transition.properties",
      );
    }
    if (
      ts.isPropertyAssignment(n) &&
      propName(n) === "transition" &&
      ts.isArrayLiteralExpression(unwrap(n.initializer) ?? n)
    ) {
      if (!objects.some(({ obj }) => obj === n.parent)) {
        ctx.report(
          "transition-manual",
          n,
          "tuple transition in a plain object",
          '{ preset: "name", ...overrides }',
        );
      }
    }
  });
  return edits;
}
