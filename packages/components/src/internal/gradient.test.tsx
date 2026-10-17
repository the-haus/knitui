import * as React from "react";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { render, screen } from "../test-utils";
import { degToSvgCoords, gradientToCss, normalizeStops } from "./gradient-shared";
import { themeColorToCssVar } from "./theme-color-web";

/** The `background-image` the element's atomic classes paint (v3 hashed classes). */
const backgroundImageOf = (el: Element) =>
  cssRulesOf(el).find((rule) => rule.includes("background-image")) ?? "";

describe("gradient helpers", () => {
  it("normalizes the from/to shorthand to two 0–100% stops", () => {
    expect(normalizeStops({ from: "#f00", to: "#00f" })).toEqual([
      { color: "#f00", offset: 0 },
      { color: "#00f", offset: 100 },
    ]);
  });

  it("falls back to the default ramp tokens when from/to are omitted", () => {
    expect(normalizeStops({})).toEqual([
      { color: "color5", offset: 0 },
      { color: "color9", offset: 100 },
    ]);
  });

  it("spaces multi-step stops evenly when offsets are omitted", () => {
    expect(normalizeStops({ stops: [{ color: "#a" }, { color: "#b" }, { color: "#c" }] })).toEqual([
      { color: "#a", offset: 0 },
      { color: "#b", offset: 50 },
      { color: "#c", offset: 100 },
    ]);
  });

  it("honors explicit stop offsets and lets stops win over from/to", () => {
    expect(
      normalizeStops({
        from: "#ignored",
        to: "#ignored",
        stops: [
          { color: "#a", offset: 10 },
          { color: "#b", offset: 80 },
        ],
      }),
    ).toEqual([
      { color: "#a", offset: 10 },
      { color: "#b", offset: 80 },
    ]);
  });

  it("builds a CSS linear-gradient with the angle (default 45deg)", () => {
    expect(gradientToCss({ from: "#f00", to: "#00f" })).toBe(
      "linear-gradient(45deg, #f00 0%, #00f 100%)",
    );
    expect(gradientToCss({ from: "#f00", to: "#00f", deg: 90 })).toBe(
      "linear-gradient(90deg, #f00 0%, #00f 100%)",
    );
  });

  // Web name resolution is theme-FREE: a theme colour name maps straight to its
  // CSS custom property, which is what lets `useGradient` skip `useTheme()`
  // entirely (see theme-color-web.ts). v3 has no sigil — the CONFIG says what a
  // name is, so literals (`#f00`, `red`, `rgb(…)`) pass through.
  it("maps theme colour names to CSS custom properties without a theme", () => {
    render(<Button>mount the provider</Button>);
    expect(gradientToCss({})).toBe("linear-gradient(45deg, var(--color5) 0%, var(--color9) 100%)");
    expect(gradientToCss({ from: "blue9", to: "red" })).toBe(
      "linear-gradient(45deg, var(--blue9) 0%, red 100%)",
    );
  });

  it("maps a colour TOKEN to its own CSS variable", () => {
    render(<Button>mount the provider</Button>);
    expect(themeColorToCssVar("white")).toMatch(/^var\(--c-/);
    expect(themeColorToCssVar("#ffffff")).toBe("#ffffff");
    expect(themeColorToCssVar("rgba(0,0,0,0.5)")).toBe("rgba(0,0,0,0.5)");
  });

  it("maps a CSS angle to SVG objectBoundingBox endpoints (0deg → bottom→top)", () => {
    const { x1, y1, x2, y2 } = degToSvgCoords(0);
    expect([x1, y1, x2, y2]).toEqual([0.5, 1, 0.5, 0]);
  });
});

describe("gradient variant rendering (web)", () => {
  // Tamagui compiles `backgroundImage` to a hashed atomic class with the literal
  // gradient in an injected stylesheet, so we assert on the rule that class
  // targets rather than on a class-name spelling.
  it("paints a backgroundImage on a gradient Button", () => {
    render(
      <Button variant="gradient" gradient={{ from: "#ff0000", to: "#0000ff" }}>
        Go
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Go");
    expect(backgroundImageOf(button)).toContain("linear-gradient(45deg, #ff0000 0%, #0000ff 100%)");
  });

  it("does not paint a backgroundImage for non-gradient variants", () => {
    render(
      <Button variant="filled" gradient={{ from: "#ff0000", to: "#0000ff" }}>
        Go
      </Button>,
    );
    expect(backgroundImageOf(screen.getByRole("button"))).toBe("");
  });

  it("paints a gradient behind Avatar initials", () => {
    render(
      <Avatar variant="gradient" gradient={{ from: "#ff0000", to: "#0000ff" }} name="Jane Doe" />,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(backgroundImageOf(screen.getByRole("img"))).toContain("linear-gradient(");
  });
});
