import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Spacer } from "./Spacer";

describe("Spacer", () => {
  it("renders without throwing", () => {
    const { container } = render(<Spacer w="md" h="md" />);
    expect(container.firstChild).toBeTruthy();
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)(
    "accepts %s as a token size for both axes",
    (size) => {
      render(<Spacer testID="sp" w={size} h={size} />);
      const rules = cssRulesOf(screen.getByTestId("sp")).join("\n");
      for (const prop of ["width", "height", "min-width", "min-height"]) {
        expect(rules).toMatch(new RegExp(`(^|[{;\\s])${prop}: var\\(--t-size-${size}\\)`));
      }
    },
  );

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Spacer>>();
    render(<Spacer ref={ref} w="xs" h="xs" />);
    expect(ref.current).not.toBeNull();
  });

  it("passes through arbitrary props such as testID via id", () => {
    const { container } = render(<Spacer w="xs" h="xs" id="my-spacer" />);
    expect(container.querySelector("#my-spacer")).toBeInTheDocument();
  });

  it("defaults the min size to the long-hand width / height too", () => {
    render(<Spacer testID="sp" width={24} height={8} />);
    expect(screen.getByTestId("sp")).toHaveStyle({ minWidth: "24px", minHeight: "8px" });
  });

  it("lets an explicit miw / mih beat the derived min size", () => {
    render(<Spacer testID="sp" w="xl" h="xl" miw={4} mih={2} />);
    expect(screen.getByTestId("sp")).toHaveStyle({ minWidth: "4px", minHeight: "2px" });
  });

  it("derives a per-breakpoint min size from a clause program", () => {
    render(<Spacer testID="sp" h="sm md:lg" />);
    const rules = cssRulesOf(screen.getByTestId("sp")).join("\n");
    expect(rules).toContain("min-height: var(--t-size-sm)");
    expect(rules).toMatch(/@media[^{]*\{[^}]*min-height: var\(--t-size-lg\)/);
  });

  it("sets no min size when no size is given", () => {
    render(<Spacer testID="sp" />);
    expect(screen.getByTestId("sp").style.minWidth).toBe("");
    expect(cssRulesOf(screen.getByTestId("sp")).join("")).not.toContain("min-");
  });

  it("can be exposed to assistive technology explicitly", () => {
    render(<Spacer testID="sp" aria-hidden={false} />);
    expect(screen.getByTestId("sp")).not.toHaveAttribute("aria-hidden", "true");
  });

  it("is a flattenable styled() component", () => {
    expect(Spacer.staticConfig.neverFlatten).toBeFalsy();
  });

  it("is hidden from assistive technology by default", () => {
    const { container } = render(<Spacer w="xs" h="xs" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
