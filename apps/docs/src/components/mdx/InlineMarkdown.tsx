import type { ReactNode } from "react";

/**
 * Renders the small subset of Markdown that appears in GENERATED prose.
 *
 * Story JSDoc and `parameters.docs.description` are written as Markdown by story
 * authors (`` `shadow` isn't Button-specific ``), but they reach the docs as plain
 * strings, not through the MDX pipeline. Without this they render with visible
 * backticks. Handles inline code, bold, and links — deliberately nothing else;
 * anything more expressive belongs in an MDX file, not a JSDoc comment.
 */
export function InlineMarkdown({ text }: { text: string }) {
  return <>{parse(text)}</>;
}

const PATTERN = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;

function parse(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    const token = match[0];

    if (token.startsWith("`")) {
      nodes.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(token) ?? [];
      nodes.push(
        <a key={key++} href={href}>
          {label}
        </a>,
      );
    }
    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
