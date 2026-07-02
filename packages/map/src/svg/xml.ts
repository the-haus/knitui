/**
 * Minimal, dependency-free, DOM-free XML/SVG parser.
 *
 * Produces a lightweight element tree from an SVG string. Works in any JS
 * runtime (browser, Node, Hermes) since it never touches `DOMParser`.
 *
 * It is intentionally lenient: it skips comments, CDATA, processing
 * instructions and DOCTYPE, ignores text nodes, and never throws on malformed
 * input — it returns whatever it managed to parse.
 */

export interface XmlNode {
  /** Local tag name, lower-cased (namespace prefix stripped). */
  tag: string;
  /**
   * Attributes keyed by their original (case-sensitive) name — SVG attribute
   * names like `viewBox` are case-sensitive, so they are preserved verbatim.
   */
  attrs: Record<string, string>;
  children: XmlNode[];
  /** Concatenated text content (used for `<style>` blocks). */
  text?: string;
}

const SPACE = /\s/;

function isSpace(ch: string): boolean {
  return SPACE.test(ch);
}

/** Strip a namespace prefix (`svg:path` → `path`, `xlink:href` → `href`). */
function localName(name: string): string {
  const colon = name.indexOf(":");
  return colon === -1 ? name : name.slice(colon + 1);
}

function decodeEntities(value: string): string {
  if (value.indexOf("&") === -1) return value;
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    switch (body) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
        return "'";
      default:
        if (body[0] === "#") {
          const code =
            body[1] === "x" || body[1] === "X"
              ? parseInt(body.slice(2), 16)
              : parseInt(body.slice(1), 10);
          return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
        }
        return whole;
    }
  });
}

/** Parse the `<tag ...>` body (without the angle brackets) into a node. */
function parseTag(body: string): XmlNode | null {
  const len = body.length;
  let k = 0;
  while (k < len && !isSpace(body[k])) k++;
  const rawName = body.slice(0, k).trim();
  if (!rawName) return null;

  const node: XmlNode = { tag: localName(rawName).toLowerCase(), attrs: {}, children: [] };

  while (k < len) {
    while (k < len && isSpace(body[k])) k++;
    if (k >= len) break;

    const nameStart = k;
    while (k < len && body[k] !== "=" && !isSpace(body[k])) k++;
    const name = body.slice(nameStart, k).trim();

    while (k < len && isSpace(body[k])) k++;

    if (body[k] === "=") {
      k++;
      while (k < len && isSpace(body[k])) k++;
      const quote = body[k];
      let value: string;
      if (quote === '"' || quote === "'") {
        k++;
        const end = body.indexOf(quote, k);
        if (end === -1) {
          value = body.slice(k);
          k = len;
        } else {
          value = body.slice(k, end);
          k = end + 1;
        }
      } else {
        const valStart = k;
        while (k < len && !isSpace(body[k])) k++;
        value = body.slice(valStart, k);
      }
      if (name) node.attrs[localName(name)] = decodeEntities(value);
    } else if (name) {
      // Valueless attribute — rare in SVG; record as empty.
      node.attrs[localName(name)] = "";
    }
  }

  return node;
}

/**
 * Parse an SVG string into an element tree, returning the root `<svg>` node
 * (or the first element found, or `null` if nothing parseable was present).
 */
export function parseXml(src: string): XmlNode | null {
  const root: XmlNode = { tag: "#root", attrs: {}, children: [] };
  const stack: XmlNode[] = [root];
  const n = src.length;
  let i = 0;

  while (i < n) {
    const lt = src.indexOf("<", i);
    if (lt === -1) break;
    if (lt > i) {
      const top = stack[stack.length - 1];
      top.text = (top.text ?? "") + src.slice(i, lt);
    }
    i = lt + 1;
    if (i >= n) break;

    const c = src[i];

    if (c === "!") {
      if (src.startsWith("!--", i)) {
        const end = src.indexOf("-->", i);
        i = end === -1 ? n : end + 3;
      } else if (src.startsWith("![CDATA[", i)) {
        const end = src.indexOf("]]>", i);
        const top = stack[stack.length - 1];
        top.text = (top.text ?? "") + src.slice(i + "![CDATA[".length, end === -1 ? n : end);
        i = end === -1 ? n : end + 3;
      } else {
        const end = src.indexOf(">", i);
        i = end === -1 ? n : end + 1;
      }
      continue;
    }

    if (c === "?") {
      const end = src.indexOf("?>", i);
      i = end === -1 ? n : end + 2;
      continue;
    }

    if (c === "/") {
      const end = src.indexOf(">", i);
      if (end === -1) break;
      if (stack.length > 1) stack.pop();
      i = end + 1;
      continue;
    }

    // Opening tag — scan to the matching '>' while respecting quoted values.
    let j = i;
    let inQuote: string | null = null;
    while (j < n) {
      const ch = src[j];
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === ">") {
        break;
      }
      j++;
    }
    if (j >= n) break;

    const raw = src.slice(i, j);
    const selfClose = raw.endsWith("/");
    const node = parseTag(selfClose ? raw.slice(0, -1) : raw);
    if (node) {
      stack[stack.length - 1].children.push(node);
      if (!selfClose) stack.push(node);
    }
    i = j + 1;
  }

  return root.children.find((child) => child.tag === "svg") ?? root.children[0] ?? null;
}
