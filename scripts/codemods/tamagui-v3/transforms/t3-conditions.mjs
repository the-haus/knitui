// T3: v2 condition objects → v3 flat values.
//
//   bg="$color2" hoverStyle={{ bg: "$color3" }}      → bg="color2 hover:color3"
//   hoverStyle={{ bg: "$color3" }}                   → bg="hover:color3"
//   bg={c} hoverStyle={{ bg: "$color3" }}            → bg={{ default: c, hover: "$color3" }}
//   { backgroundColor: "x", pressStyle: { ... } }    (styled base / variant body / styles slot)
//
// Literal base + literal conditions → string form; any expression → object form
// (T1 strips the `$` inside it afterwards). Dynamic condition values, spreads
// that may reorder the property, nested conditions and unconvertible values are
// reported (T7) and left untouched.

import {
  ts,
  walk,
  propName,
  unwrap,
  jsxAttrExpr,
  literalOf,
  objKey,
  quote,
  memberRemovalRange,
} from "../lib/ast.mjs";
import { collectStyleObjects, looksLikeStyleObject } from "../lib/context.mjs";
import {
  CONDITION_KEYS,
  CONDITION_MODIFIERS,
  LEGACY_TRANSFORM_PARTS,
  longhand,
  numberPayload,
  stringPayload,
  stripToken,
  compactParens,
  TOKEN_RE,
} from "../lib/style-props.mjs";

export const id = "T3";

/**
 * Spreads whose (v3, hand-rewritten) contents are known, so a condition next
 * to them is not an ordering hazard unless they touch the same property.
 */
export const SAFE_SPREADS = {
  focusRingStyle: ["outlineWidth", "outlineStyle", "outlineColor", "outlineOffset"],
  pressScaleStyle: ["scale"],
  webCursor: ["cursor"],
};

/** Files whose condition tables are hand-rewritten (plan §8); report only. */
export const HAND_TABLE_FILES = [
  /packages\/components\/src\/internal\/variant-colors\.ts$/,
  /packages\/components\/src\/internal\/style-props\.ts$/,
  /packages\/components\/src\/internal\/motion\.ts$/,
  /packages\/core\/src\/config\/motion\.ts$/,
  /packages\/components\/src\/internal\/focus-ring\.ts$/,
];

const MEDIA_KEY = /^\$/;

/** Props that are often a component *variant* rather than a style prop. */
const VARIANT_PRONE = new Set(["color", "size", "radius", "variant", "gap", "spacing"]);
/** Hosts where those names are known to be plain style props. */
const PRIMITIVE_TAGS = new Set([
  "Box",
  "Text",
  "View",
  "Stack",
  "XStack",
  "YStack",
  "Flex",
  "Center",
  "Paper",
  "UnstyledButton",
  "Group",
  "Anchor",
]);

function spreadName(expr) {
  const e = unwrap(expr);
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  if (ts.isCallExpression(e)) return spreadName(e.expression);
  return null;
}

/** Normalised member list of a JSX element or an object literal. */
function membersOf(container) {
  const isJsx = ts.isJsxOpeningElement(container) || ts.isJsxSelfClosingElement(container);
  const raw = isJsx ? container.attributes.properties : container.properties;
  return raw.map((node, index) => {
    if (ts.isJsxSpreadAttribute(node) || ts.isSpreadAssignment(node)) {
      return { node, index, spread: true, spreadName: spreadName(node.expression) };
    }
    const name = propName(node);
    let value = null;
    if (ts.isJsxAttribute(node)) value = jsxAttrExpr(node);
    else if (ts.isPropertyAssignment(node)) value = node.initializer;
    else if (ts.isShorthandPropertyAssignment(node)) value = node.name;
    return { node, index, name, value, spread: false, isJsx };
  });
}

function isProgramString(text) {
  return /\s[\w@/-]+:\S/.test(text) || /^[\w@/-]+:\S/.test(text);
}

/**
 * Plan + emit the conversion of one container. Returns edits.
 */
