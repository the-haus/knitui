import * as React from "react";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { YearsList } from "./YearsList";

// 2024 rounds to the 2020 decade → years 2020…2029.
const DECADE = "2024-01-01";
const YEARS = Array.from({ length: 10 }, (_, i) => String(2020 + i));

describe("YearsList", () => {
  describe("grid rendering", () => {
    it("renders a role=grid root", () => {
      render(<YearsList decade={DECADE} />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("renders the 10 years of the decade in a ragged 3/3/3/1 layout", () => {
      render(<YearsList decade={DECADE} />);
      YEARS.forEach((y) => {
        expect(screen.getByText(y)).toBeInTheDocument();
      });
      // 4 rows (3 + 3 + 3 + 1).
      expect(screen.getAllByRole("row")).toHaveLength(4);
      // 10 cells.
      expect(screen.getAllByRole("cell")).toHaveLength(10);
    });

    it("rounds any date within a decade to the same year set", () => {
      render(<YearsList decade="2029-12-31" />);
      YEARS.forEach((y) => {
        expect(screen.getByText(y)).toBeInTheDocument();
      });
    });

    it("each cell wraps a role=button control", () => {
      render(<YearsList decade={DECADE} />);
      expect(screen.getAllByRole("button")).toHaveLength(10);
    });
  });

  describe("yearsListFormat", () => {
    it("honours a custom dayjs format", () => {
      render(<YearsList decade={DECADE} yearsListFormat="YY" />);
      expect(screen.getByText("20")).toBeInTheDocument();
      expect(screen.getByText("29")).toBeInTheDocument();
    });
  });

  describe("getYearControlProps", () => {
    it("forwards props to each year's control", () => {
      const getYearControlProps = jest.fn((date: string) => ({
        "aria-label": `year-${date.slice(0, 4)}`,
      }));
      render(<YearsList decade={DECADE} getYearControlProps={getYearControlProps} />);
      expect(getYearControlProps).toHaveBeenCalled();
      expect(screen.getByLabelText("year-2020")).toBeInTheDocument();
      expect(screen.getByLabelText("year-2029")).toBeInTheDocument();
    });

    it("marks a year selected when getYearControlProps returns selected", () => {
      render(
        <YearsList
          decade={DECADE}
          getYearControlProps={(date) => (date === "2022-01-01" ? { selected: true } : {})}
        />,
      );
      const selected = screen.getByText("2022").closest('[role="button"]');
      expect(selected).toHaveAttribute("aria-selected", "true");
    });

    it("disables a year when getYearControlProps returns disabled", () => {
      render(
        <YearsList
          decade={DECADE}
          getYearControlProps={(date) => (date === "2023-01-01" ? { disabled: true } : {})}
        />,
      );
      const control = screen.getByText("2023").closest('[role="button"]');
      expect(control).toHaveAttribute("aria-disabled", "true");
    });

    it("fires the control's onPress from getYearControlProps with the year", () => {
      const onPress = jest.fn();
      render(
        <YearsList
          decade={DECADE}
          getYearControlProps={(date) => (date === "2025-01-01" ? { onPress } : {})}
        />,
      );
      fireEvent.click(screen.getByText("2025"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("renders custom children when provided via getYearControlProps", () => {
      render(
        <YearsList
          decade={DECADE}
          getYearControlProps={(date) => (date === "2021-01-01" ? { children: "custom" } : {})}
        />,
      );
      expect(screen.getByText("custom")).toBeInTheDocument();
    });
  });

  describe("min/max bounds", () => {
    it("disables years before minDate", () => {
      render(<YearsList decade={DECADE} minDate={new Date(2023, 0, 1)} />);
      expect(screen.getByText("2020").closest('[role="button"]')).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByText("2022").closest('[role="button"]')).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      // in-range years are not disabled
      expect(screen.getByText("2023").closest('[role="button"]')).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("disables years after maxDate", () => {
      render(<YearsList decade={DECADE} maxDate={new Date(2025, 0, 1)} />);
      expect(screen.getByText("2026").closest('[role="button"]')).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByText("2029").closest('[role="button"]')).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByText("2025").closest('[role="button"]')).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("keeps years within [minDate, maxDate] enabled", () => {
      render(
        <YearsList decade={DECADE} minDate={new Date(2022, 0, 1)} maxDate={new Date(2027, 0, 1)} />,
      );
      ["2022", "2024", "2027"].forEach((y) => {
        expect(screen.getByText(y).closest('[role="button"]')).not.toHaveAttribute("aria-disabled");
      });
      ["2021", "2028"].forEach((y) => {
        expect(screen.getByText(y).closest('[role="button"]')).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      });
    });
  });

  describe("internal navigation wiring", () => {
    it("calls __onControlClick with the pressed year", () => {
      const onControlClick = jest.fn();
      render(<YearsList decade={DECADE} __onControlClick={onControlClick} />);
      fireEvent.click(screen.getByText("2024"));
      expect(onControlClick).toHaveBeenCalledTimes(1);
      expect(onControlClick.mock.calls[0][1]).toBe("2024-01-01");
    });

    it("calls __onControlKeyDown with the cell coordinates and date", () => {
      const onControlKeyDown = jest.fn();
      render(<YearsList decade={DECADE} __onControlKeyDown={onControlKeyDown} />);
      // first cell of the first row is 2020.
      fireEvent.keyDown(screen.getByText("2020"), { key: "ArrowRight" });
      expect(onControlKeyDown).toHaveBeenCalledTimes(1);
      expect(onControlKeyDown.mock.calls[0][1]).toMatchObject({
        rowIndex: 0,
        cellIndex: 0,
        date: "2020-01-01",
      });
    });

    it("registers control refs via __getControlRef", () => {
      const getControlRef = jest.fn();
      render(<YearsList decade={DECADE} __getControlRef={getControlRef} />);
      expect(getControlRef).toHaveBeenCalled();
      // (rowIndex, cellIndex, { focus, disabled })
      const [rowIndex, cellIndex, api] = getControlRef.mock.calls[0];
      expect(typeof rowIndex).toBe("number");
      expect(typeof cellIndex).toBe("number");
      expect(typeof api.focus).toBe("function");
    });
  });

  describe("roving tabIndex", () => {
    it("puts exactly one control in the tab order by default", () => {
      render(<YearsList decade={DECADE} />);
      const tabbable = screen
        .getAllByRole("button")
        .filter((el) => el.getAttribute("tabindex") === "0");
      expect(tabbable).toHaveLength(1);
    });

    it("puts the selected year in the tab order", () => {
      render(
        <YearsList
          decade={DECADE}
          getYearControlProps={(date) => (date === "2026-01-01" ? { selected: true } : {})}
        />,
      );
      const selected = screen.getByText("2026").closest('[role="button"]');
      expect(selected).toHaveAttribute("tabindex", "0");
    });

    it("__preventFocus removes every control from the tab order", () => {
      render(<YearsList decade={DECADE} __preventFocus />);
      const tabbable = screen
        .getAllByRole("button")
        .filter((el) => el.getAttribute("tabindex") === "0");
      expect(tabbable).toHaveLength(0);
    });
  });

  describe("locale", () => {
    it("falls back to the DatesProvider locale", () => {
      // 'YYYY' is locale-independent, so assert it simply renders under a
      // non-default provider locale without throwing.
      render(
        <DatesProvider settings={{ locale: "fr" }}>
          <YearsList decade={DECADE} />
        </DatesProvider>,
      );
      expect(screen.getByText("2020")).toBeInTheDocument();
    });
  });

  describe("styles sugar", () => {
    it("forwards the control slot to each PickerControl", () => {
      render(<YearsList decade={DECADE} styles={{ control: { "aria-label": "control-slot" } }} />);
      expect(screen.getAllByLabelText("control-slot")).toHaveLength(10);
    });

    it("getYearControlProps wins over the control slot (explicit beats sugar)", () => {
      render(
        <YearsList
          decade={DECADE}
          styles={{ control: { disabled: true } }}
          getYearControlProps={(date) => (date === "2024-01-01" ? { disabled: false } : {})}
        />,
      );
      const control = screen.getByText("2024").closest('[role="button"]');
      expect(control).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("static parts", () => {
    it("exposes the styled Frame / Row / Cell parts", () => {
      expect(YearsList.Frame).toBeDefined();
      expect(YearsList.Row).toBeDefined();
      expect(YearsList.Cell).toBeDefined();
    });
  });

  describe("layout props", () => {
    it("renders without cell spacing when withCellSpacing is false", () => {
      render(<YearsList decade={DECADE} withCellSpacing={false} />);
      expect(screen.getAllByRole("cell")).toHaveLength(10);
    });

    it("accepts a size prop", () => {
      render(<YearsList decade={DECADE} size="lg" />);
      expect(screen.getAllByRole("button")).toHaveLength(10);
    });

    it("accepts fullWidth", () => {
      render(<YearsList decade={DECADE} fullWidth />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.getAllByRole("cell")).toHaveLength(10);
    });

    it("forwards a ref to the grid root", () => {
      const ref = React.createRef<HTMLElement>();
      render(<YearsList decade={DECADE} ref={ref as never} />);
      expect(ref.current).not.toBeNull();
    });
  });
});
