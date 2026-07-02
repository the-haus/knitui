import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Container } from "./Container";

describe("Container", () => {
  it("renders its children", () => {
    render(<Container>content</Container>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)("renders size %s", (size) => {
    render(<Container size={size}>{`s-${size}`}</Container>);
    expect(screen.getByText(`s-${size}`)).toBeInTheDocument();
  });

  // Regression: each NAMED size must resolve to a real px `max-width` cap. The
  // size variant previously mapped through `maxWidthVariant` (number/string only),
  // so a named key like "sm" fell through to an invalid `maxWidth: "sm"` and
  // capped nothing. The dedicated `containerSizeVariant` ladder fixes this.
  it.each([
    ["xxs", "420px"],
    ["xs", "540px"],
    ["sm", "720px"],
    ["md", "960px"],
    ["lg", "1140px"],
    ["xl", "1320px"],
    ["xxl", "1608px"],
  ] as const)("caps max-width for size %s", (size, expected) => {
    render(<Container size={size}>{`w-${size}`}</Container>);
    expect(screen.getByText(`w-${size}`)).toHaveStyle({ maxWidth: expected });
  });

  it("renders in fluid mode", () => {
    render(<Container fluid>fluid-content</Container>);
    expect(screen.getByText("fluid-content")).toBeInTheDocument();
  });

  it("accepts a numeric size", () => {
    render(<Container size={800}>numeric</Container>);
    expect(screen.getByText("numeric")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Container>>();
    render(<Container ref={ref}>ref</Container>);
    expect(ref.current).not.toBeNull();
  });
});
