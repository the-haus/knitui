/**
 * Syntax highlighting for code that only exists in the browser.
 *
 * Everything written in prose or extracted from a story goes through Shiki at
 * build time (`@/lib/highlight`) — but the playground's snippet is regenerated
 * from the live args on every control change, so there is nothing to highlight
 * ahead of time. Shipping Shiki to the client to cover it would cost ~1 MB of JS
 * for two code blocks, which is exactly the trade the build-time highlighter was
 * chosen to avoid.
 *
 * So this is a scanner for the narrow slice of syntax those snippets actually
 * contain: JSX tags and attributes, and the small TS expressions inside `{…}`. It
 * emits the SAME dual-theme markup Shiki does — a `.shiki` root plus per-token
 * `--shiki-light` / `--shiki-dark` custom properties — so the rules in
 * `globals.css` colour it, switch it with the scheme, and keep it visually
 * identical to the blocks above and below it. The palette was read off Shiki's
 * own `github-light` / `github-dark` output for the same code, not guessed, and
 * `scripts/docs/check-live-highlight.mjs` re-checks the two agree.
 *
 * It is a highlighter, not a parser: ambiguous syntax resolves to `plain`, which
 * degrades to the uncoloured text we rendered before rather than to something
 * wrong.
 */

export type TokenKind =
  | "plain"
  | "string"
  | "constant"
  | "component"
  | "tag"
  | "attr"
  | "call"
  | "param"
  | "operator"
  | "comment";

export type Token = { text: string; kind: TokenKind };

/** `[github-light, github-dark]` per token kind, verified against Shiki's output. */
export const TOKEN_COLORS: Record<TokenKind, readonly [string, string]> = {
  plain: ["#24292e", "#e1e4e8"],
  string: ["#032f62", "#9ecbff"],
  constant: ["#005cc5", "#79b8ff"],
  component: ["#005cc5", "#79b8ff"],
  tag: ["#22863a", "#85e89d"],
  attr: ["#6f42c1", "#b392f0"],
  call: ["#6f42c1", "#b392f0"],
  param: ["#e36209", "#ffab70"],
  operator: ["#d73a49", "#f97583"],
  comment: ["#6a737d", "#6a737d"],
};

const KEYWORDS = new Set([
  "as",
  "async",
  "await",
  "const",
  "default",
  "else",
  "export",
  "from",
  "function",
  "if",
  "import",
  "in",
  "let",
  "new",
  "of",
  "return",
  "satisfies",
  "typeof",
  "var",
  "yield",
]);

/**
 * `void` sits here rather than in `KEYWORDS` because every occurrence in a
 * snippet is a return type (`() => void`), which TextMate scopes — and Shiki
 * colours — as a type, not as the operator.
 */
const CONSTANTS = new Set(["true", "false", "null", "undefined", "void", "NaN", "Infinity"]);

const OPERATOR = /[=+\-*/%<>!&|^~?]/;
const IDENT_START = /[A-Za-z_$]/;
const IDENT = /[\w$]/;

/**
 * Where a `<` may legitimately open a JSX tag. Anywhere else it is a comparison
 * (or a generic), and the `<` stays an operator — `a < b` must not swallow the
 * rest of the line into tag mode.
 */
