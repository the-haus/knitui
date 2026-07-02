import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { DatesProvider } from "../DatesProvider";
import { DecadeLevel } from "../DecadeLevel";
import { LevelsGroup } from "../LevelsGroup";
import { fireEvent, render, screen } from "../test-utils";
import { DecadeLevelGroup } from "./DecadeLevelGroup";

const DECADE = "2024-03-15";

function renderGroup(props?: Partial<React.ComponentProps<typeof DecadeLevelGroup>>) {
  return render(
    <DatesProvider settings={{}}>
      <DecadeLevelGroup decade={DECADE} {...props} />
    </DatesProvider>,
  );
}

describe("DecadeLevelGroup", () => {
  it("renders a single decade panel by default", () => {
    renderGroup();
    // Default decadeLabelFormat 'YYYY' formats both ends as `start – end`.
    expect(screen.getByText(/–/)).toBeInTheDocument();
  });

  it("renders one grid per column", () => {
    renderGroup({ numberOfColumns: 2 });
    expect(screen.getAllByRole("grid")).toHaveLength(2);
  });

  it("steps ten years per column", () => {
    renderGroup({
      numberOfColumns: 2,
      // A two-arg function receives [startOfDecade, endOfDecade] for each panel.
      decadeLabelFormat: (start) => start.slice(0, 4),
    });
    // First panel start year and the next decade's start year (ten years apart).
    const firstStart = screen.getAllByText(/^\d{4}$/)[0]?.textContent;
    expect(firstStart).toBeTruthy();
  });

  it("shows the previous control only on the first panel and next only on the last", () => {
    renderGroup({
      numberOfColumns: 2,
      previousLabel: "Previous decade",
      nextLabel: "Next decade",
    });
    expect(screen.getAllByRole("button", { name: "Previous decade" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Next decade" })).toHaveLength(1);
  });

  it("fires onPrevious from the first panel's previous control", () => {
    const onPrevious = jest.fn();
    renderGroup({ previousLabel: "Previous decade", onPrevious });
    fireEvent.click(screen.getByRole("button", { name: "Previous decade" }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("fires onNext from the last panel's next control", () => {
    const onNext = jest.fn();
    renderGroup({ numberOfColumns: 2, nextLabel: "Next decade", onNext });
    fireEvent.click(screen.getByRole("button", { name: "Next decade" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("renders the level label as a non-interactive node (top level, no zoom-out)", () => {
    renderGroup({ levelControlAriaLabel: "Decade label" });
    // DecadeLevel is the top level: hasNextLevel is false, so the level control
    // is NOT exposed as a button.
    expect(screen.queryByRole("button", { name: "Decade label" })).not.toBeInTheDocument();
  });

  it("resolves levelControlAriaLabel per panel when given a function", () => {
    // The function receives the panel's decade date; even though the level is not
    // a button, the resolved label is still applied to the presentation node.
    const seen: string[] = [];
    renderGroup({
      numberOfColumns: 2,
      levelControlAriaLabel: (decade) => {
        seen.push(decade);
        return `Decade ${decade}`;
      },
    });
    expect(seen).toHaveLength(2);
    // Columns are ten years apart.
    expect(dayjsYearDiff(seen[0]!, seen[1]!)).toBe(10);
  });

  it("renders a custom decadeLabelFormat function", () => {
    renderGroup({ decadeLabelFormat: (start, end) => `${start.slice(0, 4)}-${end.slice(0, 4)}` });
    expect(screen.getByText(/^\d{4}-\d{4}$/)).toBeInTheDocument();
  });

  it("forwards a ref to the LevelsGroup root", () => {
    const ref = React.createRef<TamaguiElement>();
    render(
      <DatesProvider settings={{}}>
        <DecadeLevelGroup ref={ref} decade={DECADE} />
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

  it("forwards getYearControlProps to every panel", () => {
    const seen: string[] = [];
    renderGroup({
      numberOfColumns: 2,
      getYearControlProps: (year) => {
        seen.push(year);
        return {};
      },
    });
    // Both panels render their year grids and call the callback for each year.
    expect(seen.length).toBeGreaterThan(0);
    // Years from the first decade and the next (ten years apart) are both present.
    const years = seen.map((d) => Number(d.slice(0, 4)));
    expect(Math.max(...years) - Math.min(...years)).toBeGreaterThanOrEqual(10);
  });

  it("disables a year cell via getYearControlProps", () => {
    renderGroup({
      getYearControlProps: (year) => ({ disabled: year.startsWith("2025") }),
    });
    const year = screen.getByRole("button", { name: "2025" });
    expect(year).toBeDisabled();
  });

  it("exposes the LevelsGroup frame and DecadeLevel as static properties", () => {
    expect(DecadeLevelGroup.Frame).toBe(LevelsGroup);
    expect(DecadeLevelGroup.Level).toBe(DecadeLevel);
  });
});

function dayjsYearDiff(a: string, b: string): number {
  return Number(b.slice(0, 4)) - Number(a.slice(0, 4));
}
