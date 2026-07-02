import { Stack as RouterStack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Box,
  Center,
  Paragraph,
  Separator,
  Stack,
  Text,
  TextInput,
  Title,
} from "@knitui/components";
import { useColorScheme, useTheme } from "@knitui/core";
import { type DemoSection, demoSections } from "@knitui/demo";

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
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [query]);
}

/**
 * Home route — a filterable, grouped list of every demo section. No section
 * module is loaded here; tapping a row navigates to `/section/[id]`, which is
 * the only place the (lazy) section component is mounted. Sections are grouped
 * by their Storybook group, mirroring the web demo's sidebar.
 */
export default function SectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [query, setQuery] = useState("");

  const grouped = useGroupedSections(query);

  return (
    <Stack flex={1} bg="$background">
      <RouterStack.Screen
        options={{
          title: "Knit UI",
          headerRight: () => (
            <Pressable onPress={toggleColorScheme} accessibilityLabel="Toggle color scheme">
              <Paragraph>{colorScheme === "dark" ? "🌙" : "☀️"}</Paragraph>
            </Pressable>
          ),
        }}
      />
      <Stack px="$lg" pt="$md" pb="$sm" gap="$sm">
        <Title order={4} c="$color11">
          {demoSections.length} sections
        </Title>
        <TextInput
          placeholder="Search sections…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Stack>
      <SectionList
        sections={grouped}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <Separator />}
        renderSectionHeader={({ section }) => (
          <Box bg="$background" px="$lg" pt="$md" pb="$xs">
            <Text c="$color9" fz={11} fontWeight="700" textTransform="uppercase">
              {section.title}
            </Text>
          </Box>
        )}
        renderItem={({ item }) => (
          <SectionRow section={item} onPress={() => router.push(`/section/${item.id}`)} />
        )}
        ListEmptyComponent={
          <Center py="$xl">
            <Paragraph c="$color11">No sections match “{query}”.</Paragraph>
          </Center>
        }
      />
    </Stack>
  );
}

function SectionRow({ section, onPress }: { section: DemoSection; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      android_ripple={{ color: theme.color5?.val }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" px="$lg" py="$md">
        <Paragraph>{section.title}</Paragraph>
        <Paragraph c="$color10">›</Paragraph>
      </Box>
    </Pressable>
  );
}
