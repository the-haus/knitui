import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Typography } from "./Typography";

describe("Typography", () => {
  it("renders its children", () => {
    render(
      <Typography>
        <span>Block content</span>
      </Typography>,
    );
    expect(screen.getByText("Block content")).toBeInTheDocument();
  });

  it("renders multiple stacked children", () => {
    render(
      <Typography>
        <p>First</p>
        <p>Second</p>
      </Typography>,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Typography>>();
    render(<Typography ref={ref}>Body</Typography>);
    expect(ref.current).not.toBeNull();
  });

  it("forwards extra Box props such as testID", () => {
    render(<Typography testID="typo">Body</Typography>);
    expect(screen.getByTestId("typo")).toBeInTheDocument();
  });
});
