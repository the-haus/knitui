import * as React from "react";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { YearPicker } from "./YearPicker";

const JAN_2024 = new Date(2024, 0, 1);

/** Click the year control whose label is `label` (e.g. "2025"). */
function clickYear(label: string) {
  const node = screen.getByText(label);
  const button = node.closest("button") ?? node;
  fireEvent.click(button);
  return button;
}

describe("YearPicker", () => {
  it("renders the decade-level year grid by default", () => {
    render(<YearPicker defaultDate={JAN_2024} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    // The 2020-2029 decade is shown.
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2029")).toBeInTheDocument();
    // No month labels (not the year level).
    expect(screen.queryByText("Jan")).not.toBeInTheDocument();
  });

  describe("type='default'", () => {
    it("fires onChange with a start-of-year date string when a year is clicked", () => {
      const onChange = jest.fn();
      render(<YearPicker defaultDate={JAN_2024} onChange={onChange} />);
      clickYear("2025");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith("2025-01-01");
    });

    it("reflects a controlled value as the selected year", () => {
      render(<YearPicker defaultDate={JAN_2024} value="2026-01-01" onChange={jest.fn()} />);
      const y = screen.getByText("2026").closest("button");
      expect(y).toHaveAttribute("aria-selected", "true");
    });

    it("supports an uncontrolled defaultValue", () => {
      render(<YearPicker defaultDate={JAN_2024} defaultValue="2027-01-01" />);
      const y = screen.getByText("2027").closest("button");
      expect(y).toHaveAttribute("aria-selected", "true");
    });

    it("deselects (onChange null) when allowDeselect and the selected year is re-clicked", () => {
      const onChange = jest.fn();
      render(
        <YearPicker defaultDate={JAN_2024} value="2025-01-01" allowDeselect onChange={onChange} />,
      );
      clickYear("2025");
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("calls onYearSelect with the selected year", () => {
      const onYearSelect = jest.fn();
      render(<YearPicker defaultDate={JAN_2024} onYearSelect={onYearSelect} />);
      clickYear("2025");
      expect(onYearSelect).toHaveBeenCalledWith("2025-01-01");
    });
  });

  describe("type='multiple'", () => {
    it("accumulates clicked years into an array", () => {
      const onChange = jest.fn();
      render(<YearPicker<"multiple"> type="multiple" defaultDate={JAN_2024} onChange={onChange} />);
      clickYear("2025");
      expect(onChange).toHaveBeenLastCalledWith(["2025-01-01"]);
    });

    it("toggles a year off when re-clicked", () => {
      const onChange = jest.fn();
      render(
        <YearPicker<"multiple">
          type="multiple"
          defaultDate={JAN_2024}
          value={["2025-01-01"]}
          onChange={onChange}
        />,
      );
      clickYear("2025");
      expect(onChange).toHaveBeenLastCalledWith([]);
    });
  });

  describe("type='range'", () => {
    it("emits [start, null] then a sorted [start, end]", () => {
      const onChange = jest.fn();
      render(<YearPicker<"range"> type="range" defaultDate={JAN_2024} onChange={onChange} />);
      clickYear("2027");
      expect(onChange).toHaveBeenLastCalledWith(["2027-01-01", null]);
      clickYear("2025");
      expect(onChange).toHaveBeenLastCalledWith(["2025-01-01", "2027-01-01"]);
    });

    it("allows a single-year range when allowSingleDateInRange", () => {
      const onChange = jest.fn();
      render(
        <YearPicker<"range">
          type="range"
          allowSingleDateInRange
          defaultDate={JAN_2024}
          onChange={onChange}
        />,
      );
      clickYear("2025");
      clickYear("2025");
      expect(onChange).toHaveBeenLastCalledWith(["2025-01-01", "2025-01-01"]);
    });
  });

  describe("min / max date bounds", () => {
    it("disables years before minDate", () => {
      render(<YearPicker defaultDate={JAN_2024} minDate="2025-01-01" />);
      const y = screen.getByText("2024").closest("button");
      expect(y).toHaveAttribute("aria-disabled", "true");
    });

    it("disables years after maxDate", () => {
      render(<YearPicker defaultDate={JAN_2024} maxDate="2025-12-31" />);
      const y = screen.getByText("2028").closest("button");
      expect(y).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("getYearControlProps", () => {
    it("merges custom props onto year controls", () => {
      render(
        <YearPicker
          defaultDate={JAN_2024}
          getYearControlProps={(date) =>
            date === "2025-01-01" ? { "aria-label": "special-year" } : {}
          }
        />,
      );
      expect(screen.getByLabelText("special-year")).toBeInTheDocument();
    });
  });

  describe("presets", () => {
    it("applies a preset value on press", () => {
      const onChange = jest.fn();
      render(
        <YearPicker
          defaultDate={JAN_2024}
          onChange={onChange}
          presets={[{ value: "2030-01-01", label: "Year 2030" }]}
        />,
      );
      const preset = screen.getByText("Year 2030");
      fireEvent.click(preset.closest("button") ?? preset);
      expect(onChange).toHaveBeenLastCalledWith("2030-01-01");
    });
  });

  it("renders inside a DatesProvider", () => {
    render(
      <DatesProvider settings={{ firstDayOfWeek: 1 }}>
        <YearPicker defaultDate={JAN_2024} />
      </DatesProvider>,
    );
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    const ref = jest.fn();
    render(<YearPicker defaultDate={JAN_2024} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});
