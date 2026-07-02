import { Suspense, useMemo, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions } from "react-native";

import {
  Box,
  Center,
  Flex,
  Loader,
  Paragraph,
  Separator,
  Stack,
  Text,
  TextInput,
  Title,
} from "@knitui/components";
import { Provider, useColorScheme, useTheme } from "@knitui/core";
import { MediaProvider } from "@knitui/media";

import { type DemoSection, demoSections } from "./sections";
import { StoryErrorBoundary } from "./StorySection";

/** Sections grouped by their Storybook group, preserving the registry order. */
function useGroupedSections(query: string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? demoSections.filter((s) => `${s.group} ${s.title}`.toLowerCase().includes(q))
      : demoSections;
    const groups = new Map<string, DemoSection[]>();
    for (const section of matches) {
      const list = groups.get(section.group) ?? [];
      list.push(section);
      groups.set(section.group, list);
    }
    return [...groups.entries()];
  }, [query]);
}

function SidebarRow({
  section,
  active,
  onPress,
}: {
  section: DemoSection;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        backgroundColor: active ? theme.color4?.val : pressed ? theme.color3?.val : "transparent",
        borderRadius: 6,
      })}
    >
      <Box px="$sm" py="$xs">
        <Text c={active ? "$color12" : "$color11"} fz={13} fontWeight={active ? "600" : "400"}>
          {section.title}
        </Text>
      </Box>
    </Pressable>
  );
}

function Gallery() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(demoSections[0]?.id);

  const grouped = useGroupedSections(query);
  const active = demoSections.find((s) => s.id === activeId);

  return (
    <Box flexDirection="row" height={height} bg="$background">
      {/* Sidebar */}
      <Stack width={260} borderRightWidth={1} borderColor="$color4">
        <Stack p="$md" gap="$sm">
          <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Title order={4}>Knit UI</Title>
            <Pressable onPress={toggleColorScheme} accessibilityLabel="Toggle color scheme">
              <Paragraph>{colorScheme === "dark" ? "🌙" : "☀️"}</Paragraph>
            </Pressable>
          </Box>
          <TextInput
            placeholder="Search…"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            size="sm"
          />
          <Text c="$color10" fz={11}>
            {demoSections.length} components
          </Text>
        </Stack>
        <Separator />
        <ScrollView testID="DemoScreen.sidebar" style={{ flex: 1 }}>
          <Stack p="$sm" gap="$md">
            {grouped.map(([group, sections]) => (
              <Stack key={group} gap="$xxs">
                <Text c="$color9" fz={10} fontWeight="700" px="$sm" textTransform="uppercase">
                  {group}
                </Text>
                {sections.map((section) => (
                  <SidebarRow
                    key={section.id}
                    section={section}
                    active={section.id === activeId}
                    onPress={() => setActiveId(section.id)}
                  />
                ))}
              </Stack>
            ))}
            {grouped.length === 0 && (
              <Center py="$xl">
                <Paragraph c="$color11">No matches for “{query}”.</Paragraph>
              </Center>
            )}
          </Stack>
        </ScrollView>
      </Stack>

      {/* Active section. Full-bleed sections (maps) fill the pane so their
          flex:1 content gets a real height; the rest scroll in a padded column. */}
      {active?.fullBleed ? (
        <Flex testID="DemoScreen.content" flex={1} p="$lg">
          <Suspense
            fallback={
              <Center flex={1}>
                <Loader theme="blue" />
              </Center>
            }
          >
            <StoryErrorBoundary label={active.title}>
              <active.Component />
            </StoryErrorBoundary>
          </Suspense>
        </Flex>
      ) : (
        <ScrollView
          testID="DemoScreen.content"
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 32 }}
        >
          {active ? (
            <Stack gap="$xl" maw={900} w="100%">
              <Suspense
                fallback={
                  <Center py="$xl">
                    <Loader theme="blue" />
                  </Center>
                }
              >
                <StoryErrorBoundary label={active.title}>
                  <active.Component />
                </StoryErrorBoundary>
              </Suspense>
            </Stack>
          ) : (
            <Center flex={1}>
              <Paragraph c="$color11">Select a component.</Paragraph>
            </Center>
          )}
        </ScrollView>
      )}
    </Box>
  );
}

/**
 * The shared demo gallery for the web app (Next.js `apps/web`). A sidebar lists
 * every component (one per Storybook story module, see `sections.generated.tsx`);
 * selecting one mounts just that section — so only one component renders at a
 * time, exactly like Storybook and the Expo `apps/app`. This keeps the page light
 * and isolates any single component's failure to its own pane. Wraps everything
 * in `<Provider>` for theming and `<MediaProvider>` so the audio/video sections
 * have the single shared element they teleport into.
 */
export function DemoScreen() {
  return (
    <Provider defaultColorScheme="light">
      <MediaProvider>
        <Gallery />
      </MediaProvider>
    </Provider>
  );
}
