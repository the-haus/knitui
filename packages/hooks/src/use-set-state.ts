import { useCallback, useState } from "react";

/** Functional updater that derives the merged partial from the current state. */
export type SetStateCallback<T> = (current: T) => Partial<T>;

/**
 * Object state with shallow partial merge — port of Mantine's `useSetState`.
 * `setState({ a })` merges `a` into the current state (class-component
 * `setState` semantics). Pure React, so identical on web and native.
 */
export function useSetState<T extends Record<string, unknown>>(
  initialState: T,
): [T, (statePartial: Partial<T> | SetStateCallback<T>) => void] {
  const [state, setState] = useState(initialState);

  const setStatePartial = useCallback(
    (statePartial: Partial<T> | SetStateCallback<T>) =>
      setState((current) => ({
        ...current,
        ...(typeof statePartial === "function" ? statePartial(current) : statePartial),
      })),
    [],
  );

  return [state, setStatePartial];
}
