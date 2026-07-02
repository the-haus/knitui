import { useDeferredValue, useMemo, useState } from "react";

import { Box, Stack, Text, TextInput, Title } from "@knitui/components";
import { useTheme } from "@knitui/core";
import { Icon, type IconName, iconRegistry } from "@knitui/icons";

/**
 * How many matching icons to render at once. The kit ships ~6k icons, so we cap
 * the grid to keep the demo (and especially the native bundle, where each tile
 * `require`s its icon module) responsive. The header reports when results are
 * truncated so it's clear more exist beyond the limit.
 */
const RENDER_LIMIT = 120;

/** Every registry name, sorted once at module load. */
const ALL_ICON_NAMES = Object.keys(iconRegistry).sort() as IconName[];

/** A single icon tile: the glyph plus its (truncated) registry name. */
function IconTile({ name, color }: { name: IconName; color: string }) {
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
      <Icon
        name={name}
        size={28}
        color={color}
        title={name}
        fallback={<Box width={28} height={28} />}
      />
      <Text c="$color11" fz={11} numberOfLines={1} ta="center" w="100%">
        {name}
      </Text>
    </Stack>
  );
}

/**
 * A purpose-built, searchable icon browser for the demo gallery. Unlike every
 * other section (auto-generated from a Storybook story, see
 * `sections.generated.tsx`), this one is hand-written from `@knitui/components`
 * primitives because mirroring the icons story — which renders thousands of
 * icons through plain DOM — would not work natively and would be unusably heavy.
 *
 * Type a query to filter the registry by name; the grid renders up to
 * `RENDER_LIMIT` matches and the header reports the full match count.
 */
export function IconsSection() {
  const theme = useTheme();
  const iconColor = theme.color12?.val ?? "#000";
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const matches = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return ALL_ICON_NAMES;
    return ALL_ICON_NAMES.filter((name) => name.includes(needle));
  }, [deferredQuery]);

  const visible = matches.slice(0, RENDER_LIMIT);
  const truncated = matches.length - visible.length;

  return (
    <Stack gap="$md">
      <Stack gap="$xxs">
        <Title order={3}>Icons</Title>
        <Text c="$color11">
          {ALL_ICON_NAMES.length} icons from <Text fontWeight="600">@knitui/icons</Text>. Search by
          name to filter; render the <Text fontWeight="600">{"<Icon name=… />"}</Text> component
          with any registry name.
        </Text>
      </Stack>

      <TextInput
        placeholder="Search icons…"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        size="sm"
      />

      <Text c="$color10" fz={12}>
        {matches.length === 0
          ? `No icons match “${query.trim()}”.`
          : truncated > 0
            ? `Showing ${visible.length} of ${matches.length} matches (${truncated} more — refine your search).`
            : `Showing ${matches.length} ${matches.length === 1 ? "icon" : "icons"}.`}
      </Text>

      <Box flexDirection="row" flexWrap="wrap" gap="$sm">
        {visible.map((name) => (
          <IconTile key={name} name={name} color={iconColor} />
        ))}
      </Box>
    </Stack>
  );
}
