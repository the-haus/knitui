import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Loader } from "./Loader";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Loader", () => {
  it("exposes the progressbar role", () => {
    render(<Loader />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("has a default accessible label of 'Loading'", () => {
    render(<Loader />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Loading");
  });

  it("honours a custom aria-label", () => {
    render(<Loader aria-label="Please wait" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Please wait");
  });

  it.each(["oval", "dots", "bars"] as const)("renders the %s type without throwing", (type) => {
    render(<Loader type={type} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Loader size={size} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("accepts a numeric size", () => {
    render(<Loader size={48} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("forwards a ref to the loader frame", () => {
    const ref = React.createRef<GetRef<typeof Loader>>();
    render(<Loader ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});
