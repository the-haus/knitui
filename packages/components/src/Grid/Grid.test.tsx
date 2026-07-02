import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Grid } from "./Grid";

const GUTTERS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

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

  it.each(GUTTERS)("renders with the %s gutter", (gutter) => {
    render(
      <Grid gutter={gutter}>
        <Grid.Col span={12}>Guttered</Grid.Col>
      </Grid>,
    );
    expect(screen.getByText("Guttered")).toBeInTheDocument();
  });

  it("renders a column with an offset", () => {
    render(
      <Grid>
        <Grid.Col span={6} offset={3}>
          Shifted
        </Grid.Col>
      </Grid>,
    );
    expect(screen.getByText("Shifted")).toBeInTheDocument();
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
