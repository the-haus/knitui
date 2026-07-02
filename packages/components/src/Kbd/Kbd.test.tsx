import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("renders its children", () => {
    render(<Kbd>Ctrl</Kbd>);
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
  });

  it("renders a semantic kbd element", () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText("Esc").tagName).toBe("KBD");
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)("renders the %s size", (size) => {
    render(<Kbd size={size}>{size}</Kbd>);
    expect(screen.getByText(size)).toBeInTheDocument();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Kbd>>();
    render(<Kbd ref={ref}>Shift</Kbd>);
    expect(ref.current).not.toBeNull();
  });
});
