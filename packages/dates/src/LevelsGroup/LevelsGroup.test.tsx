import * as React from "react";

import { MonthLevel } from "../MonthLevel";
import { render, screen } from "../test-utils";
import { LevelsGroup } from "./LevelsGroup";

describe("LevelsGroup", () => {
  it("renders its children side by side", () => {
    render(
      <LevelsGroup>
        <MonthLevel month="2024-01-01" />
        <MonthLevel month="2024-02-01" />
      </LevelsGroup>,
    );
    expect(screen.getByText("January 2024")).toBeInTheDocument();
    expect(screen.getByText("February 2024")).toBeInTheDocument();
  });

  it("renders one grid per child level (numberOfColumns parity)", () => {
    render(
      <LevelsGroup>
        <MonthLevel month="2024-01-01" />
        <MonthLevel month="2024-02-01" />
        <MonthLevel month="2024-03-01" />
      </LevelsGroup>,
    );
    expect(screen.getAllByRole("grid")).toHaveLength(3);
  });

  it("renders a single child without issue", () => {
    render(
      <LevelsGroup>
        <MonthLevel month="2024-01-01" />
      </LevelsGroup>,
    );
    expect(screen.getAllByRole("grid")).toHaveLength(1);
  });

  it("carries no role of its own (pure layout wrapper)", () => {
    render(
      <LevelsGroup data-testid="group">
        <MonthLevel month="2024-01-01" />
      </LevelsGroup>,
    );
    expect(screen.getByTestId("group")).not.toHaveAttribute("role");
  });

  it("swallows the size prop without leaking it to the host", () => {
    render(
      <LevelsGroup size="lg" data-testid="group">
        <MonthLevel month="2024-01-01" />
      </LevelsGroup>,
    );
    const group = screen.getByTestId("group");
    expect(group).not.toHaveAttribute("size");
  });

  it("accepts the fullWidth prop", () => {
    render(
      <LevelsGroup fullWidth data-testid="group">
        <MonthLevel month="2024-01-01" />
      </LevelsGroup>,
    );
    expect(screen.getByTestId("group")).toBeInTheDocument();
  });

  it("forwards extra frame props to the root", () => {
    render(
      <LevelsGroup data-testid="group" aria-label="levels">
        <MonthLevel month="2024-01-01" />
      </LevelsGroup>,
    );
    expect(screen.getByTestId("group")).toHaveAttribute("aria-label", "levels");
  });

  it("forwards a ref to the root frame", () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <LevelsGroup ref={ref as never}>
        <MonthLevel month="2024-01-01" />
      </LevelsGroup>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("forwards a passed role through to the root (a11y is forwardable, not baked)", () => {
    render(
      <LevelsGroup role="group" data-testid="group">
        <MonthLevel month="2024-01-01" />
      </LevelsGroup>,
    );
    expect(screen.getByTestId("group")).toHaveAttribute("role", "group");
  });

  it("exposes the styled root as `LevelsGroup.Frame` (#14)", () => {
    expect(LevelsGroup.Frame).toBeDefined();
  });
});
