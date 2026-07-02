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
 * Renders a map story module as a dedicated, full-bleed gallery: the title on
 * top, ONE selected story filling the rest of the pane, and a chip-per-story
 * selector stacked underneath the map.
 *
 * Map stories render `<Map style={{ flex: 1 }}>`, so they need a parent with a
 * definite height rather than a content-sized box. We don't invent a pixel
 * height — `MapSection` is rendered into the demo's full-height content pane
 * (see `DemoScreen`), and a chain of `flex: 1` carries that height down to the
 * map. This mirrors map's own Storybook preview, which wraps each story in an
 * absolutely-positioned, inset-0 frame. Showing one map at a time also avoids
 * spinning up a dozen live WebGL/MapLibre contexts on a single page.
 */
export function MapSection({ mod, title }: { mod: Record<string, unknown>; title: string }) {
  const meta = (mod.default ?? {}) as Meta;
  const stories = getStories(mod);
  const [activeName, setActiveName] = useState(stories[0]?.[0]);

  const active = stories.find(([name]) => name === activeName) ?? stories[0];

  return (
    <Flex direction="column" flex={1} gap="$sm">
      <Title order={3}>{title}</Title>
      {active ? (
        <Box flex={1} borderRadius="$md" overflow="hidden" borderWidth={1} borderColor="$color4">
          {/* `key` remounts on story switch: a story's `render` may call hooks,
              so each selection must be its own component instance — otherwise
              switching changes the hook order and React throws. */}
          <StoryErrorBoundary key={active[0]} label={humanize(active[0])}>
            <StoryFrame meta={meta} story={active[1]} />
          </StoryErrorBoundary>
        </Box>
      ) : null}
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
    </Flex>
  );
}

/**
 * Renders a single story as its own component so any hooks its `render` uses are
 * isolated to this instance (see the `key` on the boundary above).
 */
function StoryFrame({ meta, story }: { meta: Meta; story: StoryObj }) {
  return <>{renderStory(meta, story)}</>;
}
