import { highlight } from "@/lib/highlight";

import { CopyButton } from "./CopyButton";

/**
 * A highlighted code block. Server component: Shiki runs at build time and the
 * page ships static HTML, so no highlighter reaches the browser.
 */
export async function CodeBlock({
  code,
  lang = "tsx",
  title,
  copy = true,
}: {
  code: string;
  lang?: string;
  title?: string;
  copy?: boolean;
}) {
  const html = await highlight(code, lang);

  return (
    <div className="code">
      {title || copy ? (
        <div className="code__head">
          {title ? <span>{title}</span> : null}
          <span className="header__spacer" />
          {copy ? <CopyButton value={code} /> : null}
        </div>
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
