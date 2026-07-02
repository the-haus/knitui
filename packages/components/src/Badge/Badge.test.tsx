import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Badge } from "./Badge";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Badge size={size}>Sized</Badge>);
    expect(screen.getByText("Sized")).toBeInTheDocument();
  });

  it.each(["filled", "light", "outline", "dot", "transparent", "white", "default"] as const)(
    "renders the %s variant",
    (variant) => {
      render(<Badge variant={variant}>Label</Badge>);
      expect(screen.getByText("Label")).toBeInTheDocument();
    },
  );

  it("renders left and right sections", () => {
    render(
      <Badge leftSection={<span>L</span>} rightSection={<span>R</span>}>
        Mid
      </Badge>,
    );
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Badge>>();
    render(<Badge ref={ref}>Ref</Badge>);
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts", () => {
    render(<Badge.Dot data-testid="dot" />);
    expect(screen.getByTestId("dot")).toBeInTheDocument();
  });

  it("distributes the styles map onto its root and text slots", () => {
    render(
      <Badge styles={{ root: { testID: "badge-root" }, text: { testID: "badge-text" } }}>
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge-root")).toBeInTheDocument();
    expect(screen.getByTestId("badge-text")).toBeInTheDocument();
  });

  it("distributes the dot slot in the dot variant", () => {
    render(
      <Badge variant="dot" styles={{ dot: { testID: "badge-dot" } }}>
        Status
      </Badge>,
    );
    expect(screen.getByTestId("badge-dot")).toBeInTheDocument();
  });
});
