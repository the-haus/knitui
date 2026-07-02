import * as React from "react";

import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { render, screen } from "../test-utils";
import { degToSvgCoords, gradientToCss, normalizeStops } from "./gradient-shared";

// A theme stub is only consulted for `$token` colors; raw CSS colors pass
// straight through `resolveThemeColor`, so these helper tests pass `{}`.
const noTheme = {} as Parameters<typeof gradientToCss>[0];

describe("gradient helpers", () => {
  it("normalizes the from/to shorthand to two 0–100% stops", () => {
    expect(normalizeStops({ from: "#f00", to: "#00f" })).toEqual([
      { color: "#f00", offset: 0 },
      { color: "#00f", offset: 100 },
    ]);
  });

  it("falls back to the default ramp tokens when from/to are omitted", () => {
    expect(normalizeStops({})).toEqual([
      { color: "$color5", offset: 0 },
      { color: "$color9", offset: 100 },
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
    expect(gradientToCss(noTheme, { from: "#f00", to: "#00f" })).toBe(
      "linear-gradient(45deg, #f00 0%, #00f 100%)",
    );
    expect(gradientToCss(noTheme, { from: "#f00", to: "#00f", deg: 90 })).toBe(
      "linear-gradient(90deg, #f00 0%, #00f 100%)",
    );
  });

  it("maps a CSS angle to SVG objectBoundingBox endpoints (0deg → bottom→top)", () => {
    const { x1, y1, x2, y2 } = degToSvgCoords(0);
    expect([x1, y1, x2, y2]).toEqual([0.5, 1, 0.5, 0]);
  });
});

describe("gradient variant rendering (web)", () => {
  // Tamagui compiles `backgroundImage` to an atomic class (`_backgroundImage-…`)
  // with the literal gradient in an injected stylesheet, so we assert on the
  // element's className rather than inline HTML.
  it("paints a backgroundImage on a gradient Button", () => {
    render(
      <Button variant="gradient" gradient={{ from: "#ff0000", to: "#0000ff" }}>
        Go
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Go");
    expect(button.className).toContain("_backgroundImage-");
  });

  it("does not paint a backgroundImage for non-gradient variants", () => {
    render(
      <Button variant="filled" gradient={{ from: "#ff0000", to: "#0000ff" }}>
        Go
      </Button>,
    );
    expect(screen.getByRole("button").className).not.toContain("_backgroundImage-");
  });

  it("paints a gradient behind Avatar initials", () => {
    render(
      <Avatar variant="gradient" gradient={{ from: "#ff0000", to: "#0000ff" }} name="Jane Doe" />,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByRole("img").className).toContain("_backgroundImage-");
  });
});
