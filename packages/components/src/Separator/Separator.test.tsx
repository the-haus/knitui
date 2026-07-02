import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Separator } from "./Separator";

describe("Separator", () => {
  it("exposes the separator role", () => {
    render(<Separator />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("defaults to horizontal orientation", () => {
    render(<Separator />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("honours the vertical orientation", () => {
    render(<Separator orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("renders a label when provided (horizontal)", () => {
    render(<Separator label="Section" />);
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("accepts the full named size scale and numeric custom thickness", () => {
    render(
      <>
        <Separator size="xxs" />
        <Separator size="xxl" />
        <Separator aria-label="custom" size={7} />
      </>,
    );

    expect(screen.getAllByRole("separator")).toHaveLength(3);
    expect(screen.getByLabelText("custom")).toBeInTheDocument();
  });

  it("exposes styled subparts for composition", () => {
    expect(Separator.Root).toBeDefined();
    expect(Separator.Line).toBeDefined();
    expect(Separator.Label).toBeDefined();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Separator>>();
    render(<Separator ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("routes the styles map onto the line and label slots", () => {
    const { container } = render(
      <Separator
        label="Section"
        styles={{ line: { testID: "sep-line" }, label: { testID: "sep-label" } }}
      />,
    );
    // Labeled mode renders two lines flanking the label; both take the slot.
    expect(container.querySelectorAll('[data-testid="sep-line"]')).toHaveLength(2);
    expect(screen.getByTestId("sep-label")).toHaveTextContent("Section");
  });
});
