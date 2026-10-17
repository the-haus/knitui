import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Grid } from "./Grid";

const GUTTERS = [
  ["xxs", 2],
  ["xs", 4],
  ["sm", 8],
  ["md", 12],
  ["lg", 16],
  ["xl", 24],
  ["xxl", 32],
] as const;

describe("Grid", () => {
  it("renders its columns and their content", () => {
    render(
      <Grid>
        <Grid.Col span={6}>Left</Grid.Col>
        <Grid.Col span={6}>Right</Grid.Col>
      </Grid>,
    );
    expect(screen.getByText("Left")).toBeInTheDocument();
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it.each([6, "auto", "content"] as const)("renders a column with span=%s", (span) => {
    render(
      <Grid>
        <Grid.Col span={span}>Cell</Grid.Col>
      </Grid>,
    );
    expect(screen.getByText("Cell")).toBeInTheDocument();
  });

  it("renders with a custom column count and gutter", () => {
    render(
      <Grid columns={24} gutter="lg">
        <Grid.Col span={12}>Half</Grid.Col>
      </Grid>,
    );
    expect(screen.getByText("Half")).toBeInTheDocument();
  });

  it.each(GUTTERS)("resolves the %s gutter token to %ipx", (gutter, px) => {
    render(
      <Grid gutter={gutter} testID="grid">
        <Grid.Col span={12} testID="col">
          Guttered
        </Grid.Col>
      </Grid>,
    );
    // Half the gutter on every column side, cancelled by a negative-margin track.
    expect(screen.getByTestId("col")).toHaveStyle({ padding: `${px / 2}px` });
    expect(screen.getByTestId("grid")).toHaveStyle({ margin: `${-px / 2}px` });
  });

  it("uses the md gutter by default, also for a Col outside any Grid", () => {
    render(
      <>
        <Grid>
          <Grid.Col testID="in">a</Grid.Col>
        </Grid>
        <Grid.Col testID="out">b</Grid.Col>
      </>,
    );
    expect(screen.getByTestId("in")).toHaveStyle({ padding: "6px" });
    expect(screen.getByTestId("out")).toHaveStyle({ padding: "6px" });
  });

  it("accepts a raw px gutter", () => {
    render(
      <Grid gutter={20}>
        <Grid.Col testID="col">a</Grid.Col>
      </Grid>,
    );
    expect(screen.getByTestId("col")).toHaveStyle({ padding: "10px" });
  });

  it("sizes a column as span / columns", () => {
    render(
      <Grid columns={24}>
        <Grid.Col span={6} testID="col">
          q
        </Grid.Col>
      </Grid>,
    );
    expect(screen.getByTestId("col")).toHaveStyle({ flexBasis: "25%", maxWidth: "25%" });
  });

  it("lets columns grow to fill the last row with grow", () => {
    render(
      <Grid grow>
        <Grid.Col span={4} testID="col">
          g
        </Grid.Col>
      </Grid>,
    );
    const col = screen.getByTestId("col");
    expect(col).toHaveStyle({ flexGrow: "1" });
    expect(cssRulesOf(col).join("\n")).not.toContain("max-width");
  });

  it("renders a column with an offset", () => {
    render(
      <Grid>
        <Grid.Col span={6} offset={3} testID="col">
          Shifted
        </Grid.Col>
      </Grid>,
    );
    expect(screen.getByText("Shifted")).toBeInTheDocument();
    expect(screen.getByTestId("col")).toHaveStyle({ marginLeft: "25%" });
  });

  it("forwards a ref to the grid element", () => {
    const ref = React.createRef<GetRef<typeof Grid>>();
    render(
      <Grid ref={ref}>
        <Grid.Col span={12}>Cell</Grid.Col>
      </Grid>,
    );
    expect(ref.current).not.toBeNull();
  });
});
