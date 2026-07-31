import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CodeBlock } from "../example/CodeBlock";
import { InlineMarkdown } from "../mdx/InlineMarkdown";

const GITHUB_BLOB = "https://github.com/the-haus/knitui/blob/main";

type Hook = {
  slug: string;
  name: string;
  route: string;
  signature?: string;
  description?: string;
  types: string[];
  sourcePath: string;
  githubUrl: string;
  nativePath?: string;
  sharedPath?: string;
  testPath?: string;
};

let cache: Hook[] | undefined;

function hooks(): Hook[] {
  cache ??= JSON.parse(readFileSync(join(process.cwd(), "src/generated/hooks.json"), "utf8"))
    .hooks as Hook[];
  return cache;
}

/**
 * A hook's reference block: signature, description, platform split, source links.
 *
 * Generated from `@knitui/hooks`' own JSDoc (see `scripts/docs/build-hooks.mjs`),
 * which in this repo is unusually thorough — it explains not just what each hook
 * does but why it exists and what it backs. That makes hook pages useful with no
 * prose written twice.
 */
export async function HookReference({ slug }: { slug: string }) {
  const hook = hooks().find((item) => item.slug === slug);
  if (!hook) {
    throw new Error(`[docs] unknown hook "${slug}". Run \`pnpm docs:generate\`.`);
  }

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">
          <code>@knitui/hooks</code>
        </p>
        <h1>{hook.name}</h1>
        {hook.description ? (
          <p>
            <InlineMarkdown text={hook.description} />
          </p>
        ) : null}

        <div className="badges">
          <span className="badge badge--platform">Web</span>
          <span className="badge badge--platform">iOS</span>
          <span className="badge badge--platform">Android</span>
          {hook.nativePath ? (
            <span className="badge" title="Separate web and native implementations">
              native split
            </span>
          ) : null}
          {hook.sharedPath ? (
            <span className="badge" title="Platform files share one logic module">
              shared core
            </span>
          ) : null}
          {hook.testPath ? <span className="badge">tested</span> : null}
        </div>

        <div className="meta-links">
          <a href={hook.githubUrl}>Source</a>
          {hook.nativePath ? <a href={`${GITHUB_BLOB}/${hook.nativePath}`}>Native source</a> : null}
          {hook.sharedPath ? <a href={`${GITHUB_BLOB}/${hook.sharedPath}`}>Shared core</a> : null}
          {hook.testPath ? <a href={`${GITHUB_BLOB}/${hook.testPath}`}>Tests</a> : null}
        </div>
      </header>

      <h2 id="import">Import</h2>
      <CodeBlock code={`import { ${hook.name} } from "@knitui/hooks";`} lang="tsx" />

      {hook.signature ? (
        <>
          <h2 id="signature">Signature</h2>
          <CodeBlock code={hook.signature} lang="ts" copy={false} />
        </>
      ) : null}

      {hook.types.length ? (
        <p>
          Exported types:{" "}
          {hook.types.map((type, index) => (
            <span key={type}>
              {index > 0 ? ", " : ""}
              <code>{type}</code>
            </span>
          ))}
        </p>
      ) : null}
    </>
  );
}

/** The full hook index, for `/docs/hooks`. */
export function HookIndex() {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Hook</th>
            <th>What it does</th>
            <th>Platform</th>
          </tr>
        </thead>
        <tbody>
          {hooks().map((hook) => (
            <tr key={hook.slug}>
              <td>
                <a href={hook.route}>
                  <code>{hook.name}</code>
                </a>
              </td>
              <td>
                {hook.description ? <InlineMarkdown text={firstSentence(hook.description)} /> : ""}
              </td>
              <td>{hook.nativePath ? "split" : "shared"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Trim a JSDoc block to its opening claim for the index table. */
function firstSentence(text: string): string {
  const end = text.search(/\.\s/);
  return end === -1 ? text : text.slice(0, end + 1);
}
