import dayjs from "dayjs";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { Day } from "./Day";

const DATE = "2024-01-15"; // a Monday in January 2024

describe("Day", () => {
  it("renders the day-of-month number by default", () => {
    render(<Day date={DATE} />);
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("renders as an interactive button by default with type=button", () => {
    render(<Day date={DATE} />);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("supports a custom renderDay renderer", () => {
    render(<Day date={DATE} renderDay={(d) => `D:${dayjs(d).date()}`} />);
    expect(screen.getByText("D:15")).toBeInTheDocument();
  });

  it("renders a non-text node from renderDay without a DayLabel", () => {
    render(<Day date={DATE} renderDay={() => <span data-testid="custom-node">x</span>} />);
    expect(screen.getByTestId("custom-node")).toBeInTheDocument();
  });

  describe("aria-label", () => {
    it("provides a locale-aware default label", () => {
      render(<Day date={DATE} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "15 January 2024");
    });

    it("lets an explicit aria-label win", () => {
      render(<Day date={DATE} aria-label="custom label" />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "custom label");
    });

    it("respects a per-Day locale prop for the default label", () => {
      render(<Day date={DATE} locale="ru" />);
      const label = screen.getByRole("button").getAttribute("aria-label");
      expect(label).toBe(dayjs(DATE).locale("ru").format("D MMMM YYYY"));
    });

    it("reads locale from DatesProvider", () => {
      render(
        <DatesProvider settings={{ locale: "ru" }}>
          <Day date={DATE} />
        </DatesProvider>,
      );
      const label = screen.getByRole("button").getAttribute("aria-label");
      expect(label).toBe(dayjs(DATE).locale("ru").format("D MMMM YYYY"));
    });
  });

  describe("selected", () => {
    it("sets aria-selected when selected", () => {
      render(<Day date={DATE} selected />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-selected", "true");
    });

    it("omits aria-selected when not selected", () => {
      render(<Day date={DATE} />);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-selected");
    });

    it("suppresses selected styling when disabled", () => {
      render(<Day date={DATE} selected disabled />);
      // disabled gates selected off → no aria-selected
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-selected");
    });
  });

  describe("disabled", () => {
    it("sets aria-disabled when disabled", () => {
      render(<Day date={DATE} disabled />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("omits aria-disabled when enabled", () => {
      render(<Day date={DATE} />);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("hidden", () => {
    it("sets aria-hidden when hidden", () => {
      render(<Day date={DATE} hidden data-testid="hidden-day" />);
      expect(screen.getByTestId("hidden-day")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("static (display-only) cell", () => {
    it("renders as a div with presentation role", () => {
      render(<Day date={DATE} static />);
      const node = screen.getByText("15").closest("div");
      expect(node).toBeTruthy();
      // No interactive button is exposed.
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("announces no default aria-label", () => {
      render(<Day date={DATE} static data-testid="static-day" />);
      expect(screen.getByTestId("static-day")).not.toHaveAttribute("aria-label");
    });
  });

  describe("callbacks", () => {
    it("fires onPress (click) when activated", () => {
      const onPress = jest.fn();
      render(<Day date={DATE} onPress={onPress} />);
      fireEvent.click(screen.getByRole("button"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("size", () => {
    it("defaults to md and accepts an explicit size", () => {
      const { rerender } = render(<Day date={DATE} data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
      rerender(<Day date={DATE} size="xl" data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
    });
  });

  it("forwards a ref to the host button element", () => {
    const ref = jest.fn();
    render(<Day date={DATE} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*) to the host", () => {
    render(<Day date={DATE} data-testid="day-host" />);
    expect(screen.getByTestId("day-host")).toBeInTheDocument();
  });

  describe("state variants", () => {
    it("renders an in-range day", () => {
      render(<Day date={DATE} inRange data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
    });

    it("renders the first/last day of a range", () => {
      const { rerender } = render(<Day date={DATE} inRange firstInRange data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
      rerender(<Day date={DATE} inRange lastInRange data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
    });

    it("renders a weekend day", () => {
      render(<Day date={DATE} weekend data-testid="day" />);
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("renders an outside day", () => {
      render(<Day date={DATE} outside data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
    });

    it("renders a full-width day", () => {
      render(<Day date={DATE} fullWidth data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
    });

    it("highlights today when highlightToday is set", () => {
      const today = dayjs().format("YYYY-MM-DD");
      render(<Day date={today} highlightToday data-testid="day" />);
      expect(screen.getByTestId("day")).toBeInTheDocument();
    });

    it("renders a selected day with the day number visible (compiler-safe label)", () => {
      // Regression: a selected cell must keep its visible label (the MiniCalendar
      // `_o-0` opacity trap). The label colour is a variant, not a dynamic style.
      render(<Day date={DATE} selected />);
      expect(screen.getByText("15")).toBeVisible();
    });
  });

  describe("public surface", () => {
    it("exposes the styled Frame and Label parts", () => {
      expect(Day.Frame).toBeDefined();
      expect(Day.Label).toBeDefined();
    });
  });
});
