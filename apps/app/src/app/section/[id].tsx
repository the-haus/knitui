import { Stack as RouterStack, useLocalSearchParams } from "expo-router";
import { Suspense } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Center, Loader, Paragraph, Stack } from "@knitui/components";
import { demoSections } from "@knitui/demo";

/**
 * Section detail route. Resolves the section by its `id` path param and mounts
 * the matching `React.lazy` component inside `<Suspense>`, so the section's
 * module is evaluated only once this route is opened.
 */
export default function SectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const section = demoSections.find((s) => s.id === id);

  if (!section) {
    return (
      <Center flex={1} bg="$background">
        <RouterStack.Screen options={{ title: "Not found" }} />
        <Paragraph c="$color11">Unknown section “{id}”.</Paragraph>
      </Center>
    );
  }

  const { Component } = section;
  return (
    <ScrollView
      testID={`Section.${section.id}`}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
    >
      <RouterStack.Screen options={{ title: section.title }} />
      <Stack gap="$xl" p="$xl" bg="$background" flex={1}>
        <Suspense
          fallback={
            <Center flex={1} py="$xl">
              <Loader theme="blue" />
            </Center>
          }
        >
          <Component />
        </Suspense>
      </Stack>
    </ScrollView>
  );
}
