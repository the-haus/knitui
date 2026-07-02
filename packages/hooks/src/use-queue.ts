import { useCallback, useState } from "react";

export interface UseQueueOptions<T> {
  /** Items to seed the queue with. @default [] */
  initialValues?: T[];
  /** Maximum number of items kept in `state`; the rest spill into `queue`. */
  limit: number;
}

export interface UseQueueReturn<T> {
  /** The visible items (up to `limit`). */
  state: T[];
  /** The overflow items waiting for a slot. */
  queue: T[];
  /** Add items, spilling past `limit` into `queue`. */
  add: (...items: T[]) => void;
  /** Replace all items (visible + queued) via an updater. */
  update: (fn: (state: T[]) => T[]) => void;
  /** Drop every queued (overflow) item. */
  cleanQueue: () => void;
}

/**
 * A bounded queue that keeps `limit` items visible and holds the overflow — port
 * of Mantine's `useQueue`. Pure React state, so identical on web and native.
 */
export function useQueue<T>({ initialValues = [], limit }: UseQueueOptions<T>): UseQueueReturn<T> {
  const [state, setState] = useState<{ state: T[]; queue: T[] }>({
    state: initialValues.slice(0, limit),
    queue: initialValues.slice(limit),
  });

  const add = useCallback(
    (...items: T[]) =>
      setState((current) => {
        const results = [...current.state, ...current.queue, ...items];
        return { state: results.slice(0, limit), queue: results.slice(limit) };
      }),
    [limit],
  );

  const update = useCallback(
    (fn: (state: T[]) => T[]) =>
      setState((current) => {
        const results = fn([...current.state, ...current.queue]);
        return { state: results.slice(0, limit), queue: results.slice(limit) };
      }),
    [limit],
  );

  const cleanQueue = useCallback(
    () => setState((current) => ({ state: current.state, queue: [] })),
    [],
  );

  return { state: state.state, queue: state.queue, add, update, cleanQueue };
}
