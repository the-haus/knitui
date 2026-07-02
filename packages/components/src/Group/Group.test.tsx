import * as React from "react";

import type { GetRef } from "@knitui/core";

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
        <Group justify={justify}>
          <span>{`j-${justify}`}</span>
        </Group>,
      );
      expect(screen.getByText(`j-${justify}`)).toBeInTheDocument();
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