const BEFORE_JSX = /(?:[({[,;:=>&|?]|\b(?:return|in|of))\s*$|^\s*$/;

/**
 * `text`      JSX children
 * `tag`       inside `<Name …`
 * `closetag`  inside `</Name`
 * `code`      a TS expression — `{…}` in JSX, or a whole module body
 * `params`    an arrow function's parameter list, where bare names read as params
 * `template`  inside a backtick string, whose `${…}` drops back to `code`
 */
type Mode = "text" | "tag" | "closetag" | "code" | "params" | "template";

/**
 * Tokenize a snippet.
 *
 * `start` picks the outer context: `"jsx"` for a JSX fragment (the playground's
 * snippet), `"code"` for a module body (the theme builder's `createTheme` call).
 */
export function tokenize(source: string, start: "jsx" | "code" = "jsx"): Token[] {
  const tokens: Token[] = [];
  const stack: Mode[] = [start === "jsx" ? "text" : "code"];
  let i = 0;
  /** The last token that isn't whitespace — `const` here means the next name is one. */
  let previous: Token | undefined;

  const push = (text: string, kind: TokenKind) => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) last.text += text;
    else tokens.push({ text, kind });
    if (text.trim()) previous = { text: text.trim(), kind };
  };

  const pop = () => {
    if (stack.length > 1) stack.pop();
  };

  /** Offset of the next non-space character at or after `from`. */
  const skipSpace = (from: number) => from + (source.slice(from).match(/^\s*/)?.[0].length ?? 0);

  /** A `//` line comment or a `/* … *​/` block, whichever starts at `i`. */
  const readComment = () => {
    if (source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      push(source.slice(i, end === -1 ? source.length : end), "comment");
      i = end === -1 ? source.length : end;
      return;
    }
    const end = source.indexOf("*/", i + 2);
    push(source.slice(i, end === -1 ? source.length : end + 2), "comment");
    i = end === -1 ? source.length : end + 2;
  };

  /** A `'`/`"` string through its closing quote, escapes included. */
  const readQuoted = () => {
    const quote = source[i];
    let j = i + 1;
    while (j < source.length) {
      if (source[j] === "\\") j += 2;
      else if (source[j] === quote) {
        j += 1;
        break;
      } else j += 1;
    }
    push(source.slice(i, j), "string");
    i = j;
  };

  /**
   * `<Name` / `</Name` / `<>`: the punctuation stays plain and the name is
   * coloured by case, the way JSX itself tells components from host elements.
   * Returns false when this `<` isn't a tag after all.
   */
  const readTagOpen = (): boolean => {
    const closing = source[i + 1] === "/";
    const nameAt = i + (closing ? 2 : 1);

    if (source[nameAt] === ">") {
      push(source.slice(i, nameAt + 1), "plain"); // `<>` / `</>`
      i = nameAt + 1;
      if (closing) pop();
      else stack.push("text");
      return true;
    }
    if (!IDENT_START.test(source[nameAt] ?? "")) return false;

    let end = nameAt;
    while (end < source.length && (IDENT.test(source[end]) || /[.:-]/.test(source[end]))) end += 1;
    const name = source.slice(nameAt, end);

    push(source.slice(i, nameAt), "plain");
    push(name, /^[A-Z]/.test(name) ? "component" : "tag");
    i = end;
    stack.push(closing ? "closetag" : "tag");
    return true;
  };

  /** True when the `(` at `i` opens an arrow function's parameter list. */
  const opensParams = (): boolean => {
    let depth = 0;
    for (let j = i; j < source.length; j += 1) {
      const char = source[j];
      if (char === "(") depth += 1;
      else if (char === ")") {
        depth -= 1;
        if (depth === 0) return source.startsWith("=>", skipSpace(j + 1));
      } else if (char === '"' || char === "'" || char === "`" || char === "\n") return false;
    }
    return false;
  };

  while (i < source.length) {
    const mode = stack[stack.length - 1];
    const char = source[i];

    /* ------------------------------------------------ JSX children / text */
    if (mode === "text") {
      if (char === "<" && readTagOpen()) continue;
      if (char === "{") {
        push("{", "plain");
        stack.push("code");
        i += 1;
        continue;
      }
      let j = i + 1;
      while (j < source.length && source[j] !== "<" && source[j] !== "{") j += 1;
      push(source.slice(i, j), "plain");
      i = j;
      continue;
    }

    /* ------------------------------------------- inside `<Name …` / `</Name` */
    if (mode === "tag" || mode === "closetag") {
      if (char === "/" && (source[i + 1] === "/" || source[i + 1] === "*")) {
        readComment();
        continue;
      }
      if (char === "/" && source[i + 1] === ">") {
        push("/>", "plain");
        i += 2;
        pop();
        continue;
      }
      if (char === ">") {
        push(">", "plain");
        i += 1;
        pop();
        // An opening tag's `>` starts the children; a closing tag's `>` ends them.
        if (mode === "tag") stack.push("text");
        else pop();
        continue;
      }
      if (char === "{") {
        push("{", "plain");
        stack.push("code");
        i += 1;
        continue;
      }
      if (char === "=") {
        push("=", "operator");
        i += 1;
        continue;
      }
      if (char === '"' || char === "'") {
        readQuoted();
        continue;
      }
      if (char === "`") {
        push("`", "string");
        i += 1;
        stack.push("template");
        continue;
      }
      if (IDENT_START.test(char)) {
        let j = i;
        while (j < source.length && (IDENT.test(source[j]) || /[-:]/.test(source[j]))) j += 1;
        push(source.slice(i, j), "attr");
        i = j;
        continue;
      }
      push(char, "plain");
      i += 1;
      continue;
    }

    /* ------------------------------------------------------ template string */
    if (mode === "template") {
      let j = i;
      let text = "";
      let done = false;
      while (j < source.length) {
        if (source[j] === "\\") {
          text += source.slice(j, j + 2);
          j += 2;
          continue;
        }
        if (source[j] === "`") {
          push(`${text}\``, "string");
          i = j + 1;
          pop();
          done = true;
          break;
        }
        if (source[j] === "$" && source[j + 1] === "{") {
          push(`${text}\${`, "string");
          i = j + 2;
          stack.push("code");
          done = true;
          break;
        }
        text += source[j];
        j += 1;
      }
      if (!done) {
        push(text, "string");
        i = j;
      }
      continue;
    }

    /* ------------------------------------------------ expression / TS code */
    if (char === "}") {
      // A `}` that closes a `${…}` hole belongs to the string, not the expression.
      push("}", stack[stack.length - 2] === "template" ? "string" : "plain");
      i += 1;
      pop();
      continue;
    }
    if (char === "{") {
      push("{", "plain");
      stack.push("code");
      i += 1;
      continue;
    }
    if (mode === "params" && char === ")") {
      push(")", "plain");
      i += 1;
      pop();
      continue;
    }
    if (char === "(") {
      const params = opensParams(); // must be asked while `i` still points at the `(`
      push("(", "plain");
      i += 1;
      stack.push(params ? "params" : "code");
      continue;
    }
    if (char === ")") {
      push(")", "plain");
      i += 1;
      pop();
      continue;
    }
    if (char === "/" && (source[i + 1] === "/" || source[i + 1] === "*")) {
      readComment();
      continue;
    }
    if (char === '"' || char === "'") {
      readQuoted();
      continue;
    }
    if (char === "`") {
      push("`", "string");
      i += 1;
      stack.push("template");
      continue;
    }
    if (char === "<" && BEFORE_JSX.test(source.slice(Math.max(0, i - 16), i)) && readTagOpen()) {
      continue;
    }
    if (/\d/.test(char)) {
      let j = i;
      while (j < source.length && /[\w.]/.test(source[j])) j += 1;
      push(source.slice(i, j), "constant");
      i = j;
      continue;
    }
    if (IDENT_START.test(char)) {
      let j = i;
      while (j < source.length && IDENT.test(source[j])) j += 1;
      const word = source.slice(i, j);
      const next = skipSpace(j);
      push(word, identifierKind(word, mode, previous, source, next));
      i = j;
      continue;
    }
    if (OPERATOR.test(char)) {
      let j = i;
      while (j < source.length && OPERATOR.test(source[j])) j += 1;
      push(source.slice(i, j), "operator");
      i = j;
      continue;
    }
    push(char, "plain");
    i += 1;
  }

  return tokens;
}

/**
 * How a bare identifier reads. The order matters: `const` binds its name as a
 * constant even when the value is a call, and a lone `value => …` parameter has
 * no parentheses to be recognised by.
 */
function identifierKind(
  word: string,
  mode: Mode,
  previous: Token | undefined,
  source: string,
  next: number,
): TokenKind {
  if (CONSTANTS.has(word)) return "constant";
  if (KEYWORDS.has(word)) return "operator";
  // SCREAMING_CASE reads as a constant — how most stories name their fixture data
  // (`data={EUROPEAN_CITIES}`), and how TextMate scopes it.
  if (/^[A-Z][A-Z\d_]*$/.test(word)) return "constant";
  if (previous?.kind === "operator" && previous.text === "const") return "constant";
  if (mode === "params" || source.startsWith("=>", next)) return "param";
  if (source[next] === "(") return "call";
  return "plain";
}
