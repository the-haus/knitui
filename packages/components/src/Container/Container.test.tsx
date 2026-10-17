import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
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
    expect(screen.getByText("fluid-content")).toHaveStyle({ maxWidth: "100%" });
  });

  it("lets fluid win over size whatever the prop order", () => {
    render(
      <>
        <Container fluid size="sm">
          a
        </Container>
        <Container size="sm" fluid>
          b
        </Container>
      </>,
    );
    expect(screen.getByText("a")).toHaveStyle({ maxWidth: "100%" });
    expect(screen.getByText("b")).toHaveStyle({ maxWidth: "100%" });
  });

  it("lets a call-site maxWidth beat both size and fluid", () => {
    render(
      <Container fluid size="sm" maxWidth={300}>
        cap
      </Container>,
    );
    expect(screen.getByText("cap")).toHaveStyle({ maxWidth: "300px" });
  });

  it("centres with auto margins and an md inline padding", () => {
    render(<Container>c</Container>);
    // v3 emits the logical shorthands (`margin-inline` / `padding-inline`).
    const rules = cssRulesOf(screen.getByText("c")).join("\n");
    expect(rules).toContain("width: 100%");
    expect(rules).toContain("margin-inline: auto");
    expect(rules).toContain("padding-inline: var(--t-space-md)");
  });

  it("accepts a numeric size", () => {
    render(<Container size={800}>numeric</Container>);
    expect(screen.getByText("numeric")).toHaveStyle({ maxWidth: "800px" });
  });

  it("takes a per-breakpoint size clause", () => {
    render(<Container size="sm md:xl">resp</Container>);
    const rules = cssRulesOf(screen.getByText("resp")).join("\n");
    expect(rules).toContain("max-width: 720px");
    expect(rules).toMatch(/@media[^{]*\{[^}]*max-width: 1320px/);
  });

  it("is a flattenable styled() component", () => {
    expect(Container.staticConfig.neverFlatten).toBeFalsy();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Container>>();
    render(<Container ref={ref}>ref</Container>);
    expect(ref.current).not.toBeNull();
  });
});
