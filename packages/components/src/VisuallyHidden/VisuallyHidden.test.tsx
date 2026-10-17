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
    render(<VisuallyHidden>Hidden label</VisuallyHidden>);
    // (the Provider mounts spans of its own, so query the node by its text)
    expect(screen.getByText("Hidden label").tagName).toBe("SPAN");
  });

  it("forwards a ref to the underlying node", () => {
    const ref = React.createRef<GetRef<typeof VisuallyHidden>>();
    render(<VisuallyHidden ref={ref}>With ref</VisuallyHidden>);
    expect(ref.current).not.toBeNull();
  });

  it("applies the sr-only clip (1×1, clipped, off-flow)", () => {
    render(<VisuallyHidden>clip</VisuallyHidden>);
    expect(screen.getByText("clip")).toHaveStyle({
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      marginTop: "-1px",
    });
  });

  it("is a flattenable styled() component", () => {
    expect(VisuallyHidden.staticConfig.neverFlatten).toBeFalsy();
  });

  it("renders without throwing when empty", () => {
    expect(() => render(<VisuallyHidden />)).not.toThrow();
  });
});
