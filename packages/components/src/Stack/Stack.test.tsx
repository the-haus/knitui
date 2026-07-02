import * as React from "react";

import type { GetRef } from "@knitui/core";

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
        <Stack align={align}>
          <span>child {align}</span>
        </Stack>,
      );
      expect(screen.getByText(`child ${align}`)).toBeInTheDocument();
    },
  );

  it.each(["flex-start", "center", "flex-end", "space-between"] as const)(
    "renders with justify %s",
    (justify) => {
      render(
        <Stack justify={justify}>
          <span>j {justify}</span>
        </Stack>,
      );
      expect(screen.getByText(`j ${justify}`)).toBeInTheDocument();
    },
  );

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Stack>>();
    render(<Stack ref={ref}>content</Stack>);
    expect(ref.current).not.toBeNull();
  });

  it("supports the Tamagui v2 render host prop", () => {
    const { container } = render(
      <Stack render="ul">
        <li>Item</li>
      </Stack>,
    );

    expect(container.querySelector("ul")).toBeInTheDocument();
  });
});
