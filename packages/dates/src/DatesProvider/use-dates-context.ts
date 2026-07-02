// `useDatesContext` — mirrors the `@mantine/dates` hook of the same name. Pure
// React (no Tamagui / no platform split), so it runs identically on web and
// native. Mantine reads the context with the React 19 `use()` API; this kit
// targets the stable `useContext` for the same effect, with the same getter
// helpers and the same "prop wins over context" fallback semantics.
import { useCallback, useContext } from "react";

import type { DayOfWeek } from "../types";
import { DatesProviderContext } from "./DatesProvider";

/**
 * Reads {@link DatesProviderContext} and returns its values plus getter helpers
 * that resolve a per-component prop against the provider default: pass the
 * component's prop and get back either it (when set) or the context value.
 * Mirrors @mantine/dates `useDatesContext`.
 */
export function useDatesContext() {
  const ctx = useContext(DatesProviderContext);

  const getLocale = useCallback((input?: string) => input || ctx.locale, [ctx.locale]);

  const getFirstDayOfWeek = useCallback(
    (input?: DayOfWeek) => (typeof input === "number" ? input : ctx.firstDayOfWeek),
    [ctx.firstDayOfWeek],
  );

  const getWeekendDays = useCallback(
    (input?: DayOfWeek[]) => (Array.isArray(input) ? input : ctx.weekendDays),
    [ctx.weekendDays],
  );

  const getLabelSeparator = useCallback(
    (input?: string) => (typeof input === "string" ? input : ctx.labelSeparator),
    [ctx.labelSeparator],
  );

  return {
    ...ctx,
    getLocale,
    getFirstDayOfWeek,
    getWeekendDays,
    getLabelSeparator,
  };
}
