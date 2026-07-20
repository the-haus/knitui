import * as React from "react";

import { render, screen } from "../test-utils";
import { Text } from "../Text";
import { VirtualList } from "./VirtualList";
import type { VirtualListHandle } from "./VirtualList";
import {
  createLayoutState,
  findVisibleRange,
  getContentSize,
  getItemOffset,
  heightAt,
  resizeLayoutState,
  setMeasured,
} from "./VirtualList.shared";

/* -------------------------------------------------------------------------- */
/* Pure layout engine                                                         */
/* -------------------------------------------------------------------------- */

describe("VirtualList layout engine", () => {
  it("seeds every row with the estimate before measurement", () => {
    const s = createLayoutState(10, 50);
    expect(heightAt(s, 0)).toBe(50);
    expect(getContentSize(s)).toBe(500);
    expect(getItemOffset(s, 4)).toBe(200);
  });

  it("uses measured heights and recomputes offsets forward", () => {
    const s = createLayoutState(5, 100);
    expect(setMeasured(s, 0, 0, 40)).toBe(true);
    expect(setMeasured(s, 1, 0, 60)).toBe(true);
    // Row 0 = 40, row 1 = 60 (measured). Unmeasured rows 2..4 now estimate off the
    // type's running average — (40 + 60) / 2 = 50 — not the initial 100 seed.
    expect(getItemOffset(s, 0)).toBe(0);
    expect(getItemOffset(s, 1)).toBe(40);
    expect(getItemOffset(s, 2)).toBe(100);
    expect(getContentSize(s)).toBe(40 + 60 + 50 * 3);
  });

  it("treats a sub-pixel remeasure as unchanged", () => {
    const s = createLayoutState(3, 100);
    expect(setMeasured(s, 0, 0, 40)).toBe(true);
    expect(setMeasured(s, 0, 0, 40.2)).toBe(false);
    expect(setMeasured(s, 0, 0, 45)).toBe(true);
  });

  it("estimates unmeasured rows from a per-type running average", () => {
    const s = createLayoutState(6, 100);
    // Two measured rows of type "a" average to 30; type "b" not measured yet.
    setMeasured(s, 0, "a", 20);
    setMeasured(s, 1, "a", 40);
    s.types[2] = "a"; // an unmeasured type-"a" row
    s.dirtyFrom = 0;
    expect(heightAt(s, 2)).toBe(30);
    // A row of an unseen type falls back to the global estimate.
    s.types[3] = "b";
    expect(heightAt(s, 3)).toBe(100);
  });

  it("averages over ALL measured samples, so the estimate converges", () => {
    // Regression guard for scrollbar jitter: the per-type estimate must be a
    // cumulative mean of every sample, not a short rolling window. A window
    // would drop early samples and let the estimate (and thus the total content
    // size feeding the scrollbar thumb) oscillate as rows scroll past.
    const s = createLayoutState(20, 100);
    const heights = [10, 20, 30, 40, 50, 60, 70]; // 7 samples of one type
    heights.forEach((h, i) => setMeasured(s, i, "a", h));
    s.types[10] = "a"; // an unmeasured row of the same type
    s.dirtyFrom = 0;
    // Full mean = 40. A last-5 window would give (30+40+50+60+70)/5 = 50.
    expect(heightAt(s, 10)).toBe(40);
  });

  it("estimate moves less as more samples accumulate (jitter decays)", () => {
    const s = createLayoutState(50, 100);
    s.types[40] = "a";
    // Seed a stable run of samples, then add one outlier early vs. late and
    // confirm the outlier perturbs the estimate far less once count is high.
    setMeasured(s, 0, "a", 50);
    setMeasured(s, 1, "a", 50);
    s.dirtyFrom = 0;
    const beforeEarly = heightAt(s, 40);
    setMeasured(s, 2, "a", 200); // outlier with only 2 prior samples
    s.dirtyFrom = 0;
    const earlySwing = Math.abs(heightAt(s, 40) - beforeEarly);

    const s2 = createLayoutState(50, 100);
    s2.types[45] = "a"; // the probe: an unmeasured row of the same type
    for (let i = 0; i < 40; i++) setMeasured(s2, i, "a", 50);
    s2.dirtyFrom = 0;
    const beforeLate = heightAt(s2, 45);
    setMeasured(s2, 40, "a", 200); // same outlier, but with 40 prior samples
    s2.dirtyFrom = 0;
    const lateSwing = Math.abs(heightAt(s2, 45) - beforeLate);

    expect(lateSwing).toBeLessThan(earlySwing);
  });

  it("windows the visible range with an overscan buffer", () => {
    const s = createLayoutState(100, 100); // offsets 0,100,200,...
    // Viewport [500, 800), overscan 0 → rows 5..7 (row 7 top=700 < 800).
    expect(findVisibleRange(s, 500, 300, 0)).toEqual({ start: 5, end: 7 });
    // Same viewport, overscan 100 → widened to rows 4..8.
    expect(findVisibleRange(s, 500, 300, 100)).toEqual({ start: 4, end: 8 });
  });

  it("clamps the window at the list edges", () => {
    const s = createLayoutState(10, 100);
    expect(findVisibleRange(s, 0, 250, 0).start).toBe(0);
    const end = findVisibleRange(s, 5000, 250, 0);
    expect(end.end).toBe(9);
  });

  it("returns an empty range for no data", () => {
    const s = createLayoutState(0, 100);
    expect(findVisibleRange(s, 0, 300, 100)).toEqual({ start: 0, end: -1 });
    expect(getContentSize(s)).toBe(0);
  });

  it("grows and shrinks while preserving measurements by index", () => {
    const s = createLayoutState(3, 100);
    setMeasured(s, 0, 0, 25);
    resizeLayoutState(s, 5);
    expect(s.count).toBe(5);
    expect(heightAt(s, 0)).toBe(25); // preserved
    // New rows estimate off the type's running average (25), which the one measured
    // row established — not the initial 100 seed.
    expect(heightAt(s, 4)).toBe(25);
    resizeLayoutState(s, 1);
    expect(s.count).toBe(1);
    expect(getContentSize(s)).toBe(25);
  });
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const DATA = Array.from({ length: 200 }, (_, i) => ({ id: `k${i}`, label: `Row ${i}` }));

describe("VirtualList component", () => {
  it("renders the initial window of rows", () => {
    render(
      <VirtualList
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        height={300}
      />,
    );
    // The first rows are always mounted (viewport + overscan from offset 0).
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    // A row far down the list is NOT mounted (virtualized away).
    expect(screen.queryByText("Row 150")).not.toBeInTheDocument();
  });

  it("renders the empty component when there is no data", () => {
    render(
      <VirtualList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={<Text>Nothing here</Text>}
        height={300}
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders header and footer chrome", () => {
    render(
      <VirtualList
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        ListHeaderComponent={<Text>The Header</Text>}
        ListFooterComponent={<Text>The Footer</Text>}
        height={300}
      />,
    );
    expect(screen.getByText("The Header")).toBeInTheDocument();
    expect(screen.getByText("The Footer")).toBeInTheDocument();
  });

  it("exposes an imperative handle on the forwarded ref", () => {
    const ref = React.createRef<VirtualListHandle>();
    render(
      <VirtualList
        ref={ref}
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        height={300}
      />,
    );
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.scrollToIndex).toBe("function");
    expect(typeof ref.current?.scrollToOffset).toBe("function");
    expect(typeof ref.current?.scrollToEnd).toBe("function");
    expect(typeof ref.current?.getScrollOffset).toBe("function");
    expect(ref.current?.getScrollOffset()).toBe(0);
  });
});
