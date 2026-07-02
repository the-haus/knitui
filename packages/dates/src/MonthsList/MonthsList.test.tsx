import dayjs from "dayjs";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { MonthsList } from "./MonthsList";

const YEAR = "2024-01-01"; // any date within 2024

describe("MonthsList", () => {
  it("renders the grid container with role=grid", () => {
    render(<MonthsList year={YEAR} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders 12 month controls (4 rows × 3 columns)", () => {
    render(<MonthsList year={YEAR} />);
    expect(screen.getAllByRole("cell")).toHaveLength(12);
    expect(screen.getAllByRole("button")).toHaveLength(12);
  });

  it("renders 4 rows", () => {
    render(<MonthsList year={YEAR} />);
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("labels controls with the default 'MMM' format", () => {
    render(<MonthsList year={YEAR} />);
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
  });

  it("applies a custom monthsListFormat", () => {
    render(<MonthsList year={YEAR} monthsListFormat="MMMM" />);
    expect(screen.getByText("January")).toBeInTheDocument();
    expect(screen.getByText("December")).toBeInTheDocument();
  });

  it("uses the locale prop for labels", () => {
    render(<MonthsList year={YEAR} locale="ru" monthsListFormat="MMMM" />);
    const january = dayjs("2024-01-01").locale("ru").format("MMMM");
    expect(screen.getByText(january)).toBeInTheDocument();
  });

  it("reads locale from DatesProvider", () => {
    render(
      <DatesProvider settings={{ locale: "ru" }}>
        <MonthsList year={YEAR} monthsListFormat="MMMM" />
      </DatesProvider>,
    );
    const january = dayjs("2024-01-01").locale("ru").format("MMMM");
    expect(screen.getByText(january)).toBeInTheDocument();
  });

  describe("getMonthControlProps", () => {
    it("forwards selected state to a matching month", () => {
      render(
        <MonthsList
          year={YEAR}
          getMonthControlProps={(date) => (dayjs(date).month() === 0 ? { selected: true } : {})}
        />,
      );
      const jan = screen.getByText("Jan").closest("[role='button']");
      expect(jan).toHaveAttribute("aria-selected", "true");
    });

    it("forwards disabled state to a matching month", () => {
      render(
        <MonthsList
          year={YEAR}
          getMonthControlProps={(date) => (dayjs(date).month() === 5 ? { disabled: true } : {})}
        />,
      );
      const jun = screen.getByText("Jun").closest("[role='button']");
      expect(jun).toHaveAttribute("aria-disabled", "true");
    });

    it("renders custom children from getMonthControlProps", () => {
      render(
        <MonthsList
          year={YEAR}
          getMonthControlProps={(date) => (dayjs(date).month() === 0 ? { children: "Custom" } : {})}
        />,
      );
      expect(screen.getByText("Custom")).toBeInTheDocument();
    });
  });

  describe("min / max date", () => {
    it("disables months before minDate", () => {
      render(<MonthsList year={YEAR} minDate="2024-06-01" />);
      const jan = screen.getByText("Jan").closest("[role='button']");
      expect(jan).toHaveAttribute("aria-disabled", "true");
    });

    it("disables months after maxDate", () => {
      render(<MonthsList year={YEAR} maxDate="2024-06-30" />);
      const dec = screen.getByText("Dec").closest("[role='button']");
      expect(dec).toHaveAttribute("aria-disabled", "true");
    });

    it("keeps in-range months enabled", () => {
      render(<MonthsList year={YEAR} minDate="2024-03-01" maxDate="2024-09-30" />);
      const jun = screen.getByText("Jun").closest("[role='button']");
      expect(jun).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("callbacks", () => {
    it("fires __onControlClick with the month's date on press", () => {
      const onControlClick = jest.fn();
      render(<MonthsList year={YEAR} __onControlClick={onControlClick} />);
      fireEvent.click(screen.getByText("Jan"));
      expect(onControlClick).toHaveBeenCalledTimes(1);
      expect(onControlClick.mock.calls[0]![1]).toBe("2024-01-01");
    });

    it("forwards getMonthControlProps.onPress alongside __onControlClick", () => {
      const onPress = jest.fn();
      const onControlClick = jest.fn();
      render(
        <MonthsList
          year={YEAR}
          __onControlClick={onControlClick}
          getMonthControlProps={(date) => (dayjs(date).month() === 0 ? { onPress } : {})}
        />,
      );
      fireEvent.click(screen.getByText("Jan"));
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onControlClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("styles sugar", () => {
    it("forwards the control slot to each PickerControl", () => {
      render(<MonthsList year={YEAR} styles={{ control: { "aria-label": "control-slot" } }} />);
      expect(screen.getAllByLabelText("control-slot")).toHaveLength(12);
    });

    it("getMonthControlProps wins over the control slot (explicit beats sugar)", () => {
      render(
        <MonthsList
          year={YEAR}
          styles={{ control: { disabled: true } }}
          getMonthControlProps={(date) => (dayjs(date).month() === 0 ? { disabled: false } : {})}
        />,
      );
      const jan = screen.getByText("Jan").closest("[role='button']");
      expect(jan).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("static parts", () => {
    it("exposes the styled Frame / Row / Cell parts", () => {
      expect(MonthsList.Frame).toBeDefined();
      expect(MonthsList.Row).toBeDefined();
      expect(MonthsList.Cell).toBeDefined();
    });
  });

  it("accepts a size prop without changing structure", () => {
    render(<MonthsList year={YEAR} size="xl" />);
    expect(screen.getAllByRole("button")).toHaveLength(12);
  });

  it("accepts fullWidth without changing structure", () => {
    render(<MonthsList year={YEAR} fullWidth />);
    expect(screen.getAllByRole("button")).toHaveLength(12);
  });

  it("forwards a ref to the grid host", () => {
    const ref = jest.fn();
    render(<MonthsList year={YEAR} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*) to the grid host", () => {
    render(<MonthsList year={YEAR} data-testid="months-grid" />);
    expect(screen.getByTestId("months-grid")).toBeInTheDocument();
  });
});
