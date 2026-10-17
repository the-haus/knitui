import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("renders its children", () => {
    render(<Kbd>Ctrl</Kbd>);
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
  });

  it("renders a semantic kbd element", () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText("Esc").tagName).toBe("KBD");
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)("renders the %s size", (size) => {
    render(<Kbd size={size}>{size}</Kbd>);
    expect(screen.getByText(size)).toBeInTheDocument();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Kbd>>();
    render(<Kbd ref={ref}>Shift</Kbd>);
    expect(ref.current).not.toBeNull();
  });

  it("is a bold mono keycap with a thicker bottom edge (sm by default)", () => {
    render(<Kbd>K</Kbd>);
    const el = screen.getByText("K");
    const rules = cssRulesOf(el).join("\n");
    expect(rules).toContain("font-weight: 700");
    expect(rules).toMatch(/border-width: 1px;[^]*border-bottom-width: 3px/);
    expect(rules).toContain("padding-block: 4px");
    expect(rules).toContain("background-color: var(--color2)");
    expect(rules).toContain("font-size: var(--f-size-xs)");
    expect(el.className).toContain("font_mono");
  });

  it("scales font, padding and radius together with size", () => {
    render(<Kbd size="md">M</Kbd>);
    const el = screen.getByText("M");
    const rules = cssRulesOf(el).join("\n");
    expect(rules).toContain("padding-block: 6px");
    expect(rules).toContain("padding-inline: var(--t-space-md)");
    expect(rules).toContain("font-size: var(--f-size-sm)");
  });

  it("is a flattenable styled() component", () => {
    expect(Kbd.staticConfig.neverFlatten).toBeFalsy();
  });
});
