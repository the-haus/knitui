import dayjs from "dayjs";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { Month } from "./Month";

const MONTH = "2024-01-01"; // January 2024 — Jan 1 is a Monday

describe("Month", () => {
  it("renders the grid container with role=grid", () => {
    render(<Month month={MONTH} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders a weekday header row by default", () => {
    render(<Month month={MONTH} />);
    // 7 weekday columnheaders from the WeekdaysRow
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("hides the weekday header when hideWeekdays is set", () => {
    render(<Month month={MONTH} hideWeekdays />);
    expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
  });

  it("renders day cells as buttons with role=cell wrappers", () => {
    render(<Month month={MONTH} />);
    // January 2024, Monday-first → 5 weeks × 7 days = 35 day cells.
    expect(screen.getAllByRole("cell")).toHaveLength(35);
    expect(screen.getAllByRole("button")).toHaveLength(35);
  });

  it("renders week rows (5 day rows for Jan 2024 + 1 header row treated separately)", () => {
    render(<Month month={MONTH} />);
    // WeekdaysRow is also role="row"; 5 day rows + 1 header row = 6.
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });

  it("labels each day cell with a locale-aware aria-label", () => {
    render(<Month month={MONTH} />);
    expect(screen.getByRole("button", { name: "15 January 2024" })).toBeInTheDocument();
  });

  describe("outside days", () => {
    it("includes days from adjacent months by default", () => {
      render(<Month month={MONTH} />);
      // Jan 2024 Monday-first ends with Feb 1-4 as outside days.
      expect(screen.getByRole("button", { name: "1 February 2024" })).toBeInTheDocument();
    });

    it("hides outside days when hideOutsideDates is set", () => {
      render(<Month month={MONTH} hideOutsideDates />);
      // The Feb 1 cell is hidden → removed from the a11y tree.
      expect(screen.queryByRole("button", { name: "1 February 2024" })).not.toBeInTheDocument();
      // In-month days remain.
      expect(screen.getByRole("button", { name: "15 January 2024" })).toBeInTheDocument();
    });
  });

  describe("getDayProps", () => {
    it("forwards selected state to a matching day", () => {
      render(
        <Month
          month={MONTH}
          getDayProps={(date) => (date === "2024-01-15" ? { selected: true } : {})}
        />,
      );
      expect(screen.getByRole("button", { name: "15 January 2024" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  describe("excludeDate / min / max", () => {
    it("disables days matched by excludeDate", () => {
      render(<Month month={MONTH} excludeDate={(date) => date === "2024-01-15"} />);
      expect(screen.getByRole("button", { name: "15 January 2024" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    it("disables days before minDate", () => {
      render(<Month month={MONTH} minDate="2024-01-10" />);
      expect(screen.getByRole("button", { name: "5 January 2024" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("button", { name: "15 January 2024" })).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("disables days after maxDate", () => {
      render(<Month month={MONTH} maxDate="2024-01-10" />);
      expect(screen.getByRole("button", { name: "20 January 2024" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  describe("callbacks", () => {
    it("fires __onDayClick with the day's date on press", () => {
      const onDayClick = jest.fn();
      render(<Month month={MONTH} __onDayClick={onDayClick} />);
      fireEvent.click(screen.getByRole("button", { name: "15 January 2024" }));
      expect(onDayClick).toHaveBeenCalledTimes(1);
      expect(onDayClick.mock.calls[0]![1]).toBe("2024-01-15");
    });

    it("forwards getDayProps.onPress alongside __onDayClick", () => {
      const onPress = jest.fn();
      const onDayClick = jest.fn();
      render(
        <Month
          month={MONTH}
          __onDayClick={onDayClick}
          getDayProps={(date) => (date === "2024-01-15" ? { onPress } : {})}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "15 January 2024" }));
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onDayClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("getDayAriaLabel", () => {
    it("overrides the default aria-label", () => {
      render(<Month month={MONTH} getDayAriaLabel={(date) => `aria-${date}`} />);
      expect(screen.getByRole("button", { name: "aria-2024-01-15" })).toBeInTheDocument();
    });
  });

  describe("firstDayOfWeek (via DatesProvider)", () => {
    it("starts weeks on Sunday when configured", () => {
      render(
        <DatesProvider settings={{ firstDayOfWeek: 0 }}>
          <Month month={MONTH} />
        </DatesProvider>,
      );
      // Sunday-first: the header's first label is Sunday's.
      const headers = screen.getAllByRole("columnheader");
      const sunday = dayjs().day(0).locale("en").format("dd");
      expect(headers[0]).toHaveTextContent(sunday);
    });
  });

  describe("withWeekNumbers", () => {
    it("renders a week-number rowheader per row", () => {
      render(<Month month={MONTH} withWeekNumbers />);
      // 5 day rows → 5 rowheaders.
      expect(screen.getAllByRole("rowheader")).toHaveLength(5);
    });
  });

  describe("static (display-only)", () => {
    it("renders no interactive day buttons", () => {
      render(<Month month={MONTH} static />);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      // Day numbers still render.
      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });

  describe("renderDay", () => {
    it("uses the custom day renderer", () => {
      render(<Month month={MONTH} renderDay={(date) => `#${dayjs(date).date()}`} />);
      expect(screen.getByText("#15")).toBeInTheDocument();
    });
  });

  it("forwards a ref to the grid host", () => {
    const ref = jest.fn();
    render(<Month month={MONTH} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*) to the grid host", () => {
    render(<Month month={MONTH} data-testid="month-grid" />);
    expect(screen.getByTestId("month-grid")).toBeInTheDocument();
  });

  describe("styles sugar", () => {
    it("forwards the cell slot props to every day-cell wrapper", () => {
      render(<Month month={MONTH} styles={{ cell: { "aria-label": "month-cell" } }} />);
      expect(screen.getAllByLabelText("month-cell")).toHaveLength(35);
    });

    it("forwards the day slot props onto each Day, under explicit getDayProps", () => {
      // The `day` slot disables every day; getDayProps re-enables Jan 15
      // (explicit beats sugar).
      render(
        <Month
          month={MONTH}
          styles={{ day: { disabled: true } }}
          getDayProps={(date) => (date === "2024-01-15" ? { disabled: false } : {})}
        />,
      );
      expect(screen.getByRole("button", { name: "5 January 2024" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("button", { name: "15 January 2024" })).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("forwards the weekNumber slot props onto each week-number cell", () => {
      render(
        <Month
          month={MONTH}
          withWeekNumbers
          styles={{ weekNumber: { "aria-label": "wn-cell" } }}
        />,
      );
      expect(screen.getAllByLabelText("wn-cell")).toHaveLength(5);
    });
  });

  describe("public surface", () => {
    it("exposes the styled parts for composition", () => {
      expect(Month.Frame).toBeDefined();
      expect(Month.Row).toBeDefined();
      expect(Month.Cell).toBeDefined();
      expect(Month.WeekNumber).toBeDefined();
      expect(Month.WeekNumberLabel).toBeDefined();
    });
  });
});
