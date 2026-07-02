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
 * Renders a media (`@knitui/media`) story module ONE story at a time, behind a
 * chip-per-story selector — the same idea as `CanvasGallerySection`, content-sized
 * rather than full-bleed.
 *
 * Why one at a time: the whole `@knitui/media` kit is backed by a SINGLE shared
 * engine per medium — one real `<audio>` and one real `<video>` element (plus one
 * recorder / one mic capture), owned by `<MediaProvider>` and teleported into
 * whichever player is currently active. The default `StorySection` stacks a whole
 * module's stories on one page, so a section like Video (~5 stories) mounts five
 * `<Video>` players that all contend for that single shared element: only the
 * active one can show video, the rest render as blank frames. Showing a single
 * story keeps exactly one player mounted, so the shared element always has one
 * home — and switching the chip switches the source on that one element, which is
 * precisely the shared-engine "one instance, switch source" model. (Native is
 * unaffected, but one-at-a-time keeps parity and avoids stacking idle players.)
 */
export function MediaSection({ mod, title }: { mod: Record<string, unknown>; title: string }) {
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
        // `key` remounts on story switch so the previous player UNREGISTERS from
        // the shared engine (freeing the single <audio>/<video>) before the next
        // one mounts and activates — mirrors CanvasGallerySection's WebGL teardown.
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
