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

  it("accepts the full spacing scale and $space tokens", () => {
    render(
      <SimpleGrid cols={2} spacing="xxs" verticalSpacing="$xxl">
        <span>Small gap</span>
        <span>Large row gap</span>
      </SimpleGrid>,
    );
    expect(screen.getByText("Small gap")).toBeInTheDocument();
    expect(screen.getByText("Large row gap")).toBeInTheDocument();
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
});
