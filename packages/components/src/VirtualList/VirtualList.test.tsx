import * as React from "react";

import { Box } from "../Box";
import { fireEvent, render, screen } from "../test-utils";
import { Text } from "../Text";
import { VirtualList } from "./VirtualList";
import type { VirtualListHandle, VirtualListProps } from "./VirtualList";
import {
  areRowsMeasured,
  createLayoutState,
  createRetainState,
  findVisibleRange,
  getContentSize,
  getItemOffset,
  heightAt,
  isMountAll,
  remapRetainState,
  resizeLayoutState,
  resolveRetainLimit,
  retainedOutside,
  retainRange,
  setMeasured,
  syncLayoutKeys,
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

  it("carries measurements to their new index on a prepend", () => {
    // A prepend is one case of the keyed re-sync: 3 rows of history land at the head
    // and the two measured rows keep their heights at their new indices.
    const s = createLayoutState(2, 100);
    syncLayoutKeys(s, ["a", "b"]);
    setMeasured(s, 0, 0, 30);
    setMeasured(s, 1, 0, 40);

    syncLayoutKeys(s, ["x", "y", "z", "a", "b"]);

    expect(s.count).toBe(5);
    // The two measured rows are now 3 and 4 — and only they are measured.
    expect(heightAt(s, 3)).toBe(30);
    expect(heightAt(s, 4)).toBe(40);
    expect(s.measured.slice(0, 3)).toEqual([false, false, false]);
    // The head estimates off the running average (35) the measured rows established.
    expect(heightAt(s, 0)).toBe(35);
    expect(getItemOffset(s, 3)).toBe(105);
    expect(getContentSize(s)).toBe(175);
  });

  it("routing a prepend through resize would misattribute — the bug keying fixes", () => {
    const s = createLayoutState(2, 100);
    setMeasured(s, 0, 0, 30);
    resizeLayoutState(s, 5);
    // 30px stayed on index 0, which is now a different row entirely.
    expect(heightAt(s, 0)).toBe(30);
    expect(s.measured[2]).toBe(false);
  });

  it("reports whether a head band has settled", () => {
    const s = createLayoutState(4, 100);
    expect(areRowsMeasured(s, 0, 2)).toBe(false);
    setMeasured(s, 0, 0, 10);
    expect(areRowsMeasured(s, 0, 2)).toBe(false);
    setMeasured(s, 1, 0, 10);
    expect(areRowsMeasured(s, 0, 2)).toBe(true);
    // An empty band is settled by definition — the anchor releases immediately
    // when nothing was inserted above it.
    expect(areRowsMeasured(s, 0, 0)).toBe(true);
    // Clamped to the store, not read off the end.
    expect(areRowsMeasured(s, 0, 99)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Keyed identity (measurements follow items, not slots)                      */
/* -------------------------------------------------------------------------- */

describe("VirtualList keyed layout", () => {
  /** Measure `keys` at the given heights, through a keyed store. */
  const measured = (keys: string[], heights: number[]) => {
    const s = createLayoutState(keys.length, 100);
    syncLayoutKeys(s, keys);
    heights.forEach((h, i) => setMeasured(s, i, 0, h));
    return s;
  };

  it("keeps each measurement with its item across a prepend", () => {
    const s = measured(["a", "b", "c"], [10, 20, 30]);
    // Prepend "z": index-keyed measurement would give "z" a's 10px and shift
    // everything down one slot. Keyed, every height stays with its item.
    syncLayoutKeys(s, ["z", "a", "b", "c"]);
    expect(heightAt(s, 1)).toBe(10); // a
    expect(heightAt(s, 2)).toBe(20); // b
    expect(heightAt(s, 3)).toBe(30); // c
    // "z" is unmeasured, so it takes the running average of what has been measured.
    expect(s.measured[0]).toBe(false);
    expect(heightAt(s, 0)).toBe(20);
  });

  it("keeps measurements across a reorder", () => {
    const s = measured(["a", "b", "c"], [10, 20, 30]);
    syncLayoutKeys(s, ["c", "b", "a"]);
    expect(heightAt(s, 0)).toBe(30);
    expect(heightAt(s, 2)).toBe(10);
    expect(getItemOffset(s, 2)).toBe(50);
  });

  it("restores a measurement when a filtered-out row comes back", () => {
    const s = measured(["a", "b", "c"], [10, 20, 30]);
    syncLayoutKeys(s, ["a", "c"]); // "b" filtered out
    expect(s.count).toBe(2);
    expect(getContentSize(s)).toBe(40);
    syncLayoutKeys(s, ["a", "b", "c"]); // …and back
    expect(heightAt(s, 1)).toBe(20);
    expect(s.measured[1]).toBe(true);
  });

  it("bounds the measurement cache when the data shrinks for good", () => {
    const s = measured(["a", "b", "c", "d", "e"], [10, 20, 30, 40, 50]);
    expect(s.cache.size).toBe(5);
    // 5 cached vs 1 live is past the slack, so dead keys are dropped.
    syncLayoutKeys(s, ["a"]);
    expect(s.cache.size).toBe(1);
    syncLayoutKeys(s, ["a", "b"]);
    expect(s.measured[1]).toBe(false); // "b" must re-measure
    expect(s.measured[0]).toBe(true); // "a" never lost its height
  });

  it("marks offsets stale from the first row that actually moved", () => {
    const s = measured(["a", "b", "c"], [10, 20, 30]);
    getContentSize(s); // clean the offsets
    expect(s.dirtyFrom).toBe(s.count + 1);
    syncLayoutKeys(s, ["a", "b", "c", "d"]); // append only
    expect(s.dirtyFrom).toBe(3);
    getContentSize(s);
    syncLayoutKeys(s, ["z", "a", "b", "c", "d"]); // prepend
    expect(s.dirtyFrom).toBe(0);
  });

  it("preserves index semantics when there is no keyExtractor", () => {
    // The documented fallback: no identity to follow, so measurements stay in slots.
    const s = createLayoutState(3, 100);
    setMeasured(s, 0, 0, 10);
    resizeLayoutState(s, 4);
    expect(heightAt(s, 0)).toBe(10);
    expect(s.keys).toBeNull();
    expect(s.cache.size).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* Pure retention pool                                                        */
/* -------------------------------------------------------------------------- */

describe("VirtualList retention pool", () => {
  it("resolves the keepMounted prop to a capacity", () => {
    expect(resolveRetainLimit(undefined)).toBe(0);
    expect(resolveRetainLimit(false)).toBe(0);
    expect(resolveRetainLimit(true)).toBe(Infinity);
    expect(resolveRetainLimit(5)).toBe(5);
    expect(resolveRetainLimit(2.7)).toBe(2);
    expect(resolveRetainLimit(0)).toBe(0);
    expect(resolveRetainLimit(-3)).toBe(0);
  });

  /** Fold a window into the pool and read back what would be mounted extra. */
  const visit = (
    r: ReturnType<typeof createRetainState>,
    start: number,
    end: number,
    count: number,
    limit: number,
  ) => {
    retainRange(r, { start, end }, count, limit);
    return retainedOutside(r, { start, end }, count);
  };

  it('treats "all" as no windowing rather than a pool', () => {
    expect(isMountAll("all")).toBe(true);
    expect(isMountAll(true)).toBe(false);
    expect(isMountAll(40)).toBe(false);
    expect(isMountAll(undefined)).toBe(false);
    // Every row is inside the window under "all", so a pool would have nothing left
    // to hold — the capacity is deliberately 0.
    expect(resolveRetainLimit("all")).toBe(0);
  });

  it("retains nothing when disabled", () => {
    const r = createRetainState();
    expect(visit(r, 0, 4, 100, 0)).toEqual([]);
    expect(visit(r, 10, 14, 100, 0)).toEqual([]);
    expect(r.seen.size).toBe(0);
  });

  it("keeps rows that have left the window, ascending", () => {
    const r = createRetainState();
    visit(r, 0, 2, 100, Infinity);
    // Window moved on — 0..2 are out of the window but stay mounted.
    expect(visit(r, 5, 7, 100, Infinity)).toEqual([0, 1, 2]);
    // And 5..7 join the pool once the window moves past them.
    expect(visit(r, 9, 10, 100, Infinity)).toEqual([0, 1, 2, 5, 6, 7]);
  });

  it("never reports a row that is inside the window", () => {
    const r = createRetainState();
    visit(r, 0, 5, 100, Infinity);
    // Overlapping move: 3..5 are still live, so only 0..2 are extras.
    expect(visit(r, 3, 8, 100, Infinity)).toEqual([0, 1, 2]);
  });

  it("is idempotent for an unchanged window", () => {
    const r = createRetainState();
    visit(r, 0, 2, 100, Infinity);
    const a = visit(r, 6, 8, 100, Infinity);
    const version = r.version;
    const b = visit(r, 6, 8, 100, Infinity);
    expect(b).toEqual(a);
    // Nothing changed, so the derivation cache key must not move either.
    expect(r.version).toBe(version);
  });

  it("evicts the least-recently-visible rows past the cap", () => {
    const r = createRetainState();
    // Visit 0..1, then 2..3, then 4..5 — oldest-visible first is 0.
    visit(r, 0, 1, 100, 3);
    visit(r, 2, 3, 100, 3);
    // Four rows (0..3) are out of the window; the cap is 3, so row 0 is evicted.
    expect(visit(r, 4, 5, 100, 3)).toEqual([1, 2, 3]);
    // Re-visiting row 1 makes it the freshest, so the next eviction takes 2, not 1.
    visit(r, 1, 1, 100, 3);
    expect(visit(r, 8, 9, 100, 3)).toEqual([1, 4, 5]);
  });

  it("drops rows the data no longer has", () => {
    const r = createRetainState();
    visit(r, 0, 5, 100, Infinity);
    // The list shrank to 3 rows: 3..5 no longer exist.
    expect(visit(r, 0, 0, 3, Infinity)).toEqual([1, 2]);
  });

  it("clears the pool when the cap drops to zero", () => {
    const r = createRetainState();
    visit(r, 0, 5, 100, Infinity);
    expect(visit(r, 20, 25, 100, 0)).toEqual([]);
    expect(r.seen.size).toBe(0);
  });

  it("follows items across a data change, dropping the ones that left", () => {
    const r = createRetainState();
    const before = ["a", "b", "c", "d"];
    visit(r, 0, 1, 4, Infinity); // a, b seen
    // "b" is removed and two rows are prepended: "a" moved from 0 to 2.
    const after = ["y", "z", "a", "c", "d"];
    remapRetainState(r, before, after);
    expect([...r.seen]).toEqual([2]);
    expect(visit(r, 0, 0, 5, Infinity)).toEqual([2]);
  });

  it("preserves LRU order through a remap", () => {
    const r = createRetainState();
    const before = ["a", "b", "c"];
    visit(r, 0, 0, 3, 2); // "a" is the oldest
    visit(r, 1, 1, 3, 2);
    visit(r, 2, 2, 3, 2);
    const after = ["c", "b", "a"]; // reversed
    remapRetainState(r, before, after);
    // The pool holds all three, still oldest-visible first by identity:
    // a (now index 2), then b (now 1), then the most recent c (now 0).
    expect([...r.seen]).toEqual([2, 1, 0]);
    // Window back on "c" (index 0) with room for one extra: "a" is the oldest, so
    // it is the one evicted and "b" is kept.
    expect(visit(r, 0, 0, 3, 1)).toEqual([1]);
  });
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const DATA = Array.from({ length: 200 }, (_, i) => ({ id: `k${i}`, label: `Row ${i}` }));
type Row = (typeof DATA)[number];

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

  /**
   * Drive the list's windowing the way a real scroll does: `VirtualList` reads
   * `ScrollArea`'s `onScrollPositionChange`, which on web comes off the viewport
   * element's `scroll` event. The viewport is the content spacer's parent.
   */
  const scrollTo = (y: number) => {
    const viewport = screen.getByTestId("vl-content").parentElement as HTMLElement;
    fireEvent.scroll(viewport, { target: { scrollTop: y } });
  };

  const renderList = (extra: Partial<VirtualListProps<Row>> = {}) =>
    render(
      <VirtualList<Row>
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        estimatedItemSize={100}
        drawDistance={0}
        height={300}
        styles={{ content: { testID: "vl-content" } }}
        {...extra}
      />,
    );

  it("unmounts rows that leave the window by default", () => {
    renderList();
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    scrollTo(3000);
    // The window followed the scroll: row 0 is gone, a row near 3000px is mounted.
    expect(screen.queryByText("Row 0")).not.toBeInTheDocument();
    expect(screen.getByText("Row 30")).toBeInTheDocument();
  });

  it("keepMounted keeps every already-seen row mounted", () => {
    renderList({ keepMounted: true });
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    scrollTo(3000);
    expect(screen.getByText("Row 30")).toBeInTheDocument();
    // Row 0 was mounted before, so it survives leaving the window.
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    // A row never visited is still virtualized away.
    expect(screen.queryByText("Row 100")).not.toBeInTheDocument();
    // Scrolling back does not remount it, and it never left the tree.
    scrollTo(0);
    expect(screen.getByText("Row 0")).toBeInTheDocument();
  });

  it("keepMounted preserves a row's own state across leaving the window", () => {
    const mounts: string[] = [];
    const StatefulRow = ({ label }: { label: string }) => {
      React.useEffect(() => {
        mounts.push(label);
      }, [label]);
      return <Text>{label}</Text>;
    };
    const renderItem = ({ item }: { item: Row }) => <StatefulRow label={item.label} />;

    renderList({ keepMounted: true, renderItem });
    expect(mounts.filter((l) => l === "Row 0")).toHaveLength(1);
    scrollTo(3000);
    scrollTo(0);
    // One mount, ever — the row was never torn down, so whatever state it held
    // (and any work it had in flight) is still there.
    expect(mounts.filter((l) => l === "Row 0")).toHaveLength(1);
  });

  it("keepMounted as a number bounds the pool, evicting least-recently-visible", () => {
    // Rows are 100px; the window at offset 0 with drawDistance 0 and a 0-height
    // jsdom viewport is row 0 alone, so each stop adds exactly one row to the pool.
    renderList({ keepMounted: 1 });
    scrollTo(100); // row 1 live, pool = [0]
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    scrollTo(200); // row 2 live, pool would be [0, 1] → over cap, row 0 evicted
    expect(screen.getByText("Row 1")).toBeInTheDocument();
    expect(screen.queryByText("Row 0")).not.toBeInTheDocument();
  });

  it('keepMounted="all" mounts every row, including ones never scrolled to', () => {
    const onRenderedRangeChange = jest.fn();
    renderList({ keepMounted: "all", onRenderedRangeChange });
    // No scrolling has happened at all, yet the last row of 200 is in the tree.
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    expect(screen.getByText("Row 199")).toBeInTheDocument();
    // …and the reported range is the whole list, because the window IS the list.
    expect(onRenderedRangeChange.mock.calls.at(-1)?.[0]).toEqual({ start: 0, end: 199 });
  });

  it('keepMounted="all" keeps the whole list mounted while scrolling', () => {
    renderList({ keepMounted: "all" });
    scrollTo(12000);
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    expect(screen.getByText("Row 199")).toBeInTheDocument();
  });

  it('keepMounted="all" still tracks data changes', () => {
    const { rerender } = renderList({ keepMounted: "all" });
    expect(screen.getByText("Row 199")).toBeInTheDocument();
    rerender(
      <VirtualList<Row>
        data={DATA.slice(0, 4)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        estimatedItemSize={100}
        drawDistance={0}
        height={300}
        keepMounted="all"
        styles={{ content: { testID: "vl-content" } }}
      />,
    );
    expect(screen.queryByText("Row 199")).not.toBeInTheDocument();
    expect(screen.getByText("Row 3")).toBeInTheDocument();
  });

  it("keepMounted follows items through a prepend", () => {
    const list = (data: Row[]) => (
      <VirtualList<Row>
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        estimatedItemSize={100}
        drawDistance={0}
        height={300}
        keepMounted
        styles={{ content: { testID: "vl-content" } }}
      />
    );
    const { rerender } = render(list(DATA.slice(0, 50)));
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    scrollTo(2000);
    expect(screen.queryByText("Row 20")).toBeInTheDocument();
    // Two new rows at the front shift every index by 2. Retention is by identity,
    // so the rows the user already saw are still the ones kept.
    rerender(
      list([
        { id: "new-a", label: "New A" },
        { id: "new-b", label: "New B" },
        ...DATA.slice(0, 50),
      ]),
    );
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    // …and the freshly prepended rows were never mounted, so they are not retained.
    expect(screen.queryByText("New A")).not.toBeInTheDocument();
  });

  it("keepMounted survives a reorder without remounting the kept rows", () => {
    const mounts: string[] = [];
    const StatefulRow = ({ label }: { label: string }) => {
      React.useEffect(() => {
        mounts.push(label);
      }, [label]);
      return <Text>{label}</Text>;
    };
    const renderItem = ({ item }: { item: Row }) => <StatefulRow label={item.label} />;
    const list = (data: Row[]) => (
      <VirtualList<Row>
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={100}
        drawDistance={0}
        height={300}
        keepMounted
        styles={{ content: { testID: "vl-content" } }}
      />
    );
    const head = DATA.slice(0, 50);
    const { rerender } = render(list(head));
    scrollTo(2000);
    expect(screen.getByText("Row 0")).toBeInTheDocument();

    // Reverse the list: "Row 0" moves from index 0 to index 49. The pool is keyed by
    // identity, so it must be mounted at its NEW index in the very same render — a
    // one-frame stale window would tear it down and lose exactly the state
    // `keepMounted` exists to protect.
    rerender(list([...head].reverse()));
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    expect(mounts.filter((l) => l === "Row 0")).toHaveLength(1);
  });

  it("keepMounted does not widen onRenderedRangeChange", () => {
    const onRenderedRangeChange = jest.fn();
    renderList({ keepMounted: true, onRenderedRangeChange });
    scrollTo(3000);
    const last = onRenderedRangeChange.mock.calls.at(-1)?.[0];
    // The reported range is the live window, not the window plus the pool.
    expect(last.start).toBeGreaterThan(0);
  });

  it("absorbs a prepend into the scroll offset under maintainVisibleContentPosition", () => {
    // The seam between backwards pagination and the keyed size model: the prepend is
    // still DETECTED by key (which drives this compensation), while the measurements
    // are carried by the keyed re-sync. Rows are 100px estimates, so a 5-row page of
    // history inserts exactly 500px and the offset must move by the same amount for
    // the row the user was reading to stay put.
    const ref = React.createRef<VirtualListHandle>();
    const list = (data: Row[]) => (
      <VirtualList<Row>
        ref={ref}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        estimatedItemSize={100}
        drawDistance={0}
        height={300}
        maintainVisibleContentPosition
        styles={{ content: { testID: "vl-content" } }}
      />
    );
    const tail = DATA.slice(10, 40);
    const { rerender } = render(list(tail));
    scrollTo(2000);
    expect(ref.current?.getScrollOffset()).toBe(2000);

    rerender(list([...DATA.slice(5, 10), ...tail]));
    expect(ref.current?.getScrollOffset()).toBe(2500);
  });

  it("leaves the offset alone on a prepend without maintainVisibleContentPosition", () => {
    const ref = React.createRef<VirtualListHandle>();
    const list = (data: Row[]) => (
      <VirtualList<Row>
        ref={ref}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        estimatedItemSize={100}
        drawDistance={0}
        height={300}
        styles={{ content: { testID: "vl-content" } }}
      />
    );
    const tail = DATA.slice(10, 40);
    const { rerender } = render(list(tail));
    scrollTo(2000);
    rerender(list([...DATA.slice(5, 10), ...tail]));
    // Off by default: the list that only grows at the tail has no reason to hand its
    // scroll position over.
    expect(ref.current?.getScrollOffset()).toBe(2000);
  });

  it("drops retained rows the data no longer has", () => {
    const { rerender } = renderList({ keepMounted: true });
    scrollTo(3000);
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    rerender(
      <VirtualList<Row>
        data={DATA.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        estimatedItemSize={100}
        drawDistance={0}
        height={300}
        keepMounted
        styles={{ content: { testID: "vl-content" } }}
      />,
    );
    // Rows past the new end are gone; the surviving retained rows still render.
    expect(screen.queryByText("Row 30")).not.toBeInTheDocument();
    expect(screen.getByText("Row 0")).toBeInTheDocument();
  });

  it("survives data shrinking below the current window", () => {
    // Regression: `range` is state, so the render right after `data` shrinks still
    // carries the old (longer) window. Indexing `data` with it must not blow up.
    const { rerender } = renderList();
    scrollTo(3000);
    expect(() =>
      rerender(
        <VirtualList<Row>
          data={DATA.slice(0, 3)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Text>{item.label}</Text>}
          estimatedItemSize={100}
          drawDistance={0}
          height={300}
          styles={{ content: { testID: "vl-content" } }}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText("Row 2")).toBeInTheDocument();
  });

  /* ---- render isolation (the point of the two memo boundaries) ---- */

  describe("render isolation", () => {
    const CONTENT_SLOT = { testID: "vl-content" } as const;

    /** A stable `renderItem` that records every call, per the documented contract. */
    const makeRenderItem = (calls: string[]) => {
      const fn = ({ item }: { item: Row }) => {
        calls.push(item.label);
        return <Text>{item.label}</Text>;
      };
      return fn;
    };

    it("does not re-run renderItem when only wrapper-level props change", () => {
      const calls: string[] = [];
      const renderItem = makeRenderItem(calls);
      const tree = (n: number) => (
        <VirtualList<Row>
          data={DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={100}
          height={300}
          // Both of these are fresh identities on every render — the idiomatic way
          // callers write them — and both live on the outer wrapper only.
          ItemSeparatorComponent={<Box height={1} />}
          styles={{ content: CONTENT_SLOT, item: { paddingHorizontal: "$xs" } }}
          // An unrelated frame prop, to force a real parent re-render.
          borderWidth={n}
        />
      );
      const { rerender } = render(tree(1));
      const before = calls.length;
      expect(before).toBeGreaterThan(0);
      rerender(tree(2));
      // The wrapper re-rendered; user row content did not.
      expect(calls.length).toBe(before);
    });

    it("re-runs renderItem for every mounted row when extraData changes", () => {
      const calls: string[] = [];
      const renderItem = makeRenderItem(calls);
      const tree = (extraData: unknown) => (
        <VirtualList<Row>
          data={DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={100}
          height={300}
          extraData={extraData}
          styles={{ content: CONTENT_SLOT }}
        />
      );
      const { rerender } = render(tree("a"));
      const before = calls.length;
      rerender(tree("b"));
      // The documented escape hatch: rows that cannot see external state re-render.
      expect(calls.length).toBeGreaterThan(before);
    });

    it("does not re-run renderItem for rows that stay in the window while scrolling", () => {
      const calls: string[] = [];
      const renderItem = makeRenderItem(calls);
      render(
        <VirtualList<Row>
          data={DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={100}
          drawDistance={1000}
          height={300}
          styles={{ content: CONTENT_SLOT }}
        />,
      );
      const firstRowCalls = () => calls.filter((l) => l === "Row 0").length;
      const before = firstRowCalls();
      // A scroll small enough that row 0 stays inside the (1000px) draw window.
      const viewport = screen.getByTestId("vl-content").parentElement as HTMLElement;
      fireEvent.scroll(viewport, { target: { scrollTop: 200 } });
      fireEvent.scroll(viewport, { target: { scrollTop: 400 } });
      expect(firstRowCalls()).toBe(before);
    });
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
