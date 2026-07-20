import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { VirtualList } from "./VirtualList";
import type { VirtualListHandle } from "./VirtualList";

interface Row {
  id: string;
  label: string;
  height: number;
}

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

// A large dataset — the whole point is that only a handful of rows are ever mounted.
const makeData = (n: number, variable = false): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `row-${i}`,
    label: `Row ${i}`,
    height: variable ? 48 + ((i * 37) % 120) : 56,
  }));

const DATA = makeData(10000);
const VARIABLE = makeData(10000, true);

const RowCard = ({ row }: { row: Row }) => (
  <Box
    height={row.height}
    paddingHorizontal="$md"
    justifyContent="center"
    borderBottomWidth={1}
    borderColor="$borderColor"
    backgroundColor="$background"
  >
    <Text fontWeight="600">{row.label}</Text>
    {row.height > 90 ? <Text color="$colorSubtle">{LOREM.slice(0, 80)}</Text> : null}
  </Box>
);

const meta = {
  title: "Data Display/VirtualList",
  component: VirtualList,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "VirtualList is a fast, windowed, variable-height list that renders only the rows near the viewport (plus a render-ahead buffer). One source runs on web and React Native by riding ScrollArea and driving windowing off `onScrollPositionChange`; row heights are measured via `onLayout` and fed to a per-type running-average size model, so no exact `estimatedItemSize` is required. Mirrors the familiar FlatList / FlashList surface (`data`, `renderItem`, `keyExtractor`, `getItemType`, `onEndReached`, `ListHeaderComponent`/`ListFooterComponent`/`ListEmptyComponent`/`ItemSeparatorComponent`) plus an imperative handle (`scrollToIndex` / `scrollToOffset` / `scrollToEnd`).",
      },
    },
  },
  // Required props satisfied at the meta level; every story overrides via `render`.
  args: { data: [], renderItem: () => null },
} satisfies Meta<typeof VirtualList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 10,000 fixed-height rows — scroll freely; only ~a dozen nodes are mounted. */
export const Basic: Story = {
  render: () => (
    <Box width={360} height={420} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
      <VirtualList<Row>
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RowCard row={item} />}
        height="100%"
      />
    </Box>
  ),
};

/** Rows of differing heights — measured on mount and estimated by running average. */
export const VariableHeights: Story = {
  render: () => (
    <Box width={360} height={420} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
      <VirtualList<Row>
        data={VARIABLE}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        renderItem={({ item }) => <RowCard row={item} />}
        height="100%"
      />
    </Box>
  ),
};

/** Header, footer, and separators between rows. */
export const WithChrome: Story = {
  render: () => (
    <Box width={360} height={420} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
      <VirtualList<Row>
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RowCard row={item} />}
        ListHeaderComponent={
          <Box padding="$md" backgroundColor="$backgroundStrong">
            <Text fontWeight="700">10,000 rows</Text>
          </Box>
        }
        ListFooterComponent={
          <Box padding="$md" alignItems="center">
            <Text color="$colorSubtle">— end —</Text>
          </Box>
        }
        ItemSeparatorComponent={<Box height={1} backgroundColor="$borderColor" />}
        height="100%"
      />
    </Box>
  ),
};

/** No data → the empty component is shown. */
export const Empty: Story = {
  render: () => (
    <Box width={360} height={240} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
      <VirtualList<Row>
        data={[]}
        renderItem={({ item }) => <RowCard row={item} />}
        ListEmptyComponent={
          <Box flex={1} alignItems="center" justifyContent="center" padding="$xl">
            <Text color="$colorSubtle">No items yet</Text>
          </Box>
        }
        height="100%"
      />
    </Box>
  ),
};

/** Imperative scrolling via the ref handle. */
export const ImperativeScroll: Story = {
  render: () => {
    const ref = React.useRef<VirtualListHandle>(null);
    return (
      <Box gap="$sm" width={360}>
        <Box flexDirection="row" gap="$sm">
          <Button size="sm" onPress={() => ref.current?.scrollToTop(true)}>
            Top
          </Button>
          <Button
            size="sm"
            onPress={() => ref.current?.scrollToIndex({ index: 500, animated: true })}
          >
            Row 500
          </Button>
          <Button size="sm" onPress={() => ref.current?.scrollToEnd(true)}>
            End
          </Button>
        </Box>
        <Box height={380} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
          <VirtualList<Row>
            ref={ref}
            data={DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RowCard row={item} />}
            height="100%"
          />
        </Box>
      </Box>
    );
  },
};

/** `onEndReached` drives infinite loading — rows append as you near the bottom. */
export const InfiniteScroll: Story = {
  render: () => {
    const [rows, setRows] = React.useState<Row[]>(() => makeData(50));
    const loadingRef = React.useRef(false);
    const loadMore = () => {
      if (loadingRef.current || rows.length >= 2000) return;
      loadingRef.current = true;
      // Simulate an async page fetch.
      setTimeout(() => {
        setRows((prev) => [
          ...prev,
          ...Array.from({ length: 50 }, (_, i) => ({
            id: `row-${prev.length + i}`,
            label: `Row ${prev.length + i}`,
            height: 56,
          })),
        ]);
        loadingRef.current = false;
      }, 300);
    };
    return (
      <Box width={360} height={420} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
        <VirtualList<Row>
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RowCard row={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={1}
          ListFooterComponent={
            <Box padding="$md" alignItems="center">
              <Text color="$colorSubtle">Loading more…</Text>
            </Box>
          }
          height="100%"
        />
      </Box>
    );
  },
};

/** Per-slot `styles` passthrough (Pillar B). */
export const Styles: Story = {
  render: () => (
    <Box width={360} height={420}>
      <VirtualList<Row>
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RowCard row={item} />}
        height="100%"
        styles={{
          scrollArea: { borderWidth: 2, borderColor: "$blue8", borderRadius: "$md" },
          item: { paddingHorizontal: "$xs" },
        }}
      />
    </Box>
  ),
};
