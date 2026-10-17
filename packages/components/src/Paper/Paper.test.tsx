import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Paper } from "./Paper";

describe("Paper", () => {
  it("renders its children", () => {
    render(<Paper>Surface content</Paper>);
    expect(screen.getByText("Surface content")).toBeInTheDocument();
  });

  it("renders with a border when withBorder is set", () => {
    render(<Paper withBorder>Bordered</Paper>);
    expect(screen.getByText("Bordered")).toHaveStyle({ borderTopWidth: "1px" });
    expect(cssRulesOf(screen.getByText("Bordered")).join("\n")).toContain(
      "border-color: var(--borderColor)",
    );
  });

  it.each(["xs", "sm", "md", "lg", "xl"] as const)("renders shadow %s", (shadow) => {
    render(<Paper shadow={shadow}>{`shadow-${shadow}`}</Paper>);
    expect(getComputedStyle(screen.getByText(`shadow-${shadow}`)).boxShadow).toContain(
      "var(--dropShadowColor)",
    );
  });

  it.each(["xs", "sm", "md", "lg", "xl"] as const)("renders radius %s", (radius) => {
    render(<Paper radius={radius}>{`radius-${radius}`}</Paper>);
    expect(cssRulesOf(screen.getByText(`radius-${radius}`)).join("\n")).toContain(
      `border-radius: var(--t-radius-${radius})`,
    );
  });

  it("is a background surface with an md radius and no border / shadow by default", () => {
    render(<Paper>plain</Paper>);
    const el = screen.getByText("plain");
    const rules = cssRulesOf(el).join("\n");
    expect(rules).toContain("background-color: var(--background)");
    expect(rules).toContain("border-radius: var(--t-radius-md)");
    expect(rules).not.toContain("box-shadow");
    expect(rules).not.toContain("border-width");
  });

  it("accepts a raw radius number", () => {
    render(<Paper radius={6}>r</Paper>);
    expect(cssRulesOf(screen.getByText("r")).join("\n")).toContain("border-radius: 6px");
  });

  it("is a flattenable styled() component", () => {
    expect(Paper.staticConfig.neverFlatten).toBeFalsy();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Paper>>();
    render(<Paper ref={ref}>Reffed</Paper>);
    expect(ref.current).not.toBeNull();
  });
});
