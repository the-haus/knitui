import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
