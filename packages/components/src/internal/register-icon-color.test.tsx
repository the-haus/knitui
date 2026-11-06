import * as React from "react";

import { IconStar } from "@knitui/icons";

import "./register-icon-color";
import { render } from "../test-utils";

const paint = (color?: string) => {
  const { container } = render(<IconStar color={color} />);
  return container.querySelector("svg")?.getAttribute("stroke");
};

describe("icon colours", () => {
  it("resolves a theme colour name", () => {
    expect(paint("blue9")).toBe("var(--blue9)");
  });

  it.each(["#ff0000", "rgb(1, 2, 3)", "currentColor"])("paints %s as given", (color) => {
    expect(paint(color)).toBe(color);
  });
});
