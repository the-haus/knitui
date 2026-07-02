import * as React from "react";

import type { GetRef } from "@knitui/core";
import { IconStar } from "@knitui/icons";

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
