import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Overlay } from "./Overlay";

describe("Overlay", () => {
  it("renders its children", () => {
    render(
      <Overlay>
        <span>Loading…</span>
      </Overlay>,
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders without throwing when empty", () => {
    expect(() => render(<Overlay />)).not.toThrow();
  });

  it("renders with the center variant", () => {
    render(
      <Overlay center>
        <span>Centered</span>
      </Overlay>,
    );
    expect(screen.getByText("Centered")).toBeInTheDocument();
  });

  it("renders with a custom background color and opacity", () => {
    render(
      <Overlay backgroundColor="#fff" backgroundOpacity={0.3}>
        <span>Wash</span>
      </Overlay>,
    );
    expect(screen.getByText("Wash")).toBeInTheDocument();
  });

  it("renders with a gradient", () => {
    render(
      <Overlay gradient="linear-gradient(black, white)">
        <span>Grad</span>
      </Overlay>,
    );
    expect(screen.getByText("Grad")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Overlay>>();
    render(<Overlay ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
