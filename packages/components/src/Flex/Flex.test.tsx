import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Flex } from "./Flex";

describe("Flex", () => {
  it("renders its children", () => {
    render(
      <Flex>
        <span>Child A</span>
        <span>Child B</span>
      </Flex>,
    );
    expect(screen.getByText("Child A")).toBeInTheDocument();
    expect(screen.getByText("Child B")).toBeInTheDocument();
  });

  it("accepts the named flex props without throwing", () => {
    render(
      <Flex align="center" justify="space-between" wrap="wrap" direction="column">
        <span>Item</span>
      </Flex>,
    );
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("supports the Tamagui v2 render host prop", () => {
    const { container } = render(
      <Flex render="ul">
        <li>Item</li>
      </Flex>,
    );

    expect(container.querySelector("ul")).toBeInTheDocument();
  });

  // Regression: Flex must default to `flexDirection: row` on every platform.
  // RN/Yoga defaults to `column`, so without an explicit base an undirected
  // <Flex> would lay out differently on native than on web.
  it("defaults to a row direction", () => {
    const { container } = render(
      <Flex>
        <span>Item</span>
      </Flex>,
    );
    expect(container.querySelector(".is_Flex")?.className).toMatch(/_fd-row\b/);
  });

  it("maps the direction prop onto flexDirection", () => {
    const { container } = render(
      <Flex direction="column">
        <span>Item</span>
      </Flex>,
    );
    const className = container.querySelector(".is_Flex")?.className ?? "";
    expect(className).toMatch(/_fd-column\b/);
    expect(className).not.toMatch(/_fd-row\b/);
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Flex>>();
    render(
      <Flex ref={ref}>
        <span>Item</span>
      </Flex>,
    );
    expect(ref.current).not.toBeNull();
  });
});
