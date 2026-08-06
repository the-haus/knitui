import { type CSSProperties, useMemo } from "react";

import { TOKEN_COLORS, tokenize, type TokenKind } from "@/lib/live-highlight";

/**
 * A highlighted code block for code generated in the browser.
 *
 * The build-time twin is `CodeBlock` (Shiki, server-only). This one takes the
 * same shape of output — a `.shiki` root whose tokens carry both themes as
 * custom properties — so a playground snippet and a prose fence are styled by
 * one set of rules in `globals.css` and switch schemes the same way.
 *
 * Plain tokens are emitted as bare text: they inherit the root's colour, which
 * halves the number of spans a fast-changing snippet has to re-render.
 */
export function LiveCode({ code, lang = "jsx" }: { code: string; lang?: "jsx" | "code" }) {
  const tokens = useMemo(() => tokenize(code, lang), [code, lang]);

  return (
    <pre className="shiki shiki-themes github-light github-dark" style={colors("plain")}>
      <code>
        {tokens.map((token, index) =>
          token.kind === "plain" ? (
            token.text
          ) : (
            <span key={index} style={colors(token.kind)}>
              {token.text}
            </span>
          ),
        )}
      </code>
    </pre>
  );
}

function colors(kind: TokenKind): CSSProperties {
  const [light, dark] = TOKEN_COLORS[kind];
  return { "--shiki-light": light, "--shiki-dark": dark } as CSSProperties;
}
