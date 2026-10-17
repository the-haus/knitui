/**
 * The arrow's geometry follows the measured middleware coordinate (changes on
 * every scroll / resize), so it must stay INLINE — as Tamagui style props each
 * distinct value would inject another atomic CSS rule on web.
 */
import * as React from "react";

import { allCssRules } from "../__tests__/css-rules.test.helper";
import { render } from "../test-utils";
import { FloatingArrow } from "./floating-arrow";

function arrowOf(container: HTMLElement): HTMLElement {
  const el = Array.from(container.querySelectorAll<HTMLElement>("div")).find(
    (d) => d.style.left !== "" || d.style.top !== "",
  );
  if (!el) throw new Error("arrow not found");
  return el;
}

describe("FloatingArrow", () => {
  it("puts the measured cross-axis offset and the half-out pull in inline style", () => {
    const { container } = render(
      <FloatingArrow
        placement="bottom"
        size={10}
        offset={5}
        position="center"
        radius={2}
        background="background"
        arrowX={37}
      />,
    );
    const el = arrowOf(container);
    expect(el.style.left).toBe("37px");
    expect(el.style.top).toBe("-5px");
  });

  it("a moving arrow injects no per-value CSS rules", () => {
    const props = {
      placement: "top" as const,
      size: 10,
      offset: 5,
      position: "center" as const,
      radius: 2,
      background: "background" as const,
    };
    const { rerender } = render(<FloatingArrow {...props} arrowX={11} />);
    const before = allCssRules().length;
    for (const x of [12, 13, 14, 15]) rerender(<FloatingArrow {...props} arrowX={x} />);
    expect(allCssRules().length).toBe(before);
    expect(allCssRules().some((r) => /left: 1[1-5]px/.test(r))).toBe(false);
  });

  it("centres with a percentage + negative margin while unmeasured", () => {
    const { container } = render(
      <FloatingArrow
        placement="left"
        size={8}
        offset={5}
        position="center"
        radius={2}
        background="background"
      />,
    );
    const el = arrowOf(container);
    expect(el.style.top).toBe("50%");
    expect(el.style.marginTop).toBe("-4px");
    expect(el.style.right).toBe("-4px");
  });
});
