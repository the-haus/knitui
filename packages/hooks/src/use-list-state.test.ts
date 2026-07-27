import { act, renderHook } from "@testing-library/react";

import { useListState } from "./use-list-state";

/**
 * `useListState`'s index-taking reducers, with an emphasis on OUT-OF-RANGE input.
 *
 * These are the handlers a drag-and-drop list wires straight to gesture output, so
 * a stale index is a normal occurrence — the list can shrink between the drag
 * starting and the drop landing. Each of the three used to corrupt the list rather
 * than no-op: `reorder` inserted a literal `undefined`, `swap` wrote `undefined`
 * over a real row, and `setItemProp` replaced the row with a bare
 * `{ [prop]: value }` object that satisfied neither the shape nor the intent.
 *
 * The happy paths are covered too, so the guards can't silently turn into no-ops
 * for valid input.
 */
describe("reorder", () => {
  it("moves an item to a new index", () => {
    const { result } = renderHook(() => useListState(["a", "b", "c"]));
    act(() => result.current[1].reorder({ from: 0, to: 2 }));
    expect(result.current[0]).toEqual(["b", "c", "a"]);
  });

  it("does not insert `undefined` when `from` is out of range", () => {
    const { result } = renderHook(() => useListState(["a", "b", "c"]));
    act(() => result.current[1].reorder({ from: 9, to: 0 }));
    expect(result.current[0]).toEqual(["a", "b", "c"]);
    expect(result.current[0]).not.toContain(undefined);
  });

  it("does not grow the list on a negative `from`", () => {
    const { result } = renderHook(() => useListState(["a", "b"]));
    act(() => result.current[1].reorder({ from: -5, to: 0 }));
    expect(result.current[0]).toHaveLength(2);
  });
});

describe("swap", () => {
  it("exchanges two items", () => {
    const { result } = renderHook(() => useListState(["a", "b", "c"]));
    act(() => result.current[1].swap({ from: 0, to: 2 }));
    expect(result.current[0]).toEqual(["c", "b", "a"]);
  });

  it("leaves the list untouched when either index is out of range", () => {
    const { result } = renderHook(() => useListState(["a", "b", "c"]));
    act(() => result.current[1].swap({ from: 0, to: 9 }));
    expect(result.current[0]).toEqual(["a", "b", "c"]);
    act(() => result.current[1].swap({ from: -1, to: 1 }));
    expect(result.current[0]).toEqual(["a", "b", "c"]);
  });
});

describe("setItemProp", () => {
  it("patches one property of an existing row", () => {
    const { result } = renderHook(() => useListState([{ id: 1, done: false }]));
    act(() => result.current[1].setItemProp(0, "done", true));
    expect(result.current[0]).toEqual([{ id: 1, done: true }]);
  });

  it("does not fabricate a row when the index misses", () => {
    const { result } = renderHook(() => useListState([{ id: 1, done: false }]));
    act(() => result.current[1].setItemProp(7, "done", true));
    expect(result.current[0]).toEqual([{ id: 1, done: false }]);
  });
});
