import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Title } from "./Title";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Title", () => {
  it("renders its children", () => {
    render(<Title>Hello</Title>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("defaults to an h1 tag", () => {
    render(<Title>Heading</Title>);
    expect(screen.getByText("Heading").tagName).toBe("H1");
  });

  it.each([1, 2, 3, 4, 5, 6] as const)("renders order %i with the matching tag", (order) => {
    render(<Title order={order}>Level{order}</Title>);
    expect(screen.getByText(`Level${order}`).tagName).toBe(`H${order}`);
  });

  it("renders with a size override", () => {
    render(
      <Title order={2} size="h1">
        Sized
      </Title>,
    );
    expect(screen.getByText("Sized").tagName).toBe("H2");
  });

  it.each(SIZES)("accepts the %s token size", (size) => {
    render(
      <Title order={2} size={size}>
        {`size-${size}`}
      </Title>,
    );
    expect(screen.getByText(`size-${size}`).tagName).toBe("H2");
  });

  it("forwards its ref to the underlying heading element", () => {
    const ref = React.createRef<GetRef<typeof Title>>();
    render(<Title ref={ref}>Ref title</Title>);
    expect(ref.current).not.toBeNull();
  });
});
