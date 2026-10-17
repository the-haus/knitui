import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
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
      <Overlay backgroundColor="#fff" backgroundOpacity={0.3} testID="o">
        <span>Wash</span>
      </Overlay>,
    );
    expect(screen.getByText("Wash")).toBeInTheDocument();
    expect(screen.getByTestId("o")).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.3)" });
  });

  it("renders with a gradient", () => {
    render(
      <Overlay gradient="linear-gradient(black, white)" testID="o">
        <span>Grad</span>
      </Overlay>,
    );
    expect(screen.getByText("Grad")).toBeInTheDocument();
    const rules = cssRulesOf(screen.getByTestId("o")).join("\n");
    expect(rules).toContain("background-image: linear-gradient(");
    // The gradient replaces the wash entirely.
    expect(rules).not.toContain("background-color");
  });

  it("is an absolute full-cover #000 scrim at 0.6 opacity by default", () => {
    render(<Overlay testID="o" />);
    expect(screen.getByTestId("o")).toHaveStyle({
      position: "absolute",
      top: "0px",
      left: "0px",
      right: "0px",
      bottom: "0px",
      zIndex: "200",
      pointerEvents: "auto",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    });
  });

  it("switches to a fixed, viewport-relative layer with `fixed`", () => {
    render(<Overlay testID="o" fixed />);
    expect(screen.getByTestId("o")).toHaveStyle({ position: "fixed" });
  });

  it("applies a web backdrop blur", () => {
    render(<Overlay testID="o" blur={4} />);
    expect(cssRulesOf(screen.getByTestId("o")).join("\n")).toContain("backdrop-filter: blur(4px)");
  });

  it("passes a non-hex scrim colour straight through", () => {
    render(<Overlay testID="o" backgroundColor="red" />);
    expect(screen.getByTestId("o")).toHaveStyle({ backgroundColor: "red" });
  });

  it("flex-centres its children with `center` and rounds with `radius`", () => {
    render(<Overlay testID="o" center radius={6} />);
    const el = screen.getByTestId("o");
    expect(el).toHaveStyle({ alignItems: "center", justifyContent: "center" });
    expect(cssRulesOf(el).join("\n")).toContain("border-radius: 6px");
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Overlay>>();
    render(<Overlay ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
