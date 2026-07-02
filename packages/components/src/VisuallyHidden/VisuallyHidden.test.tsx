import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { VisuallyHidden } from "./VisuallyHidden";

describe("VisuallyHidden", () => {
  it("renders its children text", () => {
    render(<VisuallyHidden>Close menu</VisuallyHidden>);
    expect(screen.getByText("Close menu")).toBeInTheDocument();
  });

  it("keeps content available to assistive technology", () => {
    render(<VisuallyHidden>Screen reader only</VisuallyHidden>);
    const node = screen.getByText("Screen reader only");
    expect(node).toBeInTheDocument();
    expect(node).toHaveTextContent("Screen reader only");
  });

  it("forwards arbitrary props like id to the host element", () => {
    render(<VisuallyHidden id="sr-label">Label</VisuallyHidden>);
    expect(screen.getByText("Label")).toHaveAttribute("id", "sr-label");
  });

  it("renders a semantic span host on web", () => {
    const { container } = render(<VisuallyHidden>Hidden label</VisuallyHidden>);
    const host = container.querySelector("span");
    expect(host).toHaveTextContent("Hidden label");
  });

  it("forwards a ref to the underlying node", () => {
    const ref = React.createRef<GetRef<typeof VisuallyHidden>>();
    render(<VisuallyHidden ref={ref}>With ref</VisuallyHidden>);
    expect(ref.current).not.toBeNull();
  });

  it("renders without throwing when empty", () => {
    expect(() => render(<VisuallyHidden />)).not.toThrow();
  });
});
