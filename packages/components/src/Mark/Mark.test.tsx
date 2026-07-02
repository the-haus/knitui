import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Mark } from "./Mark";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Mark", () => {
  it("renders its children", () => {
    render(<Mark>highlighted</Mark>);
    expect(screen.getByText("highlighted")).toBeInTheDocument();
  });

  it("renders with the semantic mark tag", () => {
    render(<Mark>marked text</Mark>);
    expect(screen.getByText("marked text").tagName).toBe("MARK");
  });

  it("accepts an accent theme without throwing", () => {
    render(<Mark theme="yellow">tinted</Mark>);
    expect(screen.getByText("tinted")).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size without crashing", (size) => {
    render(<Mark size={size}>{`size-${size}`}</Mark>);
    expect(screen.getByText(`size-${size}`)).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Mark>>();
    render(<Mark ref={ref}>ref</Mark>);
    expect(ref.current).not.toBeNull();
  });
});
