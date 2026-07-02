import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Paragraph } from "./Paragraph";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Paragraph", () => {
  it("renders its children", () => {
    render(<Paragraph>Body text</Paragraph>);
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("renders with the semantic paragraph tag", () => {
    render(<Paragraph>Paragraph element</Paragraph>);
    expect(screen.getByText("Paragraph element").tagName).toBe("P");
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Paragraph>>();
    render(<Paragraph ref={ref}>Reffed</Paragraph>);
    expect(ref.current).not.toBeNull();
  });

  it("renders text passed via multiple children", () => {
    render(
      <Paragraph>
        Hello <strong>world</strong>
      </Paragraph>,
    );
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("accepts the full inherited text size scale", () => {
    render(
      <>
        {SIZES.map((size) => (
          <Paragraph key={size} size={size}>
            {size} paragraph
          </Paragraph>
        ))}
      </>,
    );

    for (const size of SIZES) {
      expect(screen.getByText(`${size} paragraph`)).toBeInTheDocument();
    }
  });
});
