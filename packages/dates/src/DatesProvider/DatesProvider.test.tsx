import * as React from "react";

import { render, screen } from "../test-utils";
import { WeekdaysRow } from "../WeekdaysRow";
import { DATES_PROVIDER_DEFAULT_SETTINGS, DatesProvider } from "./DatesProvider";
import { useDatesContext } from "./use-dates-context";

/**
 * Small probe that surfaces the resolved context values + getter results as
 * text so tests can assert what reaches a consumer.
 */
function ContextProbe({
  locale,
  firstDayOfWeek,
  weekendDays,
  labelSeparator,
}: {
  locale?: string;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  weekendDays?: (0 | 1 | 2 | 3 | 4 | 5 | 6)[];
  labelSeparator?: string;
}) {
  const ctx = useDatesContext();
  return (
    <>
      <span data-testid="locale">{ctx.locale}</span>
      <span data-testid="firstDayOfWeek">{ctx.firstDayOfWeek}</span>
      <span data-testid="weekendDays">{ctx.weekendDays.join(",")}</span>
      <span data-testid="labelSeparator">{ctx.labelSeparator}</span>
      <span data-testid="consistentWeeks">{String(ctx.consistentWeeks)}</span>
      <span data-testid="getLocale">{ctx.getLocale(locale)}</span>
      <span data-testid="getFirstDayOfWeek">{ctx.getFirstDayOfWeek(firstDayOfWeek)}</span>
      <span data-testid="getWeekendDays">{ctx.getWeekendDays(weekendDays).join(",")}</span>
      <span data-testid="getLabelSeparator">{ctx.getLabelSeparator(labelSeparator)}</span>
    </>
  );
}

