import "server-only";

import { type BundledLanguage, createHighlighter, type Highlighter } from "shiki";

/**
 * Build-time syntax highlighting.
 *
 * Shiki runs on the server only and emits static HTML with inline CSS variables
 * for both themes at once (`--shiki-light` / `--shiki-dark`), so the client ships
 * no highlighter, no theme JSON, and no re-highlight on scheme switch — the CSS
 * in `globals.css` just picks the other variable. That is the difference between
 * ~0 kB and ~1 MB of JS on a page with 18 code blocks.
 */

const LANGUAGES: BundledLanguage[] = ["tsx", "ts", "json", "bash", "css", "diff"];

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: LANGUAGES,
  });
  return highlighterPromise;
}

/** Highlight a snippet to HTML. Unknown languages fall back to plain text. */
export async function highlight(code: string, lang = "tsx"): Promise<string> {
  const highlighter = await getHighlighter();
  const language = (LANGUAGES as string[]).includes(lang) ? lang : "text";
  return highlighter.codeToHtml(code.trim(), {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