function convertContainer(container, sf, ctx, label) {
  const isJsx = ts.isJsxOpeningElement(container) || ts.isJsxSelfClosingElement(container);
  const members = membersOf(container);
  const conds = members.filter((m) => !m.spread && CONDITION_KEYS.has(m.name));
  if (!conds.length) return [];

  // 1. validate each condition member → contributions
  const ok = [];
  for (const c of conds) {
    const obj = c.value && unwrap(c.value);
    if (!obj || !ts.isObjectLiteralExpression(obj)) {
      const text = c.value ? c.value.getText(sf).replace(/\s+/g, " ").slice(0, 80) : "(no value)";
      ctx.report("condition-dynamic", c.node, `${c.name}={${text}}`, suggestDynamic(c.name, text));
      continue;
    }
    const contributions = [];
    let bad = null;
    for (const p of obj.properties) {
      if (ts.isSpreadAssignment(p)) {
        bad = ["condition-dynamic", `${c.name} spreads ${p.expression.getText(sf)}`];
        break;
      }
      const name = propName(p);
      if (name === null) {
        bad = ["condition-dynamic", `${c.name} has a computed key`];
        break;
      }
      if (CONDITION_KEYS.has(name) || MEDIA_KEY.test(name)) {
        bad = ["condition-nested", `${c.name}.${name}`];
        break;
      }
      if (name === "transition" || name === "animateOnly") {
        bad = ["condition-unsupported-value", `${c.name}.${name} (per-state transition)`];
        break;
      }
      if (LEGACY_TRANSFORM_PARTS.has(name)) {
        bad = [
          "condition-unsupported-value",
          `${c.name}.${name} has no flat spelling (only x, y, scale, scaleX, scaleY, rotate)`,
        ];
        break;
      }
      const value = ts.isShorthandPropertyAssignment(p) ? p.name : p.initializer;
      const lit = literalOf(value);
      const raw = unwrap(value);
      if (
        raw &&
        (raw.kind === ts.SyntaxKind.NullKeyword ||
          (ts.isIdentifier(raw) && raw.text === "undefined"))
      ) {
        bad = [
          "condition-unsupported-value",
          `${c.name}.${name} is ${raw.getText(sf)} (v2 "no override"); drop it or pick a real value`,
        ];
        break;
      }
      if (lit && lit.kind === "string" && lit.value === "") {
        bad = ["condition-unsupported-value", `${c.name}.${name} is an empty string`];
        break;
      }
      if (lit && lit.kind === "string" && stringPayload(lit.value).compound) {
        bad = [
          "condition-unsupported-value",
          `${c.name}.${name} = "${lit.value}" embeds a $token in a compound value`,
        ];
        break;
      }
      contributions.push({ prop: name, expr: value, lit, mod: CONDITION_MODIFIERS[c.name] });
    }
    if (bad) {
      ctx.report(bad[0], c.node, bad[1]);
      continue;
    }
    ok.push({ member: c, contributions });
  }
  if (!ok.length) return [];

  // 2. group by target property
  const targets = new Map(); // longhand → target
  for (const { member, contributions } of ok) {
    for (const contrib of contributions) {
      const lh = longhand(contrib.prop);
      let t = targets.get(lh);
      if (!t) {
        const bases = members.filter(
          (m) => !m.spread && !CONDITION_KEYS.has(m.name) && m.name && longhand(m.name) === lh,
        );
        t = { lh, key: contrib.prop, bases, anchor: member, clauses: [] };
        targets.set(lh, t);
      }
      t.clauses.push(contrib);
    }
  }

  // 3. site-level hazards
  if (isJsx) {
    const tag = container.tagName.getText(sf);
    const risky = [...targets.values()].find(
      (t) => VARIANT_PRONE.has(t.key) && !PRIMITIVE_TAGS.has(tag),
    );
    if (risky) {
      for (const { member } of ok)
        ctx.report(
          "condition-variant-risk",
          member.node,
          `${label}: ${member.name} sets "${risky.key}", which may be a variant of <${tag}>`,
          `if ${risky.key} is a style prop: ${risky.key}="… ${risky.clauses[0].mod}:…"`,
        );
      return [];
    }
  }
  for (const t of targets.values()) {
    if (t.bases.length > 1) {
      for (const { member } of ok)
        ctx.report(
          "condition-duplicate-target",
          member.node,
          `${member.name}: ${t.bases.map((b) => b.name).join(" + ")} both set ${t.lh}`,
        );
      return [];
    }
    const base = t.bases[0];
    const pos = base ? base.index : t.anchor.index;
    const hazard = members.find(
      (m) =>
        m.spread &&
        m.index > pos &&
        !(SAFE_SPREADS[m.spreadName] && !SAFE_SPREADS[m.spreadName].includes(t.lh)),
    );
    if (hazard) {
      for (const { member } of ok) {
        if (member === t.anchor) continue;
        ctx.report(
          "condition-spread-order",
          member.node,
          `${label}: ${member.name} (same site as ${t.anchor.name})`,
        );
      }
      ctx.report(
        "condition-spread-order",
        t.anchor.node,
        `${label}: ${t.anchor.name} → ${t.key}, but ${hazard.node.getText(sf).replace(/\s+/g, " ").slice(0, 50)} comes after ${base ? `the ${base.name} base` : "it"}`,
        `move the spread before ${base ? base.name : t.key}, then rewrite as ${t.key}="… ${t.clauses[0].mod}:…"`,
      );
      return [];
    }
    if (base && base.value === null) {
      ctx.report("condition-unsupported-value", base.node, `${base.name} has no value expression`);
      return [];
    }
  }

  // 4. build values
  const edits = [];
  const anchored = new Map(); // condition member → [text]
  for (const { member } of ok) anchored.set(member, []);
  for (const t of targets.values()) {
    const base = t.bases[0];
    const key = base ? base.name : t.key;
    const value = buildValue(t, base, sf);
    if (value === null) {
      ctx.report(
        "condition-unsupported-value",
        t.anchor.node,
        `${t.key}: base already holds a clause program; merge by hand`,
      );
      return [];
    }
    if (base) {
      if (isJsx)
        edits.push({
          start: base.node.initializer.getStart(sf),
          end: base.node.initializer.end,
          text: jsxValue(value),
        });
      else if (ts.isShorthandPropertyAssignment(base.node))
        edits.push({
          start: base.node.getStart(sf),
          end: base.node.end,
          text: `${key}: ${objValue(value)}`,
        });
      else
        edits.push({
          start: base.node.initializer.getStart(sf),
          end: base.node.initializer.end,
          text: objValue(value),
        });
    } else {
      anchored
        .get(t.anchor)
        .push(isJsx ? `${key}=${jsxValue(value)}` : `${objKey(key)}: ${objValue(value)}`);
    }
  }
  for (const { member } of ok) {
    const texts = anchored.get(member);
    if (isJsx)
      edits.push({ start: member.node.getStart(sf), end: member.node.end, text: texts.join(" ") });
    else if (texts.length)
      edits.push({ start: member.node.getStart(sf), end: member.node.end, text: texts.join(", ") });
    else edits.push({ ...memberRemovalRange(sf, member.node), text: "" });
    ctx.report(
      "condition-merged",
      member.node,
      `${label}: ${member.name} → ${[...targets.values()]
        .filter((t) => t.clauses.some((c) => c.mod === CONDITION_MODIFIERS[member.name]))
        .map((t) => (t.bases[0] ? t.bases[0].name : t.key))
        .join(", ")}`,
    );
  }
  return edits;
}

