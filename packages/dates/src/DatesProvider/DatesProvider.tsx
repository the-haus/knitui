// ───────────────────────────────────────────────────────────────────────────
// `DatesProvider` — mirrors the `@mantine/dates` `DatesProvider` API: a plain
// React context that carries locale / formatting settings down to every date
// component, read through `useDatesContext`. Built on React only — no Tamagui,
// no `@knitui/components` — so it is cross-platform (web + native) from this one
// source with no platform split.
//
// This is a CONTEXT PROVIDER, not a visual control, so the styling-oriented
// gold-standard checklist points are N/A here by design: there is no styled
// Frame or leaf part (#5), shared `createStyledContext` size axis (#2), derived
// `cell-metrics` sizing (#3), theme-ramp colors (#4), marker slots (#6), per-slot
// `styles` sugar (#7), date bounds (#10), interaction styling (#12), `.styleable`
// wrapper (#13), `withStaticProperties` parts (#14), or compiler-safe style
// pitfall (#15). What DOES apply — and is honored — is: documented provenance +
// cross-platform stance (#1), correct settings-context propagation with
// locale / firstDayOfWeek / weekendDays parity vs Mantine, and a fully TSDoc'd
// public surface. This build intentionally has NO `timezone` setting, matching
// the ported `@mantine/dates` build (the upstream `tz`/dayjs-timezone layer is
// not part of this port).
// ───────────────────────────────────────────────────────────────────────────
import { createContext, type ReactNode } from "react";

import type { DayOfWeek } from "../types";

/** Locale/format context shared by every date component. */
export interface DatesProviderValue {
  /** dayjs locale used for parsing/formatting. @default 'en' */
  locale: string;
  /** First day shown in calendar weeks (`0` Sunday … `6` Saturday). @default 1 */
  firstDayOfWeek: DayOfWeek;
  /** Days highlighted as weekend. @default [0, 6] */
  weekendDays: DayOfWeek[];
  /** Separator rendered between the two dates of a range value. @default '–' */
  labelSeparator: string;
  /** Whether every month always renders 6 weeks. @default false */
  consistentWeeks: boolean;
}

/** Partial overrides accepted by {@link DatesProvider}. */
export type DatesProviderSettings = Partial<DatesProviderValue>;

/**
 * Defaults applied when a setting (or the whole provider) is absent — so
 * components can read locale/firstDayOfWeek without a provider mounted.
 * This build has NO timezone setting (kept minimal, matching the ported
 * Mantine build).
 */
export const DATES_PROVIDER_DEFAULT_SETTINGS: DatesProviderValue = {
  locale: "en",
  firstDayOfWeek: 1,
  weekendDays: [0, 6],
  labelSeparator: "–",
  consistentWeeks: false,
};

export const DatesProviderContext = createContext<DatesProviderValue>(
  DATES_PROVIDER_DEFAULT_SETTINGS,
);

export interface DatesProviderProps {
  /** Settings merged over {@link DATES_PROVIDER_DEFAULT_SETTINGS}; omitted keys keep their default. */
  settings: DatesProviderSettings;
  /** Subtree that reads the supplied settings via `useDatesContext`. */
  children?: ReactNode;
}

/**
 * Supplies locale/format context to every date component below it, mirroring
 * @mantine/dates `DatesProvider`. A plain React context — no Tamagui needed.
 * Components read it through `useDatesContext`.
 */
export function DatesProvider({ settings, children }: DatesProviderProps) {
  return (
    <DatesProviderContext.Provider value={{ ...DATES_PROVIDER_DEFAULT_SETTINGS, ...settings }}>
      {children}
    </DatesProviderContext.Provider>
  );
}

DatesProvider.displayName = "@knitui/dates/DatesProvider";
