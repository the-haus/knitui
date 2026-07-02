import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Center } from "./Center";

describe("Center", () => {
  it("renders its children", () => {
    render(<Center>Centered content</Center>);
    expect(screen.getByText("Centered content")).toBeInTheDocument();
  });

  it("renders nested element children", () => {
    render(
      <Center>
        <span>Nested</span>
      </Center>,
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("renders in the inline variant", () => {
    render(<Center inline>Inline centered</Center>);
    expect(screen.getByText("Inline centered")).toBeInTheDocument();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Center>>();
    render(<Center ref={ref}>Content</Center>);
    expect(ref.current).not.toBeNull();
  });
});
