import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { LoadingOverlay } from "./LoadingOverlay";

describe("LoadingOverlay", () => {
  it("renders nothing when not visible", () => {
    render(<LoadingOverlay visible={false} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("defaults to hidden (visible undefined)", () => {
    render(<LoadingOverlay />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders the loader when visible", () => {
    render(<LoadingOverlay visible />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("forwards loaderProps to the underlying Loader", () => {
    render(<LoadingOverlay visible loaderProps={{ type: "bars", size: "lg" }} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("forwards the loader aria-label", () => {
    render(<LoadingOverlay visible loaderProps={{ "aria-label": "Saving changes" }} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Saving changes");
  });

  it("forwards a ref to the overlay frame when visible", () => {
    const ref = React.createRef<GetRef<typeof LoadingOverlay>>();
    render(<LoadingOverlay ref={ref} visible />);
    expect(ref.current).not.toBeNull();
  });

  it("distributes the loader slot onto the underlying Loader", () => {
    render(<LoadingOverlay visible styles={{ loader: { "aria-label": "Slot loading" } }} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Slot loading");
  });

  it("lets the deprecated loaderProps win over the loader slot", () => {
    render(
      <LoadingOverlay
        visible
        styles={{ loader: { "aria-label": "Slot loading" } }}
        loaderProps={{ "aria-label": "Explicit loading" }}
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Explicit loading");
  });

  it("covers its parent with a centred, light scrim at z-index 400", () => {
    render(<LoadingOverlay visible testID="lo" />);
    const rules = cssRulesOf(screen.getByTestId("lo")).join("\n");
    expect(rules).toContain("position: absolute;");
    expect(rules).toContain("z-index: 400;");
    expect(rules).toContain("align-items: center;");
    expect(rules).toContain("justify-content: center;");
    expect(rules).toMatch(/background-color: rgba\(255, 255, 255, 0\.75\)/);
  });

  it("accepts a custom zIndex", () => {
    render(<LoadingOverlay visible zIndex={10} testID="lo" />);
    expect(cssRulesOf(screen.getByTestId("lo")).join("\n")).toContain("z-index: 10;");
  });
});
