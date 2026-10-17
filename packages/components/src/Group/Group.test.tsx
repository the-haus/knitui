import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { Box } from "../Box";
import { render, screen } from "../test-utils";
import { Group } from "./Group";

describe("Group", () => {
  it("renders its children", () => {
    render(
      <Group>
        <span>One</span>
        <span>Two</span>
      </Group>,
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("renders children when grow is set", () => {
    render(
      <Group grow>
        <span>A</span>
        <span>B</span>
      </Group>,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("applies grow styles to host children without leaking Tamagui props", () => {
    render(
      <Group grow>
        <span data-testid="item-a">A</span>
        <span>B</span>
      </Group>,
    );

    const item = screen.getByTestId("item-a");
    expect(item.style.flexBasis).toBe("0px");
    expect(item.style.flexGrow).toBe("1");
    expect(item.style.flexShrink).toBe("1");
    expect(item.style.maxWidth).toBe("50%");
    expect(item.style.minWidth).toBe("0");
    expect(item).not.toHaveAttribute("flexGrow");
  });

  it("routes grow sizing to a Tamagui child as style props, not an inline style", () => {
    render(
      <Group grow>
        <Box testID="tama">A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </Group>,
    );
    const item = screen.getByTestId("tama");
    // Tamagui children are detected through their `staticConfig` and take the
    // sizing through their own atomic-CSS pipeline.
    expect(item.getAttribute("style") ?? "").not.toContain("flex");
    expect(item).toHaveStyle({ flexGrow: "1", flexShrink: "1", maxWidth: "33.333333333333336%" });
  });

  it("is a wrapping, centred row with an md gap by default", () => {
    render(<Group testID="group" />);
    expect(screen.getByTestId("group")).toHaveStyle({
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "flex-start",
    });
    expect(cssRulesOf(screen.getByTestId("group")).join("\n")).toContain("gap: var(--t-space-md)");
  });

  it("still renders children with grow and preventGrowOverflow disabled", () => {
    render(
      <Group grow preventGrowOverflow={false}>
        <span>X</span>
        <span>Y</span>
      </Group>,
    );
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("Y")).toBeInTheDocument();
  });

  it.each(["flex-start", "center", "space-between"] as const)(
    "renders with justify %s",
    (justify) => {
      render(
        <Group justify={justify} testID="group">
          <span>{`j-${justify}`}</span>
        </Group>,
      );
      expect(screen.getByText(`j-${justify}`)).toBeInTheDocument();
      expect(screen.getByTestId("group")).toHaveStyle({ justifyContent: justify });
    },
  );

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Group>>();
    render(
      <Group ref={ref}>
        <span>Ref</span>
      </Group>,
    );
    expect(ref.current).not.toBeNull();
  });
});