function suggestDynamic(name, text) {
  const mod = CONDITION_MODIFIERS[name];
  if (/\?/.test(text)) return `per prop: prop={{ default: base, ${objKey(mod)}: cond ? a : b }}`;
  return `inline the object's props as flat values with ${mod}: clauses (or ${objKey(mod)}: in the object form)`;
}

/** `{ kind: "string", text }` | `{ kind: "object", entries: [[key, text]] }` | null. */
function buildValue(t, base, sf) {
  const baseExpr = base ? base.value : null;
  const baseLit = baseExpr ? literalOf(baseExpr) : null;
  const baseObj =
    baseExpr && unwrap(baseExpr) && ts.isObjectLiteralExpression(unwrap(baseExpr))
      ? unwrap(baseExpr)
      : null;

  // try the string form
  const tryString = () => {
    const parts = [];
    if (baseExpr) {
      if (!baseLit) return null;
      if (baseLit.kind === "string") {
        const s = stringPayload(baseLit.value);
        if (s.error) return null;
        parts.push(compactParens(s.payload));
      } else {
        const n = numberPayload(t.lh, baseLit.value);
        if (n === null) return null;
        parts.push(n);
      }
    }
    for (const c of t.clauses) {
      if (!c.lit) return null;
      let payload;
      if (c.lit.kind === "string") {
        const s = stringPayload(c.lit.value);
        if (s.error) return null;
        payload = s.payload;
      } else {
        payload = numberPayload(t.lh, c.lit.value);
        if (payload === null) return null;
      }
      parts.push(`${c.mod}:${payload}`);
    }
    return { kind: "string", text: parts.join(" ") };
  };
  const str = tryString();
  if (str) return str;

  // object form
  const entries = [];
  if (baseObj) {
    for (const p of baseObj.properties) entries.push([null, p.getText(sf)]);
  } else if (baseExpr) {
    if (baseLit && baseLit.kind === "string" && isProgramString(baseLit.value)) return null;
    entries.push(["default", baseExpr.getText(sf)]);
  }
  for (const c of t.clauses) entries.push([c.mod, c.expr.getText(sf)]);
  return { kind: "object", entries };
}

