import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { fireEvent, render, screen } from "../test-utils";
import { MonthLevel } from "./MonthLevel";

const defaultProps = {
  month: "2024-01-01",
  levelControlAriaLabel: "level-control",
  nextLabel: "next",
  previousLabel: "previous",
} as const;

describe("MonthLevel", () => {
  it("renders the month label for the given date with the default format", () => {
    render(<MonthLevel {...defaultProps} />);
    expect(screen.getByText("January 2024")).toBeInTheDocument();
  });

  it("honours a string monthLabelFormat", () => {
    render(<MonthLevel {...defaultProps} monthLabelFormat="MM/YYYY" />);
    expect(screen.getByText("01/2024")).toBeInTheDocument();
  });

  it("honours a function monthLabelFormat", () => {
    render(<MonthLevel {...defaultProps} monthLabelFormat={(date) => `custom-${date}`} />);
    expect(screen.getByText("custom-2024-01-01")).toBeInTheDocument();
  });

  it("renders the day grid", () => {
    render(<MonthLevel {...defaultProps} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    // Day cells exist (role="cell" per a11y contract).
    expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
  });

  it("renders the previous and next controls and fires their callbacks", () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    render(<MonthLevel {...defaultProps} onNext={onNext} onPrevious={onPrevious} />);

    const previous = screen.getByLabelText("previous");
    const next = screen.getByLabelText("next");
    expect(previous).toBeInTheDocument();
    expect(next).toBeInTheDocument();

    fireEvent.click(next);
    fireEvent.click(previous);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("fires onLevelClick when the level control is pressed", () => {
    const onLevelClick = jest.fn();
    render(<MonthLevel {...defaultProps} onLevelClick={onLevelClick} />);
    fireEvent.click(screen.getByLabelText("level-control"));
    expect(onLevelClick).toHaveBeenCalledTimes(1);
  });

  it("does not render the next control when withNext is false", () => {
    render(<MonthLevel {...defaultProps} withNext={false} />);
    expect(screen.queryByLabelText("next")).not.toBeInTheDocument();
  });

  it("does not render the previous control when withPrevious is false", () => {
    render(<MonthLevel {...defaultProps} withPrevious={false} />);
    expect(screen.queryByLabelText("previous")).not.toBeInTheDocument();
  });

  it("disables the next control when the month is at the maxDate bound", () => {
    render(<MonthLevel {...defaultProps} maxDate="2024-01-31" />);
    expect(screen.getByLabelText("next")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the next control when maxDate is in a later month", () => {
    render(<MonthLevel {...defaultProps} maxDate="2024-05-31" />);
    expect(screen.getByLabelText("next")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("disables the previous control when the month is at the minDate bound", () => {
    render(<MonthLevel {...defaultProps} minDate="2024-01-01" />);
    expect(screen.getByLabelText("previous")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the previous control when minDate is in an earlier month", () => {
    render(<MonthLevel {...defaultProps} minDate="2023-08-01" />);
    expect(screen.getByLabelText("previous")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("respects an explicit nextDisabled / previousDisabled override", () => {
    render(<MonthLevel {...defaultProps} nextDisabled previousDisabled />);
    expect(screen.getByLabelText("next")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByLabelText("previous")).toHaveAttribute("aria-disabled", "true");
  });

  it("respects the DatesProvider firstDayOfWeek for the weekdays row", () => {
    // firstDayOfWeek=1 (Monday) → Monday's label leads the columnheader row.
    render(
      <DatesProvider settings={{ firstDayOfWeek: 1 }}>
        <MonthLevel {...defaultProps} />
      </DatesProvider>,
    );
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveTextContent(/Mo/i);
  });

  it("hides weekdays row when hideWeekdays is set", () => {
    const { rerender } = render(<MonthLevel {...defaultProps} />);
    const withWeekdays = screen.getAllByRole("columnheader").length;
    expect(withWeekdays).toBeGreaterThan(0);

    rerender(<MonthLevel {...defaultProps} hideWeekdays />);
    expect(screen.queryAllByRole("columnheader").length).toBe(0);
  });

  it("forwards extra frame props (e.g. testID) and a ref to the root", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<MonthLevel {...defaultProps} data-testid="month-level" ref={ref} />);
    expect(screen.getByTestId("month-level")).toBeInTheDocument();
    expect(ref.current).not.toBeNull();
  });

  it("routes per-slot `styles` sugar onto the header controls", () => {
    render(<MonthLevel {...defaultProps} styles={{ headerControl: { id: "ctrl" } }} />);
    expect(screen.getByLabelText("next")).toHaveAttribute("id", "ctrl");
    expect(screen.getByLabelText("previous")).toHaveAttribute("id", "ctrl");
  });

  it("routes per-slot `styles` sugar onto the day grid", () => {
    const { container } = render(
      <MonthLevel {...defaultProps} styles={{ month: { id: "styled-grid" } }} />,
    );
    expect(container.querySelector("#styled-grid")).toBe(screen.getByRole("grid"));
  });

  it("passes getDayProps through to each day", () => {
    const getDayProps = jest.fn(() => ({}));
    render(<MonthLevel {...defaultProps} getDayProps={getDayProps} />);
    expect(getDayProps).toHaveBeenCalled();
  });

  it("exposes the composed parts as static properties", () => {
    expect(MonthLevel.Frame).toBeDefined();
    expect(MonthLevel.Header).toBeDefined();
    expect(MonthLevel.Month).toBeDefined();
  });
});
