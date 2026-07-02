import * as React from "react";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { MonthPicker } from "./MonthPicker";

const JAN_2024 = new Date(2024, 0, 1);

/** Click the month control whose short label is `label` (e.g. "Mar"). */
function clickMonth(label: string) {
  const node = screen.getByText(label);
  const button = node.closest("button") ?? node;
  fireEvent.click(button);
  return button;
}

describe("MonthPicker", () => {
  it("renders the year-level month grid by default", () => {
    render(<MonthPicker defaultDate={JAN_2024} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
    // No day grid — there is no day "January 2024" header.
    expect(screen.queryByText("January 2024")).not.toBeInTheDocument();
  });

  describe("type='default'", () => {
    it("fires onChange with the first-of-month date string when a month is clicked", () => {
      const onChange = jest.fn();
      render(<MonthPicker defaultDate={JAN_2024} onChange={onChange} />);
      clickMonth("Mar");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith("2024-03-01");
    });

    it("reflects a controlled value as the selected month", () => {
      render(<MonthPicker defaultDate={JAN_2024} value="2024-05-01" onChange={jest.fn()} />);
      const may = screen.getByText("May").closest("button");
      expect(may).toHaveAttribute("aria-selected", "true");
    });

    it("supports an uncontrolled defaultValue", () => {
      render(<MonthPicker defaultDate={JAN_2024} defaultValue="2024-07-01" />);
      const jul = screen.getByText("Jul").closest("button");
      expect(jul).toHaveAttribute("aria-selected", "true");
    });

    it("deselects (onChange null) when allowDeselect and the selected month is re-clicked", () => {
      const onChange = jest.fn();
      render(
        <MonthPicker defaultDate={JAN_2024} value="2024-03-01" allowDeselect onChange={onChange} />,
      );
      clickMonth("Mar");
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("calls onMonthSelect with the selected month", () => {
      const onMonthSelect = jest.fn();
      render(<MonthPicker defaultDate={JAN_2024} onMonthSelect={onMonthSelect} />);
      clickMonth("Mar");
      expect(onMonthSelect).toHaveBeenCalledWith("2024-03-01");
    });
  });

  describe("type='multiple'", () => {
    it("accumulates clicked months into an array", () => {
      const onChange = jest.fn();
      render(
        <MonthPicker<"multiple"> type="multiple" defaultDate={JAN_2024} onChange={onChange} />,
      );
      clickMonth("Feb");
      expect(onChange).toHaveBeenLastCalledWith(["2024-02-01"]);
    });

    it("toggles a month off when re-clicked", () => {
      const onChange = jest.fn();
      render(
        <MonthPicker<"multiple">
          type="multiple"
          defaultDate={JAN_2024}
          value={["2024-02-01"]}
          onChange={onChange}
        />,
      );
      clickMonth("Feb");
      expect(onChange).toHaveBeenLastCalledWith([]);
    });
  });

  describe("type='range'", () => {
    it("emits [start, null] then a sorted [start, end]", () => {
      const onChange = jest.fn();
      render(<MonthPicker<"range"> type="range" defaultDate={JAN_2024} onChange={onChange} />);
      clickMonth("Jun");
      expect(onChange).toHaveBeenLastCalledWith(["2024-06-01", null]);
      clickMonth("Mar");
      expect(onChange).toHaveBeenLastCalledWith(["2024-03-01", "2024-06-01"]);
    });

    it("allows a single-month range when allowSingleDateInRange", () => {
      const onChange = jest.fn();
      render(
        <MonthPicker<"range">
          type="range"
          allowSingleDateInRange
          defaultDate={JAN_2024}
          onChange={onChange}
        />,
      );
      clickMonth("Jun");
      clickMonth("Jun");
      expect(onChange).toHaveBeenLastCalledWith(["2024-06-01", "2024-06-01"]);
    });
  });

  describe("min / max date bounds", () => {
    it("disables months before minDate", () => {
      render(<MonthPicker defaultDate={JAN_2024} minDate="2024-04-01" />);
      const feb = screen.getByText("Feb").closest("button");
      expect(feb).toHaveAttribute("aria-disabled", "true");
    });

    it("disables months after maxDate", () => {
      render(<MonthPicker defaultDate={JAN_2024} maxDate="2024-04-30" />);
      const dec = screen.getByText("Dec").closest("button");
      expect(dec).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("level navigation", () => {
    it("zooms out to the decade level when the year label control is pressed", () => {
      render(<MonthPicker defaultDate={JAN_2024} />);
      fireEvent.click(screen.getByText("2024"));
      // Decade level shows year controls including 2024.
      expect(screen.getAllByText("2024").length).toBeGreaterThan(0);
      expect(screen.getByText("2025")).toBeInTheDocument();
    });

    it("calls onLevelChange when zooming out to decade", () => {
      const onLevelChange = jest.fn();
      render(<MonthPicker defaultDate={JAN_2024} onLevelChange={onLevelChange} />);
      fireEvent.click(screen.getByText("2024"));
      expect(onLevelChange).toHaveBeenCalledWith("decade");
    });
  });

  describe("getMonthControlProps", () => {
    it("merges custom props onto month controls", () => {
      render(
        <MonthPicker
          defaultDate={JAN_2024}
          getMonthControlProps={(date) =>
            date === "2024-03-01" ? { "aria-label": "special-month" } : {}
          }
        />,
      );
      expect(screen.getByLabelText("special-month")).toBeInTheDocument();
    });
  });

  describe("presets", () => {
    it("applies a preset value on press", () => {
      const onChange = jest.fn();
      render(
        <MonthPicker
          defaultDate={JAN_2024}
          onChange={onChange}
          presets={[{ value: "2024-08-01", label: "August" }]}
        />,
      );
      const preset = screen.getByText("August");
      fireEvent.click(preset.closest("button") ?? preset);
      expect(onChange).toHaveBeenLastCalledWith("2024-08-01");
    });
  });

  it("renders inside a DatesProvider", () => {
    render(
      <DatesProvider settings={{ firstDayOfWeek: 1 }}>
        <MonthPicker defaultDate={JAN_2024} />
      </DatesProvider>,
    );
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    const ref = jest.fn();
    render(<MonthPicker defaultDate={JAN_2024} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});
