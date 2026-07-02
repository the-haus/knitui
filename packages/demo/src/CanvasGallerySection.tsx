import { useState } from "react";

import { Box, Flex, Title } from "@knitui/components";

import {
  getStories,
  humanize,
  type Meta,
  renderStory,
  StoryErrorBoundary,
  type StoryObj,
  StoryTab,
} from "./StorySection";

/**
 * Renders a Skia (`@knitui/graphics`) story module ONE story at a time, behind a
 * chip-per-story selector — the same idea as `MapSection`, but content-sized
 * rather than full-bleed.
 *
 * Why one at a time: every Skia `<Canvas>` allocates its own WebGL context, and
 * browsers cap the number of live contexts (~16 in Chrome). The default
 * `StorySection` stacks a whole module's stories on one page, so a module like
 * `AudioVisualizer` (~19 stories) blows past the cap and CanvasKit can't allocate
 * a surface — "failed to attach a stencil buffer. Rendering will be skipped."
 * Showing a single story keeps the page to one live context. (Native is
 * unaffected, but rendering one at a time there is harmless and keeps parity.)
 */
export function CanvasGallerySection({
  mod,
  title,
}: {
  mod: Record<string, unknown>;
  title: string;
}) {
  const meta = (mod.default ?? {}) as Meta;
  const stories = getStories(mod);
  const [activeName, setActiveName] = useState(stories[0]?.[0]);

  const active = stories.find(([name]) => name === activeName) ?? stories[0];

  return (
    <Flex direction="column" gap="$sm">
      <Title order={3}>{title}</Title>
      <Box flexDirection="row" flexWrap="wrap" gap="$xs">
        {stories.map(([name]) => (
          <StoryTab
            key={name}
            label={humanize(name)}
            active={name === active?.[0]}
            onPress={() => setActiveName(name)}
          />
        ))}
      </Box>
      {active ? (
        // `key` remounts on story switch so each selection is its own component
        // instance (a story's `render` may use hooks) AND the previous story's
        // Skia canvas/WebGL context is torn down — see MapSection for the same.
        <StoryErrorBoundary key={active[0]} label={humanize(active[0])}>
          <StoryFrame meta={meta} story={active[1]} />
        </StoryErrorBoundary>
      ) : null}
    </Flex>
  );
}

/** A single story as its own component so its `render` hooks are isolated. */
function StoryFrame({ meta, story }: { meta: Meta; story: StoryObj }) {
  return <>{renderStory(meta, story)}</>;
}
