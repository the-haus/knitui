import { isValidElement, type ReactNode } from "react";

import { CodeBlock } from "../example/CodeBlock";

type CodeProps = { className?: string; "data-meta"?: string; children?: ReactNode };

/**
 * Markdown code fences, highlighted at build time.
 *
 * MDX hands us `<pre><code class="language-tsx">…</code></pre>`; we unwrap it and
 * re-render through `CodeBlock` so fenced prose code and generated example code
 * are visually and mechanically identical (same themes, same copy button, zero
 * client-side highlighter).
 *
 * A fence whose body isn't a plain string (an interpolated expression, say) is
 * passed through untouched rather than mangled.
 */
export function Pre({ children }: { children?: ReactNode }) {
  if (!isValidElement<CodeProps>(children)) return <pre>{children}</pre>;

  const { className, children: body } = children.props;
  if (typeof body !== "string") return <pre>{children}</pre>;

  const lang = /language-([\w-]+)/.exec(className ?? "")?.[1] ?? "tsx";
  // `title="metro.config.js"` on the fence — put there by `rehypeCodeMeta`.
  const title = /\btitle="([^"]+)"/.exec(children.props["data-meta"] ?? "")?.[1];

  return <CodeBlock code={body} lang={lang} title={title} />;
}
