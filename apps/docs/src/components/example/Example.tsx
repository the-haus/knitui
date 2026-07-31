import { humanize } from "@knitui/story-runtime";

import { highlight } from "@/lib/highlight";
import { requireEntry, storySources } from "@/lib/registry";

import { ExampleFrame } from "./ExampleFrame";
import { StoryStage } from "./StoryStage";

/**
 * One live example: the story mounted for real, its source underneath.
 *
 * Server component — it reads the registry and the extracted source, highlights
 * the snippet at build time, and hands the finished HTML to the client frame.
 * The only thing that hydrates is the story itself plus the frame's toggles.
 *
 *   <Example id="components/inputs/button" story="Variants" />
 */
export async function Example({
  id,
  story,
  caption,
  code = true,
  expanded = false,
}: {
  id: string;
  story: string;
  caption?: string;
  code?: boolean;
  expanded?: boolean;
}) {
  const entry = requireEntry(id);
  const meta = entry.stories.find((s) => s.name === story);
  if (!meta) {
    throw new Error(
      `[docs] story "${story}" not found on ${id}. Available: ${entry.stories.map((s) => s.name).join(", ")}`,
    );
  }

  const source = storySources(id)[story];
  const snippet = source?.snippet ?? source?.full;
  const codeHtml = code && snippet ? await highlight(snippet, "tsx") : undefined;

  return (
    <ExampleFrame
      title={humanize(story)}
      caption={caption ?? meta.description}
      codeHtml={codeHtml}
      codeText={snippet}
      sourceUrl={`${entry.githubUrl}#:~:text=${encodeURIComponent(`export const ${story}`)}`}
      storybookUrl={entry.storybookUrl}
      defaultCodeOpen={expanded}
    >
      <StoryStage
        id={id}
        story={story}
        mode={entry.render}
        graphicsRuntime={entry.graphicsRuntime}
      />
    </ExampleFrame>
  );
}

/**
 * Every story of a component, in declaration order — the bulk of a component
 * page. `Playground` is skipped by default because `<Playground>` renders it
 * separately with its controls panel.
 */
export async function Examples({
  id,
  skip = ["Playground"],
  only,
}: {
  id: string;
  skip?: string[];
  only?: string[];
}) {
  const entry = requireEntry(id);
  const stories = entry.stories.filter(
    (story) => (only ? only.includes(story.name) : true) && !skip.includes(story.name),
  );

  if (!stories.length) return null;

  return (
    <>
      <h2 id="examples">Examples</h2>
      {stories.map((story) => (
        <section key={story.name}>
          <h3 id={`example-${story.name.toLowerCase()}`}>{humanize(story.name)}</h3>
          <Example id={id} story={story.name} />
        </section>
      ))}
    </>
  );
}
