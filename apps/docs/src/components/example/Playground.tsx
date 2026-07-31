import { requireEntry } from "@/lib/registry";

import { PlaygroundClient } from "./PlaygroundClient";

/**
 * Server wrapper for the playground: resolves the registry entry and hands the
 * client only what it needs (argTypes + the story's initial args), so the 900 kB
 * registry never crosses the boundary.
 *
 * Defaults to the component's `Playground` story — the convention every story
 * file in the kit follows — and falls back to the first story when there isn't one.
 */
export function Playground({ id, story }: { id: string; story?: string }) {
  const entry = requireEntry(id);
  const target =
    (story && entry.stories.find((s) => s.name === story)) ??
    entry.stories.find((s) => s.name === "Playground") ??
    entry.stories[0];

  if (!target) return null;

  return (
    <PlaygroundClient
      id={id}
      story={target.name}
      componentName={entry.componentName}
      argTypes={entry.argTypes ?? {}}
      initialArgs={{ ...entry.args, ...target.args }}
      mode={entry.render}
      graphicsRuntime={entry.graphicsRuntime}
    />
  );
}
