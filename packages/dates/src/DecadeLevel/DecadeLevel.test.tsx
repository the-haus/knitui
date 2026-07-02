import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { DecadeLevel } from "./DecadeLevel";
import { getDecadeRange } from "./get-decade-range/get-decade-range";

const defaultProps = {
  decade: "2024-01-01",
  levelControlAriaLabel: "level-control",
  nextLabel: "next",
  previousLabel: "previous",
} as const;

describe("DecadeLevel", () => {
  it("renders the decade label as 'start – end' with the default format", () => {
    render(<DecadeLevel {...defaultProps} />);
    const [start, end] = getDecadeRange("2024-01-01");
    const startYear = start.slice(0, 4);
    const endYear = end.slice(0, 4);
    expect(screen.getByText(`${startYear} – ${endYear}`)).toBeInTheDocument();
  });

  it("honours a string decadeLabelFormat for both ends", () => {
    render(<DecadeLevel {...defaultProps} decadeLabelFormat="YY" />);
    const [start, end] = getDecadeRange("2024-01-01");
    expect(screen.getByText(`${start.slice(2, 4)} – ${end.slice(2, 4)}`)).toBeInTheDocument();
  });

  it("honours a two-arg function decadeLabelFormat", () => {
    render(<DecadeLevel {...defaultProps} decadeLabelFormat={(s, e) => `${s}->${e}`} />);
    const [start, end] = getDecadeRange("2024-01-01");
    expect(screen.getByText(`${start}->${end}`)).toBeInTheDocument();
  });

  it("renders the years grid", () => {
    render(<DecadeLevel {...defaultProps} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
  });

  it("renders the previous and next controls and fires their callbacks", () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    render(<DecadeLevel {...defaultProps} onNext={onNext} onPrevious={onPrevious} />);

    fireEvent.click(screen.getByLabelText("next"));
    fireEvent.click(screen.getByLabelText("previous"));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("renders the level control as non-interactive (top level, presentation role)", () => {
    render(<DecadeLevel {...defaultProps} />);
    // No onLevelClick is accepted; the level label control is presentational.
    const presentation = screen.getByLabelText("level-control");
    expect(presentation).toHaveAttribute("aria-disabled", "true");
    // It is not exposed as a button (top level cannot zoom out further).
    expect(presentation).not.toHaveAttribute("role", "button");
  });

  it("omits next/previous controls via withNext/withPrevious", () => {
    render(<DecadeLevel {...defaultProps} withNext={false} withPrevious={false} />);
    expect(screen.queryByLabelText("next")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("previous")).not.toBeInTheDocument();
  });

  it("disables the next control when the decade end is at the maxDate bound", () => {
    const [, end] = getDecadeRange("2024-01-01");
    render(<DecadeLevel {...defaultProps} maxDate={`${end.slice(0, 4)}-12-31`} />);
    expect(screen.getByLabelText("next")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the next control when maxDate is well past the decade", () => {
    render(<DecadeLevel {...defaultProps} maxDate="2099-12-31" />);
    expect(screen.getByLabelText("next")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("disables the previous control when the decade start is at the minDate bound", () => {
    const [start] = getDecadeRange("2024-01-01");
    render(<DecadeLevel {...defaultProps} minDate={`${start.slice(0, 4)}-01-01`} />);
    expect(screen.getByLabelText("previous")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the previous control when minDate is well before the decade", () => {
    render(<DecadeLevel {...defaultProps} minDate="1900-01-01" />);
    expect(screen.getByLabelText("previous")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("respects explicit nextDisabled / previousDisabled overrides", () => {
    render(<DecadeLevel {...defaultProps} nextDisabled previousDisabled />);
    expect(screen.getByLabelText("next")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByLabelText("previous")).toHaveAttribute("aria-disabled", "true");
  });

  it("fires the year control callback when a year cell is pressed", () => {
    const onControlClick = jest.fn();
    render(<DecadeLevel {...defaultProps} __onControlClick={onControlClick} />);
    const yearButton = screen
      .getAllByRole("button")
      .find(
        (b) =>
          b.getAttribute("aria-label") !== "next" && b.getAttribute("aria-label") !== "previous",
      );
    expect(yearButton).toBeDefined();
    fireEvent.click(yearButton!);
    expect(onControlClick).toHaveBeenCalled();
  });

  it("forwards extra frame props and a ref to the root", () => {
    const ref = React.createRef<HTMLElement>();
    render(<DecadeLevel {...defaultProps} data-testid="decade-level" ref={ref as never} />);
    expect(screen.getByTestId("decade-level")).toBeInTheDocument();
    expect(ref.current).not.toBeNull();
  });

  it("routes per-slot `styles` sugar onto the header controls", () => {
    render(<DecadeLevel {...defaultProps} styles={{ headerControl: { id: "ctrl" } }} />);
    expect(screen.getByLabelText("next")).toHaveAttribute("id", "ctrl");
    expect(screen.getByLabelText("previous")).toHaveAttribute("id", "ctrl");
  });

  it("routes per-slot `styles` sugar onto the years grid", () => {
    const { container } = render(
      <DecadeLevel {...defaultProps} styles={{ list: { id: "styled-grid" } }} />,
    );
    expect(container.querySelector("#styled-grid")).toBe(screen.getByRole("grid"));
  });

  it("passes getYearControlProps through to each year control", () => {
    const getYearControlProps = jest.fn(() => ({}));
    render(<DecadeLevel {...defaultProps} getYearControlProps={getYearControlProps} />);
    expect(getYearControlProps).toHaveBeenCalled();
  });

  it("exposes the composed parts as static properties", () => {
    expect(DecadeLevel.Frame).toBeDefined();
    expect(DecadeLevel.Header).toBeDefined();
    expect(DecadeLevel.List).toBeDefined();
  });
});
