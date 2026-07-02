import { useCallback, useState } from "react";

export interface UseListStateHandlers<T> {
  /** Replace the whole list (value or updater). */
  setState: (value: T[] | ((current: T[]) => T[])) => void;
  /** Add items to the end. */
  append: (...items: T[]) => void;
  /** Add items to the start. */
  prepend: (...items: T[]) => void;
  /** Insert items at `index`. */
  insert: (index: number, ...items: T[]) => void;
  /** Remove the last item. */
  pop: () => void;
  /** Remove the first item. */
  shift: () => void;
  /** Map every item through `fn`. */
  apply: (fn: (item: T, index: number) => T) => void;
  /** Map items matching `condition` through `fn`. */
  applyWhere: (
    condition: (item: T, index: number) => boolean,
    fn: (item: T, index: number) => T,
  ) => void;
  /** Remove the items at the given indices. */
  remove: (...indices: number[]) => void;
  /** Move the item at `from` to `to`. */
  reorder: (params: { from: number; to: number }) => void;
  /** Swap the items at `from` and `to`. */
  swap: (params: { from: number; to: number }) => void;
  /** Replace the item at `index`. */
  setItem: (index: number, item: T) => void;
  /** Replace a single property of the item at `index`. */
  setItemProp: <K extends keyof T>(index: number, prop: K, value: T[K]) => void;
  /** Keep only items for which `fn` returns `true`. */
  filter: (fn: (item: T, index: number) => boolean) => void;
}

export type UseListStateReturn<T> = [T[], UseListStateHandlers<T>];

/**
 * Manage array state with a rich set of immutable handlers — port of Mantine's
 * `useListState`. Every handler returns a new array, so the state is safe to use
 * as a dependency / memo input. Pure React, so identical on web and native.
 */
export function useListState<T>(initialValue: T[] = []): UseListStateReturn<T> {
  const [state, setState] = useState(initialValue);

  const append = useCallback((...items: T[]) => setState((current) => [...current, ...items]), []);

  const prepend = useCallback((...items: T[]) => setState((current) => [...items, ...current]), []);

  const insert = useCallback(
    (index: number, ...items: T[]) =>
      setState((current) => [...current.slice(0, index), ...items, ...current.slice(index)]),
    [],
  );

  const pop = useCallback(() => setState((current) => current.slice(0, current.length - 1)), []);

  const shift = useCallback(() => setState((current) => current.slice(1)), []);

  const apply = useCallback(
    (fn: (item: T, index: number) => T) =>
      setState((current) => current.map((item, index) => fn(item, index))),
    [],
  );

  const applyWhere = useCallback(
    (condition: (item: T, index: number) => boolean, fn: (item: T, index: number) => T) =>
      setState((current) =>
        current.map((item, index) => (condition(item, index) ? fn(item, index) : item)),
      ),
    [],
  );

  const remove = useCallback(
    (...indices: number[]) =>
      setState((current) => current.filter((_, index) => !indices.includes(index))),
    [],
  );

  const reorder = useCallback(
    ({ from, to }: { from: number; to: number }) =>
      setState((current) => {
        const cloned = [...current];
        const [item] = cloned.splice(from, 1);
        cloned.splice(to, 0, item);
        return cloned;
      }),
    [],
  );

  const swap = useCallback(
    ({ from, to }: { from: number; to: number }) =>
      setState((current) => {
        const cloned = [...current];
        const fromItem = cloned[from];
        const toItem = cloned[to];
        cloned.splice(to, 1, fromItem);
        cloned.splice(from, 1, toItem);
        return cloned;
      }),
    [],
  );

  const setItem = useCallback(
    (index: number, item: T) =>
      setState((current) => {
        const cloned = [...current];
        cloned[index] = item;
        return cloned;
      }),
    [],
  );

  const setItemProp = useCallback(
    <K extends keyof T>(index: number, prop: K, value: T[K]) =>
      setState((current) => {
        const cloned = [...current];
        cloned[index] = { ...cloned[index], [prop]: value };
        return cloned;
      }),
    [],
  );

  const filter = useCallback(
    (fn: (item: T, index: number) => boolean) => setState((current) => current.filter(fn)),
    [],
  );

  return [
    state,
    {
      setState,
      append,
      prepend,
      insert,
      pop,
      shift,
      apply,
      applyWhere,
      remove,
      reorder,
      swap,
      setItem,
      setItemProp,
      filter,
    },
  ];
}
