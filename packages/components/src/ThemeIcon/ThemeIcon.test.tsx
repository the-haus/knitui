import * as React from "react";

import type { GetRef } from "@knitui/core";
import { IconStar } from "@knitui/icons";

import { baseValue, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { ThemeIcon } from "./ThemeIcon";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const VARIANTS = [
  "filled",
  "light",
  "outline",
  "subtle",
  "transparent",
  "white",
  "default",
] as const;

describe("ThemeIcon", () => {
  it("renders the icon it wraps", () => {
    render(
      <ThemeIcon>
        <IconStar />
      </ThemeIcon>,
    );
    expect(document.querySelector(".tabler-icon-star")).toBeInTheDocument();
  });

  it("auto-sizes/colors a bare icon via icon context (no explicit size/color)", () => {
    render(
      <ThemeIcon size="lg" variant="filled">
        <IconStar />
      </ThemeIcon>,
    );
    const svg = document.querySelector(".tabler-icon-star");
    // Context supplies the resolved size + foreground color to the icon.
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke", expect.stringContaining("color1"));
  });

  it("lets an explicit icon prop win over the context defaults", () => {
    render(
      <ThemeIcon size="lg">
        <IconStar size={12} color="#abc" />
      </ThemeIcon>,
    );
    const svg = document.querySelector(".tabler-icon-star");
    expect(svg).toHaveAttribute("width", "12");
    expect(svg).toHaveAttribute("stroke", "#abc");
  });

  it.each(VARIANTS)("renders the %s variant", (variant) => {
    render(
      <ThemeIcon variant={variant} data-testid={`ti-${variant}`}>
        <IconStar />
      </ThemeIcon>,
    );
    expect(screen.getByTestId(`ti-${variant}`)).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(
      <ThemeIcon size={size} data-testid={`ti-${size}`}>
        <IconStar />
      </ThemeIcon>,
    );
    expect(screen.getByTestId(`ti-${size}`)).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof ThemeIcon>>();
    render(
      <ThemeIcon ref={ref}>
        <IconStar />
      </ThemeIcon>,
    );
    expect(ref.current).not.toBeNull();
  });
});

describe("ThemeIcon v3 style resolution (web CSS)", () => {
  const MATRIX = [
    ["filled", "var(--color9)"],
    ["light", "var(--color4)"],
    ["outline", "transparent"],
    ["subtle", "transparent"],
    ["default", "var(--color3)"],
    ["white", "var(--c-white)"],
    ["transparent", "transparent"],
  ] as const;

  it.each(MATRIX)("variant=%s paints a static fill with no hover / press", (variant, bg) => {
    render(<ThemeIcon variant={variant} testID="ti" />);
    const el = screen.getByTestId("ti");
    expect(baseValue(el, "background-color")).toBe(bg);
    expect(declarationsUnder(el, ":hover")).toEqual([]);
    expect(declarationsUnder(el, ":active")).toEqual([]);
  });

  it("outline paints its border", () => {
    render(<ThemeIcon variant="outline" testID="ti" />);
    expect(baseValue(screen.getByTestId("ti"), "border-color")).toBe("var(--color7)");
  });

  it.each(SIZES)("size=%s is a square on the size scale", (size) => {
    render(<ThemeIcon size={size} testID="ti" />);
    expect(baseValue(screen.getByTestId("ti"), "height")).toBe(`var(--t-size-${size})`);
  });

  it("shadow resolves the dropShadowColor theme key inside boxShadow", () => {
    render(<ThemeIcon shadow="md" testID="ti" />);
    expect(baseValue(screen.getByTestId("ti"), "box-shadow")).toContain("var(--dropShadowColor)");
  });

  it("is not interactive (no button role, no focus ring)", () => {
    render(<ThemeIcon testID="ti" />);
    const el = screen.getByTestId("ti");
    expect(el).not.toHaveAttribute("role", "button");
    expect(hasFocusRing(el)).toBe(false);
  });
});
