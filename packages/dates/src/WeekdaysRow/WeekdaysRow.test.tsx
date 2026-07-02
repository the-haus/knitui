import dayjs from "dayjs";

import { DatesProvider } from "../DatesProvider";
import { render, screen } from "../test-utils";
import { WeekdaysRow } from "./WeekdaysRow";

/** Default weekday labels (format 'dd', firstDayOfWeek = 1 / Monday). */
function expectedLabels(firstDayOfWeek = 1, locale = "en", format = "dd") {
  const base = dayjs().day(firstDayOfWeek);
  return Array.from({ length: 7 }, (_, i) =>
    dayjs(base).add(i, "days").locale(locale).format(format),
  );
}

describe("WeekdaysRow", () => {
  it("renders 7 weekday columnheader cells", () => {
    render(<WeekdaysRow />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("exposes the row with role=row", () => {
    render(<WeekdaysRow />);
    expect(screen.getByRole("row")).toBeInTheDocument();
  });

  it("renders Monday-first labels by default (firstDayOfWeek = 1)", () => {
    render(<WeekdaysRow />);
    const headers = screen.getAllByRole("columnheader");
    const labels = expectedLabels(1);
    headers.forEach((h, i) => expect(h).toHaveTextContent(labels[i]!));
  });

  it("respects firstDayOfWeek prop (Sunday first)", () => {
    render(<WeekdaysRow firstDayOfWeek={0} />);
    const headers = screen.getAllByRole("columnheader");
    const labels = expectedLabels(0);
    headers.forEach((h, i) => expect(h).toHaveTextContent(labels[i]!));
  });

  it("reads firstDayOfWeek from DatesProvider", () => {
    render(
      <DatesProvider settings={{ firstDayOfWeek: 0 }}>
        <WeekdaysRow />
      </DatesProvider>,
    );
    const headers = screen.getAllByRole("columnheader");
    const labels = expectedLabels(0);
    headers.forEach((h, i) => expect(h).toHaveTextContent(labels[i]!));
  });

  it("applies a custom string weekdayFormat", () => {
    render(<WeekdaysRow weekdayFormat="dddd" />);
    const headers = screen.getAllByRole("columnheader");
    const labels = expectedLabels(1, "en", "dddd");
    expect(headers[0]).toHaveTextContent(labels[0]!);
    // 'dddd' yields full names like "Monday"
    expect(headers[0]!.textContent).toMatch(/day$/i);
  });

  it("applies a function weekdayFormat", () => {
    render(<WeekdaysRow weekdayFormat={(date) => `W${dayjs(date).day()}`} />);
    const headers = screen.getAllByRole("columnheader");
    // First column (Monday) → day index 1
    expect(headers[0]).toHaveTextContent("W1");
  });

  it("uses the locale prop for labels", () => {
    render(<WeekdaysRow locale="ru" />);
    const headers = screen.getAllByRole("columnheader");
    const labels = expectedLabels(1, "ru");
    expect(headers[0]).toHaveTextContent(labels[0]!);
  });

  it("reads locale from DatesProvider", () => {
    render(
      <DatesProvider settings={{ locale: "ru" }}>
        <WeekdaysRow />
      </DatesProvider>,
    );
    const headers = screen.getAllByRole("columnheader");
    const labels = expectedLabels(1, "ru");
    expect(headers[0]).toHaveTextContent(labels[0]!);
  });

  describe("withWeekNumbers", () => {
    it("prepends a '#' heading column when enabled (8 columnheaders)", () => {
      render(<WeekdaysRow withWeekNumbers />);
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(8);
      expect(headers[0]).toHaveTextContent("#");
    });

    it("renders no '#' column when disabled (default)", () => {
      render(<WeekdaysRow />);
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(7);
      expect(headers[0]).not.toHaveTextContent("#");
    });
  });

  it("accepts a size prop without changing label count", () => {
    render(<WeekdaysRow size="xl" />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("accepts fullWidth without changing structure", () => {
    render(<WeekdaysRow fullWidth />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("forwards a ref to the host row element", () => {
    const ref = jest.fn();
    render(<WeekdaysRow ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*) to the row host", () => {
    render(<WeekdaysRow data-testid="weekdays" />);
    expect(screen.getByTestId("weekdays")).toBeInTheDocument();
  });

  describe("styles sugar", () => {
    it("spreads the weekdaysRow slot onto the row host", () => {
      render(<WeekdaysRow styles={{ weekdaysRow: { testID: "row-slot" } }} />);
      expect(screen.getByTestId("row-slot")).toBeInTheDocument();
    });

    it("spreads the weekday slot onto every label cell", () => {
      render(<WeekdaysRow styles={{ weekday: { "aria-label": "wd" } }} />);
      screen
        .getAllByRole("columnheader")
        .forEach((h) => expect(h).toHaveAttribute("aria-label", "wd"));
    });
  });

  describe("static parts", () => {
    it("exposes the Frame and Weekday styled parts", () => {
      expect(WeekdaysRow.Frame).toBeDefined();
      expect(WeekdaysRow.Weekday).toBeDefined();
    });
  });
});
