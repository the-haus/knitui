import * as React from "react";

import { getConfig, type GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Text } from "./index";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Text", () => {
  it("renders its children", () => {
    render(<Text>Hello world</Text>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders a text node in the document", () => {
    render(<Text>Some text</Text>);
    const el = screen.getByText("Some text");
    expect(el).toBeInTheDocument();
  });

  it("renders as a span element when the span prop is set", () => {
    render(<Text span>Inline text</Text>);
    const el = screen.getByText("Inline text");
    expect(el.tagName.toLowerCase()).toBe("span");
  });

  it.each(SIZES)("renders the %s size without crashing", (size) => {
    render(<Text size={size}>{`size-${size}`}</Text>);
    expect(screen.getByText(`size-${size}`)).toBeInTheDocument();
  });

  it("renders with the inline prop without crashing", () => {
    render(<Text inline>Inline tight</Text>);
    expect(screen.getByText("Inline tight")).toBeInTheDocument();
  });

  it("renders with the inherit prop without crashing", () => {
    render(<Text inherit>Inherited styles</Text>);
    expect(screen.getByText("Inherited styles")).toBeInTheDocument();
  });

  it("renders with truncate=true without crashing", () => {
    render(<Text truncate>Truncated text</Text>);
    expect(screen.getByText("Truncated text")).toBeInTheDocument();
  });

  it("renders with truncate=end without crashing", () => {
    render(<Text truncate="end">Truncated end</Text>);
    expect(screen.getByText("Truncated end")).toBeInTheDocument();
  });

  it("renders with truncate=start without crashing", () => {
    render(<Text truncate="start">Truncated start</Text>);
    expect(screen.getByText("Truncated start")).toBeInTheDocument();
  });

  it("renders with a lineClamp prop without crashing", () => {
    render(<Text lineClamp={3}>Clamped text</Text>);
    expect(screen.getByText("Clamped text")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Text>>();
    render(<Text ref={ref}>hi</Text>);
    expect(ref.current).not.toBeNull();
  });

  // A11Y: on the web the font ladder is `rem`, so browser text-only zoom and a
  // raised default font size scale the text; 1rem = 16px keeps the default look.
  it("sizes text through rem font tokens on the web", () => {
    render(<Text size="md">rem</Text>);
    expect(screen.getByText("rem").className).toContain("_fz-f-size-md");

    const css = getConfig().getCSS();
    expect(css).toContain("--f-size-md:1.125rem");
    expect(css).toContain("--f-lineHeight-md:1.625rem");
    // no font size or line height token is left in px
    expect(css).not.toMatch(/--f-(size|lineHeight)-[\w]+:[\d.]+px/);
  });
});