describe("DatesProvider", () => {
  describe("defaults (no provider mounted)", () => {
    it("exposes the documented default settings", () => {
      expect(DATES_PROVIDER_DEFAULT_SETTINGS).toEqual({
        locale: "en",
        firstDayOfWeek: 1,
        weekendDays: [0, 6],
        labelSeparator: "–",
        consistentWeeks: false,
      });
    });

    it("a consumer reads defaults when no DatesProvider is present", () => {
      render(<ContextProbe />);
      expect(screen.getByTestId("locale")).toHaveTextContent("en");
      expect(screen.getByTestId("firstDayOfWeek")).toHaveTextContent("1");
      expect(screen.getByTestId("weekendDays")).toHaveTextContent("0,6");
      expect(screen.getByTestId("labelSeparator")).toHaveTextContent("–");
      expect(screen.getByTestId("consistentWeeks")).toHaveTextContent("false");
    });
  });

  describe("settings propagation", () => {
    it("merges partial settings over the defaults", () => {
      render(
        <DatesProvider settings={{ firstDayOfWeek: 0 }}>
          <ContextProbe />
        </DatesProvider>,
      );
      // overridden
      expect(screen.getByTestId("firstDayOfWeek")).toHaveTextContent("0");
      // untouched defaults still apply
      expect(screen.getByTestId("locale")).toHaveTextContent("en");
      expect(screen.getByTestId("labelSeparator")).toHaveTextContent("–");
    });

    it("propagates every setting to a consumer", () => {
      render(
        <DatesProvider
          settings={{
            locale: "fr",
            firstDayOfWeek: 3,
            weekendDays: [5, 6],
            labelSeparator: "to",
            consistentWeeks: true,
          }}
        >
          <ContextProbe />
        </DatesProvider>,
      );
      expect(screen.getByTestId("locale")).toHaveTextContent("fr");
      expect(screen.getByTestId("firstDayOfWeek")).toHaveTextContent("3");
      expect(screen.getByTestId("weekendDays")).toHaveTextContent("5,6");
      expect(screen.getByTestId("labelSeparator")).toHaveTextContent("to");
      expect(screen.getByTestId("consistentWeeks")).toHaveTextContent("true");
    });
  });

  describe("getter helpers (useDatesContext)", () => {
    it("getLocale returns the prop when set, else the context locale", () => {
      render(
        <DatesProvider settings={{ locale: "de" }}>
          <ContextProbe locale="es" />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getLocale")).toHaveTextContent("es");
    });

    it("getLocale falls back to the context locale when prop is omitted", () => {
      render(
        <DatesProvider settings={{ locale: "de" }}>
          <ContextProbe />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getLocale")).toHaveTextContent("de");
    });

    it("getFirstDayOfWeek prefers a numeric prop (incl. 0) over context", () => {
      render(
        <DatesProvider settings={{ firstDayOfWeek: 1 }}>
          <ContextProbe firstDayOfWeek={0} />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getFirstDayOfWeek")).toHaveTextContent("0");
    });

    it("getFirstDayOfWeek falls back to context when prop is undefined", () => {
      render(
        <DatesProvider settings={{ firstDayOfWeek: 4 }}>
          <ContextProbe />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getFirstDayOfWeek")).toHaveTextContent("4");
    });

    it("getWeekendDays prefers an array prop over context", () => {
      render(
        <DatesProvider settings={{ weekendDays: [0, 6] }}>
          <ContextProbe weekendDays={[2, 3]} />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getWeekendDays")).toHaveTextContent("2,3");
    });

    it("getWeekendDays falls back to context when prop is undefined", () => {
      render(
        <DatesProvider settings={{ weekendDays: [3, 4] }}>
          <ContextProbe />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getWeekendDays")).toHaveTextContent("3,4");
    });

    it("getLabelSeparator prefers a string prop (incl. empty) over context", () => {
      render(
        <DatesProvider settings={{ labelSeparator: "–" }}>
          <ContextProbe labelSeparator="/" />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getLabelSeparator")).toHaveTextContent("/");
    });

    it("getLabelSeparator falls back to context when prop is undefined", () => {
      render(
        <DatesProvider settings={{ labelSeparator: "→" }}>
          <ContextProbe />
        </DatesProvider>,
      );
      expect(screen.getByTestId("getLabelSeparator")).toHaveTextContent("→");
    });
  });

  describe("propagation to a real consumer component", () => {
    it("firstDayOfWeek=1 (Monday) starts the WeekdaysRow on Mo", () => {
      render(
        <DatesProvider settings={{ firstDayOfWeek: 1, locale: "en" }}>
          <WeekdaysRow />
        </DatesProvider>,
      );
      const labels = screen.getAllByRole("columnheader").map((el) => el.textContent);
      expect(labels[0]).toBe("Mo");
      expect(labels).toHaveLength(7);
    });

    it("firstDayOfWeek=0 (Sunday) starts the WeekdaysRow on Su", () => {
      render(
        <DatesProvider settings={{ firstDayOfWeek: 0, locale: "en" }}>
          <WeekdaysRow />
        </DatesProvider>,
      );
      const labels = screen.getAllByRole("columnheader").map((el) => el.textContent);
      expect(labels[0]).toBe("Su");
    });

    it("a consumer's own prop still overrides the provider setting", () => {
      render(
        <DatesProvider settings={{ firstDayOfWeek: 0, locale: "en" }}>
          <WeekdaysRow firstDayOfWeek={1} />
        </DatesProvider>,
      );
      const labels = screen.getAllByRole("columnheader").map((el) => el.textContent);
      expect(labels[0]).toBe("Mo");
    });

    it("locale reaches the consumer and localizes the rendered weekday names", () => {
      // `ru` is registered in jest.setup.ts; this asserts the locale truly flows
      // through to dayjs formatting rather than silently falling back to `en`.
      render(
        <DatesProvider settings={{ firstDayOfWeek: 1, locale: "ru" }}>
          <WeekdaysRow />
        </DatesProvider>,
      );
      const labels = screen.getAllByRole("columnheader").map((el) => el.textContent);
      expect(labels).toEqual(["пн", "вт", "ср", "чт", "пт", "сб", "вс"]);
    });

    it("a consumer's own locale prop overrides the provider locale", () => {
      render(
        <DatesProvider settings={{ locale: "ru" }}>
          <WeekdaysRow locale="en" firstDayOfWeek={1} />
        </DatesProvider>,
      );
      const labels = screen.getAllByRole("columnheader").map((el) => el.textContent);
      expect(labels[0]).toBe("Mo");
    });
  });
});
