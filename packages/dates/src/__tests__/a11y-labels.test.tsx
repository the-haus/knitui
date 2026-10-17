/**
 * Accessible names and roles across the date family (web axis — the native
 * `accessibility*` counterparts are built by `internal/a11y` and are empty on
 * web by design). Grid cells stay `role="cell"`: RN's `Role` union has no
 * `gridcell`, so the portable value is used on purpose.
 */
import { Calendar } from "../Calendar";
import { DatePicker } from "../DatePicker";
import { DatesProvider } from "../DatesProvider";
import { MonthPicker } from "../MonthPicker";
import { render, screen, within } from "../test-utils";
import { TimeGrid } from "../TimeGrid";
import { YearPicker } from "../YearPicker";

const JAN_2024 = "2024-01-01";

describe("month grid roles + labels", () => {
  it("grid > row > cell, weekday columnheaders, locale-formatted day labels", () => {
    render(<DatePicker defaultDate={JAN_2024} />);
    const grid = screen.getByRole("grid");
    // 1 weekday header row + 5 week rows for January 2024 (Mon-first).
    expect(within(grid).getAllByRole("row").length).toBeGreaterThanOrEqual(6);
    expect(within(grid).getAllByRole("columnheader")).toHaveLength(7);
    expect(within(grid).getAllByRole("cell").length).toBeGreaterThanOrEqual(35);
    expect(screen.getByRole("button", { name: "15 January 2024" })).toBeInTheDocument();
  });

  it("honours the DatesProvider locale in day labels", () => {
    render(
      <DatesProvider settings={{ locale: "fr" }}>
        <DatePicker defaultDate={JAN_2024} />
      </DatesProvider>,
    );
    expect(screen.getByRole("button", { name: "15 janvier 2024" })).toBeInTheDocument();
  });

  it("getDayAriaLabel overrides the default label", () => {
    render(<DatePicker defaultDate={JAN_2024} getDayAriaLabel={(d) => `Pick ${d}`} />);
    expect(screen.getByRole("button", { name: "Pick 2024-01-15" })).toBeInTheDocument();
  });

  it("exposes selection and disabled state", () => {
    render(
      <DatePicker
        defaultDate={JAN_2024}
        value="2024-01-10"
        onChange={jest.fn()}
        minDate="2024-01-05"
      />,
    );
    expect(screen.getByRole("button", { name: "10 January 2024" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: "4 January 2024" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("week numbers render as rowheaders", () => {
    render(<DatePicker defaultDate={JAN_2024} withWeekNumbers />);
    expect(screen.getAllByRole("rowheader").length).toBeGreaterThanOrEqual(5);
  });
});

describe("header controls", () => {
  it("labels previous / next / level controls via ariaLabels", () => {
    render(
      <Calendar
        defaultDate={JAN_2024}
        ariaLabels={{
          previousMonth: "Previous month",
          nextMonth: "Next month",
          monthLevelControl: "Change level",
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change level" })).toBeInTheDocument();
  });

  it("the top level's label is presentational (no zoom-out)", () => {
    render(<Calendar defaultDate={JAN_2024} defaultLevel="decade" />);
    const label = screen.getByText("2020 – 2029").closest("[role]");
    expect(label).toHaveAttribute("role", "presentation");
    expect(label).toHaveAttribute("aria-disabled", "true");
  });
});

describe("month / year pickers", () => {
  it("month cells are buttons with the selected month marked", () => {
    render(<MonthPicker defaultDate={JAN_2024} value="2024-03-01" onChange={jest.fn()} />);
    const march = screen.getByText("Mar").closest("button");
    expect(march).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("cell")).toHaveLength(12);
  });

  it("year cells are buttons with the selected year marked", () => {
    render(<YearPicker defaultDate={JAN_2024} value="2026-01-01" onChange={jest.fn()} />);
    expect(screen.getByText("2026").closest("button")).toHaveAttribute("aria-selected", "true");
  });
});

describe("TimeGrid", () => {
  it("is a group of buttons announcing the formatted time and the selection", () => {
    render(<TimeGrid data={["10:00", "14:30"]} value="14:30" format="12h" />);
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2:30 PM" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: "10:00 AM" })).not.toHaveAttribute("aria-selected");
  });
});
