import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { LevelsGroup } from "../LevelsGroup";
import { MonthLevel } from "../MonthLevel";
import { fireEvent, render, screen } from "../test-utils";
import { MonthLevelGroup } from "./MonthLevelGroup";

const MONTH = "2024-03-15";

function renderGroup(props?: Partial<React.ComponentProps<typeof MonthLevelGroup>>) {
  return render(
    <DatesProvider settings={{}}>
      <MonthLevelGroup month={MONTH} {...props} />
    </DatesProvider>,
  );
}

describe("MonthLevelGroup", () => {
  it("renders a single month panel by default", () => {
    renderGroup();
    expect(screen.getByText("March 2024")).toBeInTheDocument();
  });

  it("renders numberOfColumns consecutive month panels", () => {
    renderGroup({ numberOfColumns: 3 });
    expect(screen.getByText("March 2024")).toBeInTheDocument();
    expect(screen.getByText("April 2024")).toBeInTheDocument();
    expect(screen.getByText("May 2024")).toBeInTheDocument();
  });

  it("renders one grid per column", () => {
    renderGroup({ numberOfColumns: 2 });
    expect(screen.getAllByRole("grid")).toHaveLength(2);
  });

  it("shows the previous control only on the first panel and next only on the last", () => {
    renderGroup({
      numberOfColumns: 2,
      previousLabel: "Previous month",
      nextLabel: "Next month",
    });
    expect(screen.getAllByRole("button", { name: "Previous month" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Next month" })).toHaveLength(1);
  });

  it("fires onPrevious from the first panel's previous control", () => {
    const onPrevious = jest.fn();
    renderGroup({ previousLabel: "Previous month", onPrevious });
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("fires onNext from the last panel's next control", () => {
    const onNext = jest.fn();
    renderGroup({ numberOfColumns: 2, nextLabel: "Next month", onNext });
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("fires onLevelClick when a level control is pressed", () => {
    const onLevelClick = jest.fn();
    renderGroup({ levelControlAriaLabel: "Change level", onLevelClick });
    fireEvent.click(screen.getByRole("button", { name: "Change level" }));
    expect(onLevelClick).toHaveBeenCalledTimes(1);
  });

  it("resolves levelControlAriaLabel per panel when given a function", () => {
    renderGroup({
      numberOfColumns: 2,
      levelControlAriaLabel: (month) => `Pick year for ${month}`,
    });
    expect(screen.getByRole("button", { name: "Pick year for 2024-03-15" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pick year for 2024-04-15" })).toBeInTheDocument();
  });

  it("honours monthLabelFormat", () => {
    renderGroup({ monthLabelFormat: "MM/YYYY" });
    expect(screen.getByText("03/2024")).toBeInTheDocument();
  });

  it("forwards a ref to the LevelsGroup root", () => {
    const ref = React.createRef<TamaguiElement>();
    render(
      <DatesProvider settings={{}}>
        <MonthLevelGroup ref={ref} month={MONTH} />
      </DatesProvider>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("exposes the group as role=group around the level grids", () => {
    renderGroup({ numberOfColumns: 2 });
    const group = screen.getByRole("group");
    expect(group).toBeInTheDocument();
    // The level grids are nested inside the group.
    expect(screen.getAllByRole("grid")).toHaveLength(2);
  });

  it("forwards getDayProps to every panel", () => {
    const seen: string[] = [];
    renderGroup({
      numberOfColumns: 2,
      getDayProps: (date) => {
        seen.push(date);
        return {};
      },
    });
    // Both panels render their day grids and call the callback for each day.
    expect(seen.length).toBeGreaterThan(0);
    // Days from the first month (March) and the next (April) are both present.
    expect(seen.some((d) => d.startsWith("2024-03"))).toBe(true);
    expect(seen.some((d) => d.startsWith("2024-04"))).toBe(true);
  });

  it("disables a day cell via getDayProps", () => {
    renderGroup({
      getDayProps: (date) => ({ disabled: date === "2024-03-15" }),
    });
    const day = screen.getByRole("button", { name: "15 March 2024" });
    expect(day).toBeDisabled();
  });

  it("exposes the LevelsGroup frame and MonthLevel as static properties", () => {
    expect(MonthLevelGroup.Frame).toBe(LevelsGroup);
    expect(MonthLevelGroup.Level).toBe(MonthLevel);
  });
});
