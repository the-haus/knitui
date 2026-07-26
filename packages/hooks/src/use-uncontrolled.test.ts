/**
 * Tests for `useUncontrolled`, with an emphasis on the SETTER'S IDENTITY.
 *
 * The value semantics are the easy half. The stability of the returned setter is
 * the half that actually matters to render cost: ~48 files hand that setter to a
 * child, a context value, or a dep list, so an identity that changed every render
 * invalidated everything downstream — most visibly in `Combobox`, where it made
 * the context value new on every keystroke and re-rendered every option row past
 * their `React.memo`.
 *
 * Because the latest `onChange` is read through a ref rather than closed over,
 * these tests also pin the consequence a consumer relies on: a handler memoized
 * with `[]` deps around the setter still calls the CURRENT `onChange`.
 */
import { act, renderHook } from "@testing-library/react";

import { useUncontrolled } from "./use-uncontrolled";

describe("useUncontrolled", () => {
  describe("value semantics", () => {
    it("seeds from defaultValue and reports uncontrolled", () => {
      const { result } = renderHook(() => useUncontrolled({ defaultValue: "a" }));
      expect(result.current[0]).toBe("a");
      expect(result.current[2]).toBe(false);
    });

    it("falls back to finalValue when defaultValue is absent", () => {
      const { result } = renderHook(() => useUncontrolled({ finalValue: "z" }));
      expect(result.current[0]).toBe("z");
      expect(result.current[2]).toBe(false);
    });

    it("prefers defaultValue over finalValue", () => {
      const { result } = renderHook(() => useUncontrolled({ defaultValue: "a", finalValue: "z" }));
      expect(result.current[0]).toBe("a");
    });

    it("tracks its own state and calls onChange when uncontrolled", () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => useUncontrolled({ defaultValue: "a", onChange }));

      act(() => result.current[1]("b"));

      expect(result.current[0]).toBe("b");
      expect(onChange).toHaveBeenCalledWith("b");
    });

    it("does not track its own state when controlled, and reports controlled", () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => useUncontrolled({ value: "a", onChange }));

      act(() => result.current[1]("b"));

      expect(result.current[0]).toBe("a"); // the owner decides; we do not move
      expect(result.current[2]).toBe(true);
      expect(onChange).toHaveBeenCalledWith("b");
    });

    it("tolerates a missing onChange in the controlled branch", () => {
      const { result } = renderHook(() => useUncontrolled({ value: "a" }));
      expect(() => act(() => result.current[1]("b"))).not.toThrow();
    });

    it("treats an explicit undefined value as uncontrolled", () => {
      const { result } = renderHook(() =>
        useUncontrolled<string | undefined>({ value: undefined, defaultValue: "a" }),
      );
      expect(result.current[2]).toBe(false);
      expect(result.current[0]).toBe("a");
    });
  });

  describe("setter identity", () => {
    it("is stable across re-renders when uncontrolled, even with an inline onChange", () => {
      const { result, rerender } = renderHook(() =>
        // A NEW arrow every render — the idiomatic call pattern, and the one that
        // used to make the setter unstable.
        useUncontrolled({ defaultValue: "a", onChange: () => {} }),
      );

      const first = result.current[1];
      rerender();
      rerender();

      expect(result.current[1]).toBe(first);
    });

    it("is stable across re-renders when controlled, even with an inline onChange", () => {
      const { result, rerender } = renderHook(() =>
        useUncontrolled({ value: "a", onChange: () => {} }),
      );

      const first = result.current[1];
      rerender();
      rerender();

      expect(result.current[1]).toBe(first);
    });

    it("survives a state change without changing identity", () => {
      const { result } = renderHook(() => useUncontrolled({ defaultValue: "a" }));

      const first = result.current[1];
      act(() => result.current[1]("b"));

      expect(result.current[0]).toBe("b");
      expect(result.current[1]).toBe(first);
    });
  });

  describe("always-latest onChange", () => {
    it("calls the current onChange, not the one from the first render", () => {
      const first = jest.fn();
      const second = jest.fn();

      const { result, rerender } = renderHook(
        ({ onChange }: { onChange: (v: string) => void }) =>
          useUncontrolled({ defaultValue: "a", onChange }),
        { initialProps: { onChange: first } },
      );

      // Capture the setter BEFORE the swap, the way a `[]`-dep consumer callback
      // would have closed over it.
      const setter = result.current[1];
      rerender({ onChange: second });

      act(() => setter("b"));

      expect(second).toHaveBeenCalledWith("b");
      expect(first).not.toHaveBeenCalled();
    });

    it("calls the current onChange in the controlled branch too", () => {
      const first = jest.fn();
      const second = jest.fn();

      const { result, rerender } = renderHook(
        ({ onChange }: { onChange: (v: string) => void }) =>
          useUncontrolled({ value: "a", onChange }),
        { initialProps: { onChange: first } },
      );

      const setter = result.current[1];
      rerender({ onChange: second });

      act(() => setter("b"));

      expect(second).toHaveBeenCalledWith("b");
      expect(first).not.toHaveBeenCalled();
    });
  });
});
