import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
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

  it("supports the render host prop", () => {
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
    render(
      <Flex testID="flex">
        <span>Item</span>
      </Flex>,
    );
    expect(screen.getByTestId("flex")).toHaveStyle({ flexDirection: "row", display: "flex" });
  });

  it("maps the direction prop onto flexDirection", () => {
    render(
      <Flex testID="flex" direction="column">
        <span>Item</span>
      </Flex>,
    );
    expect(screen.getByTestId("flex")).toHaveStyle({ flexDirection: "column" });
  });

  it("lets a raw flexDirection beat the direction variant", () => {
    render(<Flex testID="flex" direction="column" flexDirection="row-reverse" />);
    expect(screen.getByTestId("flex")).toHaveStyle({ flexDirection: "row-reverse" });
  });

  it("maps align / justify / wrap onto their flex style props", () => {
    render(<Flex testID="flex" align="center" justify="space-between" wrap="wrap" />);
    expect(screen.getByTestId("flex")).toHaveStyle({
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
    });
  });

  it("accepts a per-breakpoint direction clause", () => {
    render(<Flex testID="flex" direction="column md:row" />);
    const rules = cssRulesOf(screen.getByTestId("flex")).join("\n");
    expect(rules).toContain("flex-direction: column");
    expect(rules).toMatch(/@media[^{]*\{[^}]*flex-direction: row/);
  });

  it("is a flattenable styled() component (no styleable wrapper)", () => {
    expect(Flex.staticConfig.neverFlatten).toBeFalsy();
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