function objectText(v) {
  return `{ ${v.entries.map(([k, text]) => (k === null ? text : `${objKey(k)}: ${text}`)).join(", ")} }`;
}
function jsxValue(v) {
  if (v.kind === "string") return v.text.includes('"') ? `{${quote(v.text)}}` : quote(v.text);
  return `{${objectText(v)}}`;
}
function objValue(v) {
  return v.kind === "string" ? quote(v.text) : objectText(v);
}

export function run({ sf, ctx }) {
  const edits = [];
  const isHandTable = HAND_TABLE_FILES.some((re) => re.test(sf.fileName));
  const { objects, seen } = collectStyleObjects(sf);
  const conditionValues = new Set();
  const handledMembers = new Set();

  const noteConditionMembers = (container) => {
    for (const m of membersOf(container)) {
      if (!m.spread && CONDITION_KEYS.has(m.name)) {
        handledMembers.add(m.node);
        const v = m.value && unwrap(m.value);
        if (v && ts.isObjectLiteralExpression(v)) conditionValues.add(v);
      }
    }
  };

  // JSX elements
  walk(sf, (n) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      noteConditionMembers(n);
      if (isHandTable) return;
      edits.push(...convertContainer(n, sf, ctx, `<${n.tagName.getText(sf)}>`));
    }
  });

  // style objects
  for (const { obj, kind } of objects) {
    noteConditionMembers(obj);
    if (isHandTable) {
      for (const m of membersOf(obj))
        if (!m.spread && CONDITION_KEYS.has(m.name))
          ctx.report("condition-hand-table", m.node, `${m.name} in ${kind}`);
      continue;
    }
    edits.push(...convertContainer(obj, sf, ctx, kind));
  }

  // plain objects
  walk(sf, (n) => {
    if (!ts.isObjectLiteralExpression(n) || seen.has(n) || conditionValues.has(n)) return;
    const condMembers = membersOf(n).filter((m) => !m.spread && CONDITION_KEYS.has(m.name));
    if (!condMembers.length) return;
    noteConditionMembers(n);
    if (isHandTable) {
      for (const m of condMembers)
        ctx.report(
          "condition-hand-table",
          m.node,
          `${m.name} in a table object`,
          "hand rewrite (plan §8)",
        );
      return;
    }
    const shape = looksLikeStyleObject(n);
    if (shape.ok && shape.styleKeys > 0) {
      edits.push(...convertContainer(n, sf, ctx, "plain style object"));
    } else {
      for (const m of condMembers) {
        ctx.report(
          "condition-plain-object",
          m.node,
          `${m.name} in an object that is not a known style position`,
          "rewrite as flat values where it is consumed",
        );
      }
    }
  });

  // remaining references to condition names
  walk(sf, (n) => {
    if (handledMembers.has(n)) return false;
    if ((ts.isIdentifier(n) || ts.isStringLiteral(n)) && CONDITION_KEYS.has(n.text)) {
      const p = n.parent;
      if (p && handledMembers.has(p)) return;
      ctx.report("condition-reference", n, `${n.text} (${ts.SyntaxKind[p.kind]})`);
    }
  });
  return edits;
}

export { TOKEN_RE, stripToken };
