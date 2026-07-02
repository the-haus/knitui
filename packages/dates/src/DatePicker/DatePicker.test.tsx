import * as React from "react";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen, within } from "../test-utils";
import { DatePicker } from "./DatePicker";

const JAN_2024 = new Date(2024, 0, 1);

/** Click the day cell whose label is exactly `day` (e.g. "15") within the day grid. */
function clickDay(day: string) {
  // Day buttons expose the day-of-month as their visible text.
  const cells = screen.getAllByText(day, { selector: "*" });
  // The grid day button is a <button>; pick the one inside the grid.
  const button = cells
    .map((node) => node.closest("button"))
    .find((node): node is HTMLButtonElement => node !== null);
  if (!button) {
    throw new Error(`No day button found for "${day}"`);
  }
  fireEvent.click(button);
  return button;
}

describe("DatePicker", () => {
  it("renders a month-level day grid by default", () => {
    render(<DatePicker defaultDate={JAN_2024} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    // The January 2024 grid shows day numbers.
    expect(screen.getByText("January 2024")).toBeInTheDocument();
    expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
  });

  describe("type='default'", () => {
    it("fires onChange with a single date string when a day is clicked", () => {
      const onChange = jest.fn();
      render(<DatePicker defaultDate={JAN_2024} onChange={onChange} />);
      clickDay("15");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith("2024-01-15");
    });

    it("reflects a controlled value as the selected day", () => {
      render(<DatePicker defaultDate={JAN_2024} value="2024-01-10" onChange={jest.fn()} />);
      const selected = clickDay("10");
      expect(selected).toHaveAttribute("aria-selected", "true");
    });

    it("supports an uncontrolled defaultValue", () => {
      render(<DatePicker defaultDate={JAN_2024} defaultValue="2024-01-20" />);
      const day = screen
        .getAllByText("20")
        .map((n) => n.closest("button"))
        .find((n): n is HTMLButtonElement => n !== null);
      expect(day).toHaveAttribute("aria-selected", "true");
    });

    it("does not deselect by default when clicking the selected day again", () => {
      const onChange = jest.fn();
      render(<DatePicker defaultDate={JAN_2024} value="2024-01-15" onChange={onChange} />);
      clickDay("15");
      expect(onChange).toHaveBeenLastCalledWith("2024-01-15");
    });

    it("deselects (onChange null) when allowDeselect and the selected day is re-clicked", () => {
      const onChange = jest.fn();
      render(
        <DatePicker defaultDate={JAN_2024} value="2024-01-15" allowDeselect onChange={onChange} />,
      );
      clickDay("15");
      expect(onChange).toHaveBeenLastCalledWith(null);
    });
  });

  describe("type='multiple'", () => {
    it("accumulates clicked days into an array", () => {
      const onChange = jest.fn();
      render(<DatePicker<"multiple"> type="multiple" defaultDate={JAN_2024} onChange={onChange} />);
      clickDay("5");
      expect(onChange).toHaveBeenLastCalledWith(["2024-01-05"]);
    });

    it("toggles a day off when clicked while already selected", () => {
      const onChange = jest.fn();
      render(
        <DatePicker<"multiple">
          type="multiple"
          defaultDate={JAN_2024}
          value={["2024-01-05"]}
          onChange={onChange}
        />,
      );
      clickDay("5");
      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it("marks all controlled values as selected", () => {
      render(
        <DatePicker<"multiple">
          type="multiple"
          defaultDate={JAN_2024}
          value={["2024-01-05", "2024-01-06"]}
          onChange={jest.fn()}
        />,
      );
      const five = clickDay("5");
      expect(five).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("type='range'", () => {
    it("emits [start, null] on the first click then a sorted [start, end] on the second", () => {
      const onChange = jest.fn();
      render(<DatePicker<"range"> type="range" defaultDate={JAN_2024} onChange={onChange} />);
      clickDay("10");
      expect(onChange).toHaveBeenLastCalledWith(["2024-01-10", null]);
      clickDay("5");
      // Result is sorted ascending regardless of click order.
      expect(onChange).toHaveBeenLastCalledWith(["2024-01-05", "2024-01-10"]);
    });

    it("clears a single in-progress endpoint by default when re-clicked (no allowSingleDateInRange)", () => {
      const onChange = jest.fn();
      render(<DatePicker<"range"> type="range" defaultDate={JAN_2024} onChange={onChange} />);
      clickDay("10");
      clickDay("10");
      expect(onChange).toHaveBeenLastCalledWith([null, null]);
    });

    it("allows a single-day range when allowSingleDateInRange", () => {
      const onChange = jest.fn();
      render(
        <DatePicker<"range">
          type="range"
          allowSingleDateInRange
          defaultDate={JAN_2024}
          onChange={onChange}
        />,
      );
      clickDay("10");
      clickDay("10");
      expect(onChange).toHaveBeenLastCalledWith(["2024-01-10", "2024-01-10"]);
    });
  });

  describe("min / max date bounds", () => {
    it("disables days before minDate", () => {
      render(<DatePicker defaultDate={JAN_2024} minDate="2024-01-10" />);
      const five = screen
        .getAllByText("5")
        .map((n) => n.closest("button"))
        .find((n): n is HTMLButtonElement => n !== null);
      expect(five).toHaveAttribute("aria-disabled", "true");
    });

    it("disables days after maxDate", () => {
      render(<DatePicker defaultDate={JAN_2024} maxDate="2024-01-10" />);
      const twenty = screen
        .getAllByText("20")
        .map((n) => n.closest("button"))
        .find((n): n is HTMLButtonElement => n !== null);
      expect(twenty).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("level navigation", () => {
    it("zooms out to the year level when the month label control is pressed", () => {
      render(<DatePicker defaultDate={JAN_2024} />);
      fireEvent.click(screen.getByText("January 2024"));
      // Year level shows month controls (Jan, Feb, ...).
      expect(screen.getByText("Jan")).toBeInTheDocument();
      expect(screen.getByText("Dec")).toBeInTheDocument();
    });

    it("calls onLevelChange when the level zooms out", () => {
      const onLevelChange = jest.fn();
      render(<DatePicker defaultDate={JAN_2024} onLevelChange={onLevelChange} />);
      fireEvent.click(screen.getByText("January 2024"));
      expect(onLevelChange).toHaveBeenCalledWith("year");
    });

    it("starts at the level given by defaultLevel", () => {
      render(<DatePicker defaultDate={JAN_2024} defaultLevel="year" />);
      // Year level: month controls visible, no day grid label.
      expect(screen.getByText("Jan")).toBeInTheDocument();
      expect(screen.queryByText("January 2024")).not.toBeInTheDocument();
    });
  });

  describe("getDayProps", () => {
    it("merges custom props onto day controls", () => {
      render(
        <DatePicker
          defaultDate={JAN_2024}
          getDayProps={(date) => (date === "2024-01-15" ? { "aria-label": "special-day" } : {})}
        />,
      );
      expect(screen.getByLabelText("special-day")).toBeInTheDocument();
    });
  });

  describe("presets", () => {
    it("renders preset buttons and applies the preset value on press", () => {
      const onChange = jest.fn();
      render(
        <DatePicker
          defaultDate={JAN_2024}
          onChange={onChange}
          presets={[{ value: "2024-02-02", label: "Groundhog Day" }]}
        />,
      );
      const preset = screen.getByText("Groundhog Day");
      expect(preset).toBeInTheDocument();
      fireEvent.click(preset.closest("button") ?? preset);
      expect(onChange).toHaveBeenLastCalledWith("2024-02-02");
    });

    it("renders the presets as an accessible list and renders all of them", () => {
      render(
        <DatePicker
          defaultDate={JAN_2024}
          presets={[
            { value: "2024-02-02", label: "Groundhog Day" },
            { value: "2024-03-17", label: "St. Patrick's" },
          ]}
        />,
      );
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getByText("Groundhog Day")).toBeInTheDocument();
      expect(screen.getByText("St. Patrick's")).toBeInTheDocument();
    });

    it("applies a range preset value on press", () => {
      const onChange = jest.fn();
      render(
        <DatePicker<"range">
          type="range"
          defaultDate={JAN_2024}
          onChange={onChange}
          presets={[{ value: ["2024-02-01", "2024-02-07"], label: "First week of Feb" }]}
        />,
      );
      const preset = screen.getByText("First week of Feb");
      fireEvent.click(preset.closest("button") ?? preset);
      expect(onChange).toHaveBeenLastCalledWith(["2024-02-01", "2024-02-07"]);
    });

    it("forwards a ref to the root wrapper when presets are present", () => {
      const ref = jest.fn();
      render(
        <DatePicker
          defaultDate={JAN_2024}
          ref={ref}
          presets={[{ value: "2024-02-02", label: "Groundhog Day" }]}
        />,
      );
      expect(ref).toHaveBeenCalled();
    });
  });

  it("supports multiple side-by-side months via numberOfColumns", () => {
    render(<DatePicker defaultDate={JAN_2024} numberOfColumns={2} />);
    expect(screen.getByText("January 2024")).toBeInTheDocument();
    expect(screen.getByText("February 2024")).toBeInTheDocument();
  });

  it("renders inside a DatesProvider with custom settings", () => {
    render(
      <DatesProvider settings={{ firstDayOfWeek: 1 }}>
        <DatePicker defaultDate={JAN_2024} />
      </DatesProvider>,
    );
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("January 2024")).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    const ref = jest.fn();
    render(<DatePicker defaultDate={JAN_2024} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("forwards a size prop without crashing", () => {
    render(<DatePicker defaultDate={JAN_2024} size="lg" data-testid="dp" />);
    expect(within(screen.getByRole("grid")).getAllByRole("cell").length).toBeGreaterThan(0);
  });
});
