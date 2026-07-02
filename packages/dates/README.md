# @knitui/dates

Cross-platform (React Native + Web) calendars, date & time pickers — the
`@mantine/dates` API, rebuilt on the Knit UI kit.

`@knitui/dates` ports the `@mantine/dates` surface (prop names, compound parts,
controlled / uncontrolled `value` props) onto [`@knitui/components`](../components)
and [`@knitui/core`](../core) primitives, with [`dayjs`](https://day.js.org) for
all date math. Every component runs on web **and** native from one source — no
`.native` forks in your app code.

## Install

```sh
# Expo
npx expo install @knitui/dates @knitui/components @knitui/core \
  react-native-reanimated react-native-teleport

# bare React Native / web
npm install @knitui/dates @knitui/components @knitui/core \
  react-native-reanimated react-native-teleport
```

`@knitui/dates` builds on `@knitui/components` + `@knitui/core` (both are runtime
dependencies of this package) and pulls in `dayjs` for date math. It shares the
kit's native peers — `react-native-reanimated` and `react-native-teleport` are
required on every platform; `react-native-web` is the optional web peer. See the
[`@knitui/core` README](../core/README.md) for the peer-dependency story.

## Quickstart

Everything lives under a single `<Provider>` at the app root — it sets up theming
and mounts the gesture/teleport hosts the pickers rely on:

```tsx
import { Provider } from "@knitui/components";
import { DatePicker } from "@knitui/dates";

export default function App() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <Provider defaultColorScheme="system">
      <DatePicker value={value} onChange={setValue} />
    </Provider>
  );
}
```

Prefer an inline grid over a picker? Reach for `Calendar` (or `MiniCalendar`)
directly:

```tsx
import { Provider } from "@knitui/components";
import { Calendar } from "@knitui/dates";

<Provider>
  <Calendar />
</Provider>;
```

## What's inside

Every name below is a real export from `src/index.ts`.

### Calendars & levels

- **`Calendar`** — the full calendar surface that switches between day / month /
  year levels.
- **`MiniCalendar`** — a compact single-row calendar.
- **`Month`**, **`MonthLevel`**, **`MonthLevelGroup`** — the day grid for a month
  and its multi-month grouping.
- **`YearLevel`**, **`YearLevelGroup`**, **`MonthsList`** — the month-of-year
  selection level.
- **`DecadeLevel`**, **`DecadeLevelGroup`**, **`YearsList`** — the year-of-decade
  selection level.
- **`CalendarHeader`**, **`WeekdaysRow`**, **`Day`**, **`LevelsGroup`** — the
  header (prev/next + level label), weekday row, single day cell, and the
  responsive multi-column level wrapper.

### Pickers (inline)

- **`DatePicker`** — pick a single date, a range, or multiple dates.
- **`MonthPicker`** — pick a month.
- **`YearPicker`** — pick a year.
- **`DateTimePicker`** — date + time in one control.
- **`PickerControl`** — the pressable cell shared by the month/year pickers.

### Inputs (with a popover picker)

- **`DateInput`** — a free-text, parseable date input.
- **`DatePickerInput`** — an input that opens a `DatePicker` in a popover.
- **`MonthPickerInput`** — input backed by a `MonthPicker`.
- **`YearPickerInput`** — input backed by a `YearPicker`.
- **`PickerInputBase`** — the shared input shell (label, sections, clear button,
  popover) the picker inputs are built from.
- **`HiddenDatesInput`** — the hidden form field carrying the serialized value.

### Time

- **`TimePicker`** — hours / minutes / seconds with AM-PM support.
- **`TimeInput`** — a native `time`-style input.
- **`TimeGrid`** — a grid of selectable time slots.
- **`TimeValue`** — render a formatted time value.
- **`SpinInput`**, **`AmPmInput`** — the numeric spinner and AM/PM segment behind
  `TimePicker`. On native these use select-on-focus entry (tap replaces the
  segment, Backspace bridges between fields, group-blur clamps to range).

### Provider, hooks & utilities

- **`DatesProvider`** — scopes date settings (`locale`, `firstDayOfWeek`,
  `weekendDays`, `timezone`, `consistentWeeks`, `labelSeparator`) to a subtree.
- **`hooks`** — `useDatesInput`, `useDatesState`, `useTimePicker`,
  `useUncontrolledDates`.
- **`utils`** — a pure-`dayjs` toolkit (`getMonthDays`, `getStartOfWeek`,
  `getEndOfWeek`, `clampDate`, `isDateValid`, `getFormattedDate`, `assignTime`,
  and more) used by the components and safe to reuse.
- **`types`** — shared prop and value types.

## Localization

Date presentation is driven by `dayjs`. Set `locale` (and the other date
settings) once via `DatesProvider`, and it flows to every calendar, picker, and
input below it:

```tsx
import "dayjs/locale/de";
import { DatesProvider } from "@knitui/dates";

<DatesProvider settings={{ locale: "de", firstDayOfWeek: 1, weekendDays: [0, 6] }}>
  {children}
</DatesProvider>;
```

Load the matching `dayjs/locale/*` module wherever you configure your app.

## Src-ship & Next.js

Like the rest of the kit, `@knitui/dates` **ships its TypeScript source** — the
package `main`/`module`/`react-native` all point at `src/index.ts`. Expo/Metro
consumes this out of the box. Next.js and other bundlers need the scope added to
`transpilePackages`; the `withKnitui` wrapper from `@knitui/plugins/next-plugin`
wires this up for you (see [`@knitui/plugins`](../plugins/README.md) and
`docs/ci-cd-plan.md` §3).

## Storybook

Browse every component and its stories in Storybook:

```sh
pnpm --filter @knitui/dates storybook   # dev server on port 6007
pnpm --filter @knitui/dates test        # jest
```

---

Part of the [Knit UI monorepo](../../README.md). Built on
[`@knitui/components`](../components/README.md) and
[`@knitui/core`](../core/README.md).
