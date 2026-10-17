import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
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

  it.each([
    [1, "xxl"],
    [2, "xl"],
    [3, "lg"],
    [4, "md"],
    [5, "sm"],
    [6, "xs"],
  ] as const)("sizes order %i from the %s font token", (order, token) => {
    render(<Title order={order}>{`o${order}`}</Title>);
    expect(cssRulesOf(screen.getByText(`o${order}`)).join("\n")).toContain(
      `font-size: var(--f-size-${token})`,
    );
  });

  it("lets `size` override the order size (h-keys, tokens and raw values)", () => {
    render(
      <>
        <Title order={1} size="h4">
          hkey
        </Title>
        <Title order={1} size="sm">
          tok
        </Title>
        <Title order={1} size={30}>
          raw
        </Title>
      </>,
    );
    expect(cssRulesOf(screen.getByText("hkey")).join("\n")).toContain(
      "font-size: var(--f-size-md)",
    );
    expect(cssRulesOf(screen.getByText("tok")).join("\n")).toContain("font-size: var(--f-size-sm)");
    expect(screen.getByText("raw")).toHaveStyle({ fontSize: "30px" });
  });

  it("is bold, in the heading font", () => {
    render(<Title>bold</Title>);
    const el = screen.getByText("bold");
    expect(cssRulesOf(el).join("\n")).toContain("font-weight: 700");
    expect(el.className).toContain("font_heading");
  });

  it("forwards textWrap to the web text-wrap property", () => {
    render(<Title textWrap="balance">wrap</Title>);
    expect(cssRulesOf(screen.getByText("wrap")).join("\n")).toContain("text-wrap: balance");
  });

  it("does not forward its display name or variant props to the DOM", () => {
    render(<Title order={2}>clean</Title>);
    const el = screen.getByText("clean");
    expect(el.hasAttribute("name")).toBe(false);
    expect(el.hasAttribute("order")).toBe(false);
  });
});
