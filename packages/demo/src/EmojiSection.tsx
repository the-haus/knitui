import { useDeferredValue, useMemo, useState } from "react";

import { Box, Stack, Text, TextInput, Title } from "@knitui/components";
import { Emoji, type EmojiName, emojiRegistry } from "@knitui/emoji";

/**
 * How many matching emoji to render at once. The kit ships ~3.8k emoji, so we
 * cap the grid to keep the demo (and especially the native bundle, where each
 * tile `require`s its emoji module) responsive. The header reports when results
 * are truncated so it's clear more exist beyond the limit.
 */
const RENDER_LIMIT = 120;

/** Every registry name, sorted once at module load. */
const ALL_EMOJI_NAMES = Object.keys(emojiRegistry).sort() as EmojiName[];

/** A single emoji tile: the glyph plus its (truncated) registry name. */
function EmojiTile({ name }: { name: EmojiName }) {
  return (
    <Stack
      width={104}
      gap="$xs"
      alignItems="center"
      px="$xs"
      py="$sm"
      borderWidth={1}
      borderColor="$color4"
      borderRadius="$sm"
      backgroundColor="$color1"
    >
      <Emoji name={name} size={32} title={name} fallback={<Box width={32} height={32} />} />
      <Text c="$color11" fz={11} numberOfLines={1} ta="center" w="100%">
        {name}
      </Text>
    </Stack>
  );
}

/**
 * A purpose-built, searchable emoji browser for the demo gallery. Like
 * `IconsSection` — and for the same reasons — it is hand-written from
 * `@knitui/components` primitives rather than mirrored from the emoji Storybook
 * story (which renders through plain DOM and would not work natively). Emoji are
 * full-color artwork, so there is no color control — only search + size.
 *
 * Type a query to filter the registry by name; the grid renders up to
 * `RENDER_LIMIT` matches and the header reports the full match count.
 */
export function EmojiSection() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const matches = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return ALL_EMOJI_NAMES;
    return ALL_EMOJI_NAMES.filter((name) => name.includes(needle));
  }, [deferredQuery]);

  const visible = matches.slice(0, RENDER_LIMIT);
  const truncated = matches.length - visible.length;

  return (
    <Stack gap="$md">
      <Stack gap="$xxs">
        <Title order={3}>Emoji</Title>
        <Text c="$color11">
          {ALL_EMOJI_NAMES.length} full-color emoji from <Text fontWeight="600">@knitui/emoji</Text>{" "}
          (Google Noto). Search by name to filter; render the{" "}
          <Text fontWeight="600">{"<Emoji name=… />"}</Text> component with any registry name.
        </Text>
      </Stack>

      <TextInput
        placeholder="Search emoji…"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        size="sm"
      />

      <Text c="$color10" fz={12}>
        {matches.length === 0
          ? `No emoji match “${query.trim()}”.`
          : truncated > 0
            ? `Showing ${visible.length} of ${matches.length} matches (${truncated} more — refine your search).`
            : `Showing ${matches.length} ${matches.length === 1 ? "emoji" : "emoji"}.`}
      </Text>

      <Box flexDirection="row" flexWrap="wrap" gap="$sm">
        {visible.map((name) => (
          <EmojiTile key={name} name={name} />
        ))}
      </Box>
    </Stack>
  );
}
