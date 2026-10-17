import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Code } from "./Code";

describe("Code", () => {
  it("renders its children", () => {
    render(<Code>npm install</Code>);
    expect(screen.getByText("npm install")).toBeInTheDocument();
  });

  it("uses the inline 'code' tag by default", () => {
    render(<Code>inline</Code>);
    expect(screen.getByText("inline").tagName).toBe("CODE");
  });

  it("uses the 'pre' tag when block is set", () => {
    render(<Code block>block text</Code>);
    expect(screen.getByText("block text").tagName).toBe("PRE");
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Code>>();
    render(<Code ref={ref}>ref</Code>);
    expect(ref.current).not.toBeNull();
  });

  it("is mono text on a tinted surface at the xs size by default", () => {
    render(<Code>x</Code>);
    const el = screen.getByText("x");
    const rules = cssRulesOf(el).join("\n");
    expect(el.className).toContain("font_mono");
    expect(rules).toContain("background-color: var(--color3)");
    expect(rules).toContain("font-size: var(--f-size-xs)");
  });

  it("goes full-width block with `block`", () => {
    render(<Code block>b</Code>);
    expect(screen.getByText("b")).toHaveStyle({ display: "block", width: "100%" });
  });

  it("accepts a raw font size", () => {
    render(<Code size={20}>raw</Code>);
    expect(screen.getByText("raw")).toHaveStyle({ fontSize: "20px" });
  });
});
