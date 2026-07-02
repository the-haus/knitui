import { useCallback } from "react";

type PossibleRef<T> = React.Ref<T> | undefined;

/** Assign `value` to a callback or object ref (no-op for `null`/undefined refs). */
export function assignRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

/** Merge multiple refs into a single callback ref. */
export function useMergedRef<T>(...refs: PossibleRef<T>[]): (node: T | null) => void {
  return useCallback(
    (node: T | null) => {
      refs.forEach((ref) => assignRef(ref, node));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );
}
