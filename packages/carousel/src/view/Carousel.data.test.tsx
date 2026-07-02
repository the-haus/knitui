import * as React from "react";

import { Box, Text } from "@knitui/components";

import { Carousel } from "../index";
import { createAsyncSlideSource } from "../source";
import { act, render, screen, waitFor } from "../test-utils";
import type { CarouselRef } from "../types";

const slide = (label: string) => (
  <Box>
    <Text>{label}</Text>
  </Box>
);

describe("Carousel — data edge cases", () => {
  it("renders nothing (and does not crash) for empty data", () => {
    render(
      <Carousel
        data={[] as number[]}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={({ item }) => slide(`slide-${item}`)}
      />,
    );
    expect(screen.queryByText(/slide-/)).toBeNull();
  });

  it("handles a single item (auto-filled for the loop)", () => {
    render(
      <Carousel
        data={[0]}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={({ item }) => slide(`slide-${item}`)}
      />,
    );
    // loop + autoFill duplicates the lone item so the ring fills.
    expect(screen.getAllByText("slide-0").length).toBeGreaterThanOrEqual(1);
  });

  it("handles a single item without loop (no duplication)", () => {
    render(
      <Carousel
        data={[0]}
        loop={false}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={({ item }) => slide(`slide-${item}`)}
      />,
    );
    expect(screen.getByText("slide-0")).toBeTruthy();
  });

  it("auto-virtualizes large eager data (does not mount everything)", () => {
    render(
      <Carousel
        data={Array.from({ length: 1000 }, (_, i) => i)}
        loop={false}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={({ item }) => slide(`slide-${item}`)}
      />,
    );
    expect(screen.getByText("slide-0")).toBeTruthy();
    // Default large-data window is bounded, so far-off items are not mounted.
    expect(screen.queryByText("slide-500")).toBeNull();
  });

  it("keeps the active item stable when data shrinks below the index", async () => {
    const onIndexChange = jest.fn();
    const Wrapper = ({ data }: { data: number[] }) => (
      <Carousel
        data={data}
        loop={false}
        itemSize={100}
        defaultIndex={3}
        style={{ width: 100, height: 100 }}
        onIndexChange={onIndexChange}
        renderItem={({ item }) => slide(`slide-${item}`)}
      />
    );
    const { rerender } = render(<Wrapper data={[0, 1, 2, 3, 4]} />);
    rerender(<Wrapper data={[0, 1]} />); // shrink below index 3
    await waitFor(() => expect(onIndexChange).toHaveBeenCalledWith(1)); // clamped to last
  });
});

describe("Carousel — small-list loop (autoFillData)", () => {
  it("duplicates a 2-item loop so the ring fills, but reports real indices", async () => {
    const ref = React.createRef<CarouselRef>();
    const onIndexChange = jest.fn();
    render(
      <Carousel
        ref={ref}
        data={["A", "B"]}
        loop
        itemSize={100}
        style={{ width: 100, height: 100 }}
        onIndexChange={onIndexChange}
        renderItem={({ item }) => slide(`slide-${item}`)}
      />,
    );
    // Both real items render (duplicated cells map back to A/B).
    expect(screen.getAllByText("slide-A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("slide-B").length).toBeGreaterThanOrEqual(1);

    // Index callbacks stay in real (0/1) space, not the effective (0..3) space.
    act(() => {
      ref.current?.next({ animated: false });
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(1));
    act(() => {
      ref.current?.next({ animated: false });
    });
    await waitFor(() => expect(ref.current?.getCurrentIndex()).toBe(0)); // wraps 1 → 0
    expect(onIndexChange.mock.calls.every(([i]) => i === 0 || i === 1)).toBe(true);
  });
});

describe("Carousel — async source (lazy/remote data)", () => {
  it("shows placeholders then the fetched items", async () => {
    const fetchRange = jest.fn(async (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => `remote-${start + i}`),
    );
    const source = createAsyncSlideSource({ length: 100, fetchRange, pageSize: 10 });

    render(
      <Carousel
        source={source}
        loop={false}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={({ item }) => slide(item)}
        renderPlaceholder={() => slide("loading")}
      />,
    );

    // First paint: window items not loaded yet → placeholders.
    expect(screen.getAllByText("loading").length).toBeGreaterThan(0);
    // It requested the first page only (bounded window), not the whole list.
    expect(fetchRange).toHaveBeenCalledWith(0, 10);

    await waitFor(() => expect(screen.getByText("remote-0")).toBeTruthy());
    expect(screen.queryByText("loading")).toBeNull();
  });

  it("does not fetch the entire list up front", async () => {
    const fetchRange = jest.fn(async (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => `r-${start + i}`),
    );
    const source = createAsyncSlideSource({ length: 10000, fetchRange, pageSize: 10 });
    render(
      <Carousel
        source={source}
        loop={false}
        itemSize={100}
        style={{ width: 100, height: 100 }}
        renderItem={({ item }) => slide(item)}
        renderPlaceholder={() => slide("loading")}
      />,
    );
    await waitFor(() => expect(screen.getByText("r-0")).toBeTruthy());
    // Only the first page(s) covering the bounded window were fetched.
    expect(fetchRange.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("prefetches pages ahead of the mounted window (no placeholder flash on scroll)", async () => {
    const fetchRange = jest.fn(async (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => `p-${start + i}`),
    );
    const source = createAsyncSlideSource({ length: 100, fetchRange, pageSize: 5 });
    render(
      <Carousel
        source={source}
        loop={false}
        itemSize={100}
        windowSize={3}
        style={{ width: 100, height: 100 }}
        renderItem={({ item }) => slide(item)}
        renderPlaceholder={() => slide("loading")}
      />,
    );
    await waitFor(() => expect(screen.getByText("p-0")).toBeTruthy());
    // The mounted window is [0,1,2] (page 0), but the forward prefetch lead
    // reaches into the next page (index 5+), so page 1 is fetched up front —
    // before any of its slides are mounted.
    expect(fetchRange).toHaveBeenCalledWith(5, 5);
  });
});
