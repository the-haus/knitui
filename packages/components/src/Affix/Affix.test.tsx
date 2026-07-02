import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Affix } from "./Affix";

describe("Affix", () => {
  it("renders its children", () => {
    render(<Affix>Pinned</Affix>);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it("renders without a portal when withinPortal is false", () => {
    render(<Affix withinPortal={false}>In place</Affix>);
    expect(screen.getByText("In place")).toBeInTheDocument();
  });

  it("forwards a ref to the frame", () => {
    const ref = React.createRef<GetRef<typeof Affix>>();
    render(
      <Affix ref={ref} withinPortal={false}>
        Anchored
      </Affix>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("renders with a custom position", () => {
    render(
      <Affix withinPortal={false} position={{ top: 10, left: 20 }} testID="affix">
        Top left
      </Affix>,
    );

    expect(screen.getByTestId("affix")).toHaveStyle({
      left: "20px",
      position: "fixed",
      top: "10px",
    });
  });
});
