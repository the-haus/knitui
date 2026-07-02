import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { YearLevel } from "./YearLevel";

const defaultProps = {
  year: "2024-01-01",
  levelControlAriaLabel: "level-control",
  nextLabel: "next",
  previousLabel: "previous",
} as const;

describe("YearLevel", () => {
  it("renders the year label with the default format", () => {
    render(<YearLevel {...defaultProps} />);
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("honours a string yearLabelFormat", () => {
    render(<YearLevel {...defaultProps} yearLabelFormat="YY" />);
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("honours a function yearLabelFormat", () => {
    render(<YearLevel {...defaultProps} yearLabelFormat={(d) => `Y:${d}`} />);
    expect(screen.getByText("Y:2024-01-01")).toBeInTheDocument();
  });

  it("renders the months grid with 12 month controls", () => {
    render(<YearLevel {...defaultProps} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getAllByRole("cell")).toHaveLength(12);
  });

  it("renders the previous and next controls and fires their callbacks", () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    render(<YearLevel {...defaultProps} onNext={onNext} onPrevious={onPrevious} />);

    fireEvent.click(screen.getByLabelText("next"));
    fireEvent.click(screen.getByLabelText("previous"));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("fires onLevelClick when the level control is pressed (zooms to decade)", () => {
    const onLevelClick = jest.fn();
    render(<YearLevel {...defaultProps} onLevelClick={onLevelClick} />);
    fireEvent.click(screen.getByLabelText("level-control"));
    expect(onLevelClick).toHaveBeenCalledTimes(1);
  });

  it("omits next/previous controls via withNext/withPrevious", () => {
    render(<YearLevel {...defaultProps} withNext={false} withPrevious={false} />);
    expect(screen.queryByLabelText("next")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("previous")).not.toBeInTheDocument();
  });

  it("disables the next control when the year is at the maxDate bound", () => {
    render(<YearLevel {...defaultProps} maxDate="2024-12-31" />);
    expect(screen.getByLabelText("next")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the next control when maxDate is in a later year", () => {
    render(<YearLevel {...defaultProps} maxDate="2026-12-31" />);
    expect(screen.getByLabelText("next")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("disables the previous control when the year is at the minDate bound", () => {
    render(<YearLevel {...defaultProps} minDate="2024-01-01" />);
    expect(screen.getByLabelText("previous")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the previous control when minDate is in an earlier year", () => {
    render(<YearLevel {...defaultProps} minDate="2020-01-01" />);
    expect(screen.getByLabelText("previous")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("respects explicit nextDisabled / previousDisabled overrides", () => {
    render(<YearLevel {...defaultProps} nextDisabled previousDisabled />);
    expect(screen.getByLabelText("next")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByLabelText("previous")).toHaveAttribute("aria-disabled", "true");
  });

  it("fires the month control callback when a month cell is pressed", () => {
    const onControlClick = jest.fn();
    render(<YearLevel {...defaultProps} __onControlClick={onControlClick} />);
    // Click the first month control inside the grid.
    const months = screen.getAllByRole("button");
    // Filter out the header controls (next/previous/level) by aria-label.
    const monthButton = months.find(
      (b) =>
        b.getAttribute("aria-label") !== "next" &&
        b.getAttribute("aria-label") !== "previous" &&
        b.getAttribute("aria-label") !== "level-control",
    );
    expect(monthButton).toBeDefined();
    fireEvent.click(monthButton!);
    expect(onControlClick).toHaveBeenCalled();
  });

  it("forwards extra frame props and a ref to the root", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<YearLevel {...defaultProps} data-testid="year-level" ref={ref} />);
    expect(screen.getByTestId("year-level")).toBeInTheDocument();
    expect(ref.current).not.toBeNull();
  });

  it("routes per-slot `styles` sugar onto the header controls", () => {
    render(<YearLevel {...defaultProps} styles={{ headerControl: { id: "ctrl" } }} />);
    expect(screen.getByLabelText("next")).toHaveAttribute("id", "ctrl");
    expect(screen.getByLabelText("previous")).toHaveAttribute("id", "ctrl");
  });

  it("routes per-slot `styles` sugar onto the months grid", () => {
    const { container } = render(
      <YearLevel {...defaultProps} styles={{ months: { id: "styled-grid" } }} />,
    );
    expect(container.querySelector("#styled-grid")).toBe(screen.getByRole("grid"));
  });

  it("passes getMonthControlProps through to each month", () => {
    const getMonthControlProps = jest.fn(() => ({}));
    render(<YearLevel {...defaultProps} getMonthControlProps={getMonthControlProps} />);
    expect(getMonthControlProps).toHaveBeenCalled();
  });

  it("exposes the composed parts as static properties", () => {
    expect(YearLevel.Frame).toBeDefined();
    expect(YearLevel.Header).toBeDefined();
    expect(YearLevel.List).toBeDefined();
  });
});
