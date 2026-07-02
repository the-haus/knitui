import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { LevelsGroup } from "../LevelsGroup";
import { fireEvent, render, screen } from "../test-utils";
import { YearLevel } from "../YearLevel";
import { YearLevelGroup } from "./YearLevelGroup";

const YEAR = "2024-03-15";

function renderGroup(props?: Partial<React.ComponentProps<typeof YearLevelGroup>>) {
  return render(
    <DatesProvider settings={{}}>
      <YearLevelGroup year={YEAR} {...props} />
    </DatesProvider>,
  );
}

describe("YearLevelGroup", () => {
  it("renders a single year panel by default", () => {
    renderGroup();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders numberOfColumns consecutive year panels", () => {
    renderGroup({ numberOfColumns: 3 });
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });

  it("renders one grid per column", () => {
    renderGroup({ numberOfColumns: 2 });
    expect(screen.getAllByRole("grid")).toHaveLength(2);
  });

  it("shows the previous control only on the first panel and next only on the last", () => {
    renderGroup({
      numberOfColumns: 2,
      previousLabel: "Previous year",
      nextLabel: "Next year",
    });
    expect(screen.getAllByRole("button", { name: "Previous year" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Next year" })).toHaveLength(1);
  });

  it("fires onPrevious from the first panel's previous control", () => {
    const onPrevious = jest.fn();
    renderGroup({ previousLabel: "Previous year", onPrevious });
    fireEvent.click(screen.getByRole("button", { name: "Previous year" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("fires onNext from the last panel's next control", () => {
    const onNext = jest.fn();
    renderGroup({ numberOfColumns: 2, nextLabel: "Next year", onNext });
    fireEvent.click(screen.getByRole("button", { name: "Next year" }));
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
      levelControlAriaLabel: (year) => `Pick decade for ${year}`,
    });
    expect(screen.getByRole("button", { name: "Pick decade for 2024-03-15" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pick decade for 2025-03-15" })).toBeInTheDocument();
  });

  it("honours yearLabelFormat", () => {
    renderGroup({ yearLabelFormat: "YY" });
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("forwards a ref to the LevelsGroup root", () => {
    const ref = React.createRef<TamaguiElement>();
    render(
      <DatesProvider settings={{}}>
        <YearLevelGroup ref={ref} year={YEAR} />
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

  it("forwards getMonthControlProps to every panel", () => {
    const seen: string[] = [];
    renderGroup({
      numberOfColumns: 2,
      getMonthControlProps: (date) => {
        seen.push(date);
        return {};
      },
    });
    // Both panels render their month grids and call the callback for each month.
    expect(seen.length).toBeGreaterThan(0);
    // Months from the first year (2024) and the next (2025) are both present.
    expect(seen.some((d) => d.startsWith("2024-"))).toBe(true);
    expect(seen.some((d) => d.startsWith("2025-"))).toBe(true);
  });

  it("disables a month cell via getMonthControlProps", () => {
    renderGroup({
      getMonthControlProps: (date) => ({ disabled: date.startsWith("2024-06") }),
    });
    const jun = screen.getByText("Jun").closest("[role='button']");
    expect(jun).toHaveAttribute("aria-disabled", "true");
  });

  it("exposes the LevelsGroup frame and YearLevel as static properties", () => {
    expect(YearLevelGroup.Frame).toBe(LevelsGroup);
    expect(YearLevelGroup.Level).toBe(YearLevel);
  });
});
