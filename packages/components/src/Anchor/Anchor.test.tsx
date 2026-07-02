import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Anchor } from "./Anchor";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const UNDERLINES = ["always", "hover", "not-hover", "never"] as const;

describe("Anchor", () => {
  it("renders its text", () => {
    render(<Anchor>Visit site</Anchor>);
    expect(screen.getByText("Visit site")).toBeInTheDocument();
  });

  it("exposes the link role", () => {
    render(<Anchor href="https://example.com">Home</Anchor>);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("owns the link role", () => {
    render(
      <Anchor href="https://example.com" role="button">
        Home
      </Anchor>,
    );
    expect(screen.getByRole("link")).toHaveTextContent("Home");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("forwards href to the underlying anchor", () => {
    render(<Anchor href="https://example.com">Home</Anchor>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com");
  });

  it("keeps the link role without an href", () => {
    render(<Anchor>About</Anchor>);
    expect(screen.getByRole("link")).toHaveTextContent("About");
  });

  it("does not emit an href attribute when none is given", () => {
    render(<Anchor>About</Anchor>);
    expect(screen.getByRole("link")).not.toHaveAttribute("href");
  });

  // The `underline` variant only toggles textDecoration (incl. hover-driven
  // branches) which is not observable via role/text in jsdom; assert each value
  // renders a valid link so the variant axis is exercised end to end.
  it.each(UNDERLINES)("renders the %s underline variant", (underline) => {
    render(
      <Anchor underline={underline} href="https://example.com">
        {`u-${underline}`}
      </Anchor>,
    );
    expect(screen.getByRole("link")).toHaveTextContent(`u-${underline}`);
  });

  // The `size` variant is visual; smoke-render each token key so the public
  // seven-step axis is exercised end to end.
  it.each(SIZES)("accepts the %s size", (size) => {
    render(
      <Anchor href="https://example.com" size={size}>
        {`size-${size}`}
      </Anchor>,
    );
    expect(screen.getByRole("link")).toHaveTextContent(`size-${size}`);
  });

  it("forwards its ref to the underlying anchor node", () => {
    const ref = React.createRef<GetRef<typeof Anchor>>();
    render(
      <Anchor ref={ref} href="https://example.com">
        Home
      </Anchor>,
    );
    expect(ref.current).not.toBeNull();
  });
});
