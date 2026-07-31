"use client";

import { type ReactNode, useState } from "react";

import { InlineMarkdown } from "../mdx/InlineMarkdown";
import { CopyButton } from "./CopyButton";

/**
 * The chrome around a live example: caption, stage, toolbar, collapsible source.
 *
 * Plain HTML and CSS on purpose. The one thing on the page that must be the kit
 * is the example itself — wrapping it in more kit components would make it harder
 * to tell what is being demonstrated from what is demonstrating it, and would put
 * react-native-web on the critical path of every prose page.
 *
 * `data-pagefind-ignore` keeps example markup out of the search index; a search
 * for "filled" should land on the Button page's prose, not on 40 rendered demos.
 */
export function ExampleFrame({
  title,
  caption,
  codeHtml,
  codeText,
  sourceUrl,
  storybookUrl,
  defaultCodeOpen = false,
  children,
}: {
  title: string;
  caption?: string;
  codeHtml?: string;
  codeText?: string;
  sourceUrl?: string;
  storybookUrl?: string;
  defaultCodeOpen?: boolean;
  children: ReactNode;
}) {
  const [showCode, setShowCode] = useState(defaultCodeOpen);

  return (
    <div className="example">
      {caption ? (
        <p className="example__caption">
          <InlineMarkdown text={caption} />
        </p>
      ) : null}

      <div data-pagefind-ignore>{children}</div>

      <div className="example__bar">
        <span>{title}</span>
        <span className="header__spacer" />
        {codeHtml ? (
          <button
            type="button"
            className="button-quiet"
            data-active={showCode}
            aria-expanded={showCode}
            onClick={() => setShowCode((current) => !current)}
          >
            {showCode ? "Hide code" : "Show code"}
          </button>
        ) : null}
        {codeText ? <CopyButton value={codeText} /> : null}
        {sourceUrl ? (
          <a className="button-quiet" href={sourceUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        ) : null}
        {storybookUrl ? (
          <a className="button-quiet" href={storybookUrl} target="_blank" rel="noreferrer">
            Storybook
          </a>
        ) : null}
      </div>

      {showCode && codeHtml ? (
        <div className="code">
          <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
        </div>
      ) : null}
    </div>
  );
}
