import { useReducer } from "react";

/**
 * Force a re-render imperatively — port of Mantine's `useForceUpdate`. Returns a
 * stable function that bumps an internal counter. Pure React, so identical on
 * web and native.
 */
export function useForceUpdate(): () => void {
  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);
  return forceUpdate as () => void;
}
