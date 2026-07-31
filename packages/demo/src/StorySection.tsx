import { memo, type ReactNode, useEffect, useState } from "react";

import { Box, Separator, Stack, Text, Title, UnstyledButton } from "@knitui/components";
import {
  getMeta,
  getStories,
  StoryErrorBoundary as HeadlessStoryErrorBoundary,
  humanize,
  type Meta,
  renderStory,
  type StoryModule,
  type StoryObj,
} from "@knitui/story-runtime";

export { getStories, humanize, type Meta, renderStory, type StoryObj };

/**
 * The gallery's error UI. `@knitui/story-runtime`'s boundary is headless (so the
 * docs site can style errors its own way); this is the demo's skin for it.
 */
const storyErrorFallback = (error: Error, label: string): ReactNode => (
  <Box
    borderWidth={1}
    borderColor="$red7"
    backgroundColor="$red2"
    borderRadius="$sm"
    p="$sm"
    gap="$xs"
  >
    <Text c="$red11" fontWeight="600" fz={13}>
      {label} failed to render
    </Text>
    <Text c="$red10" fz={12}>
      {error.message}
    </Text>
  </Box>
);

/**
 * The demo's pre-skinned story boundary — the headless runtime boundary with the
 * gallery's red error panel wired in. Isolates one story so a throw in it can't
 * blank the whole section.
 */
export function StoryErrorBoundary({ label, children }: { label: string; children: ReactNode }) {
  return (
    <HeadlessStoryErrorBoundary label={label} fallback={storyErrorFallback}>
      {children}
    </HeadlessStoryErrorBoundary>
  );
}

/**
 * A single story-selector chip, shared by the one-story-at-a-time renderers
 * (`MapSection`, `CanvasGallerySection`). Active chip is filled; the rest quiet.
 */
export function StoryTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <UnstyledButton
      onPress={onPress}
      px="$sm"
      py="$xxs"
      borderRadius="$sm"
      borderWidth={1}
      borderColor={active ? "$color7" : "$color4"}
      backgroundColor={active ? "$color5" : "transparent"}
      pressStyle={{ backgroundColor: active ? "$color5" : "$color3" }}
    >
      <Text c={active ? "$color12" : "$color11"} fz={12} fontWeight={active ? "600" : "400"}>
        {label}
      </Text>
    </UnstyledButton>
  );
}

/**
 * One mounted story: label + isolated render. Memoized on its (stable) module
 * references so the progressive-mount re-renders below don't re-render — let
 * alone remount — stories that are already on screen.
 */
const RenderedStory = memo(function RenderedStory({
  meta,
  story,
  name,
}: {
  meta: Meta;
  story: StoryObj;
  name: string;
}) {
  return (
    <Stack gap="$sm">
      <Text c="$color11" fz={13} fontWeight="600">
        {humanize(name)}
      </Text>
      <StoryErrorBoundary label={humanize(name)}>
        <Box>{renderStory(meta, story)}</Box>
      </StoryErrorBoundary>
    </Stack>
  );
});

/** How many stories to mount in the first synchronous pass. */
const INITIAL_MOUNT = 2;

/**
 * Grow a count from `initial` up to `total`, one step per animation frame. Each
 * increment lands after the previous frame has painted, so the heavy mount work
 * of a whole section (e.g. 20 carousels) is spread across frames instead of
 * blocking the JS thread in one synchronous burst — the difference between a
 * smooth progressive reveal and an immediate freeze on Android.
 */
function useProgressiveCount(total: number, initial = INITIAL_MOUNT): number {
  const [count, setCount] = useState(() => Math.min(initial, total));
  useEffect(() => {
    if (count >= total) return;
    const raf = requestAnimationFrame(() => setCount((c) => Math.min(c + 1, total)));
    return () => cancelAnimationFrame(raf);
  }, [count, total]);
  return count;
}

/**
 * Renders every story in a Storybook module as one demo section: the component
 * title, then each named story under a small label. `mod` is the imported story
 * module (`import("@knitui/components/src/Button/Button.stories")`). Stories that
 * fill their container (e.g. maps) are rendered by `MapSection` instead — see
 * `sections.generated.tsx`.
 *
 * Stories mount progressively (one per frame) rather than all at once: a section
 * can hold dozens of heavy demos (carousels, maps), and mounting them in a single
 * synchronous pass froze the screen on open. The first {@link INITIAL_MOUNT} show
 * immediately so the screen is never blank.
 */
export function StorySection({ mod, title }: { mod: StoryModule; title: string }) {
  const meta = getMeta(mod);
  const stories = getStories(mod);
  const mounted = useProgressiveCount(stories.length);

  return (
    <Stack gap="$lg">
      <Title order={3}>{title}</Title>
      <Separator />
      {stories.slice(0, mounted).map(([name, story]) => (
        <RenderedStory key={name} meta={meta} story={story} name={name} />
      ))}
      {mounted < stories.length ? (
        <Text c="$color10" fz={12}>
          Loading {stories.length - mounted} more…
        </Text>
      ) : null}
    </Stack>
  );
}
