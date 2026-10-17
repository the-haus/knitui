import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("renders its children", () => {
    render(
      <Stack>
        <span>first</span>
        <span>second</span>
      </Stack>,
    );
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it.each(["flex-start", "center", "flex-end", "stretch"] as const)(
    "renders with align %s",
    (align) => {
      render(
        <Stack align={align} testID="stack">
          <span>child {align}</span>
        </Stack>,
      );
      expect(screen.getByText(`child ${align}`)).toBeInTheDocument();
      expect(screen.getByTestId("stack")).toHaveStyle({ alignItems: align });
    },
  );

  it.each(["flex-start", "center", "flex-end", "space-between"] as const)(
    "renders with justify %s",
    (justify) => {
      render(
        <Stack justify={justify} testID="stack">
          <span>j {justify}</span>
        </Stack>,
      );
      expect(screen.getByText(`j ${justify}`)).toBeInTheDocument();
      expect(screen.getByTestId("stack")).toHaveStyle({ justifyContent: justify });
    },
  );

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Stack>>();
    render(<Stack ref={ref}>content</Stack>);
    expect(ref.current).not.toBeNull();
  });

  it("is a vertical stack with an md gap by default", () => {
    render(<Stack testID="stack" />);
    expect(screen.getByTestId("stack")).toHaveStyle({
      flexDirection: "column",
      alignItems: "stretch",
    });
    expect(cssRulesOf(screen.getByTestId("stack")).join("\n")).toContain("gap: var(--t-space-md)");
  });

  it("takes a per-breakpoint gap clause", () => {
    render(<Stack testID="stack" gap="sm md:lg" />);
    const rules = cssRulesOf(screen.getByTestId("stack")).join("\n");
    expect(rules).toContain("gap: var(--t-space-sm)");
    expect(rules).toMatch(/@media[^{]*\{[^}]*gap: var\(--t-space-lg\)/);
  });

  it("supports the render host prop", () => {
    const { container } = render(
      <Stack render="ul">
        <li>Item</li>
      </Stack>,
    );

    expect(container.querySelector("ul")).toBeInTheDocument();
  });
});
