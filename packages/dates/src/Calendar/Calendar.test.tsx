import * as React from "react";

import { styled } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { act, fireEvent, render, screen } from "../test-utils";
import { Calendar } from "./Calendar";

const DATE = "2024-01-15";

// aria-labels for the level / navigation controls so the tests can target them
// unambiguously across all three levels.
const ariaLabels = {
  monthLevelControl: "Change to year view",
  yearLevelControl: "Change to decade view",
  nextMonth: "Next month",
  previousMonth: "Previous month",
  nextYear: "Next year",
  previousYear: "Previous year",
  nextDecade: "Next decade",
  previousDecade: "Previous decade",
};

describe("Calendar", () => {
  describe("month level (default)", () => {
    it("renders the month level by default with the month-year label", () => {
      render(<Calendar defaultDate={DATE} ariaLabels={ariaLabels} />);
      expect(screen.getByText("January 2024")).toBeInTheDocument();
    });

    it("renders day cells for the month", () => {
      render(<Calendar defaultDate={DATE} ariaLabels={ariaLabels} />);
      // 15 January 2024 is in the grid
      expect(screen.getByRole("button", { name: "15 January 2024" })).toBeInTheDocument();
    });
  });

  describe("level switching", () => {
    it("zooms out to the year level when the month level control is clicked", () => {
      render(<Calendar defaultDate={DATE} ariaLabels={ariaLabels} />);
      fireEvent.click(screen.getByRole("button", { name: "Change to year view" }));
      // year level shows the year label and a month grid (January control)
      expect(screen.getByText("2024")).toBeInTheDocument();
    });

    it("zooms out to the decade level from the year level", () => {
      render(<Calendar defaultDate={DATE} defaultLevel="year" ariaLabels={ariaLabels} />);
      fireEvent.click(screen.getByRole("button", { name: "Change to decade view" }));
      // decade label spans a range, e.g. 2020 – 2029
      expect(screen.getByText("2020 – 2029")).toBeInTheDocument();
    });

    it("respects a controlled level prop", () => {
      render(<Calendar defaultDate={DATE} level="decade" ariaLabels={ariaLabels} />);
      // decade level renders years, not the month-year label
      expect(screen.queryByText("January 2024")).not.toBeInTheDocument();
      expect(screen.getByText("2020 – 2029")).toBeInTheDocument();
    });

    it("respects defaultLevel in uncontrolled mode", () => {
      render(<Calendar defaultDate={DATE} defaultLevel="year" ariaLabels={ariaLabels} />);
      expect(screen.queryByText("January 2024")).not.toBeInTheDocument();
    });

    it("calls onLevelChange when zooming out", () => {
      const onLevelChange = jest.fn();
      render(<Calendar defaultDate={DATE} onLevelChange={onLevelChange} ariaLabels={ariaLabels} />);
      fireEvent.click(screen.getByRole("button", { name: "Change to year view" }));
      expect(onLevelChange).toHaveBeenCalledWith("year");
    });

    it("zooms back in when a month is selected on the year level", () => {
      const onLevelChange = jest.fn();
      const onMonthSelect = jest.fn();
      render(
        <Calendar
          defaultDate={DATE}
          defaultLevel="year"
          onLevelChange={onLevelChange}
          onMonthSelect={onMonthSelect}
          ariaLabels={ariaLabels}
        />,
      );
      // pick a month control — its label is the month name
      fireEvent.click(screen.getByRole("button", { name: "Mar" }));
      expect(onMonthSelect).toHaveBeenCalled();
      expect(onLevelChange).toHaveBeenCalledWith("month");
    });

    it("zooms in to the year level when a year is selected on the decade level", () => {
      const onLevelChange = jest.fn();
      const onYearSelect = jest.fn();
      render(
        <Calendar
          defaultDate={DATE}
          defaultLevel="decade"
          onLevelChange={onLevelChange}
          onYearSelect={onYearSelect}
          ariaLabels={ariaLabels}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "2022" }));
      expect(onYearSelect).toHaveBeenCalled();
      expect(onLevelChange).toHaveBeenCalledWith("year");
    });
  });

  describe("min / max level clamping", () => {
    it("does not expose a year-zoom control when maxLevel is month", () => {
      render(<Calendar defaultDate={DATE} maxLevel="month" ariaLabels={ariaLabels} />);
      const levelControl = screen.getByRole("presentation");
      // static level control is non-interactive (no zoom out)
      expect(levelControl).toBeInTheDocument();
    });

    it("clamps a controlled level above maxLevel back down", () => {
      render(
        <Calendar defaultDate={DATE} level="decade" maxLevel="month" ariaLabels={ariaLabels} />,
      );
      // clamped to month → month-year label is shown
      expect(screen.getByText("January 2024")).toBeInTheDocument();
    });
  });

  describe("month navigation", () => {
    it("advances the displayed month on next, calling onNextMonth", () => {
      const onNextMonth = jest.fn();
      const onDateChange = jest.fn();
      render(
        <Calendar
          defaultDate={DATE}
          onNextMonth={onNextMonth}
          onDateChange={onDateChange}
          ariaLabels={ariaLabels}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Next month" }));
      expect(onNextMonth).toHaveBeenCalledWith("2024-02-15");
      expect(onDateChange).toHaveBeenCalledWith("2024-02-15");
      expect(screen.getByText("February 2024")).toBeInTheDocument();
    });

    it("rewinds the displayed month on previous, calling onPreviousMonth", () => {
      const onPreviousMonth = jest.fn();
      render(
        <Calendar defaultDate={DATE} onPreviousMonth={onPreviousMonth} ariaLabels={ariaLabels} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
      expect(onPreviousMonth).toHaveBeenCalledWith("2023-12-15");
      expect(screen.getByText("December 2023")).toBeInTheDocument();
    });

    it("steps by columnsToScroll when set", () => {
      const onNextMonth = jest.fn();
      render(
        <Calendar
          defaultDate={DATE}
          columnsToScroll={3}
          onNextMonth={onNextMonth}
          ariaLabels={ariaLabels}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Next month" }));
      expect(onNextMonth).toHaveBeenCalledWith("2024-04-15");
    });
  });

  describe("controlled date", () => {
    it("does not change the displayed month internally when date is controlled", () => {
      const onDateChange = jest.fn();
      render(<Calendar date={DATE} onDateChange={onDateChange} ariaLabels={ariaLabels} />);
      fireEvent.click(screen.getByRole("button", { name: "Next month" }));
      // callback fires but the controlled value pins the label
      expect(onDateChange).toHaveBeenCalledWith("2024-02-15");
      expect(screen.getByText("January 2024")).toBeInTheDocument();
    });
  });

  describe("getDayProps", () => {
    it("applies returned props to the matching day cell", () => {
      render(
        <Calendar
          defaultDate={DATE}
          ariaLabels={ariaLabels}
          getDayProps={(date) =>
            date === "2024-01-15" ? ({ "data-testid": "marked-day" } as object) : {}
          }
        />,
      );
      expect(screen.getByTestId("marked-day")).toHaveAttribute("aria-label", "15 January 2024");
    });
  });

  describe("renderDay", () => {
    it("renders a custom day label", () => {
      render(
        <Calendar
          defaultDate={DATE}
          ariaLabels={ariaLabels}
          renderDay={(date) => (date === "2024-01-15" ? "X15" : undefined)}
        />,
      );
      expect(screen.getByText("X15")).toBeInTheDocument();
    });
  });

  describe("numberOfColumns", () => {
    it("renders multiple month labels when numberOfColumns > 1", () => {
      render(<Calendar defaultDate={DATE} numberOfColumns={2} ariaLabels={ariaLabels} />);
      expect(screen.getByText("January 2024")).toBeInTheDocument();
      expect(screen.getByText("February 2024")).toBeInTheDocument();
    });
  });

  describe("monthLabelFormat", () => {
    it("formats the header label with a custom format string", () => {
      render(<Calendar defaultDate={DATE} monthLabelFormat="YYYY/MM" ariaLabels={ariaLabels} />);
      expect(screen.getByText("2024/01")).toBeInTheDocument();
    });

    it("renders within a DatesProvider without crashing", () => {
      render(
        <DatesProvider settings={{ locale: "en" }}>
          <Calendar defaultDate={DATE} ariaLabels={ariaLabels} />
        </DatesProvider>,
      );
      expect(screen.getByText("January 2024")).toBeInTheDocument();
    });
  });

  describe("imperative refs", () => {
    it("sets the displayed date via __setDateRef", () => {
      const setDateRef = { current: null } as React.RefObject<((date: string) => void) | null>;
      render(<Calendar defaultDate={DATE} __setDateRef={setDateRef} ariaLabels={ariaLabels} />);
      expect(screen.getByText("January 2024")).toBeInTheDocument();
      act(() => {
        setDateRef.current?.("2024-05-10");
      });
      expect(screen.getByText("May 2024")).toBeInTheDocument();
    });

    it("sets the displayed level via __setLevelRef", () => {
      const setLevelRef = { current: null } as React.RefObject<
        ((level: "month" | "year" | "decade") => void) | null
      >;
      render(<Calendar defaultDate={DATE} __setLevelRef={setLevelRef} ariaLabels={ariaLabels} />);
      act(() => {
        setLevelRef.current?.("year");
      });
      expect(screen.queryByText("January 2024")).not.toBeInTheDocument();
    });
  });

  it("forwards a ref to the root", () => {
    const ref = jest.fn();
    render(<Calendar defaultDate={DATE} ref={ref} ariaLabels={ariaLabels} />);
    expect(ref).toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*) to the root", () => {
    render(<Calendar defaultDate={DATE} data-testid="calendar-root" ariaLabels={ariaLabels} />);
    expect(screen.getByTestId("calendar-root")).toBeInTheDocument();
  });

  it("forwards frame style props to the root", () => {
    render(
      <Calendar
        defaultDate={DATE}
        data-testid="calendar-root"
        padding={8}
        ariaLabels={ariaLabels}
      />,
    );
    expect(screen.getByTestId("calendar-root")).toHaveStyle({ padding: "8px 8px 8px 8px" });
  });

  describe("static parts", () => {
    it("exposes the styled root as Calendar.Frame", () => {
      expect(Calendar.Frame).toBeDefined();
    });

    it("Calendar.Frame is extensible via styled()", () => {
      const Extended = styled(Calendar.Frame, { padding: 12 });
      render(<Extended data-testid="extended-frame" />);
      expect(screen.getByTestId("extended-frame")).toHaveStyle({ padding: "12px 12px 12px 12px" });
    });
  });
});
