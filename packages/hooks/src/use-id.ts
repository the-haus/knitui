import { useId as useReactId } from "react";

/** Stable id, using a provided id when present (port of Mantine's `useId`). */
export function useId(staticId?: string): string {
  const reactId = useReactId();
  return staticId ?? reactId;
}
