import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { SimpleGrid } from "./SimpleGrid";

describe("SimpleGrid", () => {
  it("renders all of its children", () => {
    render(
      <SimpleGrid cols={2}>
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </SimpleGrid>,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.getByText("Three")).toBeInTheDocument();
  });

  it("filters out falsy children", () => {
    render(
      <SimpleGrid cols={2}>
        <span>Visible</span>
        {false}
        {null}
      </SimpleGrid>,
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("renders with minColWidth mode", () => {
    render(
      <SimpleGrid minColWidth={200}>
        <span>Cell</span>
      </SimpleGrid>,
    );
    expect(screen.getByText("Cell")).toBeInTheDocument();
  });

  it("resolves bare space tokens to px for the cell math", () => {
    render(
      <SimpleGrid testID="grid" cols={2} spacing="xs" verticalSpacing="xxl">
        <span>Small gap</span>
        <span>Large row gap</span>
      </SimpleGrid>,
    );
    // xs = 4px column gap split over 2 columns; xxl = 32px row gap.
    expect(screen.getByText("Small gap").parentElement).toHaveStyle({
      paddingLeft: "0px",
      paddingRight: "2px",
    });
    expect(screen.getByTestId("grid")).toHaveStyle({ rowGap: "32px" });
  });

  it("defaults the spacing to the md token", () => {
    render(
      <SimpleGrid testID="grid" cols={2}>
        <span>a</span>
        <span>b</span>
      </SimpleGrid>,
    );
    expect(screen.getByTestId("grid")).toHaveStyle({ rowGap: "12px" });
    expect(screen.getByText("a").parentElement).toHaveStyle({ paddingRight: "6px" });
  });

  it("forwards a ref to the grid frame", () => {
    const ref = React.createRef<GetRef<typeof SimpleGrid>>();
    render(
      <SimpleGrid ref={ref}>
        <span>Cell</span>
      </SimpleGrid>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("renders without children", () => {
    expect(() => render(<SimpleGrid data-testid="grid" />)).not.toThrow();
    expect(screen.getByTestId("grid")).toBeInTheDocument();
  });

  it("spreads the `cell` slot onto every cell wrapper", () => {
    render(
      <SimpleGrid cols={2} styles={{ cell: { testID: "cell" } }}>
        <span>One</span>
        <span>Two</span>
      </SimpleGrid>,
    );
    expect(screen.getAllByTestId("cell")).toHaveLength(2);
  });

  describe("gutter stays inside the grid (KIT-06)", () => {
    const renderGrid = (props: React.ComponentProps<typeof SimpleGrid>, count: number) =>
      render(
        <SimpleGrid testID="grid" spacing={12} verticalSpacing={20} {...props}>
          {Array.from({ length: count }, (_, i) => (
            <span key={i}>{`c${i}`}</span>
          ))}
        </SimpleGrid>,
      );
    const cellOf = (text: string) => screen.getByText(text).parentElement!;

    it("does not pull the track outward and spaces rows with rowGap", () => {
      renderGrid({ cols: 3 }, 3);
      const grid = screen.getByTestId("grid");
      for (const side of ["Left", "Right", "Top", "Bottom"]) {
        expect(grid.style.getPropertyValue(`margin-${side.toLowerCase()}`)).not.toMatch(/^-/);
        expect(getComputedStyle(grid)[`margin${side}` as "marginLeft"]).not.toMatch(/^-/);
      }
      expect(grid).toHaveStyle({ rowGap: "20px" });
    });

    it("splits the column gap so outer columns are flush and every gap is the spacing", () => {
      renderGrid({ cols: 3 }, 6);
      // Column c of 3 with a 12px gap: c*12/3 before, (2-c)*12/3 after.
      const expected = [
        ["0px", "8px"],
        ["4px", "4px"],
        ["8px", "0px"],
      ];
      for (let i = 0; i < 6; i += 1) {
        const [left, right] = expected[i % 3]!;
        const cell = cellOf(`c${i}`);
        expect(cell).toHaveStyle({ paddingLeft: left, paddingRight: right });
        expect(cell).toHaveStyle({ width: `${100 / 3}%` });
      }
    });

    it("uses columnGap in minColWidth mode with the basis less one gap", () => {
      renderGrid({ minColWidth: 200 }, 2);
      expect(screen.getByTestId("grid")).toHaveStyle({ columnGap: "12px", rowGap: "20px" });
      expect(cellOf("c0")).toHaveStyle({ flexBasis: "188px", minWidth: "188px" });
    });
  });
});
