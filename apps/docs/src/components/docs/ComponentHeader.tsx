import { blobUrl } from "@/lib/github";
import { componentProps, requireEntry } from "@/lib/registry";

import { CodeBlock } from "../example/CodeBlock";
import { InlineMarkdown } from "../mdx/InlineMarkdown";

/**
 * The masthead of a component page: what it is, which package ships it, which
 * platforms it runs on, and links to the code that backs every claim on the page.
 *
 * All of it comes from the registry, so it cannot drift from the source: the
 * platform note is derived from whether a real `.native.tsx` exists, and the
 * "tests" link only appears when there is a test file.
 */
export async function ComponentHeader({ id }: { id: string }) {
  const entry = requireEntry(id);
  const propsData = componentProps(id);
  const importPath = entry.packageName;
  const slotCount = propsData?.slots?.length ?? 0;
  const ownPropCount = propsData?.counts.own ?? 0;

  return (
    <header className="page-header">
      <p className="eyebrow">
        <span>{entry.group}</span>
        <span aria-hidden="true">·</span>
        <code>{importPath}</code>
      </p>

      <h1>{entry.name}</h1>

      {entry.description ? (
        <p>
          <InlineMarkdown text={entry.description} />
        </p>
      ) : null}

      <div className="badges">
        <span className="badge badge--platform">Web</span>
        <span className="badge badge--platform">iOS</span>
        <span className="badge badge--platform">Android</span>
        {entry.nativePath ? (
          <span className="badge" title="Ships a dedicated native implementation">
            native split
          </span>
        ) : null}
        {slotCount ? <span className="badge">{slotCount} style slots</span> : null}
        {propsData ? <span className="badge">{ownPropCount} own props</span> : null}
        <span className="badge">{entry.stories.length} examples</span>
      </div>

      <div className="meta-links">
        <a href={entry.githubUrl}>Stories</a>
        {entry.componentPath ? <a href={blobUrl(entry.componentPath)}>Source</a> : null}
        {entry.testPath ? <a href={blobUrl(entry.testPath)}>Tests</a> : null}
        {entry.nativePath ? <a href={blobUrl(entry.nativePath)}>Native source</a> : null}
        <a href={entry.storybookUrl}>Open in Storybook</a>
      </div>

      <CodeBlock
        code={`import { ${entry.componentName ?? entry.name} } from "${importPath}";`}
        lang="tsx"
      />
    </header>
  );
}
