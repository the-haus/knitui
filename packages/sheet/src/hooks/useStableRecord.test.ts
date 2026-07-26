import { renderHook } from "@testing-library/react";

import { useStableRecord } from "./useStableRecord";

describe("useStableRecord", () => {
  it("keeps the FIRST object's identity when a later one is shallowly equal", () => {
    const first = { damping: 20, stiffness: 200 };
    const { result, rerender } = renderHook((props: typeof first) => useStableRecord(props), {
      initialProps: first,
    });

    expect(result.current).toBe(first);

    // A fresh literal with identical values — what an inline prop hands us.
    rerender({ damping: 20, stiffness: 200 });
    expect(result.current).toBe(first);
  });

  it("adopts the new object when a value actually changes", () => {
    const first = { damping: 20 };
    const { result, rerender } = renderHook((props: typeof first) => useStableRecord(props), {
      initialProps: first,
    });

    const next = { damping: 30 };
    rerender(next);
    expect(result.current).toBe(next);
  });

  it("adopts the new object when a key is added or removed", () => {
    const first: Record<string, number> = { damping: 20 };
    const { result, rerender } = renderHook(
      (props: Record<string, number>) => useStableRecord(props),
      { initialProps: first },
    );

    const added = { damping: 20, mass: 1 };
    rerender(added);
    expect(result.current).toBe(added);

    const removed = { damping: 20 };
    rerender(removed);
    expect(result.current).toBe(removed);
  });

  it("handles undefined on both sides", () => {
    const { result, rerender } = renderHook(
      (props: { damping: number } | undefined) => useStableRecord(props),
      { initialProps: undefined as { damping: number } | undefined },
    );

    expect(result.current).toBeUndefined();

    // undefined → defined adopts the new object.
    const defined = { damping: 20 };
    rerender(defined);
    expect(result.current).toBe(defined);

    // defined → undefined adopts undefined (never silently keeps the old config).
    rerender(undefined);
    expect(result.current).toBeUndefined();
  });

  it("is a pure render-time cache — a repeated render with the same input is stable", () => {
    const first = { damping: 20 };
    const { result, rerender } = renderHook((props: typeof first) => useStableRecord(props), {
      initialProps: first,
    });

    rerender({ damping: 20 });
    const afterFirst = result.current;
    rerender({ damping: 20 });
    expect(result.current).toBe(afterFirst);
  });
});
