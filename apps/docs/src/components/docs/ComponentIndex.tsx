import Link from "next/link";

import { entries, type RegistryEntry } from "@/lib/registry";

import { StoryStage } from "../example/StoryStage";

/**
 * The component gallery — "show me everything you have", which is the most
 * common first action on a component library and had no page to land on.
 *
 * Live thumbnails, not screenshots: each tile mounts the component's own story
 * through `StoryStage`, so a tile cannot drift from what ships and there are no
 * images to regenerate. That is only affordable because `StoryStage` defers every
 * mount until it nears the viewport — a 105-tile page loads the dozen you can
 * actually see.
 *
 * Scoped to `@knitui/components` deliberately. Every entry there is `render:
 * "stack"`, so it thumbnails in a fixed-height frame; the satellite kits are maps,
 * Skia canvases and media players, which each hold a GPU context or a player
 * element and are linked to rather than mounted 20 at a time.
 */

/**
 * Stories worth showing at thumbnail size, best first.
 *
 * A component's first story is usually its plainest, but not always — `Matrix`
 * and the gradient permutations are reference grids that turn to mush at 7rem.
 */
const PREFERRED = ["Variants", "Default", "Basic", "Usage", "Sizes", "Overview"];
const AVOID = /^(Playground|Matrix|Styles|Gradient|Themed|Group)/;

function thumbnailStory(entry: RegistryEntry): string | undefined {
  const names = entry.stories.map((story) => story.name);
  for (const preferred of PREFERRED) {
    if (names.includes(preferred)) return preferred;
  }
  return names.find((name) => !AVOID.test(name)) ?? names.find((name) => name !== "Playground");
}

/** First sentence of the registry description — the tile has room for one. */
function summary(entry: RegistryEntry): string {
  if (!entry.description) return "";
  const [first] = entry.description.split(/(?<=\.)\s+(?=[A-Z`])/);
  return first ?? entry.description;
}

export function ComponentIndex() {
  const all = entries().filter((entry) => !entry.internal && entry.package === "components");

  // Group order comes from the registry's own traversal, which follows the
  // editorial nav config — so the gallery and the sidebar agree.
  const groups = new Map<string, RegistryEntry[]>();
  for (const entry of all) {
    const list = groups.get(entry.group) ?? [];
    list.push(entry);
    groups.set(entry.group, list);
  }

  return (
    <>
      {[...groups].map(([group, items]) => (
        <section key={group}>
          <h2 id={group.toLowerCase().replace(/\s+/g, "-")}>
            {group} <span className="gallery__count">{items.length}</span>
          </h2>
          <div className="gallery">
            {items.map((entry) => {
              const story = thumbnailStory(entry);
              return (
                <article key={entry.id} className="gallery__tile">
                  {/*
                   * The thumbnail is a picture, not a control. These are real
                   * components — buttons, inputs, switches — so without
                   * `pointer-events: none` (in CSS) and `aria-hidden` they would be
                   * focusable, tabbable duplicates of the real thing, and nesting
                   * them inside the tile's link would be invalid HTML. The link is
                   * the component's name; the demo is decoration.
                   */}
                  <div className="gallery__frame" aria-hidden="true" data-pagefind-ignore>
                    {story ? (
                      <StoryStage
                        id={entry.id}
                        story={story}
                        mode={entry.render}
                        className="gallery__stage"
                      />
                    ) : null}
                  </div>
                  <h3 className="gallery__name">
                    <Link href={entry.route}>{entry.name}</Link>
                  </h3>
                  <p className="gallery__blurb">{summary(entry)}</p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
