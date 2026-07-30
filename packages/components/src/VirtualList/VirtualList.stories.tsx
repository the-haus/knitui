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

/**
 * Lets a story show how many rows are really mounted. Rows report in on mount and
 * out on unmount, so the tally is the live size of the mounted set — no DOM peeking,
 * so it reads the same on native.
 */
const MountTallyContext = React.createContext<((delta: number) => void) | null>(null);

const MountCounter = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(0);
  const report = React.useCallback((delta: number) => setMounted((n) => n + delta), []);
  return (
    <Box gap="$xs" width={240}>
      <Text fontWeight="700" fontSize="$sm">
        {title}
      </Text>
      <Text color="$colorSubtle" fontSize="$sm">
        {`${mounted} rows mounted`}
      </Text>
      <Box height={340} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
        <MountTallyContext.Provider value={report}>{children}</MountTallyContext.Provider>
      </Box>
    </Box>
  );
};

/**
 * A row that owns state nothing outside it can restore — the case `keepMounted`
 * exists for. Unmount it and the count is gone.
 */
const CounterRow = ({ row }: { row: Row }) => {
  const [count, setCount] = React.useState(0);
  const report = React.useContext(MountTallyContext);
  React.useEffect(() => {
    report?.(1);
    return () => report?.(-1);
  }, [report]);
  return (
    <Box
      height={row.height}
      paddingHorizontal="$md"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      gap="$sm"
      borderBottomWidth={1}
      borderColor="$borderColor"
      backgroundColor={count > 0 ? "$blue2" : "$background"}
    >
      <Text fontWeight="600">{row.label}</Text>
      {/* Button defaults to alignSelf="flex-start" so it never stretches; centre it. */}
      <Button size="sm" alignSelf="center" onPress={() => setCount((c) => c + 1)}>
        {`count ${count}`}
      </Button>
    </Box>
  );
};

const meta = {
  title: "Data Display/VirtualList",
  component: VirtualList,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "VirtualList is a fast, windowed, variable-height list that renders only the rows near the viewport (plus a render-ahead buffer). One source runs on web and React Native by riding ScrollArea and driving windowing off `onScrollPositionChange`; row heights are measured via `onLayout` and fed to a per-type running-average size model, so no exact `estimatedItemSize` is required. Mirrors the familiar FlatList / FlashList surface (`data`, `renderItem`, `keyExtractor`, `getItemType`, `onEndReached`, `ListHeaderComponent`/`ListFooterComponent`/`ListEmptyComponent`/`ItemSeparatorComponent`) plus an imperative handle (`scrollToIndex` / `scrollToOffset` / `scrollToEnd`). Set `keepMounted` when rows own state that must survive scrolling out of view — a bounded LRU warm pool (`keepMounted={40}`) or everything ever mounted (`keepMounted`).",
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

/**
 * `keepMounted` — rows keep their own state after scrolling out of view.
 *
 * Both lists render the same stateful row (a per-row counter). Bump a few counters
 * near the top, scroll to the bottom, then scroll back: the plain list unmounted
 * those rows and their counts are back to 0, while the `keepMounted` list kept them
 * in the tree. A number bounds the pool — the least-recently-visible rows are
 * evicted first — so memory stays bounded on a long list.
 */
export const KeepMounted: Story = {
  render: () => {
    const data = React.useMemo(() => makeData(500), []);
    const renderItem = React.useCallback(
      ({ item }: { item: Row }) => <CounterRow row={item} />,
      [],
    );
    return (
      <Box flexDirection="row" gap="$md">
        {(
          [
            { title: "Default (unmounts)", keep: false as const },
            { title: "keepMounted={40}", keep: 40 },
          ] satisfies Array<{ title: string; keep: boolean | number }>
        ).map(({ title, keep }) => (
          <Box key={title} gap="$xs" width={240}>
            <Text fontWeight="700" fontSize="$sm">
              {title}
            </Text>
            <Box height={360} borderWidth={1} borderColor="$borderColor" borderRadius="$md">
              <VirtualList<Row>
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                keepMounted={keep}
                height="100%"
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  },
};

/**
 * `keepMounted="all"` — windowing off entirely.
 *
 * Every row in `data` is mounted from the first commit, whether or not it has ever
 * been on screen, so find-in-page reaches every row and nothing measures late. This
 * gives up what virtualization buys you — mount cost is O(data) — so it is for lists
 * of a size you would have `.map()`ed anyway. The counter shows how many rows are
 * really in the tree; compare it with the windowed list beside it.
 */
export const MountEverything: Story = {
  render: () => {
    const data = React.useMemo(() => makeData(60), []);
    const renderItem = React.useCallback(
      ({ item }: { item: Row }) => <CounterRow row={item} />,
      [],
    );
    return (
      <Box flexDirection="row" gap="$md">
        {(
          [
            { title: "Windowed (default)", keep: false as const },
            { title: 'keepMounted="all"', keep: "all" as const },
          ] satisfies Array<{ title: string; keep: boolean | "all" }>
        ).map(({ title, keep }) => (
          <MountCounter key={title} title={title}>
            <VirtualList<Row>
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              keepMounted={keep}
              height="100%"
            />
          </MountCounter>
        ))}
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
